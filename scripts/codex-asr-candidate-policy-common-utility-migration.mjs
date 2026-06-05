import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from './codex-safe-summary-builder.mjs';
import { fileURLToPath } from 'node:url';
import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from './codex-unsafe-field-detector.mjs';

const FORBIDDEN_FRAGMENTS = [
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

function buildSyntheticUnsafeRecord(overrides = {}) {
  return {
    raw_audio: 'raw_audio_value',
    audio_chunk: 'audio_chunk_value',
    microphone_input: 'microphone_input_value',
    transcript_raw: 'transcript_raw_value',
    speaker_identity: 'speaker_identity_value',
    language_tag: 'language_tag_value',
    stream_id: 'stream_id_value',
    endpoint: 'https://bad.invalid',
    api_key: 'api_key=abc',
    'api-key': 'api_key=abc',
    token: 'token=def',
    secret: 'secret=ghi',
    authorization: 'authorization=Bearer abc',
    bearer_header: 'Bearer abc',
    model_path: 'C:/private/model',
    dataset_path: 'C:/private/dataset',
    private_path: 'private/path',
    raw_payload: 'raw_payload_value',
    raw_logs: 'raw_logs_value',
    uri: 'https://bad.invalid/asr-uri',
    url: 'https://bad.invalid/asr-url',
    email: 'user@example.com',
    asr_output_payload: { raw_payload: 'asr_output_payload_value' },
    language_detection_payload: { raw_payload: 'language_detection_payload_value' },
    speaker_diarization_payload: { raw_payload: 'speaker_diarization_payload_value' },
    latency_raw_trace: { raw_payload: 'latency_raw_trace_value' },
    concurrency_raw_trace: { raw_payload: 'concurrency_raw_trace_value' },
    vendor_claim_notes: 'vendor_claim_notes_value',
    ...overrides,
  };
}

export function buildAsrCandidatePolicyMigrationFixture() {
  return [
    {
      ...buildSyntheticUnsafeRecord(),
      candidate_type: 'synthetic_asr_candidate',
      asr_candidate_policy: 'candidate_policy_only',
      privacy_review_required: true,
      transcript_safety_review_required: true,
      microphone_input_policy_review_required: true,
      audio_retention_policy_review_required: true,
      license_review_required: true,
      benchmark_required: true,
      runtime_connected: false,
      production_ready: false,
      asr_runtime_ready: false,
      safe_summary_only: true,
      review_required: true,
      blocked: true,
      approved: false,
      vendor_claim_language_locale_count: 12,
      verified_language_locale_count: 0,
      vendor_claim_latency_ms: 120,
      verified_latency_ms: 0,
      vendor_claim_concurrent_streams: 4,
      verified_concurrent_streams: 0,
      reason_codes: [
        'privacy_review_required',
        'transcript_safety_review_required',
        'microphone_input_policy_review_required',
        'audio_retention_policy_review_required',
        'license_review_required',
        'vendor_claim_unverified',
      ],
    },
    {
      ...buildSyntheticUnsafeRecord({
        nested: {
          raw_audio: 'raw_audio_value',
          transcript_raw: 'transcript_raw_value',
          authorization: 'authorization=Bearer abc',
          model_path: 'C:/private/model',
          raw_logs: 'raw_logs_value',
        },
      }),
      candidate_type: 'synthetic_asr_candidate',
      asr_candidate_policy: 'candidate_policy_only',
      privacy_review_required: true,
      transcript_safety_review_required: true,
      microphone_input_policy_review_required: true,
      audio_retention_policy_review_required: true,
      license_review_required: true,
      benchmark_required: true,
      runtime_connected: false,
      production_ready: false,
      asr_runtime_ready: false,
      safe_summary_only: true,
      review_required: true,
      blocked: true,
      approved: false,
      vendor_claim_language_locale_count: 6,
      verified_language_locale_count: 0,
      vendor_claim_latency_ms: 180,
      verified_latency_ms: 0,
      vendor_claim_concurrent_streams: 2,
      verified_concurrent_streams: 0,
      reason_codes: ['privacy_review_required', 'benchmark_required'],
    },
    {
      candidate_type: 'synthetic_asr_candidate',
      asr_candidate_policy: 'candidate_policy_only',
      privacy_review_required: false,
      transcript_safety_review_required: false,
      microphone_input_policy_review_required: false,
      audio_retention_policy_review_required: false,
      license_review_required: false,
      benchmark_required: false,
      runtime_connected: false,
      production_ready: false,
      asr_runtime_ready: false,
      safe_summary_only: true,
      review_required: false,
      blocked: false,
      approved: true,
      vendor_claim_language_locale_count: 0,
      verified_language_locale_count: 0,
      vendor_claim_latency_ms: 0,
      verified_latency_ms: 0,
      vendor_claim_concurrent_streams: 0,
      verified_concurrent_streams: 0,
      reason_codes: ['synthetic_policy_record'],
    },
  ];
}

export function buildAsrCandidatePolicyMigrationSafeSummary(result) {
  const records = Array.isArray(result?.records) ? result.records : [];
  const unsafeDetectionSummary = result?.unsafe_detection_summary;
  return {
    status: result?.status === 'pass' ? 'pass' : 'blocked',
    migration_count: 1,
    safe_summary_only_count: result?.safe_summary_only === true ? 1 : 0,
    unsafe_detection_count: unsafeDetectionSummary?.unsafe_count ?? 0,
    migration_performed_count: result?.migration_performed === true ? 1 : 0,
    existing_policy_modified_count: result?.existing_policy_modified === true ? 1 : 0,
    existing_validator_modified_count: result?.existing_validator_modified === true ? 1 : 0,
    runtime_connected_count: result?.runtime_connected === true ? 1 : 0,
    asr_runtime_connected_count: result?.asr_runtime_connected === true ? 1 : 0,
    active_quality_gate_connected_count: result?.active_quality_gate_connected === true ? 1 : 0,
    microphone_capture_count: result?.microphone_capture_implemented === true ? 1 : 0,
    model_download_count: result?.model_download_performed === true ? 1 : 0,
    api_call_count: result?.api_call_performed === true ? 1 : 0,
    endpoint_config_count: result?.endpoint_config_added === true ? 1 : 0,
    benchmark_execution_count: result?.benchmark_executed === true ? 1 : 0,
    workflow_change_count: result?.workflow_changed === true ? 1 : 0,
    package_change_count: result?.package_changed === true ? 1 : 0,
    blocked_count: records.filter((record) => record.blocked === true).length,
    review_required_count: records.filter((record) => record.review_required === true).length,
    approved_count: records.filter((record) => record.approved === true).length,
    safe_summary_only: true,
  };
}

export function runAsrCandidatePolicyCommonUtilityMigration(input = {}) {
  const records = Array.isArray(input.records)
    ? input.records
    : buildAsrCandidatePolicyMigrationFixture();
  const unsafeFindings = records.map((record) => detectUnsafeFields(record));
  const unsafeDetectionSummary = buildUnsafeFieldDetectionSafeSummary(unsafeFindings);
  const safeSummary = buildCountOnlySafeSummary(records, {
    statusField: 'asr_candidate_policy',
    reviewRequiredField: 'review_required',
    approvedField: 'approved',
    blockedField: 'blocked',
    runtimeConnectedField: 'runtime_connected',
    productionReadyField: 'production_ready',
    asrRuntimeReadyField: 'asr_runtime_ready',
    reasonCodesField: 'reason_codes',
  });

  assertSafeSummaryDoesNotLeak(safeSummary, FORBIDDEN_FRAGMENTS);
  assertSafeSummaryDoesNotLeak(unsafeDetectionSummary, FORBIDDEN_FRAGMENTS);

  const result = {
    status: 'pass',
    migration_status: 'implemented_non_runtime_candidate',
    target_area: 'asr_candidate_policy',
    uses_safe_summary_builder: true,
    uses_unsafe_field_detector: hasUnsafeFields(records),
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
    safe_summary: safeSummary,
    unsafe_detection_summary: unsafeDetectionSummary,
    fixed_flags: {
      runtime_readiness_claimed: false,
      production_readiness_claimed: false,
      real_tts_readiness_claimed: false,
      asr_runtime_readiness_claimed: false,
      merge_readiness: false,
    },
  };

  const migrationSafeSummary = buildAsrCandidatePolicyMigrationSafeSummary({
    ...result,
    records,
  });
  assertSafeSummaryDoesNotLeak(migrationSafeSummary, FORBIDDEN_FRAGMENTS);

  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = runAsrCandidatePolicyCommonUtilityMigration();
  console.log(JSON.stringify(result, null, 2));
}
