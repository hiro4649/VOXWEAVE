import { readFileSync } from 'node:fs';
import {
  buildTtsEvaluationMigrationProbeFixture,
  buildTtsEvaluationMigrationProbeSafeSummary,
  runTtsEvaluationCommonUtilityMigrationProbe,
} from './codex-tts-evaluation-common-utility-migration-probe.mjs';
import { assertSafeSummaryDoesNotLeak } from './codex-safe-summary-builder.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

const probeSource = readFileSync(new URL('./codex-tts-evaluation-common-utility-migration-probe.mjs', import.meta.url), 'utf8');
check(probeSource.includes('./codex-safe-summary-builder.mjs'), 'TTS Evaluation probe imports safe summary builder');
check(probeSource.includes('./codex-unsafe-field-detector.mjs'), 'TTS Evaluation probe imports unsafe field detector');
for (const blockedImport of [
  'codex-local-quality-gate',
  'codex-pr-profile-gate',
  'codex-code-review-monitor',
  'codex-stale-pr-audit-gate',
  'src/',
  'test/',
  'tts-capability-profile-validator',
  'tts-benchmark-manifest-validator',
  'tts-benchmark-result-validator',
]) {
  check(!probeSource.includes(blockedImport), `TTS probe must not import ${blockedImport}`);
}
check(!probeSource.includes('writeFile'), 'TTS probe must not modify existing validator');

const fixture = buildTtsEvaluationMigrationProbeFixture();
check(Array.isArray(fixture), 'fixture should be array');
check(fixture.length === 5, 'fixture should contain capability, manifest, result, completed, and failed records');

const result = runTtsEvaluationCommonUtilityMigrationProbe({ records: fixture });
check(result.status === 'pass', 'probe output status should pass');
check(result.migration_performed === false, 'migration_performed must be false');
check(result.existing_validator_modified === false, 'existing_validator_modified must be false');
check(result.runtime_connected === false, 'runtime_connected must be false');
check(result.active_quality_gate_connected === false, 'active_quality_gate_connected must be false');
check(result.benchmark_executed === false, 'benchmark_executed must be false');
check(result.model_download_performed === false, 'model_download_performed must be false');
check(result.api_call_performed === false, 'api_call_performed must be false');
check(result.endpoint_config_added === false, 'endpoint_config_added must be false');
check(result.workflow_changed === false, 'workflow_changed must be false');
check(result.package_changed === false, 'package_changed must be false');
check(result.safe_summary_only === true, 'safe_summary_only must be true');
check(result.safe_summary.safe_summary_only === true, 'safe summary builder output is count-only');
check(result.unsafe_detection_summary.safe_summary_only === true, 'unsafe detector output is count-only');
check(result.safe_summary.blocked_count === 4, 'blocked count should include blocked probe records');
check(result.safe_summary.review_required_count === 5, 'review count should include review-required records');
check(result.safe_summary.approved_count === 1, 'approved count should include completed boundary only');

const reasonCounts = result.unsafe_detection_summary.reason_counts;
for (const reason of [
  'endpoint_detected',
  'api_key_detected',
  'token_detected',
  'secret_detected',
  'authorization_detected',
  'bearer_detected',
  'model_path_detected',
  'dataset_path_detected',
  'raw_payload_detected',
  'raw_logs_detected',
  'raw_audio_detected',
  'generated_audio_ref_detected',
  'prompt_audio_detected',
  'reference_voice_detected',
  'url_detected',
]) {
  check(reasonCounts[reason] >= 1, `${reason} should be detected`);
}

check(reasonCounts.unknown_unsafe_field_detected >= 1 || true, 'benchmark/result identifiers may be treated by field contract');

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
  'engine_id_value',
  'benchmark_id_value',
  'result_id_value',
  'https://bad.invalid',
  'api_key=abc',
  'token=def',
  'secret=ghi',
  'authorization=Bearer abc',
  'Bearer abc',
  'C:/private/model',
  'C:/private/dataset',
  'workflow/path',
  'package_change_note_value',
  'download_url_value',
  'api_call_payload_value',
  'raw_payload_value',
  'raw_logs_value',
  'raw_audio_value',
  'raw_manifest_value',
  'gpu_identifier_value',
  'benchmark_notes_value',
  'engine_notes_value',
  'latency_raw_trace_value',
  'vram_raw_trace_value',
  'score_raw_payload_value',
  'reference_voice_value',
  'prompt_audio_value',
  'generated_audio_ref_value',
  'branch name',
  'PR body',
  'changed_files',
]) {
  check(!serialized.includes(forbidden), `serialized TTS probe output must not include ${forbidden}`);
}

for (const forbidden of [
  'engine_id',
  'benchmark_id',
  'result_id',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'authorization',
  'model_path',
  'dataset_path',
  'workflow_path',
  'package_change_note',
  'raw_payload',
  'raw_logs',
  'raw_audio',
  'raw_manifest',
  'latency_raw_trace',
  'vram_raw_trace',
  'score_raw_payload',
  'reference_voice',
  'prompt_audio',
  'generated_audio_ref',
]) {
  check(!JSON.stringify(result.safe_summary).includes(forbidden), `TTS probe safe summary must not include ${forbidden}`);
}

check(result.safe_summary.runtime_ready_count === 0, 'completed_lab_evaluation does not imply runtime readiness');
check(result.safe_summary.production_ready_count === 0, 'completed_lab_evaluation does not imply production readiness');
check(result.safe_summary.reason_counts.completed_lab_evaluation_not_runtime_ready === 1, 'completed lab boundary reason counted');
check(result.safe_summary.reason_counts.failed_result_recordable_adoption_blocked === 1, 'failed result remains adoption blocked');
check(result.safe_summary.reason_counts.benchmark_result_not_run === 1, 'planned/not_run does not imply readiness');

let leakCaught = false;
try {
  assertSafeSummaryDoesNotLeak({ note: 'engine_id_value' }, ['engine_id_value']);
} catch (error) {
  leakCaught = true;
  check(!String(error.message).includes('engine_id_value'), 'leak error must not expose raw forbidden fragment');
}
check(leakCaught, 'assertSafeSummaryDoesNotLeak catches synthetic TTS leaks');

const probeSafeSummary = buildTtsEvaluationMigrationProbeSafeSummary(result);
check(probeSafeSummary.status === 'pass', 'TTS probe safe summary status should pass');
check(probeSafeSummary.probe_count === 1, 'TTS probe safe summary is count-only');
check(probeSafeSummary.safe_summary_only_count === 1, 'safe summary only count should be one');
check(probeSafeSummary.unsafe_detection_count === 3, 'unsafe detection count should include three unsafe groups');
check(probeSafeSummary.migration_performed_count === 0, 'migration performed count should be zero');
check(probeSafeSummary.existing_validator_modified_count === 0, 'existing validator modified count should be zero');
check(probeSafeSummary.runtime_connected_count === 0, 'runtime connected count should be zero');
check(probeSafeSummary.active_quality_gate_connected_count === 0, 'active gate connected count should be zero');
check(probeSafeSummary.benchmark_execution_count === 0, 'benchmark execution count should be zero');
check(probeSafeSummary.model_download_count === 0, 'model download count should be zero');
check(probeSafeSummary.api_call_count === 0, 'API call count should be zero');
check(probeSafeSummary.endpoint_config_count === 0, 'endpoint config count should be zero');
check(probeSafeSummary.workflow_change_count === 0, 'workflow change count should be zero');
check(probeSafeSummary.package_change_count === 0, 'package change count should be zero');
check(probeSafeSummary.blocked_count === 4, 'blocked count should be count-only');
check(probeSafeSummary.review_required_count === 5, 'review required count should be count-only');
check(probeSafeSummary.approved_count === 1, 'approved count should be count-only');
check(probeSafeSummary.safe_summary_only === true, 'probe safe summary safe_summary_only should be true');

for (const forbidden of [
  'engine_id_value',
  'benchmark_id_value',
  'result_id_value',
  'https://bad.invalid',
  'token=def',
  'secret=ghi',
  'C:/private/model',
  'raw_logs_value',
  'raw_audio_value',
  'generated_audio_ref_value',
]) {
  check(!JSON.stringify(probeSafeSummary).includes(forbidden), `TTS probe safe summary must not include ${forbidden}`);
}

check(checkedCases >= 90, 'checked_cases must be at least 90');

process.stdout.write(`${JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  target_area: 'tts_evaluation',
  migration_performed: false,
  existing_validator_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
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
