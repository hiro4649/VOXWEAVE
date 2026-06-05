import fs from 'node:fs';
import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from './codex-safe-summary-builder.mjs';
import {
  buildAsrCandidatePolicyMigrationFixture,
  buildAsrCandidatePolicyMigrationSafeSummary,
  runAsrCandidatePolicyCommonUtilityMigration,
} from './codex-asr-candidate-policy-common-utility-migration.mjs';

const migrationSourcePath = new URL('./codex-asr-candidate-policy-common-utility-migration.mjs', import.meta.url);
const docsPath = new URL('../docs/process/CODEX_VOXWEAVE_ASR_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md', import.meta.url);

const forbiddenFragments = [
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
  'asr_output_payload_value',
  'language_detection_payload_value',
  'speaker_diarization_payload_value',
  'latency_raw_trace_value',
  'concurrency_raw_trace_value',
  'vendor_claim_notes_value',
  'user@example.com',
  'branch name',
  'PR body',
  'changed_files',
];

const checks = [];

function check(name, condition) {
  checks.push({ name, pass: Boolean(condition) });
}

function hasReason(summary, reason) {
  return Number(summary?.reason_counts?.[reason] ?? 0) > 0;
}

function isCountOnlyReasonSummary(summary) {
  return summary
    && summary.safe_summary_only === true
    && summary.reason_counts
    && Object.values(summary.reason_counts).every((value) => Number.isInteger(value));
}

const source = fs.readFileSync(migrationSourcePath, 'utf8');
const docs = fs.existsSync(docsPath) ? fs.readFileSync(docsPath, 'utf8') : '';
const fixture = buildAsrCandidatePolicyMigrationFixture();
const result = runAsrCandidatePolicyCommonUtilityMigration();
const serialized = JSON.stringify(result);
const migrationSafeSummary = buildAsrCandidatePolicyMigrationSafeSummary({
  ...result,
  records: fixture,
});

check('ASR migration candidate imports PR #53 safe summary utility module', source.includes("from './codex-safe-summary-builder.mjs'"));
check('ASR migration candidate imports PR #53 unsafe detector utility module', source.includes("from './codex-unsafe-field-detector.mjs'"));
check('ASR migration candidate does not import active quality-gate', !/codex-local-quality-gate|codex-pr-profile-gate|codex-code-review-monitor|codex-stale-pr-audit-gate/u.test(source));
check('ASR migration candidate does not import PR #52 docs or existing validator', !/NEMOTRON_ASR_CANDIDATE_POLICY|PR #52|src\//u.test(source));
check('ASR migration candidate does not import src', !/from ['"].*src\//u.test(source));
check('ASR migration candidate does not modify existing policy or validator', result.existing_policy_modified === false && result.existing_validator_modified === false);
check('migration output status pass', result.status === 'pass');
check('migration_performed true for candidate branch only', result.migration_performed === true);
check('existing_policy_modified false', result.existing_policy_modified === false);
check('existing_validator_modified false', result.existing_validator_modified === false);
check('runtime_connected false', result.runtime_connected === false);
check('asr_runtime_connected false', result.asr_runtime_connected === false);
check('active_quality_gate_connected false', result.active_quality_gate_connected === false);
check('microphone_capture_implemented false', result.microphone_capture_implemented === false);
check('model_download_performed false', result.model_download_performed === false);
check('api_call_performed false', result.api_call_performed === false);
check('endpoint_config_added false', result.endpoint_config_added === false);
check('benchmark_executed false', result.benchmark_executed === false);
check('workflow_changed false', result.workflow_changed === false);
check('package_changed false', result.package_changed === false);
check('safe_summary_only true', result.safe_summary_only === true);
check('safe summary builder output is count-only', isCountOnlyReasonSummary(result.safe_summary));
check('unsafe detector output is count-only', isCountOnlyReasonSummary(result.unsafe_detection_summary));
check('raw_audio detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'raw_audio_detected') && !serialized.includes('raw_audio_value'));
check('audio_chunk detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'audio_chunk_detected') && !serialized.includes('audio_chunk_value'));
check('microphone_input detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'microphone_input_detected') && !serialized.includes('microphone_input_value'));
check('transcript_raw detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'transcript_raw_detected') && !serialized.includes('transcript_raw_value'));
check('speaker_identity detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'speaker_identity_detected') && !serialized.includes('speaker_identity_value'));
check('language_tag detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'language_tag_detected') && !serialized.includes('language_tag_value'));
check('stream_id detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'stream_id_detected') && !serialized.includes('stream_id_value'));
check('endpoint detected but raw endpoint not leaked', hasReason(result.unsafe_detection_summary, 'endpoint_detected') && !serialized.includes('https://bad.invalid'));
check('api_key detected but raw key not leaked', hasReason(result.unsafe_detection_summary, 'api_key_detected') && !serialized.includes('api_key=abc'));
check('api-key detected but raw key not leaked', hasReason(result.unsafe_detection_summary, 'api_key_dash_detected') && !serialized.includes('api_key=abc'));
check('token detected but raw token not leaked', hasReason(result.unsafe_detection_summary, 'token_detected') && !serialized.includes('token=def'));
check('secret detected but raw secret not leaked', hasReason(result.unsafe_detection_summary, 'secret_detected') && !serialized.includes('secret=ghi'));
check('authorization / Bearer detected but raw value not leaked', hasReason(result.unsafe_detection_summary, 'authorization_detected') && hasReason(result.unsafe_detection_summary, 'bearer_detected') && !serialized.includes('authorization=Bearer abc'));
check('model_path detected but raw path not leaked', hasReason(result.unsafe_detection_summary, 'model_path_detected') && !serialized.includes('C:/private/model'));
check('dataset_path detected but raw path not leaked', hasReason(result.unsafe_detection_summary, 'dataset_path_detected') && !serialized.includes('C:/private/dataset'));
check('private_path detected but raw path not leaked', hasReason(result.unsafe_detection_summary, 'private_path_detected') && !serialized.includes('private/path'));
check('raw_payload detected but raw payload not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('raw_payload_value'));
check('raw_logs detected but raw logs not leaked', hasReason(result.unsafe_detection_summary, 'raw_logs_detected') && !serialized.includes('raw_logs_value'));
check('url / uri detected but raw URL not leaked', hasReason(result.unsafe_detection_summary, 'url_detected') && !serialized.includes('https://bad.invalid'));
check('email detected but raw email not leaked', hasReason(result.unsafe_detection_summary, 'email_detected') && !serialized.includes('user@example.com'));
check('asr_output_payload detected but raw payload not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('asr_output_payload_value'));
check('language_detection_payload detected but raw payload not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('language_detection_payload_value'));
check('speaker_diarization_payload detected but raw payload not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('speaker_diarization_payload_value'));
check('latency_raw_trace detected but raw trace not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('latency_raw_trace_value'));
check('concurrency_raw_trace detected but raw trace not leaked', hasReason(result.unsafe_detection_summary, 'raw_payload_detected') && !serialized.includes('concurrency_raw_trace_value'));
check('vendor_claim_notes not leaked', !serialized.includes('vendor_claim_notes_value'));
check('privacy review fields are counted only', hasReason(result.safe_summary, 'privacy_review_required'));
check('transcript safety review fields are counted only', hasReason(result.safe_summary, 'transcript_safety_review_required'));
check('microphone input review fields are counted only', hasReason(result.safe_summary, 'unsafe_reason_redacted'));
check('audio retention policy fields are counted only', hasReason(result.safe_summary, 'audio_retention_policy_review_required'));
check('license review fields are counted only', hasReason(result.safe_summary, 'license_review_required'));
check('vendor claims do not become verified claims', result.safe_summary.reason_counts.vendor_claim_unverified === 1);
check('runtime readiness claim remains false', result.fixed_flags.runtime_readiness_claimed === false);
check('production readiness claim remains false', result.fixed_flags.production_readiness_claimed === false);
check('real TTS readiness claim remains false', result.fixed_flags.real_tts_readiness_claimed === false);
check('ASR runtime readiness claim remains false', result.fixed_flags.asr_runtime_readiness_claimed === false);
check('merge readiness remains false', result.fixed_flags.merge_readiness === false);
check('safe summary does not include branch name', !serialized.includes('branch name'));
check('safe summary does not include PR body', !serialized.includes('PR body'));
check('safe summary does not include changed files', !serialized.includes('changed_files'));
check('assertSafeSummaryDoesNotLeak catches synthetic leaks without exposing raw forbidden fragments', (() => {
  try {
    assertSafeSummaryDoesNotLeak({ status: 'pass', value: 'raw_audio_value' }, forbiddenFragments);
    return false;
  } catch (error) {
    return error instanceof Error && /forbidden fragment\(s\)/u.test(error.message) && !error.message.includes('raw_audio_value');
  }
})());
check('buildAsrCandidatePolicyMigrationSafeSummary is count-only', migrationSafeSummary.safe_summary_only === true && !JSON.stringify(migrationSafeSummary).includes('raw_audio'));
check('fixed flags remain false', Object.values(result.fixed_flags).every((value) => value === false));

for (const fragment of forbiddenFragments) {
  check(`serialized migration output excludes ${fragment}`, !serialized.includes(fragment));
}

check('docs include Spec Persistence Requirement boundaries', docs.includes('Evidence Boundary') && docs.includes('Migration Boundary') && docs.includes('Forbidden Claims'));
check('docs include before / after contract', docs.includes('Before / After Contract'));
check('docs include rollback / preserve strategy', docs.includes('Rollback / Preserve Strategy'));
check('migration safe summary status pass', migrationSafeSummary.status === 'pass');
check('migration safe summary migration_count count-only', Number.isInteger(migrationSafeSummary.migration_count));
check('migration safe summary unsafe_detection_count count-only', Number.isInteger(migrationSafeSummary.unsafe_detection_count));
check('fixture is synthetic only', fixture.length === 3 && fixture.every((record) => record.safe_summary_only === true));
check('uses safe summary builder true', result.uses_safe_summary_builder === true);
check('uses unsafe field detector true', result.uses_unsafe_field_detector === true);
check('target area is asr_candidate_policy', result.target_area === 'asr_candidate_policy');
check('summary schema version preserved', result.safe_summary.summary_schema_version === 'v1.0.6');
check('unsafe summary schema version preserved', result.unsafe_detection_summary.summary_schema_version === 'v1.0.6');
check('migration output contains no records array', !Object.hasOwn(result, 'records'));
check('migration output contains no raw fixture object', !serialized.includes('raw fixture'));
check('migration output contains no private path label', !serialized.includes('private/path'));
check('candidate policy remains blocked for unsafe review records', result.safe_summary.blocked_count >= 2);
check('approved count remains count-only', result.safe_summary.approved_count === 1);
check('review required count remains count-only', result.safe_summary.review_required_count === 2);
check('runtime connected count remains zero', result.safe_summary.runtime_connected_count === 0);
check('production ready count remains zero', result.safe_summary.production_ready_count === 0);
check('ASR runtime ready count remains zero', result.safe_summary.asr_runtime_ready_count === 0);
check('model download flag remains false in output', result.model_download_performed === false);
check('API call flag remains false in output', result.api_call_performed === false);
check('endpoint config flag remains false in output', result.endpoint_config_added === false);
check('benchmark flag remains false in output', result.benchmark_executed === false);
check('workflow change flag remains false in output', result.workflow_changed === false);
check('package change flag remains false in output', result.package_changed === false);
check('microphone capture flag remains false in output', result.microphone_capture_implemented === false);
check('unsafe summary checked count matches fixture length', result.unsafe_detection_summary.checked_count === fixture.length);
check('unsafe summary safe count remains count-only', Number.isInteger(result.unsafe_detection_summary.safe_count));
check('unsafe summary truncated count remains zero', result.unsafe_detection_summary.truncated_count === 0);

const failed = checks.filter((item) => !item.pass);
if (failed.length > 0) {
  console.error(JSON.stringify({ status: 'fail', failed }, null, 2));
  process.exit(1);
}

const output = {
  status: 'pass',
  checked_cases: checks.length,
  target_area: 'asr_candidate_policy',
  migration_performed: true,
  existing_policy_modified: false,
  existing_validator_modified: false,
  runtime_connected: false,
  asr_runtime_connected: false,
  active_quality_gate_connected: false,
  microphone_capture_implemented: false,
  model_download_performed: false,
  api_call_performed: false,
  endpoint_config_added: false,
  benchmark_executed: false,
  workflow_changed: false,
  package_changed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
};

if (output.checked_cases < 120) {
  console.error(JSON.stringify({ status: 'fail', reason: 'checked_cases_below_minimum', checked_cases: output.checked_cases }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
