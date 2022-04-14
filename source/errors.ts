/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfdxAdapterError } from '@ciguru/sfdx-ts-adapter';

export class FileNotExist extends Error {
  name = 'FileNotExist';
  constructor(fileName: string) {
    super(`File '${fileName}' is not exist.`);
  }
}

export class IncorrectContentOfFile extends Error {
  name = 'IncorrectContentOfFile';
  constructor(fileName: string, contentType: string) {
    super(`File '${fileName}' must contain valid ${contentType} data.`);
  }
}

export class IncorrectFileType extends Error {
  name = 'IncorrectFileType';
  constructor(fileName: string, fileType: string) {
    super(`File '${fileName}' must be a ${fileType} file.`);
  }
}

export class IncorrectSchema extends Error {
  name = 'IncorrectSchema';
  constructor(fileName: string, errors: string) {
    super(`File '${fileName}' has incorrect schema. Errors: ${errors}`);
  }
}

export class DuplicateStepId extends Error {
  name = 'DuplicateStepId';
  constructor(stepId: string, i: number, j: number) {
    super(`Steps #${i} and #${j} has duplicated ID: '${stepId}'`);
  }
}

export class UnloadedSettings extends Error {
  name = 'UnloadedSettings';
  constructor() {
    super('CI Settings are not loaded. loadSettings() must be called at the first.');
  }
}

export class MetadataDeployError extends SfdxAdapterError {
  constructor(message: string, summary: { [k: string]: any } | undefined) {
    super('MetadataDeployError', message, { summary });
  }
}
