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
];

export function buildTtsEvaluationMigrationProbeFixture() {
  return [
    {
      group: 'capability_profile',
      engine_id: 'engine_id_value',
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
      notes: 'notes_value',
      engine_notes: 'engine_notes_value',
      reference_voice: 'reference_voice_value',
      prompt_audio: 'prompt_audio_value',
      generated_audio_ref: 'generated_audio_ref_value',
      candidate_status: 'candidate_only',
      runtime_connected: false,
      production_ready: false,
      real_tts_ready: false,
      supports_voice_cloning: true,
      reference_voice_consent_status: 'missing',
      human_review_status: 'required',
      license_review_status: 'required',
      benchmark_required: true,
      safe_summary_only: true,
      review_required: true,
      blocked: true,
      approved: false,
      reason_codes: ['human_review_required', 'license_review_required', 'benchmark_required'],
    },
    {
      group: 'benchmark_manifest',
      benchmark_id: 'benchmark_id_value',
      engine_id: 'engine_id_value',
      endpoint: 'https://bad.invalid',
      api_key: 'api_key=abc',
      model_path: 'C:/private/model',
      dataset_path: 'C:/private/dataset',
      raw_manifest: 'raw_manifest_value',
      workflow_path: 'workflow/path',
      package_change_note: 'package_change_note_value',
      download_url: 'download_url_value https://bad.invalid',
      api_call_payload: 'api_call_payload_value',
      raw_payload: 'raw_payload_value',
      raw_logs: 'raw_logs_value',
      benchmark_status: 'planned',
      execution_mode: 'not_run',
      model_download_allowed: false,
      api_call_allowed: false,
      endpoint_config_allowed: false,
      workflow_change_allowed: false,
      package_change_allowed: false,
      tested_languages: 0,
      benchmark_required: true,
      blocked: true,
      review_required: true,
      approved: false,
      reason_codes: ['benchmark_manifest_planned', 'execution_blocked'],
    },
    {
      group: 'benchmark_result',
      result_id: 'result_id_value',
      engine_id: 'engine_id_value',
      raw_logs: 'raw_logs_value',
      raw_audio: 'raw_audio_value',
      generated_audio_ref: 'generated_audio_ref_value',
      gpu_identifier: 'gpu_identifier_value',
      model_path: 'C:/private/model',
      dataset_path: 'C:/private/dataset',
      benchmark_notes: 'benchmark_notes_value',
      latency_raw_trace: 'latency_raw_trace_value',
      vram_raw_trace: 'vram_raw_trace_value',
      score_raw_payload: 'score_raw_payload_value',
      result_status: 'planned',
      planned: true,
      not_run: true,
      failed: false,
      completed_lab_evaluation: false,
      quality_review_status: 'required',
      human_review_status: 'required',
      reference_voice_consent_status: 'missing',
      latency_score: 0,
      vram_score: 0,
      pronunciation_score: 0,
      multilingual_score: 0,
      pause_alignment_score: 0,
      subtitle_alignment_score: 0,
      lip_sync_alignment_score: 0,
      live2d_alignment_score: 0,
      runtime_ready: false,
      production_ready: false,
      real_tts_ready: false,
      blocked: true,
      review_required: true,
      approved: false,
      reason_codes: ['benchmark_result_not_run', 'runtime_adoption_blocked'],
    },
    {
      group: 'completed_lab_evaluation_boundary',
      result_status: 'completed_lab_evaluation',
      planned: false,
      not_run: false,
      failed: false,
      completed_lab_evaluation: true,
      runtime_ready: false,
      production_ready: false,
      real_tts_ready: false,
      blocked: false,
      review_required: true,
      approved: true,
      reason_codes: ['completed_lab_evaluation_not_runtime_ready'],
    },
    {
      group: 'failed_result_boundary',
      result_status: 'failed',
      planned: false,
      not_run: false,
      failed: true,
      completed_lab_evaluation: false,
      runtime_ready: false,
      production_ready: false,
      real_tts_ready: false,
      blocked: true,
      review_required: true,
      approved: false,
      reason_codes: ['failed_result_recordable_adoption_blocked'],
    },
  ];
}

export function runTtsEvaluationCommonUtilityMigrationProbe(input = {}) {
  const fixture = Array.isArray(input.records) ? input.records : buildTtsEvaluationMigrationProbeFixture();
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
    target_area: 'tts_evaluation',
    uses_safe_summary_builder: true,
    uses_unsafe_field_detector: true,
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

export function buildTtsEvaluationMigrationProbeSafeSummary(result) {
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
    benchmark_execution_count: item.benchmark_executed === true ? 1 : 0,
    model_download_count: item.model_download_performed === true ? 1 : 0,
    api_call_count: item.api_call_performed === true ? 1 : 0,
    endpoint_config_count: item.endpoint_config_added === true ? 1 : 0,
    workflow_change_count: item.workflow_changed === true ? 1 : 0,
    package_change_count: item.package_changed === true ? 1 : 0,
    blocked_count: Number.isInteger(safeSummary.blocked_count) ? safeSummary.blocked_count : 0,
    review_required_count: Number.isInteger(safeSummary.review_required_count)
      ? safeSummary.review_required_count
      : 0,
    approved_count: Number.isInteger(safeSummary.approved_count) ? safeSummary.approved_count : 0,
    safe_summary_only: true,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(runTtsEvaluationCommonUtilityMigrationProbe())}\n`);
}
