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
];

export function buildVoiceLabMigrationProbeFixture() {
  return [
    {
      candidate_id: 'candidate_id_value',
      generated_text: 'generated_text_value',
      generated_audio_ref: 'generated_audio_ref_value',
      prompt_audio: 'prompt_audio_value',
      reference_voice: 'reference_voice_value',
      raw_audio: 'raw_audio_value',
      endpoint: 'https://bad.invalid',
      api_key: 'api_key=abc',
      token: 'token=def',
      secret: 'secret=ghi',
      authorization: 'authorization=Bearer abc',
      bearer: 'Bearer abc',
      model_path: 'C:/private/model',
      dataset_path: 'C:/private/dataset',
      raw_payload: 'raw_payload_value',
      raw_logs: 'raw_logs_value',
      human_review_status: 'required',
      reference_voice_consent_status: 'missing',
      prohibited_use_cases: ['voice_clone_without_consent'],
      runtime_connected: false,
      production_ready: false,
      runtime_ready: false,
      safe_summary_only: true,
      review_required: true,
      blocked: true,
      approved: false,
      reason_codes: [
        'human_review_required',
        'reference_consent_missing',
        'prohibited_use_case_blocked',
      ],
    },
    {
      human_review_status: 'approved',
      reference_voice_consent_status: 'explicit_consent_recorded',
      prohibited_use_cases: [],
      runtime_connected: false,
      production_ready: false,
      runtime_ready: false,
      safe_summary_only: true,
      review_required: false,
      blocked: false,
      approved: true,
      reason_codes: ['synthetic_safe_voice_lab_record'],
    },
  ];
}

export function runVoiceLabCommonUtilityMigrationProbe(input = {}) {
  const fixture = Array.isArray(input.records) ? input.records : buildVoiceLabMigrationProbeFixture();
  const safeSummary = buildCountOnlySafeSummary(fixture, {
    reviewRequiredField: 'review_required',
    approvedField: 'approved',
    blockedField: 'blocked',
    runtimeConnectedField: 'runtime_connected',
    productionReadyField: 'production_ready',
    runtimeReadyField: 'runtime_ready',
    reasonCodesField: 'reason_codes',
  });
  const detectionResults = fixture.map((record) => detectUnsafeFields(record));
  const unsafeDetectionSummary = buildUnsafeFieldDetectionSafeSummary(detectionResults);

  const result = {
    status: safeSummary.safe_summary_only === true && unsafeDetectionSummary.safe_summary_only === true
      ? 'pass'
      : 'blocked',
    probe_status: 'synthetic_fixture_checked',
    target_area: 'voice_lab',
    uses_safe_summary_builder: true,
    uses_unsafe_field_detector: true,
    migration_performed: false,
    existing_validator_modified: false,
    runtime_connected: false,
    active_quality_gate_connected: false,
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

export function buildVoiceLabMigrationProbeSafeSummary(result) {
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
    existing_validator_modified_count: item.existing_validator_modified === true ? 1 : 0,
    runtime_connected_count: item.runtime_connected === true ? 1 : 0,
    active_quality_gate_connected_count: item.active_quality_gate_connected === true ? 1 : 0,
    blocked_count: Number.isInteger(safeSummary.blocked_count) ? safeSummary.blocked_count : 0,
    review_required_count: Number.isInteger(safeSummary.review_required_count)
      ? safeSummary.review_required_count
      : 0,
    approved_count: Number.isInteger(safeSummary.approved_count) ? safeSummary.approved_count : 0,
    safe_summary_only: true,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(runVoiceLabCommonUtilityMigrationProbe())}\n`);
}
