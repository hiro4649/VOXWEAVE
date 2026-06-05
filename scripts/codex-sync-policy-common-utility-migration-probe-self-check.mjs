import { readFileSync } from 'node:fs';
import {
  buildSyncPolicyMigrationProbeSafeSummary,
  runSyncPolicyCommonUtilityMigrationProbe,
} from './codex-sync-policy-common-utility-migration-probe.mjs';
import { assertSafeSummaryDoesNotLeak } from './codex-safe-summary-builder.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

const probeSource = readFileSync(new URL('./codex-sync-policy-common-utility-migration-probe.mjs', import.meta.url), 'utf8');
check(probeSource.includes('./codex-safe-summary-builder.mjs'), 'Sync Policy probe imports safe summary builder');
check(probeSource.includes('./codex-unsafe-field-detector.mjs'), 'Sync Policy probe imports unsafe field detector');
for (const blockedImport of [
  'codex-local-quality-gate',
  'codex-pr-profile-gate',
  'codex-code-review-monitor',
  'codex-stale-pr-audit-gate',
  'src/',
  'test/',
  'pause-control-validator',
  'pronunciation-hint-validator',
  'multilingual-locale-validator',
  'subtitle-timing-validator',
  'lip-sync-cue-validator',
  'live2d-cue-validator',
]) {
  check(!probeSource.includes(blockedImport), `Sync Policy probe must not import ${blockedImport}`);
}
check(!probeSource.includes('writeFile'), 'Sync Policy probe must not modify existing validator');

const result = runSyncPolicyCommonUtilityMigrationProbe();
check(result.status === 'pass', 'probe output status should pass');
for (const [field, expected] of [
  ['migration_performed', false],
  ['existing_validator_modified', false],
  ['runtime_connected', false],
  ['active_quality_gate_connected', false],
  ['tts_engine_connected', false],
  ['pause_marker_sent', false],
  ['pronunciation_hint_sent', false],
  ['locale_routing_connected', false],
  ['subtitle_rendering_performed', false],
  ['lip_sync_runtime_connected', false],
  ['live2d_renderer_connected', false],
  ['benchmark_executed', false],
  ['model_download_performed', false],
  ['api_call_performed', false],
  ['endpoint_config_added', false],
  ['workflow_changed', false],
  ['package_changed', false],
  ['safe_summary_only', true],
]) {
  check(result[field] === expected, `${field} should be ${expected}`);
}
check(result.safe_summary.safe_summary_only === true, 'safe summary builder output is count-only');
check(result.unsafe_detection_summary.safe_summary_only === true, 'unsafe detector output is count-only');

const reasonCounts = result.unsafe_detection_summary.reason_counts;
for (const reason of [
  'endpoint_detected',
  'api_key_detected',
  'token_detected',
  'secret_detected',
  'authorization_detected',
  'bearer_detected',
  'model_path_detected',
  'private_path_detected',
  'raw_payload_detected',
  'raw_logs_detected',
  'reference_voice_detected',
  'speaker_identity_detected',
  'subtitle_text_detected',
  'viseme_payload_detected',
  'live2d_payload_detected',
  'renderer_payload_detected',
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
  'pause_id_value',
  'hint_id_value',
  'locale_id_value',
  'subtitle_id_value',
  'lip_sync_id_value',
  'live2d_cue_id_value',
  'raw_pause_syntax_value',
  'ssml_payload_value',
  'moss_pause_payload_value',
  'engine_pause_payload_value',
  'pause_reason_payload_value',
  'hint_value_value',
  'phoneme_payload_value',
  'ipa_payload_value',
  'kana_payload_value',
  'pinyin_payload_value',
  'engine_mapping_payload_value',
  'voice_clone_payload_value',
  'locale_routing_payload_value',
  'text_ref_value',
  'subtitle_text_value',
  'raw_subtitle_payload_value',
  'mouth_shape_payload_value',
  'viseme_payload_value',
  'raw_viseme_payload_value',
  'renderer_payload_value',
  'live2d_payload_value',
  'motion_payload_value',
  'expression_payload_value',
  'parameter_payload_value',
  'https://bad.invalid',
  'api_key=abc',
  'token=def',
  'secret=ghi',
  'C:/private/model',
  'private/path',
  'raw_payload_value',
  'raw_logs_value',
  'branch name',
  'PR body',
  'changed_files',
]) {
  check(!serialized.includes(forbidden), `serialized Sync Policy probe output must not include ${forbidden}`);
}

for (const forbidden of [
  'pause_id',
  'hint_id',
  'locale_id',
  'subtitle_id',
  'lip_sync_id',
  'live2d_cue_id',
  'raw_pause_syntax',
  'ssml_payload',
  'hint_value',
  'phoneme_payload',
  'ipa_payload',
  'kana_payload',
  'pinyin_payload',
  'locale_routing_payload',
  'subtitle_text',
  'viseme_payload',
  'renderer_payload',
  'live2d_payload',
  'model_path',
  'private_path',
  'endpoint',
  'token',
  'secret',
  'raw_payload',
  'raw_logs',
]) {
  check(!JSON.stringify(result.safe_summary).includes(forbidden), `safe summary must not include ${forbidden}`);
}

check(result.safe_summary.runtime_ready_count === 0, 'sync fixture does not imply runtime readiness');
check(result.safe_summary.blocked_count === 6, 'six unsafe sync groups should be blocked');
check(result.safe_summary.review_required_count === 6, 'six unsafe sync groups require review');
check(result.safe_summary.approved_count === 1, 'safe placeholder is approved only');

let leakCaught = false;
try {
  assertSafeSummaryDoesNotLeak({ note: 'renderer_payload_value' }, ['renderer_payload_value']);
} catch (error) {
  leakCaught = true;
  check(!String(error.message).includes('renderer_payload_value'), 'leak error must not expose raw forbidden fragment');
}
check(leakCaught, 'assertSafeSummaryDoesNotLeak catches synthetic sync leaks');

const probeSafeSummary = buildSyncPolicyMigrationProbeSafeSummary(result);
check(probeSafeSummary.status === 'pass', 'Sync probe safe summary status should pass');
check(probeSafeSummary.probe_count === 1, 'Sync probe safe summary is count-only');
check(probeSafeSummary.safe_summary_only_count === 1, 'safe summary only count should be one');
check(probeSafeSummary.unsafe_detection_count === 6, 'unsafe detection count should include six unsafe groups');
for (const [field, expected] of [
  ['migration_performed_count', 0],
  ['existing_validator_modified_count', 0],
  ['runtime_connected_count', 0],
  ['active_quality_gate_connected_count', 0],
  ['tts_engine_connected_count', 0],
  ['pause_marker_sent_count', 0],
  ['pronunciation_hint_sent_count', 0],
  ['locale_routing_connected_count', 0],
  ['subtitle_rendering_count', 0],
  ['lip_sync_runtime_count', 0],
  ['live2d_renderer_count', 0],
  ['benchmark_execution_count', 0],
  ['model_download_count', 0],
  ['api_call_count', 0],
  ['endpoint_config_count', 0],
  ['workflow_change_count', 0],
  ['package_change_count', 0],
]) {
  check(probeSafeSummary[field] === expected, `${field} should be ${expected}`);
}
check(probeSafeSummary.blocked_count === 6, 'probe safe summary blocked count should be count-only');
check(probeSafeSummary.review_required_count === 6, 'probe safe summary review count should be count-only');
check(probeSafeSummary.approved_count === 1, 'probe safe summary approved count should be count-only');
check(probeSafeSummary.safe_summary_only === true, 'probe safe summary safe_summary_only should be true');

for (const forbidden of ['pause_id_value', 'hint_id_value', 'subtitle_text_value', 'viseme_payload_value', 'renderer_payload_value', 'https://bad.invalid', 'token=def', 'secret=ghi']) {
  check(!JSON.stringify(probeSafeSummary).includes(forbidden), `probe safe summary must not include ${forbidden}`);
}

check(checkedCases >= 120, 'checked_cases must be at least 120');

process.stdout.write(`${JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  target_area: 'sync_policy',
  migration_performed: false,
  existing_validator_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  tts_engine_connected: false,
  pause_marker_sent: false,
  pronunciation_hint_sent: false,
  locale_routing_connected: false,
  subtitle_rendering_performed: false,
  lip_sync_runtime_connected: false,
  live2d_renderer_connected: false,
  benchmark_executed: false,
  model_download_performed: false,
  api_call_performed: false,
  endpoint_config_added: false,
  workflow_changed: false,
  package_changed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
})}\n`);
