import { readFileSync } from 'node:fs';
import {
  buildAsrMigrationProbeFixture,
  buildAsrMigrationProbeSafeSummary,
  runAsrCommonUtilityMigrationProbe,
} from './codex-asr-common-utility-migration-probe.mjs';
import { assertSafeSummaryDoesNotLeak } from './codex-safe-summary-builder.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

const probeSource = readFileSync(new URL('./codex-asr-common-utility-migration-probe.mjs', import.meta.url), 'utf8');
check(probeSource.includes('./codex-safe-summary-builder.mjs'), 'ASR probe imports safe summary builder');
check(probeSource.includes('./codex-unsafe-field-detector.mjs'), 'ASR probe imports unsafe field detector');
for (const blockedImport of [
  'codex-local-quality-gate',
  'codex-pr-profile-gate',
  'codex-code-review-monitor',
  'codex-stale-pr-audit-gate',
  'CODEX_VOXWEAVE_NEMOTRON_ASR_CANDIDATE_POLICY',
  'src/',
  'test/',
]) {
  check(!probeSource.includes(blockedImport), `ASR probe must not import ${blockedImport}`);
}
check(!probeSource.includes('writeFile'), 'ASR probe must not modify existing policy or validator');

const fixture = buildAsrMigrationProbeFixture();
check(Array.isArray(fixture), 'fixture should be array');
check(fixture.length === 2, 'fixture should contain synthetic records');

const result = runAsrCommonUtilityMigrationProbe({ records: fixture });
check(result.status === 'pass', 'probe output status should pass');
check(result.migration_performed === false, 'migration_performed must be false');
check(result.existing_policy_modified === false, 'existing_policy_modified must be false');
check(result.existing_validator_modified === false, 'existing_validator_modified must be false');
check(result.runtime_connected === false, 'runtime_connected must be false');
check(result.asr_runtime_connected === false, 'asr_runtime_connected must be false');
check(result.active_quality_gate_connected === false, 'active_quality_gate_connected must be false');
check(result.microphone_capture_implemented === false, 'microphone_capture_implemented must be false');
check(result.model_download_performed === false, 'model_download_performed must be false');
check(result.api_call_performed === false, 'api_call_performed must be false');
check(result.benchmark_executed === false, 'benchmark_executed must be false');
check(result.safe_summary_only === true, 'safe_summary_only must be true');
check(result.safe_summary.safe_summary_only === true, 'safe summary builder output is count-only');
check(result.unsafe_detection_summary.safe_summary_only === true, 'unsafe detector output is count-only');
check(result.safe_summary.blocked_count === 1, 'privacy/prohibited ASR record should be blocked');
check(result.safe_summary.review_required_count === 1, 'review fields are counted only');
check(result.safe_summary.approved_count === 1, 'approved fields are counted only');

const reasonCounts = result.unsafe_detection_summary.reason_counts;
for (const reason of [
  'raw_audio_detected',
  'audio_chunk_detected',
  'microphone_input_detected',
  'transcript_raw_detected',
  'speaker_identity_detected',
  'language_tag_detected',
  'stream_id_detected',
  'endpoint_detected',
  'api_key_detected',
  'api_key_dash_detected',
  'token_detected',
  'secret_detected',
  'authorization_detected',
  'bearer_detected',
  'model_path_detected',
  'dataset_path_detected',
  'private_path_detected',
  'raw_payload_detected',
  'raw_logs_detected',
  'url_detected',
  'email_detected',
]) {
  check(reasonCounts[reason] >= 1, `${reason} should be detected`);
}

for (const key of [
  'runtime_readiness_claimed',
  'production_readiness_claimed',
  'real_tts_readiness_claimed',
  'asr_runtime_readiness_claimed',
  'merge_readiness',
]) {
  check(result.fixed_flags[key] === false, `${key} should remain false`);
}

const serialized = JSON.stringify(result);
for (const forbidden of [
  'raw_audio_value',
  'audio_chunk_value',
  'microphone_input_value',
  'transcript_raw_value',
  'speaker_identity_value',
  'language_tag_value',
  'stream_id_value',
  'https://bad.invalid',
  'api_key=abc',
  'token=def',
  'secret=ghi',
  'authorization=Bearer abc',
  'Bearer abc',
  'C:/private/model',
  'C:/private/dataset',
  'private/path',
  'raw_payload_value',
  'raw_logs_value',
  'user@example.com',
  'branch name',
  'PR body',
  'changed_files',
]) {
  check(!serialized.includes(forbidden), `serialized ASR probe output must not include ${forbidden}`);
}

for (const forbidden of [
  'raw_audio',
  'audio_chunk',
  'microphone_input',
  'transcript_raw',
  'speaker_identity',
  'language_tag',
  'stream_id',
  'endpoint',
  'api_key',
  'api-key',
  'token',
  'secret',
  'authorization',
  'Bearer',
  'model_path',
  'dataset_path',
  'private_path',
  'raw_payload',
  'raw_logs',
  'url',
  'uri',
  'email',
]) {
  check(!JSON.stringify(result.safe_summary).includes(forbidden), `ASR probe safe summary must not include ${forbidden}`);
}

let leakCaught = false;
try {
  assertSafeSummaryDoesNotLeak({ note: 'raw_audio_value' }, ['raw_audio_value']);
} catch (error) {
  leakCaught = true;
  check(!String(error.message).includes('raw_audio_value'), 'leak error must not expose raw forbidden fragment');
}
check(leakCaught, 'assertSafeSummaryDoesNotLeak catches synthetic ASR leaks');

const probeSafeSummary = buildAsrMigrationProbeSafeSummary(result);
check(probeSafeSummary.status === 'pass', 'ASR probe safe summary status should pass');
check(probeSafeSummary.probe_count === 1, 'ASR probe safe summary is count-only');
check(probeSafeSummary.safe_summary_only_count === 1, 'safe summary only count should be one');
check(probeSafeSummary.unsafe_detection_count === 1, 'unsafe detection count should be one');
check(probeSafeSummary.migration_performed_count === 0, 'migration performed count should be zero');
check(probeSafeSummary.existing_policy_modified_count === 0, 'existing policy modified count should be zero');
check(probeSafeSummary.existing_validator_modified_count === 0, 'existing validator modified count should be zero');
check(probeSafeSummary.runtime_connected_count === 0, 'runtime connected count should be zero');
check(probeSafeSummary.asr_runtime_connected_count === 0, 'ASR runtime connected count should be zero');
check(probeSafeSummary.active_quality_gate_connected_count === 0, 'active gate connected count should be zero');
check(probeSafeSummary.microphone_capture_count === 0, 'microphone capture count should be zero');
check(probeSafeSummary.model_download_count === 0, 'model download count should be zero');
check(probeSafeSummary.api_call_count === 0, 'API call count should be zero');
check(probeSafeSummary.benchmark_execution_count === 0, 'benchmark execution count should be zero');
check(probeSafeSummary.blocked_count === 1, 'blocked count should be one');
check(probeSafeSummary.review_required_count === 1, 'review required count should be one');
check(probeSafeSummary.approved_count === 1, 'approved count should be one');
check(probeSafeSummary.safe_summary_only === true, 'probe safe summary safe_summary_only should be true');

for (const forbidden of [
  'raw_audio',
  'audio_chunk',
  'microphone_input',
  'transcript_raw',
  'speaker_identity',
  'language_tag',
  'stream_id',
  'endpoint',
  'token',
  'secret',
  'model_path',
  'private_path',
]) {
  check(!JSON.stringify(probeSafeSummary).includes(forbidden), `ASR probe safe summary must not include ${forbidden}`);
}

check(checkedCases >= 80, 'checked_cases must be at least 80');

process.stdout.write(`${JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  target_area: 'asr',
  migration_performed: false,
  existing_policy_modified: false,
  existing_validator_modified: false,
  runtime_connected: false,
  asr_runtime_connected: false,
  active_quality_gate_connected: false,
  microphone_capture_implemented: false,
  model_download_performed: false,
  api_call_performed: false,
  benchmark_executed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
})}\n`);
