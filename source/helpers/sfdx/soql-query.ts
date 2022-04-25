/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import SFDX from '@ciguru/sfdx-ts-adapter';
import { Output } from '@ciguru/sfdx-ts-adapter/dist/force/data/soql';

function buildQueryString(sObjectType: string, sObjectFields: string[], queryFilter: string): string {
  return `SELECT ${sObjectFields.join(',')} FROM ${sObjectType} ${queryFilter}`;
}

export async function DataSoqlQueryCsv(
  targetUserName: string,
  csvFile: string,
  sObjectType: string,
  sObjectFields: string[],
  queryFilter: string,
  replaceCsvHeader?: string[],
): Promise<Output> {
  return await SFDX.force.data.soql.queryCsv(
    targetUserName,
    csvFile,
    buildQueryString(sObjectType, sObjectFields, queryFilter),
    replaceCsvHeader ? replaceCsvHeader?.join(',') : undefined,
  );
}
