#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildTtsBenchmarkResultSafeSummary,
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
    quality_review_status: "completed",
    ...overrides,
  });
}

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
  result({ result_status: "failed" }),
  completedLabResult(),
  result({ runtime_connected: true }),
  result({ production_ready: true }),
  result({ approved_for_runtime: true }),
  unsafe,
]);

assert.equal(summary.result_count, 9);
assert.equal(summary.runtime_connected_count, 0);
assert.equal(summary.production_ready_count, 0);
assert.equal(summary.runtime_approved_count, 0);
assert.equal(summary.safe_summary_only, true);

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
  "raw gpu id",
  "unredacted reviewer notes",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 19,
  safe_summary_only: true,
}, null, 2));
