/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfdxOutputs } from '@ciguru/sfdx-ts-adapter';

export type Output =
  | SfdxOutputs['auth']['accessToken']['store']
  | SfdxOutputs['auth']['sfdxUrl']['store']
  | SfdxOutputs['auth']['list']
  | SfdxOutputs['auth']['logout']
  | SfdxOutputs['force']['apex']['execute']
  | SfdxOutputs['force']['apex']['test']['run']
  | SfdxOutputs['force']['data']['bulk']['delete']
  | SfdxOutputs['force']['data']['bulk']['upsert']
  | SfdxOutputs['force']['data']['tree']['import']
  | SfdxOutputs['force']['data']['soql']['queryCsv']
  | SfdxOutputs['force']['mdApi']['deploy']
  | SfdxOutputs['force']['mdApi']['retrieve']
  | SfdxOutputs['force']['org']['create']['scratch']
  | SfdxOutputs['force']['org']['delete']
  | SfdxOutputs['force']['org']['display']
  | SfdxOutputs['force']['package']['install']
  | SfdxOutputs['force']['source']['push'];
