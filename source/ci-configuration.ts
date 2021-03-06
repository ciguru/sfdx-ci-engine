/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { readFileSync, existsSync } from 'fs';
import { Validator, ValidatorResult } from 'jsonschema';
import JsYaml from 'js-yaml';

import { FileNotExist, IncorrectContentOfFile, IncorrectFileType, IncorrectSchema, DuplicateStepId } from './errors';
import { JSONSchemaForCTSoftwareSFDXCIConfiguration as SchemaV100 } from '../lib/schema-v1.0.0';
import { JSONSchemaForCTSoftwareSFDXCIConfiguration as SchemaV1 } from '../lib/schema-v1';
import JsonSchemaV100 from '../schema/schema-v1.0.0.json';
import JsonSchemaV110 from '../schema/schema-v1.1.0.json';

export type Schema = SchemaV100 | SchemaV1;

function parseConfigurationFile(filePath: string, rawSettings: string): Schema {
  switch (filePath.slice(filePath.lastIndexOf('.')).toLowerCase()) {
    case '.yml':
    case '.yaml':
      try {
        return JsYaml.load(rawSettings) as Schema;
      } catch (e) {
        throw new IncorrectContentOfFile(filePath, 'YAML');
      }
    case '.json':
      try {
        return JSON.parse(rawSettings) as Schema;
      } catch (e) {
        throw new IncorrectContentOfFile(filePath, 'JSON');
      }
    default:
      throw new IncorrectFileType(filePath, 'YAML or JSON');
  }
}

interface StepIdMap {
  [id: string]: number;
}

function validateStepIdUniqueness(settings: Schema): StepIdMap {
  const stepIdMap: StepIdMap = {};
  for (let i = 0; i < settings.steps.length; i++) {
    const step = settings.steps[i];
    if (stepIdMap[step.id] === undefined) {
      stepIdMap[step.id] = i;
    } else {
      throw new DuplicateStepId(step.id, stepIdMap[step.id], i);
    }
  }
  return stepIdMap;
}

export async function load(filePath: string): Promise<{ settings: Schema; stepIdMap: StepIdMap }> {
  // Read data from file
  if (!existsSync(filePath)) {
    throw new FileNotExist(filePath);
  }
  const rawSettings = readFileSync(filePath, { encoding: 'utf-8' });

  // Parse data
  const settings: Schema = parseConfigurationFile(filePath, rawSettings);

  // Validate data
  let validationResult: ValidatorResult;

  switch (settings.version) {
    case '1.0.0':
    case '1.0.x':
    case '1.0':
      validationResult = new Validator().validate(settings, JsonSchemaV100);
      break;
    case '1.1.0':
    case '1.1.x':
    case '1.1':
    case '1.x':
    default:
      validationResult = new Validator().validate(settings, JsonSchemaV110);
  }

  if (!validationResult.valid) {
    throw new IncorrectSchema(filePath, validationResult.errors.toString());
  }

  // Validate if step IDs is unique and get StepIdMap
  const stepIdMap: StepIdMap = validateStepIdUniqueness(settings);

  return {
    settings,
    stepIdMap,
  };
}
