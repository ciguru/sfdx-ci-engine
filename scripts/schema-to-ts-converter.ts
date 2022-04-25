/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';
import { join } from 'path';

const prettierConfig = join(__dirname, '..', '.prettierrc.json');
const prettierSettings = JSON.parse(readFileSync(prettierConfig, { encoding: 'utf-8' }));

const jsonSchemaDir = join(__dirname, '..', 'schema');
const dtsSchemaDir = join(__dirname, '..', 'lib');

const schemaVersions = [
  {
    version: 'v1',
    versions: ['v1.0.0', 'v1.1.0'],
  },
];

async function generate() {
  // Prepare DTS folder
  if (!existsSync(dtsSchemaDir)) {
    mkdirSync(dtsSchemaDir, { recursive: true });
  }

  for (const majorVer of schemaVersions) {
    // Convert all version to DTS
    for (const v of majorVer.versions) {
      writeFileSync(
        join(dtsSchemaDir, `schema-${v}.ts`),
        await compileFromFile(join(jsonSchemaDir, `schema-${v}.json`), { style: prettierSettings }),
      );
    }
    // Save latest version as major
    cpSync(
      join(dtsSchemaDir, `schema-${majorVer.versions.slice(-1)}.ts`),
      join(dtsSchemaDir, `schema-${majorVer.version}.ts`),
    );
  }
}

generate().then();
