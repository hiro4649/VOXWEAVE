import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from './codex-safe-summary-builder.mjs';
import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from './codex-unsafe-field-detector.mjs';
import { pathToFileURL } from 'node:url';

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
  'api-key=abc',
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
];

export function buildAsrMigrationProbeFixture() {
  return [
    {
      raw_audio: 'raw_audio_value',
      audio_chunk: 'audio_chunk_value',
      microphone_input: 'microphone_input_value',
      transcript_raw: 'transcript_raw_value',
      speaker_identity: 'speaker_identity_value',
      language_tag: 'language_tag_value',
      stream_id: 'stream_id_value',
      endpoint: 'https://bad.invalid',
      url: 'https://bad.invalid',
      uri: 'https://bad.invalid',
      email: 'user@example.com',
      api_key: 'api_key=abc',
      'api-key': 'api-key=abc',
      token: 'token=def',
      secret: 'secret=ghi',
      authorization: 'authorization=Bearer abc',
      bearer: 'Bearer abc',
      model_path: 'C:/private/model',
      dataset_path: 'C:/private/dataset',
      private_path: 'private/path',
      raw_payload: 'raw_payload_value',
      raw_logs: 'raw_logs_value',
      candidate_type: 'asr_engine_candidate',
      asr_candidate_policy: 'nemotron_asr_candidate_policy',
      privacy_review_required: true,
      transcript_safety_review_required: true,
      microphone_input_policy_review_required: true,
      audio_retention_policy_review_required: true,
      license_review_required: true,
      runtime_connected: false,
      production_ready: false,
      asr_runtime_ready: false,
      safe_summary_only: true,
      review_required: true,
      blocked: true,
      approved: false,
      reason_codes: [
        'privacy_review_required',
        'transcript_safety_review_required',
        'microphone_input_policy_review_required',
        'audio_retention_policy_review_required',
        'license_review_required',
      ],
    },
    {
      candidate_type: 'asr_policy_placeholder',
      asr_candidate_policy: 'synthetic_safe_boundary',
      privacy_review_required: false,
      transcript_safety_review_required: false,
      microphone_input_policy_review_required: false,
      audio_retention_policy_review_required: false,
      license_review_required: false,
      runtime_connected: false,
      production_ready: false,
      asr_runtime_ready: false,
      safe_summary_only: true,
      review_required: false,
      blocked: false,
      approved: true,
      reason_codes: ['synthetic_safe_asr_record'],
    },
  ];
}

export function runAsrCommonUtilityMigrationProbe(input = {}) {
  const fixture = Array.isArray(input.records) ? input.records : buildAsrMigrationProbeFixture();
  const safeSummary = buildCountOnlySafeSummary(fixture, {
    reviewRequiredField: 'review_required',
    approvedField: 'approved',
    blockedField: 'blocked',
    runtimeConnectedField: 'runtime_connected',
    productionReadyField: 'production_ready',
    asrRuntimeReadyField: 'asr_runtime_ready',
    reasonCodesField: 'reason_codes',
  });
  const detectionResults = fixture.map((record) => detectUnsafeFields(record));
  const unsafeDetectionSummary = buildUnsafeFieldDetectionSafeSummary(detectionResults);

  const result = {
    status: safeSummary.safe_summary_only === true && unsafeDetectionSummary.safe_summary_only === true
      ? 'pass'
      : 'blocked',
    probe_status: 'synthetic_fixture_checked',
    target_area: 'asr',
    uses_safe_summary_builder: true,
    uses_unsafe_field_detector: true,
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

  assertSafeSummaryDoesNotLeak(result, FORBIDDEN_FRAGMENTS);
  return result;
}

export function buildAsrMigrationProbeSafeSummary(result) {
  const item = result && typeof result === 'object' ? result : {};
  const safeSummary = item.safe_summary && typeof item.safe_summary === 'object' ? item.safe_summary : {};
  const unsafeSummary = item.unsafe_detection_summary && typeof item.unsafe_detection_summary === 'object'
    ? item.unsafe_detection_summary
    : {};

  return {
    status: item.status === 'pass' ? 'pass' : 'blocked',
    probe_count: 1,
    safe_summary_only_count: item.safe_summary_only === true ? 1 : 0,
    unsafe_detection_count: Number.isInteger(unsafeSummary.unsafe_count) ? unsafeSummary.unsafe_count : 0,
    migration_performed_count: item.migration_performed === true ? 1 : 0,
    existing_policy_modified_count: item.existing_policy_modified === true ? 1 : 0,
    existing_validator_modified_count: item.existing_validator_modified === true ? 1 : 0,
    runtime_connected_count: item.runtime_connected === true ? 1 : 0,
    asr_runtime_connected_count: item.asr_runtime_connected === true ? 1 : 0,
    active_quality_gate_connected_count: item.active_quality_gate_connected === true ? 1 : 0,
    microphone_capture_count: item.microphone_capture_implemented === true ? 1 : 0,
    model_download_count: item.model_download_performed === true ? 1 : 0,
    api_call_count: item.api_call_performed === true ? 1 : 0,
    benchmark_execution_count: item.benchmark_executed === true ? 1 : 0,
    blocked_count: Number.isInteger(safeSummary.blocked_count) ? safeSummary.blocked_count : 0,
    review_required_count: Number.isInteger(safeSummary.review_required_count)
      ? safeSummary.review_required_count
      : 0,
    approved_count: Number.isInteger(safeSummary.approved_count) ? safeSummary.approved_count : 0,
    safe_summary_only: true,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(runAsrCommonUtilityMigrationProbe())}\n`);
}
