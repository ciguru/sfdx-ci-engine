/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import SFDX, { SfdxOutputs } from '@ciguru/sfdx-ts-adapter';
import { TestLevel as ApexTestLevel } from '@ciguru/sfdx-ts-adapter/dist/force/apex/test/run';
import { TestLevel as DeployTestLevel } from '@ciguru/sfdx-ts-adapter/dist/force/mdapi/deploy';
import { OverrideDefinition } from '@ciguru/sfdx-ts-adapter/dist/force/org/create';
import MetadataDeploy from './metadataDeploy';
import { DataSoqlQueryCsv } from './soql-query';

interface Sfdx {
  auth: {
    accessToken: {
      store: (
        alias: string,
        instanceUrl: string,
        accessToken: string,
      ) => Promise<SfdxOutputs['auth']['accessToken']['store']>;
    };
    sfdxUrl: {
      store: (alias: string, sfdxUrlFile: string) => Promise<SfdxOutputs['auth']['sfdxUrl']['store']>;
    };
    list: () => Promise<SfdxOutputs['auth']['list']>;
    logout: (targetUserName: string) => Promise<SfdxOutputs['auth']['logout']>;
  };
  force: {
    apex: {
      execute: (targetUserName: string, apexCodeFile: string) => Promise<SfdxOutputs['force']['apex']['execute']>;
      test: {
        run: (
          targetUserName: string,
          outputDir: string,
          testLevel: ApexTestLevel,
        ) => Promise<SfdxOutputs['force']['apex']['test']['run']>;
      };
    };
    data: {
      bulk: {
        upsert: (
          targetUserName: string,
          csvFile: string,
          externalId: string,
          sObjectType: string,
          allowNoMoreFailedBatches?: number,
          allowNoMoreFailedRecords?: number,
        ) => Promise<SfdxOutputs['force']['data']['bulk']['upsert']>;
      };
      tree: {
        import: (targetUserName: string, planFile: string) => Promise<SfdxOutputs['force']['data']['tree']['import']>;
      };
      soql: {
        queryCsv: (
          targetUserName: string,
          csvFile: string,
          sObjectType: string,
          sObjectFields: string[],
          queryFilter: string,
        ) => Promise<SfdxOutputs['force']['data']['soql']['queryCsv']>;
      };
    };
    mdApi: {
      deploy: (
        targetUserName: string,
        testLevel: DeployTestLevel,
        isCheckOnly: boolean,
        deployDir?: string,
        deployZip?: string,
      ) => Promise<SfdxOutputs['force']['mdApi']['deploy']>;
      retrieve: (
        targetUserName: string,
        retrieveTargetDir: string,
        manifestFile?: string,
        packageNames?: string[],
      ) => Promise<SfdxOutputs['force']['mdApi']['retrieve']>;
    };
    org: {
      create: {
        scratch: (
          alias: string,
          isNoAncestors: boolean,
          definitionFile: string,
          devHubUserName: string,
          duration: number,
          overrideDefinition?: OverrideDefinition,
        ) => Promise<SfdxOutputs['force']['org']['create']['scratch']>;
      };
      delete: (targetUsername: string, devHubUserName: string) => Promise<SfdxOutputs['force']['org']['delete']>;
      display: (targetUsername: string) => Promise<SfdxOutputs['force']['org']['display']>;
    };
    package: {
      install: (targetUserName: string, packageId: string) => Promise<SfdxOutputs['force']['package']['install']>;
    };
    source: {
      push: (targetUserName: string, isForceOverwrite?: boolean) => Promise<SfdxOutputs['force']['package']['install']>;
    };
  };
}

const sfdx: Sfdx = {
  auth: {
    accessToken: {
      store: async (alias: string, instanceUrl: string, accessToken: string) =>
        await SFDX.auth.accessToken.store(alias, instanceUrl, accessToken),
    },
    sfdxUrl: {
      store: async (alias: string, sfdxUrlFile: string) => await SFDX.auth.sfdxUrl.store(alias, sfdxUrlFile),
    },
    list: async () => await SFDX.auth.list(),
    logout: async (targetUserName: string) => await SFDX.auth.logout(targetUserName),
  },
  force: {
    apex: {
      execute: async (targetUserName: string, apexCodeFile: string) =>
        await SFDX.force.apex.execute(targetUserName, apexCodeFile),
      test: {
        run: async (targetUserName: string, outputDir: string, testLevel: ApexTestLevel) =>
          await SFDX.force.apex.test.run(targetUserName, outputDir, testLevel),
      },
    },
    data: {
      bulk: {
        upsert: async (
          targetUserName: string,
          csvFile: string,
          externalId: string,
          sObjectType: string,
          allowNoMoreFailedBatches?: number,
          allowNoMoreFailedRecords?: number,
        ) =>
          await SFDX.force.data.bulk.upsert(
            targetUserName,
            csvFile,
            externalId,
            sObjectType,
            allowNoMoreFailedBatches,
            allowNoMoreFailedRecords,
          ),
      },
      tree: {
        import: async (targetUserName: string, planFile: string) =>
          await SFDX.force.data.tree.import(targetUserName, planFile),
      },
      soql: {
        queryCsv: async (
          targetUserName: string,
          csvFile: string,
          sObjectType: string,
          sObjectFields: string[],
          queryFilter: string,
        ) => await DataSoqlQueryCsv(targetUserName, csvFile, sObjectType, sObjectFields, queryFilter),
      },
    },
    mdApi: {
      deploy: async (
        targetUserName: string,
        testLevel: DeployTestLevel,
        isCheckOnly: boolean,
        deployDir?: string,
        deployZip?: string,
      ) => await MetadataDeploy(targetUserName, testLevel, isCheckOnly, deployDir, deployZip),
      retrieve: async (
        targetUserName: string,
        retrieveTargetDir: string,
        manifestFile?: string,
        packageNames?: string[],
      ) => await SFDX.force.mdApi.retrieve(targetUserName, retrieveTargetDir, manifestFile, packageNames),
    },
    org: {
      create: {
        scratch: async (
          alias: string,
          isNoAncestors: boolean,
          definitionFile: string,
          devHubUserName: string,
          duration: number,
          overrideDefinition?: OverrideDefinition,
        ) =>
          await SFDX.force.org.create.scratch(
            alias,
            isNoAncestors,
            definitionFile,
            devHubUserName,
            duration,
            overrideDefinition,
          ),
      },
      delete: async (targetUsername: string, devHubUserName: string) =>
        await SFDX.force.org.delete(targetUsername, devHubUserName),
      display: async (targetUsername: string) => await SFDX.force.org.display(targetUsername),
    },
    package: {
      install: async (targetUserName: string, packageId: string) =>
        await SFDX.force.package.install(targetUserName, packageId),
    },
    source: {
      push: async (targetUserName: string, isForceOverwrite?: boolean) =>
        await SFDX.force.source.push(targetUserName, isForceOverwrite),
    },
  },
};
export default sfdx;
