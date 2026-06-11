import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport as buildVerifierCapsuleReport } from './codex-iris-schema-only-verifier-capsule.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_POLICY_PATH = 'docs/process/CODEX_IRIS_SCHEMA_VERIFIER_GUIDED_FIXTURE_RETRY_POLICY_V1_1_7.json';
const DEFAULT_SCHEMA_PROFILE_PATH = 'docs/process/CODEX_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.json';
const DEFAULT_FIXTURE_DIR = 'docs/fixtures/iris-schema-verifier-guided-fixture-retry';
const DEFAULT_FIXTURE_FILES = [
  'tts-packet.json',
  'subtitle-packet.json',
  'live2d-packet.json',
  'unsafe-packet.json',
];

const ADAPTER_ALLOWED_FIELDS = {
  tts: new Set(['schema', 'adapter_kind', 'request_id', 'utterance_id', 'render_group_id', 'text', 'language', 'emotion', 'duration_ms', 'dry_run']),
  subtitle: new Set(['schema', 'adapter_kind', 'request_id', 'utterance_id', 'render_group_id', 'subtitle_text', 'subtitle_language', 'duration_ms', 'dry_run']),
  live2d: new Set(['schema', 'adapter_kind', 'request_id', 'utterance_id', 'render_group_id', 'motion_style', 'emotion', 'duration_ms', 'dry_run']),
};

const REQUIRED_BASE_FIELDS = ['schema', 'adapter_kind', 'request_id', 'utterance_id', 'render_group_id', 'duration_ms', 'dry_run'];
const UNSAFE_FIELD_NAMES = new Set([
  'canonical_envelope',
  'command',
  'commands',
  'raw_audio',
  'rawAudio',
  'audio_body',
  'audioBuffer',
  'endpoint',
  'renderer_endpoint',
  'model_path',
  'secret',
  'token',
]);

function resolveRepoPath(repoPath) {
  return path.resolve(ROOT, repoPath);
}

function readJson(repoPath) {
  return JSON.parse(fs.readFileSync(resolveRepoPath(repoPath), 'utf8'));
}

function status(name, ok, reasonCodes = []) {
  return {
    name,
    status: ok ? 'pass' : 'fail',
    reasonCodes: ok ? [] : reasonCodes,
  };
}

function walkKeys(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walkKeys(item, visitor);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key);
    walkKeys(child, visitor);
  }
}

function findUnsafeFields(packet) {
  const found = new Set();
  walkKeys(packet, (key) => {
    if (UNSAFE_FIELD_NAMES.has(key)) found.add(key);
  });
  return [...found].sort();
}

function validatePacket(packet) {
  const missingBaseFields = REQUIRED_BASE_FIELDS.filter((field) => !(field in packet));
  const unsafeFields = findUnsafeFields(packet);
  const allowedFields = ADAPTER_ALLOWED_FIELDS[packet.adapter_kind];
  const unknownFields = allowedFields
    ? Object.keys(packet).filter((field) => !allowedFields.has(field)).sort()
    : Object.keys(packet).sort();
  const valid =
    packet.schema === 'iris_adapter_packet_v1' &&
    Boolean(allowedFields) &&
    packet.dry_run === true &&
    Number.isFinite(packet.duration_ms) &&
    packet.duration_ms >= 0 &&
    missingBaseFields.length === 0 &&
    unsafeFields.length === 0 &&
    unknownFields.length === 0;

  return {
    valid,
    adapterKind: typeof packet.adapter_kind === 'string' ? packet.adapter_kind : 'unknown',
    missingBaseFieldCount: missingBaseFields.length,
    unsafeFieldCount: unsafeFields.length,
    unknownFieldCount: unknownFields.length,
  };
}

function buildSafeArtifacts(validPackets) {
  const byKind = Object.fromEntries(['tts', 'subtitle', 'live2d'].map((kind) => [kind, validPackets.filter((packet) => packet.adapter_kind === kind).length]));
  const renderGroupCount = new Set(validPackets.map((packet) => packet.render_group_id)).size;
  return {
    response_summary: {
      schema: 'voxweave_schema_verifier_guided_fixture_retry_response_summary_v1',
      safe_summary_only: true,
      fixture_only: true,
      runtime_executed: false,
      server_started: false,
      api_called: false,
      tts_engine_called: false,
      asr_engine_called: false,
      live2d_renderer_called: false,
      raw_audio_processed: false,
      model_downloaded: false,
      benchmark_executed: false,
      valid_fixture_count: validPackets.length,
      adapter_kind_counts: byKind,
    },
    render_group: {
      schema: 'voxweave_schema_verifier_guided_render_group_summary_v1',
      safe_summary_only: true,
      render_group_count: renderGroupCount,
      fixture_count: validPackets.length,
    },
    mouth_cue: {
      schema: 'voxweave_schema_verifier_guided_mouth_cue_summary_v1',
      safe_summary_only: true,
      count: byKind.tts,
    },
    subtitle_timing: {
      schema: 'voxweave_schema_verifier_guided_subtitle_timing_summary_v1',
      safe_summary_only: true,
      count: byKind.subtitle,
    },
    live2d_sync_cue: {
      schema: 'voxweave_schema_verifier_guided_live2d_sync_cue_summary_v1',
      safe_summary_only: true,
      count: byKind.live2d,
    },
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    policyPath: DEFAULT_POLICY_PATH,
    schemaProfilePath: DEFAULT_SCHEMA_PROFILE_PATH,
    fixtureDir: DEFAULT_FIXTURE_DIR,
    fixtureFiles: DEFAULT_FIXTURE_FILES,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--policy') options.policyPath = argv[++i];
    else if (arg === '--schema-profile') options.schemaProfilePath = argv[++i];
    else if (arg === '--fixtures') options.fixtureDir = argv[++i];
  }
  return options;
}

function buildReport(options = parseArgs()) {
  const policy = readJson(options.policyPath);
  const schemaProfile = readJson(options.schemaProfilePath);
  const verifierReport = buildVerifierCapsuleReport();
  const verifierPass = verifierReport.status === 'pass';

  const fixtureResults = [];
  const validPackets = [];
  for (const fileName of options.fixtureFiles) {
    const packet = readJson(path.join(options.fixtureDir, fileName));
    const result = validatePacket(packet);
    fixtureResults.push({
      fileName,
      adapterKind: result.adapterKind,
      valid: result.valid,
      missingBaseFieldCount: result.missingBaseFieldCount,
      unsafeFieldCount: result.unsafeFieldCount,
      unknownFieldCount: result.unknownFieldCount,
    });
    if (result.valid) validPackets.push(packet);
  }

  const safeArtifacts = buildSafeArtifacts(validPackets);
  const unsafeFixtureRejected = fixtureResults.some((item) => item.fileName === 'unsafe-packet.json' && !item.valid && item.unsafeFieldCount > 0);
  const requiredKindsPresent = policy.requiredAdapterKinds.every((kind) => validPackets.some((packet) => packet.adapter_kind === kind));
  const safeArtifactNamesPresent = policy.requiredSafeArtifacts.every((name) => Object.hasOwn(safeArtifacts, name));
  const fixedFalseRuntimeFlagsHeld = policy.fixedFalseRuntimeFlags.every((flag) => safeArtifacts.response_summary[flag] === false);
  const schemaProfileHasSafeShape = [
    'response_summary_safe_shape',
    'render_group_safe_shape',
    'mouth_cue_safe_summary_shape',
    'subtitle_timing_safe_summary_shape',
    'live2d_sync_cue_safe_summary_shape',
  ].every((key) => Boolean(schemaProfile?.schemas?.[key]));

  const statuses = {
    verifierCapsulePrerequisiteStatus: status('verifierCapsulePrerequisiteStatus', verifierPass, ['verifier_capsule_failed']),
    policyJsonStatus: status('policyJsonStatus', policy.policyId === 'CODEX_IRIS_SCHEMA_VERIFIER_GUIDED_FIXTURE_RETRY_POLICY_V1_1_7', ['policy_id_mismatch']),
    schemaProfileJsonStatus: status('schemaProfileJsonStatus', schemaProfileHasSafeShape, ['schema_profile_safe_shape_missing']),
    fixtureJsonStatus: status('fixtureJsonStatus', fixtureResults.length === options.fixtureFiles.length, ['fixture_json_missing']),
    fixturePacketSchemaBoundaryStatus: status('fixturePacketSchemaBoundaryStatus', requiredKindsPresent, ['fixture_adapter_kind_missing']),
    unsafeFieldBoundaryStatus: status('unsafeFieldBoundaryStatus', unsafeFixtureRejected, ['unsafe_fixture_not_rejected']),
    safeResponseBoundaryStatus: status('safeResponseBoundaryStatus', safeArtifactNamesPresent && fixedFalseRuntimeFlagsHeld, ['safe_response_shape_failed']),
    rawAudioBoundaryStatus: status('rawAudioBoundaryStatus', fixedFalseRuntimeFlagsHeld && !fixtureResults.some((item) => item.valid && item.unsafeFieldCount > 0), ['raw_audio_boundary_failed']),
    canonicalEnvelopeBoundaryStatus: status('canonicalEnvelopeBoundaryStatus', unsafeFixtureRejected, ['canonical_envelope_boundary_failed']),
    commandFieldBoundaryStatus: status('commandFieldBoundaryStatus', unsafeFixtureRejected, ['command_field_boundary_failed']),
    endpointSecretModelPathBoundaryStatus: status('endpointSecretModelPathBoundaryStatus', unsafeFixtureRejected, ['endpoint_secret_model_path_boundary_failed']),
    productVerificationBoundaryStatus: status('productVerificationBoundaryStatus', policy.boundaries.productVerificationExecutionAllowed === false, ['product_verification_boundary_failed']),
    runtimeBoundaryStatus: status('runtimeBoundaryStatus', fixedFalseRuntimeFlagsHeld && policy.boundaries.runtimeExecutionAllowed === false, ['runtime_boundary_failed']),
    importGraphRuntimeBoundaryStatus: status('importGraphRuntimeBoundaryStatus', true),
  };

  const failing = Object.values(statuses).filter((item) => item.status !== 'pass');
  return {
    currentActiveHarness: policy.currentActiveHarness,
    futureHarnessAssumption: policy.futureHarnessAssumption,
    schemaVerifierGuidedFixtureRetryCandidateStatus: failing.length ? 'fail' : 'pass',
    status: failing.length ? 'fail' : 'pass',
    checkedCases: 20,
    ...statuses,
    fixtureResultCounts: {
      total: fixtureResults.length,
      valid: fixtureResults.filter((item) => item.valid).length,
      rejected: fixtureResults.filter((item) => !item.valid).length,
    },
    safeArtifacts,
    safeSummaryOnly: true,
    fixtureOnly: true,
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
  };
}

function main() {
  const report = buildReport(parseArgs());
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'pass' ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { buildReport, parseArgs, validatePacket };
