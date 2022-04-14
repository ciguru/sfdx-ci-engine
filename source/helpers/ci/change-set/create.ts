/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import FS from 'fs';
import Git, { SimpleGit } from 'simple-git';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import SFDX from '@ciguru/sfdx-ts-adapter';
import { FileNotExist, IncorrectContentOfFile, IncorrectSchema } from '../../../errors';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  numberParseOptions: {
    leadingZeros: true,
    hex: true,
    skipLike: /[0-9]{1,2}\.0/,
  },
});

const xmlBuilder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  suppressEmptyNode: true,
});

interface PackageXmlType {
  members?: string[];
  name?: string;
}

interface PackageXML {
  '?xml'?: {
    '@version'?: string;
    '@encoding'?: string;
  };
  Package?: {
    types?: PackageXmlType[];
    version?: string;
    '@xmlns'?: string;
  };
}

interface ChangeType {
  [type: string]: string[];
}

export interface Changes {
  added: ChangeType;
  deleted: ChangeType;
}

export type DestructiveChangeSetMode = 'pre' | 'post';

export default async function (
  headSha: string,
  baseSha: string,
  destructiveChangeSetMode: DestructiveChangeSetMode,
  changeSetDir: string,
  createRevertChangeSet: boolean,
  revertDestructiveChangeSetMode: DestructiveChangeSetMode,
  revertChangeSetDir: string,
): Promise<Changes> {
  // Init vars
  const helper = new CreateChangeSet();
  revertChangeSetDir = revertChangeSetDir || `revertChSet_${Date.now()}`;

  // Create change set for Revert
  await helper.gitCheckout(baseSha);
  await SFDX.force.source.convert(revertChangeSetDir, helper.getSourcePaths());

  // Create change set for Changes
  await helper.gitMerge(headSha, baseSha);
  await SFDX.force.source.convert(changeSetDir, helper.getSourcePaths());

  // Create destructive package.xml
  const deployPackageXml: PackageXML = xmlParser.parse(FS.readFileSync(`${changeSetDir}/package.xml`));
  const revertPackageXml: PackageXML = xmlParser.parse(FS.readFileSync(`${revertChangeSetDir}/package.xml`));
  const { deployDestructivePackageXml, revertDestructivePackageXml, changes } = helper.getDestructivePackageXMLs(
    revertPackageXml,
    deployPackageXml,
  );

  // Save destructive package.xml
  if (deployDestructivePackageXml) {
    FS.writeFileSync(
      `${changeSetDir}/destructivechanges${destructiveChangeSetMode}.xml`,
      xmlBuilder.build(deployDestructivePackageXml),
      { encoding: 'utf-8' },
    );
  }
  if (revertDestructivePackageXml && createRevertChangeSet) {
    FS.writeFileSync(
      `${revertChangeSetDir}/destructivechanges${revertDestructiveChangeSetMode}.xml`,
      xmlBuilder.build(revertDestructivePackageXml),
      { encoding: 'utf-8' },
    );
  }

  // Delete the Revert change set if not required
  if (!createRevertChangeSet) {
    FS.rmSync(`${revertChangeSetDir}`, { recursive: true });
  }

  return changes;
}

class CreateChangeSet {
  private readonly git: SimpleGit;

  constructor() {
    this.git = Git({ baseDir: process.cwd(), binary: 'git', maxConcurrentProcesses: 6 });
  }

  async gitCheckout(point: string): Promise<void> {
    await this.git.checkout(point);
  }

  async gitMerge(from: string, to: string): Promise<void> {
    await this.git.mergeFromTo(from, to);
  }

  getSourcePaths(): string[] {
    // Load sfdx-project.json
    const sfdxProjectJsonName = 'sfdx-project.json';
    if (!FS.existsSync(sfdxProjectJsonName)) {
      throw new FileNotExist(sfdxProjectJsonName);
    }
    let sfdxProject;
    try {
      sfdxProject = JSON.parse(FS.readFileSync(sfdxProjectJsonName, { encoding: 'utf-8' }));
    } catch (e) {
      throw new IncorrectContentOfFile(sfdxProjectJsonName, 'JSON');
    }

    // Get Paths of all packageDirectories
    if (!(sfdxProject && sfdxProject.packageDirectories && sfdxProject.packageDirectories.length > 0)) {
      throw new IncorrectSchema(sfdxProjectJsonName, 'File must contain at least one packageDirectories');
    }
    const sourcePath = [];
    for (const directory of sfdxProject.packageDirectories) {
      if (directory.path) {
        sourcePath.push(directory.path);
      }
    }
    return sourcePath;
  }

  getDestructivePackageXMLs(
    revertPackageXml: PackageXML,
    deployPackageXml: PackageXML,
  ): {
    deployDestructivePackageXml: PackageXML | null;
    revertDestructivePackageXml: PackageXML | null;
    changes: Changes;
  } {
    // Prepare old package data to analyze
    const revertPackageType: ChangeType = {};
    if (revertPackageXml?.Package?.types) {
      for (const mdType of revertPackageXml.Package.types) {
        if (mdType.name && mdType.members && mdType.members.length > 0) {
          revertPackageType[mdType.name] = [...mdType.members];
        }
      }
    }

    // Find new components in deploy package XML
    const changes: Changes = {
      added: {},
      deleted: {},
    };
    if (deployPackageXml?.Package?.types) {
      for (const mdType of deployPackageXml.Package.types) {
        if (mdType.name && mdType.members && mdType.members.length > 0) {
          for (const member of mdType.members) {
            if (revertPackageType[mdType.name] && revertPackageType[mdType.name].includes(member)) {
              // Modified
              revertPackageType[mdType.name].splice(revertPackageType[mdType.name].indexOf(member), 1);
            } else {
              // Added
              if (!changes.added[mdType.name]) {
                changes.added[mdType.name] = [];
              }
              changes.added[mdType.name].push(member);
            }
          }
        }
      }
    }

    // Find deleted components in deploy package XML
    for (const type of Object.keys(revertPackageType)) {
      if (revertPackageType[type].length > 0) {
        // Deleted
        if (!changes.deleted[type]) {
          changes.deleted[type] = [];
        }
        changes.deleted[type].push(...revertPackageType[type]);
      }
    }

    return {
      deployDestructivePackageXml: CreateChangeSet.buildDestructivePackageXml(deployPackageXml, changes.deleted),
      revertDestructivePackageXml: CreateChangeSet.buildDestructivePackageXml(revertPackageXml, changes.added),
      changes,
    };
  }

  protected static buildDestructivePackageXml(
    packageXml: PackageXML,
    destructiveChanges: ChangeType,
  ): PackageXML | null {
    const types: PackageXmlType[] = [];
    for (const type of Object.keys(destructiveChanges)) {
      if (destructiveChanges[type].length > 0) {
        types.push({
          members: destructiveChanges[type],
          name: type,
        });
      }
    }

    if (types.length > 0) {
      return {
        '?xml': {
          '@version': packageXml?.['?xml']?.['@version'] || '1.0',
          '@encoding': packageXml?.['?xml']?.['@encoding'] || 'UTF-8',
        },
        Package: {
          '@xmlns': packageXml?.Package?.['@xmlns'] || 'http://soap.sforce.com/2006/04/metadata',
          types,
          version: packageXml?.Package?.version || '53.0',
        },
      };
    } else {
      return null;
    }
  }
}
