import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_POLICY_PATH = path.join(
  REPO_ROOT,
  'docs/process/CODEX_IRIS_ADAPTER_FIXTURE_ONLY_E2E_MOCK_POLICY_V1_1_6.json',
);

const FORBIDDEN_VALUE_PATTERN =
  /\b(?:authorization|bearer|oauth|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|secret|password)\b/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkObject(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkObject(item, visitor, [...trail, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, [...trail, key]);
    walkObject(child, visitor, [...trail, key]);
  }
}

function normalizeKind(kind) {
  return ['tts', 'subtitle', 'live2d'].includes(kind) ? kind : 'unknown';
}

function assertSafeObject(value, policy, label) {
  const forbiddenKeys = new Set([...(policy.forbiddenInputKeys || []), ...(policy.forbiddenOutputKeys || [])]);
  const findings = [];
  walkObject(value, (key, child, trail) => {
    if (forbiddenKeys.has(key)) findings.push(`${label}:${trail.join('.')}`);
    if (typeof child === 'string' && FORBIDDEN_VALUE_PATTERN.test(child)) {
      findings.push(`${label}:${trail.join('.')}:unsafe_value`);
    }
  });
  if (findings.length) {
    const err = new Error(`unsafe fixture object: ${findings.length}`);
    err.code = 'unsafe_fixture_object';
    throw err;
  }
}

function validatePacket(packet, expectedKind, policy) {
  const checked = [];
  if (packet.schema !== 'iris_adapter_packet_v1') throw new Error(`${expectedKind}: schema mismatch`);
  checked.push(`${expectedKind}:schema`);
  if (normalizeKind(packet.adapter_kind) !== expectedKind) throw new Error(`${expectedKind}: adapter kind mismatch`);
  checked.push(`${expectedKind}:adapter_kind`);
  for (const key of ['request_id', 'utterance_id', 'render_group_id']) {
    if (typeof packet[key] !== 'string' || !packet[key]) throw new Error(`${expectedKind}: missing ${key}`);
    checked.push(`${expectedKind}:${key}`);
  }
  if (packet.dry_run !== true) throw new Error(`${expectedKind}: dry_run must be true`);
  checked.push(`${expectedKind}:dry_run`);
  if (!Number.isInteger(packet.duration_ms) || packet.duration_ms <= 0) {
    throw new Error(`${expectedKind}: duration_ms invalid`);
  }
  checked.push(`${expectedKind}:duration_ms`);
  assertSafeObject(packet, policy, `${expectedKind}:input`);
  checked.push(`${expectedKind}:safe_input`);
  return checked;
}

function textForPacket(packet) {
  return String(packet.text || packet.subtitle_text || 'offline fixture');
}

function buildMouthCueSummary(packet) {
  const text = textForPacket(packet);
  const cueCount = Math.max(1, Math.min(8, Math.ceil(text.length / 8)));
  return {
    schema: 'voxweave_fixture_mouth_cue_summary_v1',
    cue_count: cueCount,
    duration_ms: packet.duration_ms,
    safe_summary_only: true,
  };
}

function buildSubtitleTimingSummary(packet) {
  return {
    schema: 'voxweave_fixture_subtitle_timing_summary_v1',
    segment_count: 1,
    duration_ms: packet.duration_ms,
    overflow_risk: false,
    safe_summary_only: true,
  };
}

function buildLive2dSyncCueSummary(packet, mouthCueSummary) {
  return {
    schema: 'voxweave_fixture_live2d_sync_cue_summary_v1',
    motion_style: packet.motion_style || 'neutral',
    track_count: mouthCueSummary.cue_count,
    renderer_call_performed: false,
    safe_summary_only: true,
  };
}

export function buildFixtureMockResponse(packet, policy = readJson(DEFAULT_POLICY_PATH)) {
  const kind = normalizeKind(packet.adapter_kind);
  if (!policy.allowedFixtureKinds.includes(kind)) throw new Error(`unsupported fixture kind: ${kind}`);
  validatePacket(packet, kind, policy);
  const mouthCueSummary = buildMouthCueSummary(packet);
  const subtitleTimingSummary = buildSubtitleTimingSummary(packet);
  const live2dSyncCueSummary = buildLive2dSyncCueSummary(packet, mouthCueSummary);
  const response = {
    schema: 'voxweave_fixture_e2e_mock_response_v1',
    adapter_kind: kind,
    request_id: packet.request_id,
    response_summary: {
      schema: 'voxweave_fixture_response_summary_v1',
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
      unsafe_field_count: 0,
    },
    render_group: {
      schema: 'voxweave_fixture_render_group_v1',
      render_group_id: packet.render_group_id,
      tts_received: kind === 'tts',
      subtitle_received: kind === 'subtitle',
      live2d_received: kind === 'live2d',
      safe_summary_only: true,
    },
    mock_tts_metadata: {
      schema: 'voxweave_fixture_mock_tts_metadata_v1',
      generated_audio: false,
      artifact_created: false,
      safe_summary_only: true,
    },
    mouth_cue_summary: mouthCueSummary,
    subtitle_timing_summary: subtitleTimingSummary,
    live2d_sync_cue_summary: live2dSyncCueSummary,
  };
  assertSafeObject(response, policy, `${kind}:output`);
  return response;
}

export function validateFixtureSet({ policyPath = DEFAULT_POLICY_PATH, fixturePaths = [] } = {}) {
  const policy = readJson(policyPath);
  const cases = [];
  for (const [field, expected] of Object.entries({
    fixtureOnlyStatus: true,
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
  })) {
    if (policy[field] !== expected) throw new Error(`policy ${field} mismatch`);
    cases.push(`policy:${field}`);
  }
  const responses = [];
  for (const fixturePath of fixturePaths) {
    const packet = readJson(fixturePath);
    const kind = normalizeKind(packet.adapter_kind);
    cases.push(...validatePacket(packet, kind, policy));
    const response = buildFixtureMockResponse(packet, policy);
    for (const required of ['response_summary', 'render_group', 'mouth_cue_summary', 'subtitle_timing_summary', 'live2d_sync_cue_summary']) {
      if (!response[required] || response[required].safe_summary_only !== true) {
        throw new Error(`${kind}: unsafe ${required}`);
      }
      cases.push(`${kind}:${required}`);
    }
    for (const forbidden of policy.forbiddenOutputKeys) {
      if (JSON.stringify(response).includes(`"${forbidden}"`)) throw new Error(`${kind}: forbidden output key`);
    }
    cases.push(`${kind}:forbidden_output_absent`);
    responses.push(response);
  }
  const unsafeFixture = {
    schema: 'iris_adapter_packet_v1',
    adapter_kind: 'tts',
    request_id: 'unsafe-fixture',
    utterance_id: 'unsafe-fixture',
    render_group_id: 'unsafe-fixture',
    duration_ms: 1,
    dry_run: true,
    endpoint: 'blocked',
  };
  let failedClosed = false;
  try {
    buildFixtureMockResponse(unsafeFixture, policy);
  } catch (error) {
    failedClosed = error.code === 'unsafe_fixture_object' || /unsafe fixture object/.test(error.message);
  }
  if (!failedClosed) throw new Error('unsafe fixture did not fail closed');
  cases.push('unsafe_fixture:fail_closed');
  return {
    status: 'pass',
    checkedCases: cases.length,
    fixtureCount: fixturePaths.length,
    responseSchemas: [...new Set(responses.map((response) => response.schema))],
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const fixtureDir = path.join(REPO_ROOT, 'docs/fixtures/iris-adapter-e2e-mock');
  const result = validateFixtureSet({
    fixturePaths: ['tts-packet.json', 'subtitle-packet.json', 'live2d-packet.json'].map((name) =>
      path.join(fixtureDir, name),
    ),
  });
  console.log(JSON.stringify(result, null, 2));
}
