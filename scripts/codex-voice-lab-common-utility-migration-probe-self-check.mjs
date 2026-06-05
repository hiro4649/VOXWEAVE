import { readFileSync } from 'node:fs';
import {
  buildVoiceLabMigrationProbeFixture,
  buildVoiceLabMigrationProbeSafeSummary,
  runVoiceLabCommonUtilityMigrationProbe,
} from './codex-voice-lab-common-utility-migration-probe.mjs';
import { assertSafeSummaryDoesNotLeak } from './codex-safe-summary-builder.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

const probeSource = readFileSync(new URL('./codex-voice-lab-common-utility-migration-probe.mjs', import.meta.url), 'utf8');

check(probeSource.includes('./codex-safe-summary-builder.mjs'), 'probe imports safe summary builder');
check(probeSource.includes('./codex-unsafe-field-detector.mjs'), 'probe imports unsafe field detector');
for (const blockedImport of [
  'codex-local-quality-gate',
  'codex-pr-profile-gate',
  'codex-code-review-monitor',
  'codex-stale-pr-audit-gate',
  'src/',
  'test/',
]) {
  check(!probeSource.includes(blockedImport), `probe must not import ${blockedImport}`);
}
check(!probeSource.includes('voice-lab-metadata-validator'), 'probe must not import PR #17 validator');
check(!probeSource.includes('writeFile'), 'probe must not modify existing validator');

const fixture = buildVoiceLabMigrationProbeFixture();
check(Array.isArray(fixture), 'fixture should be array');
check(fixture.length === 2, 'fixture should contain synthetic records');

const result = runVoiceLabCommonUtilityMigrationProbe({ records: fixture });
check(result.status === 'pass', 'probe output status should pass');
check(result.migration_performed === false, 'migration_performed must be false');
check(result.existing_validator_modified === false, 'existing_validator_modified must be false');
check(result.runtime_connected === false, 'runtime_connected must be false');
check(result.active_quality_gate_connected === false, 'active_quality_gate_connected must be false');
check(result.safe_summary_only === true, 'safe_summary_only must be true');
check(result.uses_safe_summary_builder === true, 'safe summary builder must be used');
check(result.uses_unsafe_field_detector === true, 'unsafe field detector must be used');
check(result.target_area === 'voice_lab', 'target area must be voice_lab');
check(result.safe_summary.safe_summary_only === true, 'safe summary builder output is safe summary only');
check(result.unsafe_detection_summary.safe_summary_only === true, 'unsafe detector output is safe summary only');
check(result.safe_summary.record_count === 2, 'safe summary should count records');
check(result.safe_summary.blocked_count === 1, 'prohibited use cases produce blocked count');
check(result.safe_summary.review_required_count === 1, 'Human Review Gate style fields counted only');
check(result.safe_summary.approved_count === 1, 'reference consent style fields counted only');

const reasonCounts = result.unsafe_detection_summary.reason_counts;
for (const reason of [
  'candidate_id_detected',
  'generated_text_detected',
  'generated_audio_ref_detected',
  'prompt_audio_detected',
  'reference_voice_detected',
  'raw_audio_detected',
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
]) {
  check(reasonCounts[reason] >= 1, `${reason} should be detected`);
}

check(result.fixed_flags.runtime_readiness_claimed === false, 'runtime readiness claim remains false');
check(result.fixed_flags.production_readiness_claimed === false, 'production readiness claim remains false');
check(result.fixed_flags.real_tts_readiness_claimed === false, 'real TTS readiness claim remains false');
check(result.fixed_flags.asr_runtime_readiness_claimed === false, 'ASR runtime readiness claim remains false');
check(result.fixed_flags.merge_readiness === false, 'merge readiness remains false');

const serialized = JSON.stringify(result);
for (const forbidden of [
  'candidate_id_value',
  'generated_text_value',
  'generated_audio_ref_value',
  'prompt_audio_value',
  'reference_voice_value',
  'raw_audio_value',
  'https://bad.invalid',
  'api_key=abc',
  'token=def',
  'secret=ghi',
  'authorization=Bearer abc',
  'Bearer abc',
  'C:/private/model',
  'C:/private/dataset',
  'raw_payload_value',
  'raw_logs_value',
  'branch name',
  'PR body',
  'changed_files',
]) {
  check(!serialized.includes(forbidden), `serialized probe output must not include ${forbidden}`);
}

for (const forbidden of [
  'candidate_id',
  'generated_text',
  'generated_audio_ref',
  'prompt_audio',
  'reference_voice',
  'raw_audio',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'authorization',
  'Bearer',
  'model_path',
  'dataset_path',
  'raw_payload',
  'raw_logs',
]) {
  check(!JSON.stringify(result.safe_summary).includes(forbidden), `probe safe summary must not include ${forbidden}`);
}

let leakCaught = false;
try {
  assertSafeSummaryDoesNotLeak({ note: 'candidate_id_value' }, ['candidate_id_value']);
} catch (error) {
  leakCaught = true;
  check(!String(error.message).includes('candidate_id_value'), 'leak error must not expose raw forbidden fragment');
}
check(leakCaught, 'assertSafeSummaryDoesNotLeak catches synthetic leaks');

const probeSafeSummary = buildVoiceLabMigrationProbeSafeSummary(result);
check(probeSafeSummary.status === 'pass', 'probe safe summary status should pass');
check(probeSafeSummary.probe_count === 1, 'probe safe summary is count-only');
check(probeSafeSummary.safe_summary_only_count === 1, 'safe summary only count should be one');
check(probeSafeSummary.migration_performed_count === 0, 'migration performed count should be zero');
check(probeSafeSummary.existing_validator_modified_count === 0, 'existing validator modified count should be zero');
check(probeSafeSummary.runtime_connected_count === 0, 'runtime connected count should be zero');
check(probeSafeSummary.active_quality_gate_connected_count === 0, 'active gate connected count should be zero');
check(probeSafeSummary.blocked_count === 1, 'blocked count should be count-only');
check(probeSafeSummary.review_required_count === 1, 'review required count should be count-only');
check(probeSafeSummary.approved_count === 1, 'approved count should be count-only');
check(probeSafeSummary.safe_summary_only === true, 'probe safe summary safe_summary_only should be true');
check(!JSON.stringify(probeSafeSummary).includes('candidate_id'), 'probe safe summary must not contain candidate_id');
check(!JSON.stringify(probeSafeSummary).includes('generated_text'), 'probe safe summary must not contain generated_text');
check(!JSON.stringify(probeSafeSummary).includes('endpoint'), 'probe safe summary must not contain endpoint');
check(!JSON.stringify(probeSafeSummary).includes('token'), 'probe safe summary must not contain token');
check(!JSON.stringify(probeSafeSummary).includes('secret'), 'probe safe summary must not contain secret');
check(!JSON.stringify(probeSafeSummary).includes('model_path'), 'probe safe summary must not contain model_path');

check(checkedCases >= 60, 'checked_cases must be at least 60');

process.stdout.write(`${JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  target_area: 'voice_lab',
  migration_performed: false,
  existing_validator_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
})}\n`);
