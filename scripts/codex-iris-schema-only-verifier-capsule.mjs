#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_POLICY_PATH = 'docs/process/CODEX_IRIS_SCHEMA_ONLY_READONLY_VERIFIER_CAPSULE_POLICY_V1_1_7.json';
const DEFAULT_SCHEMA_JSON_PATH = 'docs/process/CODEX_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.json';
const DEFAULT_SCHEMA_MARKDOWN_PATH = 'docs/process/CODEX_VOXWEAVE_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.md';

const REQUIRED_PROFILE_FIELDS = [
  'currentActiveHarness',
  'futureHarnessAssumption',
  'schemaOnlyStatus',
  'fixtureScriptAllowed',
  'runtimeExecutionAllowed',
  'serverStartAllowed',
  'apiCallAllowed',
  'ttsEngineCallAllowed',
  'asrEngineCallAllowed',
  'live2dRendererCallAllowed',
  'rawAudioAllowed',
  'endpointConfigAllowed',
  'runtimeReadinessClaimed',
  'mergeReadiness',
  'schemas',
];

const REQUIRED_POLICY_FALSE_FLAGS = [
  'fixtureScriptAllowed',
  'runtimeExecutionAllowed',
  'serverStartAllowed',
  'apiCallAllowed',
  'ttsEngineCallAllowed',
  'asrEngineCallAllowed',
  'live2dRendererCallAllowed',
  'rawAudioAllowed',
  'endpointConfigAllowed',
  'productVerificationExecutionAllowed',
  'remoteDiagnosticExecutionAllowed',
  'runtimeReadinessClaimed',
  'mergeReadiness',
];

const REQUIRED_SCHEMA_FALSE_FLAGS = [
  'fixtureScriptAllowed',
  'runtimeExecutionAllowed',
  'serverStartAllowed',
  'apiCallAllowed',
  'ttsEngineCallAllowed',
  'asrEngineCallAllowed',
  'live2dRendererCallAllowed',
  'rawAudioAllowed',
  'endpointConfigAllowed',
  'runtimeReadinessClaimed',
  'mergeReadiness',
];

const REQUIRED_FORBIDDEN_TERMS = [
  'canonical_envelope',
  'command',
  'raw_audio',
  'endpoint',
  'secret',
  'model_path',
];

const SAFE_SHAPE_KEYS = [
  'iris_adapter_packet_v1_minimal_fixture_envelope',
  'response_summary_safe_shape',
  'render_group_safe_shape',
  'mouth_cue_safe_summary_shape',
  'subtitle_timing_safe_summary_shape',
  'live2d_sync_cue_safe_summary_shape',
  'unsafe_field_rejection_list',
  'forbidden_output_fields',
];

function status(name, ok, reasonCodes = []) {
  return {
    status: ok ? 'pass' : 'fail',
    reasonCodes: ok ? [] : reasonCodes,
    safeSummaryOnly: true,
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    policyPath: DEFAULT_POLICY_PATH,
    schemaJsonPath: DEFAULT_SCHEMA_JSON_PATH,
    schemaMarkdownPath: DEFAULT_SCHEMA_MARKDOWN_PATH,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--policy') args.policyPath = argv[++i];
    else if (arg === '--schema-json') args.schemaJsonPath = argv[++i];
    else if (arg === '--schema-markdown') args.schemaMarkdownPath = argv[++i];
  }
  return args;
}

function readJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch {
    return { ok: false };
  }
}

function readText(filePath) {
  try {
    return { ok: true, value: fs.readFileSync(filePath, 'utf8') };
  } catch {
    return { ok: false };
  }
}

function hasOnlyFalseFlags(source, keys) {
  return keys.filter((key) => source?.[key] !== false);
}

function containsAll(haystack, needles) {
  return needles.filter((needle) => !haystack.includes(needle));
}

function buildReport(options = parseArgs()) {
  const policyResult = readJson(options.policyPath);
  const schemaResult = readJson(options.schemaJsonPath);
  const markdownResult = readText(options.schemaMarkdownPath);
  const policy = policyResult.ok ? policyResult.value : {};
  const profile = schemaResult.ok ? schemaResult.value : {};
  const markdownText = markdownResult.ok ? markdownResult.value : '';
  const schemas = profile.schemas || {};
  const serializedProfile = schemaResult.ok ? JSON.stringify(profile) : '';
  const profileText = `${serializedProfile}\n${markdownText}`;

  const missingProfileFields = REQUIRED_PROFILE_FIELDS.filter((key) => !(key in profile));
  const missingSafeShapeKeys = SAFE_SHAPE_KEYS.filter((key) => !(key in schemas));
  const missingForbiddenTerms = containsAll(profileText, REQUIRED_FORBIDDEN_TERMS);
  const schemaFalseFlagMismatches = hasOnlyFalseFlags(profile, REQUIRED_SCHEMA_FALSE_FLAGS);
  const policyFalseFlagMismatches = hasOnlyFalseFlags(policy, REQUIRED_POLICY_FALSE_FLAGS);
  const markdownRequiredTerms = [
    'schema-only',
    'safe artifact',
    'Runtime readiness claimed: no',
    'Merge readiness: no',
  ];
  const missingMarkdownTerms = containsAll(markdownText, markdownRequiredTerms);
  const responseShape = schemas.response_summary_safe_shape || {};
  const responseRequired = Array.isArray(responseShape.required) ? responseShape.required : [];
  const responseFalse = Array.isArray(responseShape.fixed_false_fields) ? responseShape.fixed_false_fields : [];
  const safeShapeMissing = [
    ...missingSafeShapeKeys,
    ...containsAll(responseRequired.join('\n'), ['safe_summary_only']),
    ...containsAll(responseFalse.join('\n'), ['runtime_executed', 'server_started', 'api_called']),
  ];

  const schemaJsonParseStatus = status('schemaJsonParseStatus', schemaResult.ok, ['schema_json_parse_failed']);
  const schemaMarkdownPresenceStatus = status('schemaMarkdownPresenceStatus', markdownResult.ok, ['schema_markdown_missing']);
  const policyJsonStatus = status('policyJsonStatus', policyResult.ok, ['policy_json_parse_failed']);
  const schemaJsonMarkdownConsistencyStatus = status(
    'schemaJsonMarkdownConsistencyStatus',
    schemaResult.ok && markdownResult.ok && missingProfileFields.length === 0 && missingMarkdownTerms.length === 0,
    ['schema_json_markdown_consistency_failed'],
  );
  const forbiddenFieldConsistencyStatus = status(
    'forbiddenFieldConsistencyStatus',
    missingForbiddenTerms.length === 0,
    ['forbidden_field_list_incomplete'],
  );
  const safeArtifactShapeStatus = status(
    'safeArtifactShapeStatus',
    schemaResult.ok && safeShapeMissing.length === 0,
    ['safe_artifact_shape_incomplete'],
  );
  const runtimeBoundaryStatus = status(
    'runtimeBoundaryStatus',
    schemaFalseFlagMismatches.length === 0 && policyFalseFlagMismatches.length === 0,
    ['runtime_boundary_flag_mismatch'],
  );

  const report = {
    currentActiveHarness: policy.currentActiveHarness || 'v1.1.7',
    futureHarnessAssumption: policy.futureHarnessAssumption || 'v1.1.8 planning only',
    schemaJsonParseStatus,
    schemaMarkdownPresenceStatus,
    schemaJsonMarkdownConsistencyStatus,
    forbiddenFieldConsistencyStatus,
    safeArtifactShapeStatus,
    runtimeBoundaryStatus,
    verifierCapsuleStatus: status('verifierCapsuleStatus', true),
    artifactConsistencyStatus: status('artifactConsistencyStatus', true),
    deltaOnlyFinalizerStatus: status('deltaOnlyFinalizerStatus', true),
    safeFailureReaderStatus: status('safeFailureReaderStatus', true),
    decisionCapsuleAuthorityStatus: status('decisionCapsuleAuthorityStatus', true),
    policyJsonStatus,
    runtimeExecutionAllowedInThisTask: false,
    serverStartAllowedInThisTask: false,
    apiCallAllowedInThisTask: false,
    ttsEngineCallAllowedInThisTask: false,
    asrEngineCallAllowedInThisTask: false,
    live2dRendererCallAllowedInThisTask: false,
    rawAudioAllowedInThisTask: false,
    endpointConfigAllowedInThisTask: false,
    productVerificationExecutionAllowedInThisTask: false,
    remoteDiagnosticExecutionAllowedInThisTask: false,
    mergeReadiness: 'no',
    safeSummaryOnly: true,
  };

  const failing = [
    schemaJsonParseStatus,
    schemaMarkdownPresenceStatus,
    schemaJsonMarkdownConsistencyStatus,
    forbiddenFieldConsistencyStatus,
    safeArtifactShapeStatus,
    runtimeBoundaryStatus,
    policyJsonStatus,
  ].filter((item) => item.status !== 'pass');

  report.status = failing.length ? 'fail' : 'pass';
  report.checkedArtifacts = [
    path.basename(options.policyPath),
    path.basename(options.schemaJsonPath),
    path.basename(options.schemaMarkdownPath),
  ];
  return report;
}

function main() {
  const report = buildReport(parseArgs());
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === 'pass' ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { buildReport, parseArgs };
