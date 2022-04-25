/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import SFDX, { SfdxOutputs } from '@ciguru/sfdx-ts-adapter';
import { TestLevel } from '@ciguru/sfdx-ts-adapter/dist/force/mdapi/deploy';
import { MetadataDeployError } from '../../errors';

interface Output {
  id: string;
  status: string;
  numberComponentErrors: number;
  numberComponentsDeployed: number;
  numberComponentsTotal: number;
  numberTestErrors: number;
  numberTestsCompleted: number;
  numberTestsTotal: number;
}

export default async function sfdxMetadataDeploy(
  targetUserName: string,
  testLevel: TestLevel,
  isCheckOnly: boolean,
  deployDir?: string,
  deployZip?: string,
): Promise<Output> {
  const deploy: SfdxOutputs['force']['mdApi']['deploy'] = await SFDX.force.mdApi.deploy(
    targetUserName,
    testLevel,
    isCheckOnly,
    deployDir,
    deployZip,
  );

  if (!deploy?.id) {
    throw new MetadataDeployError('Queueing deployment error', deploy);
  }

  // Retry to get a report on Connection timeouts and if deploy not done, but no more them 3 times.
  let attempt = 0;
  while (attempt < 3) {
    let result: SfdxOutputs['force']['mdApi']['deployReport'] | undefined;
    try {
      result = await SFDX.force.mdApi.deployReport(targetUserName, deploy.id, 30);
    } catch (e) {
      // Repeat on connection timeout
      if ((e as Error).message.indexOf('The client has timed out') === -1) {
        throw e;
      }
    }

    if (result?.done === true) {
      if (result?.success === true) {
        // return result;
        return {
          id: result.id,
          status: result.status,
          numberComponentErrors: result.numberComponentErrors,
          numberComponentsDeployed: result.numberComponentsDeployed,
          numberComponentsTotal: result.numberComponentsTotal,
          numberTestErrors: result.numberTestErrors,
          numberTestsCompleted: result.numberTestsCompleted,
          numberTestsTotal: result.numberTestsTotal,
        };
      } else {
        throw new MetadataDeployError('Deployment error', {
          id: result?.id,
          status: result?.status,
          numberComponentErrors: result?.numberComponentErrors,
          numberComponentsDeployed: result?.numberComponentsDeployed,
          numberComponentsTotal: result?.numberComponentsTotal,
          numberTestErrors: result?.numberTestErrors,
          numberTestsCompleted: result?.numberTestsCompleted,
          numberTestsTotal: result?.numberTestsTotal,
          details: {
            componentFailures: result?.details?.componentFailures,
            codeCoverageWarnings: result?.details?.runTestResult?.codeCoverageWarnings,
            testFailures: result?.details?.runTestResult?.failures,
          },
        });
      }
    }
    attempt++;
  }
  throw new MetadataDeployError('3 attempts to get deployment report was accidentally failed.', {});
}
