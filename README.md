# Continuous Delivery Engine, based on SFDX CLI

CI Engine to automate the [Salesforce CRM](https://salesforce.com) development process.
The Engine communicates with Salesforce through the [SFDX CLI](https://developer.salesforce.com/tools/sfdxcli).

# Installation

You can install this by either using npm installer.

### Requirements

To get started, you'll need to install node v16 (LTS) or greater. While this can be done using
an installer from nodejs.com or via an OS-specific package manager.

### Install package

```shell
> npm install --global @ciguru/sfdx-ci-engine
```

# Usage

## Tools based on adapter

- SFDX Plugin - Provides the ability to use the CI Engine as part of the [SFDX CLI](https://developer.salesforce.com/tools/sfdxcli).

## Import in your own code

```ts
// Import CI Engine
import CiEngine from '@ctsoftware/sfdx-ci-engine';
// Set up the CI Engine by specifying the path to the configuration file
const ci = new CiEngine(configurationfile);
// Tune the behaviur of your configuration by providing input
ci.setGlobalInputs({ foo: 'abra', bar: 123 });
// Performing CI steps(actions) according to configuration
await ci.run();
// Get step results(outputs)
const result = ci.getOutputs();
```

# CI Configuration

## Supported configuration file formats

You can use YAML (`.yaml` or `.yml`) or JSON (`.json`) files to set up the
configuration. You can import [JSON Schema](/schema/schema-v1.0.0.json) in
your IDE to simplify configuration process (guidelines for
[WebStorm](https://www.jetbrains.com/help/webstorm/json.html#ws_json_using_schemas) and
[VS Code](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings)).

## Configuration

### Top-level attributes

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td><b>Description</b></td></tr>
<tr><td>version</td><td>enum</td><td>true</td><td>CI Configuration version. Values:<br/>- 1.0.0<br/>- 1.0<br/>- 1.0.x<br/>- 1.x</td></tr>
<tr><td>inputs</td><td>Input[]</td><td>false</td><td>User input data. Supported by CLI tools</td></tr>
<tr><td>vars</td><td>Variable[]</td><td>false</td><td>Configuration variables</td></tr>
<tr><td>steps</td><td>Step[]</td><td>true</td><td>Job steps</td></tr>
</table>

---

### Input attributes

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>id</td><td>string</td><td>true</td><td>-</td><td>Input id. Must be unique for configuration. Pattern: [A-Za-z][0-9A-Za-z_-]{0,78}[0-9A-Za-z]?</td></tr>
<tr><td>description</td><td>string</td><td>false</td><td>-</td><td>Input variable description. Used bu CLI tool as input question.</td></tr>
<tr><td>required</td><td>boolean</td><td>false</td><td>-</td><td>Mark input as required (default: false)</td></tr>
<tr><td>default</td><td>string | number | boolean | null</td><td>false</td><td>yes, only $env</td><td>Default value of input variable (default: null).</td></tr>
</table>

---

### Variable attributes

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>id</td><td>string</td><td>true</td><td>-</td><td>Variable id. Must be unique for configuration. Pattern: [A-Za-z][0-9A-Za-z_-]{0,78}[0-9A-Za-z]?</td></tr>
<tr><td>description</td><td>string</td><td>false</td><td>-</td><td>Variable description</td></tr>
<tr><td>value</td><td>string | number | boolean | null</td><td>true</td><td>yes, only $env and $input</td><td>Value of variable</td></tr>
</table>

---

### Step attributes

#### Attributes for all steps

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>type</td><td>enum</td><td>true</td><td>-</td><td>Type of step. Values:<br/>
- sfdx.auth.accessToken - Authorize an org using an access token<br/>
- sfdx.auth.list - List auth connection information<br/>
- sfdx.auth.logout - Log out from authorized orgs<br/>
- sfdx.auth.sfdxUrl - Authorize an org using sfdxurl<br/>
- sfdx.force.apex.execute - Executes anonymous Apex code<br/>
- sfdx.force.apex.test.run - Invoke Apex tests<br/>
- sfdx.force.data.bulk.upsert - Bulk upsert records from a CSV file<br/>
- sfdx.force.data.tree.import - Import data into an org<br/>
- sfdx.force.mdApi.deploy - Deploy metadata to an org using Metadata API<br/>
- sfdx.force.mdApi.retrieve - Retrieve metadata from an org using Metadata API<br/>
- sfdx.force.org.create.scratch - Create a scratch org<br/>
- sfdx.force.org.delete - Mark a scratch or sandbox org for deletion<br/>
- sfdx.force.org.display - Get the description for the current or target org<br/>
- sfdx.force.package.install - Install a package in the target org<br/>
- sfdx.force.source.push - Push source to a scratch org from the project<br/>
</td></tr>
<tr><td>id</td><td>string</td><td>true</td><td>-</td><td>Step ID to be referenced in output. Must be unique for configuration. Pattern: [A-Za-z][0-9A-Za-z-_]{0,39}</td></tr>
<tr><td>description</td><td>string</td><td>false</td><td>-</td><td>Step description.</td></tr>
<tr><td>continueOnError</td><td>string</td><td>false</td><td>-</td><td>Continue configuration execution on step error (default: false)</td></tr>
</table>

#### Additional attributes for `sfdx.auth.accessToken` step

Authorize an org using access token

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>alias</td><td>string</td><td>true</td><td>yes</td><td>Alias for the authenticated org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>instanceUrl</td><td>string</td><td>true</td><td>yes</td><td>Login URL of the instance the org lives on. Pattern: https://[a-zA-Z0-9][a-zA-Z0-9.-]{1,255}\.salesforce\.com/?</td></tr>
<tr><td>accessToken</td><td>string</td><td>true</td><td>yes</td><td>Active access token. Pattern: 00D[0-9A-Za-z]{12}![0-9A-Za-z_.]{96}</td></tr>
</table>

#### Additional attributes for `sfdx.auth.list` step

List auth connection information

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
</table>

#### Additional attributes for `sfdx.auth.logout` step

Log out from authorized orgs

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
</table>

#### Additional attributes for `sfdx.auth.sfdxUrl` step

Authorize an org using sfdxurl

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>alias</td><td>string</td><td>true</td><td>yes</td><td>Alias for the authenticated org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>sfdxUrlFile</td><td>string</td><td>true</td><td>yes</td><td>Path to a file containing the sfdx url</td></tr>
</table>

#### Additional attributes for `sfdx.force.apex.execute` step

Executes anonymous Apex code

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>apexCodeFile</td><td>string</td><td>true</td><td>yes</td><td>Path to a local file that contains Apex code</td></tr>
</table>

#### Additional attributes for `sfdx.force.apex.test.run` step

Invoke Apex tests

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>testLevel</td><td>enum</td><td>true</td><td>-</td><td>Specifies which tests to run, using one of these TestLevel enum values:<br/>- RunSpecifiedTests—Only the tests that you specify are run (not supported yet)<br/>- RunLocalTests—All tests in your org are run, except the ones that originate from installed managed packages<br/>- RunAllTestsInOrg—All tests are in your org and in installed managed packages are run</td></tr>
<tr><td>outputDir</td><td>string</td><td>true</td><td>yes</td><td>Directory to store test run files</td></tr>
</table>

#### Additional attributes for `sfdx.force.data.bulk.upsert` step

Bulk upsert records from a CSV file

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>csvFile</td><td>string</td><td>true</td><td>yes</td><td>Path to the CSV file that defines the records to upsert</td></tr>
<tr><td>externalId</td><td>string</td><td>true</td><td>-</td><td>Column name of the external ID. Pattern: [A-Za-z][0-9A-Za-z_]{0,38}[0-9A-Za-z]</td></tr>
<tr><td>sObjectType</td><td>string</td><td>true</td><td>-</td><td>SObject type of the records you want to upsert. Pattern: [A-Za-z][0-9A-Za-z_]{0,38}[0-9A-Za-z]</td></tr>
<tr><td>allowNoMoreFailedBatches</td><td>number</td><td>false</td><td>-</td><td>Mark a step as successful if the number of Failed Batches is less than the specified number (default: 0).</td></tr>
<tr><td>allowNoMoreFailedRecords</td><td>number</td><td>false</td><td>-</td><td>Mark a step as successful if the number of Failed Records is less than the specified number (default: 0).</td></tr>
</table>

#### Additional attributes for `sfdx.force.data.tree.import` step

Import data into an org

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>planFile</td><td>string</td><td>true</td><td>yes</td><td>Path to plan to insert multiple data files that have master-detail relationships</td></tr>
</table>

#### Additional attributes for `sfdx.force.mdApi.deploy` step

Deploy metadata to an org using Metadata API

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>testLevel</td><td>string</td><td>true</td><td>-</td><td>Specifies which tests to run, using one of these TestLevel enum values:<br/>- NoTestRun-No one test runs.<br/>- RunSpecifiedTests — Only the tests that you specify are run (not supported yet).<br/>- RunLocalTests — All tests in your org are run, except the ones that originate from installed managed packages.<br/>- RunAllTestsInOrg — All tests are in your org and in installed managed packages are run</td></tr>
<tr><td>checkOnly</td><td>boolean</td><td>false</td><td>-</td><td>Validate deploy but don’t save to the org</td></tr>
<tr><td>deployDir</td><td>string</td><td>false</td><td>yes</td><td>Root of directory tree of files to deploy. deployDir or deployZip is required. deployDir will be used if specified both parameters</td></tr>
<tr><td>deployZip</td><td>string</td><td>false</td><td>yes</td><td>Path to Zip of files to deploy. deployDir or deployZip is required. deployDir will be used if specified both parameters</td></tr>
</table>

#### Additional attributes for `sfdx.force.mdApi.retrieve` step

Retrieve metadata from an org using Metadata API

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>retrieveTargetDir</td><td>string</td><td>true</td><td>yes</td><td>Directory for the retrieved metadata</td></tr>
<tr><td>manifestFile</td><td>string</td><td>false</td><td>yes</td><td>File path of manifest of components to retrieve</td></tr>
<tr><td>packageNames</td><td>string[]</td><td>false</td><td>-</td><td>List of packages to retrieve</td></tr>
</table>

#### Additional attributes for `sfdx.force.org.create.scratch` step

Create a scratch org

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>alias</td><td>string</td><td>true</td><td>yes</td><td>Alias for the created org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>noAncestors</td><td>boolean</td><td>false</td><td>-</td><td>Do not include second-generation package ancestors in the scratch org (default: false)</td></tr>
<tr><td>definitionFile</td><td>string</td><td>true</td><td>yes</td><td>Path to an org definition file</td></tr>
<tr><td>devHubUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>duration</td><td>number</td><td>false</td><td>yes</td><td>Duration of the scratch org (in days) (default: 1, min:1, max:30)</td></tr>
<tr><td>overrideDefinition.adminEmail</td><td>string</td><td>false</td><td>yes</td><td>Administrator Email address of the Dev Hub user making the scratch org creation request.</td></tr>
</table>

#### Additional attributes for `sfdx.force.org.delete` step

Mark a scratch or sandbox org for deletion

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>devHubUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
</table>

#### Additional attributes for `sfdx.force.org.display` step

Get the description for the current or target org

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
</table>

#### Additional attributes for `sfdx.force.package.install` step

Install a package in the target org

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>packageId</td><td>string</td><td>true</td><td>yes</td><td>ID (starts with 04t) or alias of the package version to install. Pattern: 04t([0-9A-Za-z]{12}|[0-9A-Za-z]{15}</td></tr>
</table>

#### Additional attributes for `sfdx.force.source.push` step

Push source to a scratch org from the project

<table>
<tr><td><b>Attribute</b></td><td><b>Type</b></td><td><b>Required</b></td><td>$ref syntax</td><td><b>Description</b></td></tr>
<tr><td>targetUserName</td><td>string</td><td>true</td><td>yes</td><td>Username or alias for the target org. Pattern: [0-9A-Za-z_-]{1,40}</td></tr>
<tr><td>forceOverwrite</td><td>boolean</td><td>false</td><td>-</td><td>Ignore conflict warnings and overwrite changes to scratch org (default: false)</td></tr>
</table>

---

## Reference syntax

- $env.ENVIRONMENT_NAME
- $input.INPUT_ID
- $var.VARIABLE_ID
- $step.STEP_ID.outputs
