#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReport } from './codex-iris-schema-only-verifier-capsule.mjs';

const cases = [];
const failures = [];

function record(name, ok, detail = '') {
  cases.push({ name, status: ok ? 'pass' : 'fail' });
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

const repoReport = buildReport();
record('default_profile_passes', repoReport.status === 'pass', repoReport.status);
record('policy_json_parse_passes', repoReport.policyJsonStatus.status === 'pass');
record('schema_json_parse_passes', repoReport.schemaJsonParseStatus.status === 'pass');
record('markdown_presence_passes', repoReport.schemaMarkdownPresenceStatus.status === 'pass');
record('forbidden_fields_present', repoReport.forbiddenFieldConsistencyStatus.status === 'pass');
record('safe_artifact_shape_passes', repoReport.safeArtifactShapeStatus.status === 'pass');
record('runtime_boundary_passes', repoReport.runtimeBoundaryStatus.status === 'pass');
record('safe_summary_only_output', repoReport.safeSummaryOnly === true);
record('merge_readiness_no', repoReport.mergeReadiness === 'no');
record('no_runtime_execution_allowed', repoReport.runtimeExecutionAllowedInThisTask === false);
record('no_server_start_allowed', repoReport.serverStartAllowedInThisTask === false);
record('no_api_call_allowed', repoReport.apiCallAllowedInThisTask === false);
record('no_tts_asr_live2d_allowed',
  repoReport.ttsEngineCallAllowedInThisTask === false &&
  repoReport.asrEngineCallAllowedInThisTask === false &&
  repoReport.live2dRendererCallAllowedInThisTask === false);
record('no_raw_audio_allowed', repoReport.rawAudioAllowedInThisTask === false);
record('no_product_or_remote_diagnostic_execution',
  repoReport.productVerificationExecutionAllowedInThisTask === false &&
  repoReport.remoteDiagnosticExecutionAllowedInThisTask === false);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iris-schema-verifier-'));
const policyPath = path.join(tempDir, 'policy.json');
const mdPath = path.join(tempDir, 'profile.md');
const jsonPath = path.join(tempDir, 'profile.json');

const validPolicy = {
  currentActiveHarness: 'v1.1.7',
  futureHarnessAssumption: 'v1.1.8 planning only',
  readOnlyVerifierCapsule: true,
  fixtureScriptAllowed: false,
  runtimeExecutionAllowed: false,
  serverStartAllowed: false,
  apiCallAllowed: false,
  ttsEngineCallAllowed: false,
  asrEngineCallAllowed: false,
  live2dRendererCallAllowed: false,
  rawAudioAllowed: false,
  endpointConfigAllowed: false,
  productVerificationExecutionAllowed: false,
  remoteDiagnosticExecutionAllowed: false,
  runtimeReadinessClaimed: false,
  mergeReadiness: false,
};

const validProfile = {
  currentActiveHarness: 'v1.1.6',
  futureHarnessAssumption: 'v1.1.7 planning only',
  schemaOnlyStatus: true,
  fixtureScriptAllowed: false,
  runtimeExecutionAllowed: false,
  serverStartAllowed: false,
  apiCallAllowed: false,
  ttsEngineCallAllowed: false,
  asrEngineCallAllowed: false,
  live2dRendererCallAllowed: false,
  rawAudioAllowed: false,
  endpointConfigAllowed: false,
  runtimeReadinessClaimed: false,
  mergeReadiness: false,
  schemas: {
    iris_adapter_packet_v1_minimal_fixture_envelope: {},
    response_summary_safe_shape: {
      required: ['safe_summary_only'],
      fixed_false_fields: ['runtime_executed', 'server_started', 'api_called'],
    },
    render_group_safe_shape: {},
    mouth_cue_safe_summary_shape: {},
    subtitle_timing_safe_summary_shape: {},
    live2d_sync_cue_safe_summary_shape: {},
    unsafe_field_rejection_list: ['canonical_envelope', 'command', 'raw_audio', 'endpoint', 'secret', 'model_path'],
    forbidden_output_fields: ['canonical_envelope', 'command', 'raw_audio', 'endpoint', 'secret', 'model_path'],
  },
};

writeJson(policyPath, validPolicy);
writeJson(jsonPath, validProfile);
fs.writeFileSync(mdPath, 'schema-only safe artifact\nRuntime readiness claimed: no\nMerge readiness: no\n');

const tempPass = buildReport({ policyPath, schemaJsonPath: jsonPath, schemaMarkdownPath: mdPath });
record('temp_fixture_passes', tempPass.status === 'pass', tempPass.status);

const missingSchema = buildReport({ policyPath, schemaJsonPath: path.join(tempDir, 'missing.json'), schemaMarkdownPath: mdPath });
record('missing_schema_json_fails_closed', missingSchema.status === 'fail' && missingSchema.schemaJsonParseStatus.status === 'fail');

const malformedPath = path.join(tempDir, 'malformed.json');
fs.writeFileSync(malformedPath, '{');
const malformed = buildReport({ policyPath, schemaJsonPath: malformedPath, schemaMarkdownPath: mdPath });
record('malformed_schema_json_fails_closed', malformed.status === 'fail' && malformed.schemaJsonParseStatus.status === 'fail');

const rawOutput = JSON.stringify(repoReport);
record('no_raw_file_content_emitted',
  !rawOutput.includes('unsafe_field_rejection_list') &&
  !rawOutput.includes('subtitle_fixture_profile') &&
  !rawOutput.includes('response_summary_safe_shape'));

const checkedCases = cases.length;
const report = {
  irisSchemaOnlyVerifierCapsuleSelfCheckStatus: failures.length ? 'fail' : 'pass',
  checkedCases,
  cases,
  failures: failures.slice(0, 5),
  safeSummaryOnly: true,
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
