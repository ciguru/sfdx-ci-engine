/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import SFDX from '../../sfdx';
import { Output as SfdxOutput } from '@ciguru/sfdx-ts-adapter/dist/force/data/bulk/upsert';

export type Output = SfdxOutput;

export type SObjectItem =
  | string
  | {
      source: string;
      target: string;
    };

type Org = 'source' | 'target';

export function getItem(item: SObjectItem, org: Org): string {
  if (typeof item === 'string') {
    return item;
  } else {
    return item[org];
  }
}

function getFields(sObjectFields: SObjectItem[], org: Org): string[] {
  const fields: string[] = [];
  for (const item of sObjectFields) {
    fields.push(getItem(item, org));
  }
  return fields;
}

function deleteFile(fileName: string): void {
  if (existsSync(fileName)) {
    rmSync(fileName);
  }
}

export default async function (
  sourceOrgAlias: string,
  targetOrgAlias: string,
  sObjectType: SObjectItem,
  sObjectFields: SObjectItem[],
  queryFilter: string,
  externalId: string,
  allowNoMoreFailedBatches?: number,
  allowNoMoreFailedRecords?: number,
): Promise<Output> {
  // Get data from source org
  const tmpFile = join(process.cwd(), `tmp_data_${Date.now()}.csv`);
  try {
    await SFDX.force.data.soql.queryCsv(
      sourceOrgAlias,
      tmpFile,
      getItem(sObjectType, 'source'),
      getFields(sObjectFields, 'source'),
      queryFilter,
      getFields(sObjectFields, 'target'),
    );

    // Load data to target org
    const result = await SFDX.force.data.bulk.upsert(
      targetOrgAlias,
      tmpFile,
      externalId,
      getItem(sObjectType, 'target'),
      allowNoMoreFailedBatches,
      allowNoMoreFailedRecords,
    );

    // Delete tmp files
    deleteFile(tmpFile);

    return result;
  } catch (e) {
    deleteFile(tmpFile);
    throw e;
  }
}
