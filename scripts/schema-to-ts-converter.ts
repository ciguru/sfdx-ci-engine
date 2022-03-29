/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';
import * as Path from 'path';

const prettierConfig = Path.join(__dirname, '../.prettierrc.json');
const jsonSchemaName = Path.join(__dirname, '../schema/schema-v1.0.0.json');
const dtsSchemaDir = Path.join(__dirname, '../lib');
const dtsSchemaName = `${dtsSchemaDir}/schema-v1.0.0.ts`;

async function generate() {
  const prettierSettings = JSON.parse(readFileSync(prettierConfig, { encoding: 'utf-8' }));

  if (!existsSync(dtsSchemaDir)) {
    mkdirSync(dtsSchemaDir, { recursive: true });
  }

  writeFileSync(dtsSchemaName, await compileFromFile(jsonSchemaName, { style: prettierSettings }));
}

generate().then();
