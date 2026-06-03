import {
  REQUIRED_TTS_BENCHMARK_RESULT_FIELDS,
  RESULT_QUALITY_REVIEW_COMPLETED_STATUSES,
  TTS_BENCHMARK_EXECUTION_MODES,
  TTS_BENCHMARK_RESULT_SAFE_SUMMARY_SCHEMA,
  TTS_BENCHMARK_RESULT_STATUSES,
  UNSAFE_TTS_BENCHMARK_RESULT_FIELDS,
} from "./ttsBenchmarkResultSchema.js";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(result) {
  return REQUIRED_TTS_BENCHMARK_RESULT_FIELDS.filter((field) => !hasValue(result[field]));
}

function unsafeFieldsPresent(result) {
  return UNSAFE_TTS_BENCHMARK_RESULT_FIELDS.filter((field) => result[field] !== undefined);
}

function isVoiceReferenceResult(result) {
  return result.reference_voice_consent_status !== "not_required_for_mock";
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  resultStatusAllowed,
  executionModeAllowed,
  completedWithoutExecution,
  completedWithNotExecutedMode,
  prohibitedRuntimeActionPresent,
  production_ready,
  approved_for_runtime,
  humanReviewIncomplete,
  referenceConsentReady,
  completedQualityReviewReady,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_tts_benchmark_result_fields_present");
  if (!resultStatusAllowed) reason_codes.push("result_status_not_allowed");
  if (!executionModeAllowed) reason_codes.push("benchmark_execution_mode_not_allowed");
  if (completedWithoutExecution) reason_codes.push("completed_lab_evaluation_requires_execution");
  if (completedWithNotExecutedMode) {
    reason_codes.push("completed_lab_evaluation_requires_executed_mode");
  }
  if (prohibitedRuntimeActionPresent) reason_codes.push("runtime_side_effect_prohibited");
  if (production_ready) reason_codes.push("production_ready_claim_prohibited_for_result_report");
  if (approved_for_runtime) reason_codes.push("runtime_approval_prohibited_for_result_report");
  if (humanReviewIncomplete) reason_codes.push("human_review_completion_required");
  if (!referenceConsentReady) reason_codes.push("reference_voice_explicit_consent_required");
  if (!completedQualityReviewReady) {
    reason_codes.push("completed_lab_evaluation_requires_quality_review");
  }
  return reason_codes;
}

export function validateTtsBenchmarkResult(result = {}) {
  const missing_metadata = missingRequiredFields(result);
  const unsafe_fields_present = unsafeFieldsPresent(result);
  const resultStatusAllowed = TTS_BENCHMARK_RESULT_STATUSES.includes(result.result_status);
  const executionModeAllowed = TTS_BENCHMARK_EXECUTION_MODES.includes(
    result.benchmark_execution_mode,
  );
  const completedLab = result.result_status === "completed_lab_evaluation";
  const runtime_connected = Boolean(result.runtime_connected);
  const production_ready = Boolean(result.production_ready);
  const model_downloaded = Boolean(result.model_downloaded);
  const api_call_performed = Boolean(result.api_call_performed);
  const endpoint_configured = Boolean(result.endpoint_configured);
  const package_dependency_added = Boolean(result.package_dependency_added);
  const workflow_changed = Boolean(result.workflow_changed);
  const benchmark_executed = Boolean(result.benchmark_executed);
  const approved_for_runtime = Boolean(result.approved_for_runtime);
  const human_review_required = Boolean(result.human_review_required);
  const human_review_completed = Boolean(result.human_review_completed);
  const prohibitedRuntimeActionPresent =
    runtime_connected ||
    model_downloaded ||
    api_call_performed ||
    endpoint_configured ||
    package_dependency_added ||
    workflow_changed;
  const completedWithoutExecution = completedLab && !benchmark_executed;
  const completedWithNotExecutedMode =
    completedLab && result.benchmark_execution_mode === "not_executed";
  const humanReviewIncomplete = human_review_required && !human_review_completed;
  const referenceConsentReady =
    !isVoiceReferenceResult(result) || result.reference_voice_consent_status === "explicit_consent";
  const completedQualityReviewReady =
    !completedLab || RESULT_QUALITY_REVIEW_COMPLETED_STATUSES.includes(result.quality_review_status);

  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !resultStatusAllowed ||
    !executionModeAllowed ||
    completedWithoutExecution ||
    completedWithNotExecutedMode ||
    prohibitedRuntimeActionPresent ||
    production_ready ||
    approved_for_runtime ||
    humanReviewIncomplete ||
    !referenceConsentReady ||
    !completedQualityReviewReady;

  return {
    result_status: resultStatusAllowed ? result.result_status : "blocked",
    benchmark_execution_mode: executionModeAllowed
      ? result.benchmark_execution_mode
      : "not_executed",
    runtime_connected,
    production_ready,
    model_downloaded,
    api_call_performed,
    endpoint_configured,
    package_dependency_added,
    workflow_changed,
    benchmark_executed,
    human_review_required,
    human_review_completed,
    approved_for_runtime,
    runtime_adoption_allowed: false,
    blocked,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      resultStatusAllowed,
      executionModeAllowed,
      completedWithoutExecution,
      completedWithNotExecutedMode,
      prohibitedRuntimeActionPresent,
      production_ready,
      approved_for_runtime,
      humanReviewIncomplete,
      referenceConsentReady,
      completedQualityReviewReady,
    }),
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function buildTtsBenchmarkResultSafeSummary(results = []) {
  const validations = results.map((result) => validateTtsBenchmarkResult(result));

  return {
    schema: TTS_BENCHMARK_RESULT_SAFE_SUMMARY_SCHEMA,
    result_count: validations.length,
    not_run_count: validations.filter((item) => item.result_status === "not_run").length,
    planned_count: validations.filter((item) => item.result_status === "planned").length,
    blocked_count: validations.filter((item) => item.blocked).length,
    failed_count: validations.filter((item) => item.result_status === "failed").length,
    completed_lab_evaluation_count: validations.filter(
      (item) => item.result_status === "completed_lab_evaluation",
    ).length,
    runtime_connected_count: validations.filter((item) => !item.blocked && item.runtime_connected)
      .length,
    production_ready_count: validations.filter((item) => !item.blocked && item.production_ready)
      .length,
    benchmark_executed_count: validations.filter((item) => !item.blocked && item.benchmark_executed)
      .length,
    human_review_required_count: validations.filter((item) => item.human_review_required).length,
    human_review_completed_count: validations.filter((item) => item.human_review_completed).length,
    runtime_approved_count: validations.filter((item) => !item.blocked && item.approved_for_runtime)
      .length,
    safe_summary_only: true,
  };
}
