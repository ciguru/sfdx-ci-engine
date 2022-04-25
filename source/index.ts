/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import EventEmitter from 'events';
import { load, Schema } from './ci-configuration';
import CI from './helpers/ci';
import SFDX from './helpers/sfdx';
import { UnloadedSettings } from './errors';
import Variables, { Data, Output } from './variables';
import { SfdxAdapterError } from '@ciguru/sfdx-ts-adapter';
import {
  StepCiChangeSetCreate,
  StepSfdxAuthAccessToken,
  StepSfdxAuthList,
  StepSfdxAuthLogout,
  StepSfdxAuthSfdxUrl,
  StepSfdxForceApexExecute,
  StepSfdxForceApexTestRun,
  StepSfdxForceDataBulkDelete,
  StepSfdxForceDataBulkUpsert,
  StepSfdxForceDataTreeImport,
  StepSfdxForceDataSoqlQueryCsv,
  StepSfdxForceMdApiDeploy,
  StepSfdxForceMdApiRetrieve,
  StepSfdxForceOrgCreateScratch,
  StepSfdxForceOrgDelete,
  StepSfdxForceOrgDisplay,
  StepSfdxForcePackageInstall,
  StepSfdxForceSourcePush,
} from '../lib/schema-v1';

type StepTypes =
  | StepCiChangeSetCreate
  | StepSfdxAuthAccessToken
  | StepSfdxAuthList
  | StepSfdxAuthLogout
  | StepSfdxAuthSfdxUrl
  | StepSfdxForceApexExecute
  | StepSfdxForceApexTestRun
  | StepSfdxForceDataBulkDelete
  | StepSfdxForceDataBulkUpsert
  | StepSfdxForceDataTreeImport
  | StepSfdxForceDataSoqlQueryCsv
  | StepSfdxForceMdApiDeploy
  | StepSfdxForceMdApiRetrieve
  | StepSfdxForceOrgCreateScratch
  | StepSfdxForceOrgDelete
  | StepSfdxForceOrgDisplay
  | StepSfdxForcePackageInstall
  | StepSfdxForceSourcePush;

export default class CiEngine {
  private readonly settingsPath: string;
  private readonly vars;
  public event: EventEmitter;

  constructor(settingsPath: string) {
    this.settingsPath = settingsPath;
    this.vars = new Variables();
    this.event = new EventEmitter();
  }

  private readonly stepEngine: {
    [stepType: string]: (step: any) => Promise<void>;
  } = {
    'ci.changeSet.create': async (step: StepCiChangeSetCreate) => this.ciChangeSetCreate(step),
    'sfdx.auth.accessToken': async (step: StepSfdxAuthAccessToken) => this.sfdxAuthAccessToken(step),
    'sfdx.auth.list': async (step: StepSfdxAuthList) => this.sfdxAuthList(step),
    'sfdx.auth.logout': async (step: StepSfdxAuthLogout) => this.sfdxAuthLogout(step),
    'sfdx.auth.sfdxUrl': async (step: StepSfdxAuthSfdxUrl) => this.sfdxAuthSfdxUrl(step),
    'sfdx.force.apex.execute': async (step: StepSfdxForceApexExecute) => this.sfdxForceApexExecute(step),
    'sfdx.force.apex.test.run': async (step: StepSfdxForceApexTestRun) => this.sfdxForceApexTestRun(step),
    'sfdx.force.data.bulk.delete': async (step: StepSfdxForceDataBulkDelete) => this.sfdxForceDataBulkDelete(step),
    'sfdx.force.data.bulk.upsert': async (step: StepSfdxForceDataBulkUpsert) => this.sfdxForceDataBulkUpsert(step),
    'sfdx.force.data.tree.import': async (step: StepSfdxForceDataTreeImport) => this.sfdxForceDataTreeImport(step),
    'sfdx.force.data.soql.query.csv': async (step: StepSfdxForceDataSoqlQueryCsv) =>
      this.sfdxForceDataSoqlQueryCsv(step),
    'sfdx.force.mdApi.deploy': async (step: StepSfdxForceMdApiDeploy) => this.sfdxForceMdApiDeploy(step),
    'sfdx.force.mdApi.retrieve': async (step: StepSfdxForceMdApiRetrieve) => this.sfdxForceMdApiRetrieve(step),
    'sfdx.force.org.create.scratch': async (step: StepSfdxForceOrgCreateScratch) =>
      this.sfdxForceOrgCreateScratch(step),
    'sfdx.force.org.delete': async (step: StepSfdxForceOrgDelete) => this.sfdxForceOrgDelete(step),
    'sfdx.force.org.display': async (step: StepSfdxForceOrgDisplay) => this.sfdxForceOrgDisplay(step),
    'sfdx.force.package.install': async (step: StepSfdxForcePackageInstall) => this.sfdxForcePackageInstall(step),
    'sfdx.force.source.push': async (step: StepSfdxForceSourcePush) => this.sfdxForceSourcePush(step),
  };

  private settings: undefined | Schema;
  private stepIdMap: { [id: string]: number } = {};

  async loadSettings(): Promise<Schema> {
    const { settings, stepIdMap } = await load(this.settingsPath);
    this.stepIdMap = stepIdMap;
    return (this.settings = settings);
  }

  // Allowed variables defined in settings only.
  setGlobalInputs(inputData: Data): void {
    if (this.settings === undefined) {
      throw new UnloadedSettings();
    }
    if (this.settings.inputs && this.settings.inputs.length > 0) {
      for (const input of this.settings.inputs) {
        this.vars.settings.setInput(input, inputData[input.id]);
      }
    }
  }

  protected setGlobalVariables(): void {
    if (this.settings === undefined) {
      throw new UnloadedSettings();
    }
    if (this.settings.vars && this.settings.vars.length > 0) {
      this.vars.settings.setVariables(this.settings.vars);
    }
  }

  public getStep(stepId: string): { step: StepTypes; number: number; total: number } | undefined {
    if (this.stepIdMap[stepId] !== undefined && this.settings && this.settings.steps[this.stepIdMap[stepId]]) {
      return {
        step: this.settings.steps[this.stepIdMap[stepId]] as StepTypes,
        number: this.stepIdMap[stepId],
        total: this.settings.steps.length,
      };
    } else {
      return undefined;
    }
  }

  public getOutputs(): Output {
    return this.vars.outputs;
  }

  async run(): Promise<void> {
    if (this.settings === undefined) {
      throw new UnloadedSettings();
    }

    // Calculate variables
    this.setGlobalVariables();

    try {
      for (const step of this.settings.steps) {
        this.event.emit('step_start', step.id);
        if (Object.prototype.hasOwnProperty.call(this.stepEngine, step.type)) {
          await this.stepEngine[step.type](step);
        }
        this.event.emit('step_finish');
      }
    } catch (e) {
      this.event.emit('step_error', (e as Error).message);
      throw e;
    }
  }

  private async ciChangeSetCreate(step: StepCiChangeSetCreate): Promise<void> {
    try {
      const outputs = await CI.changeSet.create(
        this.vars.getStringValue(step.headSha),
        this.vars.getStringValue(step.baseSha),
        step.destructiveChangeSetMode || 'post',
        this.vars.getStringValue(step.changeSetDir),
        step.createRevertChangeSet || false,
        step.revertDestructiveChangeSetMode || 'post',
        this.vars.getStringValue(step.revertChangeSetDir || ''),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxAuthAccessToken(step: StepSfdxAuthAccessToken): Promise<void> {
    try {
      const outputs = await SFDX.auth.accessToken.store(
        this.vars.getStringValue(step.alias),
        this.vars.getStringValue(step.instanceUrl),
        this.vars.getStringValue(step.accessToken),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxAuthList(step: StepSfdxAuthList): Promise<void> {
    try {
      const outputs = await SFDX.auth.list();
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxAuthLogout(step: StepSfdxAuthLogout): Promise<void> {
    try {
      const outputs = await SFDX.auth.logout(this.vars.getStringValue(step.targetUserName));
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxAuthSfdxUrl(step: StepSfdxAuthSfdxUrl): Promise<void> {
    try {
      const outputs = await SFDX.auth.sfdxUrl.store(
        this.vars.getStringValue(step.alias),
        this.vars.getStringValue(step.sfdxUrlFile),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceApexExecute(step: StepSfdxForceApexExecute): Promise<void> {
    try {
      const outputs = await SFDX.force.apex.execute(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.apexCodeFile),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceApexTestRun(step: StepSfdxForceApexTestRun): Promise<void> {
    try {
      const outputs = await SFDX.force.apex.test.run(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.outputDir),
        step.testLevel,
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceDataBulkDelete(step: StepSfdxForceDataBulkDelete): Promise<void> {
    try {
      const outputs = await SFDX.force.data.bulk.delete(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.csvFile),
        step.sObjectType,
        step.allowNoMoreFailedBatches,
        step.allowNoMoreFailedRecords,
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceDataBulkUpsert(step: StepSfdxForceDataBulkUpsert): Promise<void> {
    try {
      const outputs = await SFDX.force.data.bulk.upsert(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.csvFile),
        step.externalId,
        step.sObjectType,
        step.allowNoMoreFailedBatches,
        step.allowNoMoreFailedRecords,
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceDataTreeImport(step: StepSfdxForceDataTreeImport): Promise<void> {
    try {
      const outputs = await SFDX.force.data.tree.import(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.planFile),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceDataSoqlQueryCsv(step: StepSfdxForceDataSoqlQueryCsv): Promise<void> {
    try {
      await SFDX.force.data.soql.queryCsv(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.csvFile),
        step.sObjectType,
        step.sObjectFields,
        step.queryFilter || '',
      );
      this.vars.setOutput({ id: step.id });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceMdApiDeploy(step: StepSfdxForceMdApiDeploy): Promise<void> {
    try {
      const outputs = await SFDX.force.mdApi.deploy(
        this.vars.getStringValue(step.targetUserName),
        step.testLevel,
        step.checkOnly || false,
        this.vars.getStringValue(step.deployDir || ''),
        this.vars.getStringValue(step.deployZip || ''),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceMdApiRetrieve(step: StepSfdxForceMdApiRetrieve): Promise<void> {
    try {
      const outputs = await SFDX.force.mdApi.retrieve(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.retrieveTargetDir),
        this.vars.getStringValue(step.manifestFile || ''),
        step.packageNames,
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceOrgCreateScratch(step: StepSfdxForceOrgCreateScratch): Promise<void> {
    try {
      const outputs = await SFDX.force.org.create.scratch(
        this.vars.getStringValue(step.alias),
        step.noAncestors || false,
        this.vars.getStringValue(step.definitionFile),
        this.vars.getStringValue(step.devHubUserName),
        step.duration ? this.vars.getNumberValue(step.duration) : 1,
        {
          adminEmail: this.vars.getStringValue(step.overrideDefinition?.adminEmail || ''),
        },
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceOrgDelete(step: StepSfdxForceOrgDelete): Promise<void> {
    try {
      const outputs = await SFDX.force.org.delete(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.devHubUserName),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceOrgDisplay(step: StepSfdxForceOrgDisplay): Promise<void> {
    try {
      const outputs = await SFDX.force.org.display(this.vars.getStringValue(step.targetUserName));
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForcePackageInstall(step: StepSfdxForcePackageInstall): Promise<void> {
    try {
      const outputs = await SFDX.force.package.install(
        this.vars.getStringValue(step.targetUserName),
        this.vars.getStringValue(step.packageId),
      );
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  private async sfdxForceSourcePush(step: StepSfdxForceSourcePush): Promise<void> {
    try {
      const outputs = await SFDX.force.source.push(this.vars.getStringValue(step.targetUserName), step.forceOverwrite);
      this.vars.setOutput({ id: step.id, outputs });
    } catch (e) {
      this.stepErrorHandler(step, e as SfdxAdapterError);
    }
  }

  stepErrorHandler(step: StepTypes, error: SfdxAdapterError): void {
    this.vars.setOutput({ id: step.id, error });
    if (!step.continueOnError) {
      throw error;
    }
  }
}
