import {
  REQUIRED_TTS_BENCHMARK_RESULT_FIELDS,
  RESULT_QUALITY_REVIEW_COMPLETED_STATUSES,
  TTS_BENCHMARK_EXECUTION_MODES,
  TTS_BENCHMARK_RESULT_BENCHMARK_STATUSES,
  TTS_BENCHMARK_RESULT_CANDIDATE_STATUSES,
  TTS_BENCHMARK_RESULT_HUMAN_REVIEW_STATUSES,
  TTS_BENCHMARK_RESULT_LICENSE_REVIEW_STATUSES,
  TTS_BENCHMARK_RESULT_REFERENCE_CONSENT_STATUSES,
  TTS_BENCHMARK_RESULT_SAFE_SUMMARY_SCHEMA,
  TTS_BENCHMARK_RESULT_STATUSES,
  UNSAFE_TTS_BENCHMARK_RESULT_FIELDS,
} from "./ttsBenchmarkResultSchema.js";
import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from "../../scripts/codex-safe-summary-builder.mjs";
import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from "../../scripts/codex-unsafe-field-detector.mjs";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(result) {
  return REQUIRED_TTS_BENCHMARK_RESULT_FIELDS.filter((field) => !hasValue(result[field]));
}

function unsafeFieldsPresent(result) {
  return UNSAFE_TTS_BENCHMARK_RESULT_FIELDS.filter((field) => result[field] !== undefined);
}

function buildLegacyUnsafeFindings(result) {
  return unsafeFieldsPresent(result).map((field) => {
    const reasonByField = {
      dataset_path: "dataset_path_detected",
      generated_audio_ref: "generated_audio_ref_detected",
      model_path: "model_path_detected",
      raw_audio: "raw_audio_detected",
      raw_benchmark_logs: "raw_logs_detected",
      raw_logs: "raw_logs_detected",
      score_raw_payload: "raw_payload_detected",
    };
    return {
      category: "field",
      reason_code: reasonByField[field] ?? "unknown_unsafe_field_detected",
      count: 1,
    };
  });
}

export function detectUnsafeTtsBenchmarkResultFields(result = {}) {
  return [
    ...detectUnsafeFields(result),
    ...buildLegacyUnsafeFindings(result),
  ];
}

export function hasUnsafeTtsBenchmarkResultFields(result = {}) {
  return hasUnsafeFields(result) || buildLegacyUnsafeFindings(result).length > 0;
}

export function buildTtsBenchmarkResultUnsafeDetectionSafeSummary(results = []) {
  const items = Array.isArray(results) ? results : [];
  return buildUnsafeFieldDetectionSafeSummary(
    items.map((result) => detectUnsafeTtsBenchmarkResultFields(result)),
  );
}

function isVoiceReferenceResult(result) {
  return result.reference_voice_consent_status !== "not_required_for_mock";
}

function scoreValuesReady(result) {
  return [
    "pause_control_score",
    "pronunciation_control_score",
    "subtitle_alignment_score",
    "lip_sync_alignment_score",
    "live2d_alignment_score",
    "long_form_stability_score",
  ].every((field) => {
    const value = result[field];
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  });
}

function numericMetricsReady(result) {
  return [
    "text_to_first_audio_latency_ms",
    "total_synthesis_latency_ms",
    "vram_used_mb",
  ].every((field) => {
    const value = result[field];
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  });
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  resultStatusAllowed,
  candidateStatusAllowed,
  benchmarkStatusAllowed,
  licenseReviewStatusAllowed,
  referenceConsentStatusAllowed,
  humanReviewStatusAllowed,
  benchmarkStatusBlocked,
  resultStatusBlocked,
  licenseReviewBlocked,
  referenceConsentBlocked,
  humanReviewBlocked,
  executionModeAllowed,
  completedWithoutExecution,
  completedWithNotExecutedMode,
  completedWithMismatchedBenchmarkStatus,
  prohibitedRuntimeActionPresent,
  production_ready,
  approved_for_runtime,
  humanReviewStatusConflict,
  humanReviewIncomplete,
  humanReviewCompletionInvalid,
  referenceConsentReady,
  testedLanguagesArray,
  testedLanguagesReadyForCompletedLab,
  scoresReady,
  numericMetricsReady,
  completedQualityReviewReady,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_tts_benchmark_result_fields_present");
  if (!resultStatusAllowed) reason_codes.push("result_status_not_allowed");
  if (!candidateStatusAllowed) reason_codes.push("candidate_status_not_allowed");
  if (!benchmarkStatusAllowed) reason_codes.push("benchmark_status_not_allowed");
  if (!licenseReviewStatusAllowed) reason_codes.push("license_review_status_not_allowed");
  if (!referenceConsentStatusAllowed) reason_codes.push("reference_voice_consent_status_not_allowed");
  if (!humanReviewStatusAllowed) reason_codes.push("human_review_status_not_allowed");
  if (benchmarkStatusBlocked) reason_codes.push("benchmark_status_blocked");
  if (resultStatusBlocked) reason_codes.push("result_status_blocked");
  if (licenseReviewBlocked) reason_codes.push("license_review_blocked");
  if (referenceConsentBlocked) reason_codes.push("reference_voice_consent_blocked");
  if (humanReviewBlocked) reason_codes.push("human_review_blocked");
  if (!executionModeAllowed) reason_codes.push("benchmark_execution_mode_not_allowed");
  if (completedWithoutExecution) reason_codes.push("completed_lab_evaluation_requires_execution");
  if (completedWithNotExecutedMode) {
    reason_codes.push("completed_lab_evaluation_requires_executed_mode");
  }
  if (completedWithMismatchedBenchmarkStatus) {
    reason_codes.push("completed_lab_evaluation_requires_matching_benchmark_status");
  }
  if (prohibitedRuntimeActionPresent) reason_codes.push("runtime_side_effect_prohibited");
  if (production_ready) reason_codes.push("production_ready_claim_prohibited_for_result_report");
  if (approved_for_runtime) reason_codes.push("runtime_approval_prohibited_for_result_report");
  if (humanReviewStatusConflict) {
    reason_codes.push("human_review_status_conflicts_with_required_flag");
  }
  if (humanReviewIncomplete) reason_codes.push("human_review_completion_required");
  if (humanReviewCompletionInvalid) {
    reason_codes.push("human_review_completion_requires_approved_status");
  }
  if (!referenceConsentReady) reason_codes.push("reference_voice_explicit_consent_required");
  if (!testedLanguagesArray) reason_codes.push("tested_languages_must_be_array");
  if (!testedLanguagesReadyForCompletedLab) {
    reason_codes.push("tested_languages_required_for_completed_lab_evaluation");
  }
  if (!scoresReady) reason_codes.push("score_value_out_of_range");
  if (!numericMetricsReady) reason_codes.push("numeric_metric_invalid");
  if (!completedQualityReviewReady) {
    reason_codes.push("completed_lab_evaluation_requires_quality_review");
  }
  return reason_codes;
}

export function validateTtsBenchmarkResult(result = {}) {
  const missing_metadata = missingRequiredFields(result);
  const unsafe_fields_present = unsafeFieldsPresent(result);
  const resultStatusAllowed = TTS_BENCHMARK_RESULT_STATUSES.includes(result.result_status);
  const candidateStatusAllowed = TTS_BENCHMARK_RESULT_CANDIDATE_STATUSES.includes(
    result.candidate_status,
  );
  const benchmarkStatusAllowed = TTS_BENCHMARK_RESULT_BENCHMARK_STATUSES.includes(
    result.benchmark_status,
  );
  const licenseReviewStatusAllowed = TTS_BENCHMARK_RESULT_LICENSE_REVIEW_STATUSES.includes(
    result.license_review_status,
  );
  const referenceConsentStatusAllowed = TTS_BENCHMARK_RESULT_REFERENCE_CONSENT_STATUSES.includes(
    result.reference_voice_consent_status,
  );
  const humanReviewStatusAllowed = TTS_BENCHMARK_RESULT_HUMAN_REVIEW_STATUSES.includes(
    result.human_review_status,
  );
  const executionModeAllowed = TTS_BENCHMARK_EXECUTION_MODES.includes(
    result.benchmark_execution_mode,
  );
  const completedLab = result.result_status === "completed_lab_evaluation";
  const benchmarkStatusBlocked = result.benchmark_status === "blocked";
  const resultStatusBlocked = result.result_status === "blocked";
  const licenseReviewBlocked = result.license_review_status === "blocked";
  const referenceConsentBlocked = result.reference_voice_consent_status === "blocked";
  const humanReviewBlocked = result.human_review_status === "blocked";
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
  const completedWithMismatchedBenchmarkStatus =
    completedLab && result.benchmark_status !== "completed_lab_evaluation";
  const humanReviewStatusConflict =
    human_review_required === false && ["required", "pending"].includes(result.human_review_status);
  const humanReviewIncomplete = human_review_required && !human_review_completed;
  const humanReviewCompletionInvalid =
    human_review_required && human_review_completed && result.human_review_status !== "approved_for_lab";
  const referenceConsentReady =
    !isVoiceReferenceResult(result) || result.reference_voice_consent_status === "explicit_consent";
  const testedLanguagesArray = Array.isArray(result.tested_languages);
  const testedLanguagesReadyForCompletedLab =
    !completedLab || (testedLanguagesArray && result.tested_languages.length > 0);
  const scoresReady = scoreValuesReady(result);
  const metricsReady = numericMetricsReady(result);
  const completedQualityReviewReady =
    !completedLab || RESULT_QUALITY_REVIEW_COMPLETED_STATUSES.includes(result.quality_review_status);

  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !resultStatusAllowed ||
    !candidateStatusAllowed ||
    !benchmarkStatusAllowed ||
    !licenseReviewStatusAllowed ||
    !referenceConsentStatusAllowed ||
    !humanReviewStatusAllowed ||
    benchmarkStatusBlocked ||
    resultStatusBlocked ||
    licenseReviewBlocked ||
    referenceConsentBlocked ||
    humanReviewBlocked ||
    !executionModeAllowed ||
    completedWithoutExecution ||
    completedWithNotExecutedMode ||
    completedWithMismatchedBenchmarkStatus ||
    prohibitedRuntimeActionPresent ||
    production_ready ||
    approved_for_runtime ||
    humanReviewStatusConflict ||
    humanReviewIncomplete ||
    humanReviewCompletionInvalid ||
    !referenceConsentReady ||
    !testedLanguagesArray ||
    !testedLanguagesReadyForCompletedLab ||
    !scoresReady ||
    !metricsReady ||
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
      candidateStatusAllowed,
      benchmarkStatusAllowed,
      licenseReviewStatusAllowed,
      referenceConsentStatusAllowed,
      humanReviewStatusAllowed,
      benchmarkStatusBlocked,
      resultStatusBlocked,
      licenseReviewBlocked,
      referenceConsentBlocked,
      humanReviewBlocked,
      executionModeAllowed,
      completedWithoutExecution,
      completedWithNotExecutedMode,
      completedWithMismatchedBenchmarkStatus,
      prohibitedRuntimeActionPresent,
      production_ready,
      approved_for_runtime,
      humanReviewStatusConflict,
      humanReviewIncomplete,
      humanReviewCompletionInvalid,
      referenceConsentReady,
      testedLanguagesArray,
      testedLanguagesReadyForCompletedLab,
      scoresReady,
      numericMetricsReady: metricsReady,
      completedQualityReviewReady,
    }),
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function buildTtsBenchmarkResultSafeSummary(results = []) {
  const validations = results.map((result) => validateTtsBenchmarkResult(result));
  const utilitySummary = buildCountOnlySafeSummary(validations, {
    statusField: "result_status",
    blockedField: "blocked",
    reviewRequiredField: "human_review_required",
    runtimeConnectedField: "runtime_connected",
    productionReadyField: "production_ready",
    reasonCodesField: "reason_codes",
  });
  const summary = {
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
    reason_counts: utilitySummary.reason_counts,
    summary_schema_version: utilitySummary.summary_schema_version,
    safe_summary_only: true,
  };
  assertSafeSummaryDoesNotLeak(summary);
  return summary;
}
