/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfdxAdapterError } from '@ciguru/sfdx-ts-adapter';
import { Output as SFDXOutput } from './helpers/sfdx/output';
import { Vars, Input } from '../lib/schema-v1.0.0';

const INPUT_PREFIX = 'input.';
const ENV_PREFIX = 'env.';
const VAR_PREFIX = 'var.';
const STEPS_OUTPUT_PREFIX = 'step.';

export interface Output {
  [stepId: string]:
    | {
        success: true;
        outputs: SFDXOutput;
      }
    | {
        success: false;
        error: SfdxAdapterError;
      };
}

type DataValue = string | number | boolean | null;

export interface Data {
  [key: string]: string | null;
}

export default class Variables {
  inputs: Data = {};
  variables: Data = {};
  outputs: Output = {};

  settings = {
    setInput: (input: Input, data: DataValue | undefined): Data => {
      // Use default value if there is no input data
      if (typeof data === 'undefined') {
        this.inputs[input.id] = this.getValue(input.default);
      } else {
        this.inputs[input.id] = this.getValue(data);
      }
      return this.inputs;
    },
    setVariables: (vars: Vars): Data => {
      for (const variable of vars) {
        this.variables[variable.id] = this.getValue(variable.value);
      }
      return this.variables;
    },
  };

  setOutput(data: { id?: string; outputs?: SFDXOutput; error?: SfdxAdapterError }): void {
    if (data.id) {
      if (!!data.error) {
        this.outputs[data.id] = {
          success: false,
          error: {
            name: data.error.name,
            stack: data.error.stack,
            message: data.error.message,
            logs: data.error.logs,
            summary: data.error.summary,
          },
        };
      } else {
        this.outputs[data.id] = {
          success: true,
          outputs: data.outputs,
        };
      }
    }
  }

  getBooleanValue(value: boolean | string): boolean {
    if (typeof value === 'boolean') {
      return value;
    } else {
      let result: string | null;
      if (value.trim().startsWith('$')) {
        result = this.calculateVariable(value);
      } else {
        result = value;
      }

      if (result?.toLowerCase() === 'true') {
        return true;
      } else if (result?.toLowerCase() === 'false') {
        return false;
      } else {
        // TODO
        return false;
      }
    }
  }

  getNumberValue(value: number | string): number {
    if (typeof value === 'number') {
      return value;
    } else {
      let result: string | null;
      if (value.trim().startsWith('$')) {
        result = this.calculateVariable(value);
      } else {
        result = value;
      }

      if (result && !Number.isNaN(result)) {
        return Number(result);
      } else {
        // TODO
        return 0;
      }
    }
  }

  getStringValue(value: string): string {
    let result: string | null;
    if (value.trim().startsWith('$')) {
      result = this.calculateVariable(value);
    } else {
      result = value;
    }

    // TODO nulls
    return result === null ? '' : result;
  }

  private getValue(value: DataValue | undefined): string | null {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return String(value);
      case 'string':
        if (value.trim().startsWith('$')) {
          return this.calculateVariable(value);
        } else {
          return value;
        }
      default:
        return null;
    }
  }

  private calculateVariable(value: string): string | null {
    // Clear string
    value = value.trim();
    if (value.startsWith('$')) {
      value = value.slice(1).trim();
    }
    if (value.startsWith('{{') && value.endsWith('}}')) {
      value = value.slice(2, value.length - 2).trim();
    }

    // Get value
    if (value.startsWith(ENV_PREFIX)) {
      return Variables.getEnv(value.slice(ENV_PREFIX.length));
    } else if (value.startsWith(INPUT_PREFIX)) {
      return this.getInput(value.slice(INPUT_PREFIX.length));
    } else if (value.startsWith(VAR_PREFIX)) {
      return this.getVariable(value.slice(VAR_PREFIX.length));
    } else if (value.startsWith(STEPS_OUTPUT_PREFIX)) {
      return this.getStepOutput(value.slice(STEPS_OUTPUT_PREFIX.length).split('.'), this.outputs);
    } else {
      return null;
    }
  }

  private getInput(key: string): string | null {
    if (this.inputs[key] === undefined) {
      return null;
    } else {
      return this.inputs[key];
    }
  }

  private getVariable(key: string): string | null {
    if (this.variables[key] === undefined) {
      return null;
    } else {
      return this.variables[key];
    }
  }

  private getStepOutput(keys: string[], data: { [index: string]: any }): string | null {
    if (keys.length === 0) {
      return null;
    }

    const key = keys.shift();
    let value: any;

    if (key && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, key)) {
      if (keys.length > 0) {
        value = this.getStepOutput(keys, data[key]);
      } else {
        value = data[key];
      }
    } else {
      value = null;
    }

    switch (typeof value) {
      case 'boolean':
      case 'number':
        return String(value);
      case 'string':
        return value;
      default:
        return null;
    }
  }

  private static getEnv(key: string): string | null {
    const envValue = process.env[key];
    return envValue === undefined ? null : envValue;
  }
}
