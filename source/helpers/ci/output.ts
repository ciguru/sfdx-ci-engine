/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Changes as ChangeSetOutput } from './change-set/create';
import { Output as DataTransferOutput } from './data/transfer';

export type CiOutput = ChangeSetOutput | DataTransferOutput;
