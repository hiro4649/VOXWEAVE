#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildTtsBenchmarkResultUnsafeDetectionSafeSummary,
  buildTtsBenchmarkResultSafeSummary,
  detectUnsafeTtsBenchmarkResultFields,
  hasUnsafeTtsBenchmarkResultFields,
  validateTtsBenchmarkResult,
} from "../src/ttsBenchmark/ttsBenchmarkResultValidator.js";

function result(overrides = {}) {
  return {
    result_id: "result-1",
    benchmark_id: "benchmark-1",
    engine_id: "moss-tts-v1.5",
    engine_family: "moss-tts",
    candidate_status: "benchmark_required",
    benchmark_status: "planned",
    result_status: "planned",
    runtime_connected: false,
    production_ready: false,
    model_downloaded: false,
    api_call_performed: false,
    endpoint_configured: false,
    package_dependency_added: false,
    workflow_changed: false,
    benchmark_executed: false,
    benchmark_execution_mode: "not_executed",
    license_review_status: "required",
    reference_voice_consent_status: "explicit_consent",
    human_review_status: "pending",
    text_to_first_audio_latency_ms: 0,
    total_synthesis_latency_ms: 0,
    gpu_name_redacted: "redacted",
    gpu_benchmark_status: "not_started",
    vram_used_mb: 0,
    vram_benchmark_status: "not_started",
    tested_languages: [],
    multilingual_benchmark_status: "not_started",
    pause_control_score: 0,
    pause_control_benchmark_status: "not_started",
    pronunciation_control_score: 0,
    pronunciation_control_benchmark_status: "not_started",
    subtitle_alignment_score: 0,
    subtitle_alignment_benchmark_status: "not_started",
    lip_sync_alignment_score: 0,
    lip_sync_alignment_benchmark_status: "not_started",
    live2d_alignment_score: 0,
    live2d_alignment_benchmark_status: "not_started",
    long_form_stability_score: 0,
    long_form_benchmark_status: "not_started",
    streaming_benchmark_status: "not_started",
    realtime_benchmark_status: "not_started",
    quality_review_status: "pending",
    human_review_required: true,
    human_review_completed: false,
    approved_for_runtime: false,
    notes_redacted: "redacted result notes",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

function completedLabResult(overrides = {}) {
  return result({
    benchmark_status: "completed_lab_evaluation",
    result_status: "completed_lab_evaluation",
    benchmark_executed: true,
    benchmark_execution_mode: "lab_manual",
    human_review_status: "approved_for_lab",
    human_review_required: true,
    human_review_completed: true,
    text_to_first_audio_latency_ms: 100,
    total_synthesis_latency_ms: 850,
    pause_control_score: 0.92,
    pronunciation_control_score: 0.93,
    subtitle_alignment_score: 0.91,
    lip_sync_alignment_score: 0.9,
    live2d_alignment_score: 0.9,
    long_form_stability_score: 0.88,
    tested_languages: ["ja", "en"],
    quality_review_status: "completed",
    ...overrides,
  });
}

const unknownCandidateStatus = validateTtsBenchmarkResult(result({
  candidate_status: "unknown",
}));
assert.equal(unknownCandidateStatus.blocked, true);
assert.equal(unknownCandidateStatus.reason_codes.includes("candidate_status_not_allowed"), true);

const unknownBenchmarkStatus = validateTtsBenchmarkResult(result({
  benchmark_status: "unknown",
}));
assert.equal(unknownBenchmarkStatus.blocked, true);
assert.equal(unknownBenchmarkStatus.reason_codes.includes("benchmark_status_not_allowed"), true);

const blockedBenchmarkStatus = validateTtsBenchmarkResult(result({
  benchmark_status: "blocked",
}));
assert.equal(blockedBenchmarkStatus.blocked, true);
assert.equal(blockedBenchmarkStatus.reason_codes.includes("benchmark_status_blocked"), true);

const blockedResultStatus = validateTtsBenchmarkResult(result({
  result_status: "blocked",
}));
assert.equal(blockedResultStatus.blocked, true);
assert.equal(blockedResultStatus.reason_codes.includes("result_status_blocked"), true);

const blockedLicense = validateTtsBenchmarkResult(result({
  license_review_status: "blocked",
}));
assert.equal(blockedLicense.blocked, true);
assert.equal(blockedLicense.reason_codes.includes("license_review_blocked"), true);

const blockedReferenceConsent = validateTtsBenchmarkResult(result({
  reference_voice_consent_status: "blocked",
}));
assert.equal(blockedReferenceConsent.blocked, true);
assert.equal(blockedReferenceConsent.reason_codes.includes("reference_voice_consent_blocked"), true);

const blockedHumanReview = validateTtsBenchmarkResult(result({
  human_review_status: "blocked",
}));
assert.equal(blockedHumanReview.blocked, true);
assert.equal(blockedHumanReview.reason_codes.includes("human_review_blocked"), true);

const completedWithPlannedBenchmark = validateTtsBenchmarkResult(completedLabResult({
  benchmark_status: "planned",
}));
assert.equal(completedWithPlannedBenchmark.blocked, true);
assert.equal(
  completedWithPlannedBenchmark.reason_codes.includes(
    "completed_lab_evaluation_requires_matching_benchmark_status",
  ),
  true,
);

const completedWithoutExecution = validateTtsBenchmarkResult(completedLabResult({
  benchmark_executed: false,
}));
assert.equal(completedWithoutExecution.blocked, true);
assert.equal(
  completedWithoutExecution.reason_codes.includes("completed_lab_evaluation_requires_execution"),
  true,
);

const completedWithNotExecutedMode = validateTtsBenchmarkResult(completedLabResult({
  benchmark_execution_mode: "not_executed",
}));
assert.equal(completedWithNotExecutedMode.blocked, true);
assert.equal(
  completedWithNotExecutedMode.reason_codes.includes(
    "completed_lab_evaluation_requires_executed_mode",
  ),
  true,
);

for (const [field, reason] of [
  ["runtime_connected", "runtime_side_effect_prohibited"],
  ["model_downloaded", "runtime_side_effect_prohibited"],
  ["api_call_performed", "runtime_side_effect_prohibited"],
  ["endpoint_configured", "runtime_side_effect_prohibited"],
  ["package_dependency_added", "runtime_side_effect_prohibited"],
  ["workflow_changed", "runtime_side_effect_prohibited"],
]) {
  const checked = validateTtsBenchmarkResult(result({ [field]: true }));
  assert.equal(checked.blocked, true, `${field} should block`);
  assert.equal(checked.reason_codes.includes(reason), true, `${field} reason missing`);
}

const productionReady = validateTtsBenchmarkResult(result({ production_ready: true }));
assert.equal(productionReady.blocked, true);
assert.equal(
  productionReady.reason_codes.includes("production_ready_claim_prohibited_for_result_report"),
  true,
);

const runtimeApproved = validateTtsBenchmarkResult(result({ approved_for_runtime: true }));
assert.equal(runtimeApproved.blocked, true);
assert.equal(
  runtimeApproved.reason_codes.includes("runtime_approval_prohibited_for_result_report"),
  true,
);

const latencyOnly = validateTtsBenchmarkResult(result({
  text_to_first_audio_latency_ms: 75,
  total_synthesis_latency_ms: 420,
}));
assert.equal(latencyOnly.runtime_readiness_claimed, false);
assert.equal(latencyOnly.runtime_adoption_allowed, false);

const highScores = validateTtsBenchmarkResult(result({
  pause_control_score: 0.99,
  pronunciation_control_score: 0.99,
  subtitle_alignment_score: 0.99,
  lip_sync_alignment_score: 0.99,
  live2d_alignment_score: 0.99,
}));
assert.equal(highScores.production_readiness_claimed, false);
assert.equal(highScores.runtime_adoption_allowed, false);

const failedResult = validateTtsBenchmarkResult(result({
  result_status: "failed",
  human_review_status: "approved_for_lab",
  human_review_required: true,
  human_review_completed: true,
}));
assert.equal(failedResult.blocked, false);
assert.equal(failedResult.runtime_adoption_allowed, false);
assert.equal(failedResult.production_ready, false);
assert.equal(failedResult.runtime_readiness_claimed, false);
assert.equal(failedResult.production_readiness_claimed, false);

const reviewFlagConflict = validateTtsBenchmarkResult(result({
  human_review_required: false,
  human_review_status: "pending",
}));
assert.equal(reviewFlagConflict.blocked, true);
assert.equal(
  reviewFlagConflict.reason_codes.includes("human_review_status_conflicts_with_required_flag"),
  true,
);

const reviewCompletionInvalid = validateTtsBenchmarkResult(result({
  human_review_required: true,
  human_review_completed: true,
  human_review_status: "pending",
}));
assert.equal(reviewCompletionInvalid.blocked, true);
assert.equal(
  reviewCompletionInvalid.reason_codes.includes("human_review_completion_requires_approved_status"),
  true,
);

const reviewIncomplete = validateTtsBenchmarkResult(result({
  human_review_required: true,
  human_review_completed: false,
}));
assert.equal(reviewIncomplete.blocked, true);
assert.equal(reviewIncomplete.reason_codes.includes("human_review_completion_required"), true);

const missingConsent = validateTtsBenchmarkResult(result({
  reference_voice_consent_status: "missing_consent",
}));
assert.equal(missingConsent.blocked, true);
assert.equal(missingConsent.reason_codes.includes("reference_voice_explicit_consent_required"), true);

const invalidLanguages = validateTtsBenchmarkResult(result({
  tested_languages: "ja",
}));
assert.equal(invalidLanguages.blocked, true);
assert.equal(invalidLanguages.reason_codes.includes("tested_languages_must_be_array"), true);

const completedWithoutLanguages = validateTtsBenchmarkResult(completedLabResult({
  tested_languages: [],
}));
assert.equal(completedWithoutLanguages.blocked, true);
assert.equal(
  completedWithoutLanguages.reason_codes.includes(
    "tested_languages_required_for_completed_lab_evaluation",
  ),
  true,
);

const invalidScore = validateTtsBenchmarkResult(result({
  pause_control_score: 1.1,
}));
assert.equal(invalidScore.blocked, true);
assert.equal(invalidScore.reason_codes.includes("score_value_out_of_range"), true);

const invalidMetric = validateTtsBenchmarkResult(result({
  text_to_first_audio_latency_ms: -1,
}));
assert.equal(invalidMetric.blocked, true);
assert.equal(invalidMetric.reason_codes.includes("numeric_metric_invalid"), true);

const completed = validateTtsBenchmarkResult(completedLabResult());
assert.equal(completed.blocked, false);
assert.equal(completed.runtime_adoption_allowed, false);
assert.equal(completed.production_ready, false);
assert.equal(completed.runtime_readiness_claimed, false);
assert.equal(completed.production_readiness_claimed, false);

const completedWithoutQualityReview = validateTtsBenchmarkResult(completedLabResult({
  quality_review_status: "pending",
}));
assert.equal(completedWithoutQualityReview.blocked, true);
assert.equal(
  completedWithoutQualityReview.reason_codes.includes(
    "completed_lab_evaluation_requires_quality_review",
  ),
  true,
);

const unsafe = validateTtsBenchmarkResult(result({
  endpoint: "https://tts-result.invalid",
  api_key: "api-key",
  token: "token",
  secret: "secret",
  authorization: "Bearer secret",
  raw_audio: "raw audio",
  raw_reference_voice: "raw reference voice",
  dataset_path: "dataset/path",
  model_path: "model/path",
  model_download_url: "https://download.invalid/model",
  private_path: "private/path",
  raw_benchmark_logs: "raw benchmark logs",
  voice_sample: "voice sample",
  speaker_embedding: "speaker embedding",
  gpu_name: "raw gpu id",
  reviewer_notes: "unredacted reviewer notes",
}));
assert.equal(unsafe.blocked, true);
assert.equal(unsafe.reason_codes.includes("unsafe_tts_benchmark_result_fields_present"), true);

const summary = buildTtsBenchmarkResultSafeSummary([
  result({ result_status: "not_run" }),
  result({ result_status: "planned" }),
  result({ result_status: "blocked" }),
  result({
    result_status: "failed",
    human_review_status: "approved_for_lab",
    human_review_completed: true,
  }),
  completedLabResult(),
  result({ runtime_connected: true }),
  result({ production_ready: true }),
  result({ approved_for_runtime: true }),
  unsafe,
]);

assert.equal(summary.result_count, 9);
assert.equal(summary.failed_count, 1);
assert.equal(summary.runtime_connected_count, 0);
assert.equal(summary.production_ready_count, 0);
assert.equal(summary.runtime_approved_count, 0);
assert.equal(summary.safe_summary_only, true);
assert.equal(Object.values(summary.reason_counts).every(Number.isInteger), true);
assert.equal(summary.summary_schema_version, "v1.0.6");

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "raw benchmark logs",
  "raw_benchmark_logs",
  "raw audio",
  "raw_audio",
  "raw reference voice",
  "raw_reference_voice",
  "dataset/path",
  "dataset_path",
  "model/path",
  "model_path",
  "endpoint",
  "https://tts-result.invalid",
  "api_key",
  "token",
  "secret",
  "authorization",
  "private/path",
  "private_path",
  "https://download.invalid/model",
  "model_download_url",
  "raw_pr_body",
  "raw_artifact_text",
  "voice sample",
  "voice_sample",
  "speaker embedding",
  "speaker_embedding",
  "moss-tts",
  "mock-tts",
  "result-1",
  "benchmark-1",
  "engine_id",
  "engine_family",
  "result_id",
  "benchmark_id",
  "redacted result notes",
  "raw gpu id",
  "unredacted reviewer notes",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

const planned = validateTtsBenchmarkResult(result({ result_status: "planned" }));
assert.equal(planned.runtime_readiness_claimed, false);
assert.equal(planned.production_readiness_claimed, false);
assert.equal(planned.runtime_adoption_allowed, false);

const notRun = validateTtsBenchmarkResult(result({ result_status: "not_run" }));
assert.equal(notRun.runtime_readiness_claimed, false);
assert.equal(notRun.production_readiness_claimed, false);
assert.equal(notRun.runtime_adoption_allowed, false);

const unsafeDetection = detectUnsafeTtsBenchmarkResultFields(result({
  result_id: "result_id_value",
  engine_id: "engine_id_value",
  raw_logs: "raw_logs_value",
  raw_audio: "raw_audio_value",
  generated_audio_ref: "generated_audio_ref_value",
  gpu_identifier: "gpu_identifier_value",
  model_path: "C:/private/model",
  dataset_path: "C:/private/dataset",
  benchmark_notes: "benchmark_notes_value",
  latency_raw_trace: "latency_raw_trace_value",
  vram_raw_trace: "vram_raw_trace_value",
  score_raw_payload: "score_raw_payload_value",
}));
assert.equal(unsafeDetection.length > 0, true);
assert.equal(hasUnsafeTtsBenchmarkResultFields({ raw_logs: "raw_logs_value" }), true);
const unsafeSummary = buildTtsBenchmarkResultUnsafeDetectionSafeSummary([
  result({ raw_logs: "raw_logs_value" }),
  result({ generated_audio_ref: "generated_audio_ref_value" }),
]);
assert.equal(unsafeSummary.safe_summary_only, true);
assert.equal(unsafeSummary.unsafe_count, 2);
assert.equal(Object.values(unsafeSummary.reason_counts).every(Number.isInteger), true);
const unsafeSerialized = JSON.stringify(unsafeSummary);
for (const forbidden of [
  "raw_logs_value",
  "generated_audio_ref_value",
  "gpu_identifier_value",
  "benchmark_notes_value",
  "latency_raw_trace_value",
  "vram_raw_trace_value",
  "score_raw_payload_value",
]) {
  assert.equal(unsafeSerialized.includes(forbidden), false, `unsafe detector leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 33,
  safe_summary_only: true,
}, null, 2));
