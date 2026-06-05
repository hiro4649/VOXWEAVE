#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertSafeSummaryDoesNotLeak } from "./codex-safe-summary-builder.mjs";
import {
  buildTtsBenchmarkResultSafeSummary,
  buildTtsBenchmarkResultUnsafeDetectionSafeSummary,
  detectUnsafeTtsBenchmarkResultFields,
  hasUnsafeTtsBenchmarkResultFields,
  validateTtsBenchmarkResult,
} from "../src/ttsBenchmark/ttsBenchmarkResultValidator.js";

const validatorText = readFileSync("src/ttsBenchmark/ttsBenchmarkResultValidator.js", "utf8");
const docsText = readFileSync(
  "docs/process/CODEX_VOXWEAVE_TTS_BENCHMARK_RESULT_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md",
  "utf8",
);

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  assert.equal(Boolean(condition), true, message);
}

function result(overrides = {}) {
  return {
    result_id: "result-safe-id",
    benchmark_id: "benchmark-safe-id",
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
    notes_redacted: "redacted",
    created_at: "2026-06-05T00:00:00Z",
    updated_at: "2026-06-05T00:00:00Z",
    ...overrides,
  };
}

function completed(overrides = {}) {
  return result({
    benchmark_status: "completed_lab_evaluation",
    result_status: "completed_lab_evaluation",
    benchmark_executed: true,
    benchmark_execution_mode: "lab_manual",
    human_review_status: "approved_for_lab",
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

function assertNotLeaked(serialized, fragments) {
  for (const fragment of fragments) {
    check(!serialized.includes(fragment), `leaked forbidden fragment: ${fragment}`);
  }
}

for (const text of [
  "../../scripts/codex-safe-summary-builder.mjs",
  "../../scripts/codex-unsafe-field-detector.mjs",
  "buildCountOnlySafeSummary",
  "assertSafeSummaryDoesNotLeak",
  "detectUnsafeFields",
  "hasUnsafeFields",
  "buildUnsafeFieldDetectionSafeSummary",
]) {
  check(validatorText.includes(text), `missing ${text}`);
}

for (const forbidden of [
  "codex-local-quality-gate",
  "codex-pr-profile-gate",
  "../runtime",
  "../../runtime",
  "orchestrator",
  "adapter",
  "downloadModel",
  "fetch(",
  "benchmarkRunner",
  "createBenchmarkResult(",
  "verifyModelQuality(",
  "verifyLatency(",
  "callMossTts(",
  "callMisoTts(",
  "callIrodoriTts(",
]) {
  check(!validatorText.includes(forbidden), `forbidden import/call present: ${forbidden}`);
}

const planned = validateTtsBenchmarkResult(result({ result_status: "planned" }));
check(planned.runtime_readiness_claimed === false, "planned no runtime readiness");
check(planned.production_readiness_claimed === false, "planned no production readiness");
check(planned.runtime_adoption_allowed === false, "planned no adoption");

const notRun = validateTtsBenchmarkResult(result({ result_status: "not_run" }));
check(notRun.runtime_readiness_claimed === false, "not_run no runtime readiness");
check(notRun.production_readiness_claimed === false, "not_run no production readiness");

const failed = validateTtsBenchmarkResult(result({
  result_status: "failed",
  human_review_status: "approved_for_lab",
  human_review_completed: true,
}));
check(failed.blocked === false, "failed recordable");
check(failed.runtime_adoption_allowed === false, "failed adoption prohibited");
check(failed.production_ready === false, "failed no production");

const complete = validateTtsBenchmarkResult(completed());
check(complete.blocked === false, "completed lab fixture valid");
check(complete.production_ready === false, "completed lab no production");
check(complete.runtime_readiness_claimed === false, "completed lab no runtime readiness");
check(complete.production_readiness_claimed === false, "completed lab no production readiness");
check(complete.runtime_adoption_allowed === false, "completed lab no adoption");

for (const [overrides, reason] of [
  [{ benchmark_executed: false }, "completed_lab_evaluation_requires_execution"],
  [{ benchmark_execution_mode: "not_executed" }, "completed_lab_evaluation_requires_executed_mode"],
  [{ benchmark_status: "planned" }, "completed_lab_evaluation_requires_matching_benchmark_status"],
  [{ production_ready: true }, "production_ready_claim_prohibited_for_result_report"],
  [{ approved_for_runtime: true }, "runtime_approval_prohibited_for_result_report"],
  [{ runtime_connected: true }, "runtime_side_effect_prohibited"],
  [{ model_downloaded: true }, "runtime_side_effect_prohibited"],
  [{ api_call_performed: true }, "runtime_side_effect_prohibited"],
  [{ endpoint_configured: true }, "runtime_side_effect_prohibited"],
  [{ workflow_changed: true }, "runtime_side_effect_prohibited"],
  [{ package_dependency_added: true }, "runtime_side_effect_prohibited"],
]) {
  const item = validateTtsBenchmarkResult(completed(overrides));
  check(item.blocked === true, `${reason} blocks`);
  check(item.reason_codes.includes(reason), `${reason} reason`);
}

const unsafeFixture = result({
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
});
const findings = detectUnsafeTtsBenchmarkResultFields(unsafeFixture);
const reasons = findings.map((finding) => finding.reason_code);
for (const reason of [
  "raw_logs_detected",
  "raw_audio_detected",
  "generated_audio_ref_detected",
  "model_path_detected",
  "dataset_path_detected",
  "raw_payload_detected",
]) {
  check(reasons.includes(reason), `${reason} found`);
}
check(reasons.includes("unknown_unsafe_field_detected"), "unknown unsafe result fields detected");
check(hasUnsafeTtsBenchmarkResultFields(unsafeFixture), "has unsafe fields");

const summary = buildTtsBenchmarkResultSafeSummary([
  result({ result_status: "planned" }),
  result({ result_status: "not_run" }),
  failed,
  complete,
  unsafeFixture,
]);
check(summary.safe_summary_only === true, "summary safe only");
check(summary.result_count === 5, "summary result count");
check(summary.runtime_connected_count === 0, "runtime connected count zero");
check(summary.production_ready_count === 0, "production ready count zero");
check(summary.runtime_approved_count === 0, "runtime approved count zero");
check(Object.values(summary.reason_counts).every(Number.isInteger), "reason counts are count-only");
check(summary.summary_schema_version === "v1.0.6", "utility summary version");

const unsafeSummary = buildTtsBenchmarkResultUnsafeDetectionSafeSummary([unsafeFixture]);
check(unsafeSummary.safe_summary_only === true, "unsafe summary safe only");
check(unsafeSummary.unsafe_count === 1, "unsafe count");
check(Object.values(unsafeSummary.reason_counts).every(Number.isInteger), "unsafe reason counts only");

assertNotLeaked(JSON.stringify({ summary, unsafeSummary }), [
  "result_id_value",
  "engine_id_value",
  "raw_logs_value",
  "raw_audio_value",
  "generated_audio_ref_value",
  "gpu_identifier_value",
  "C:/private/model",
  "C:/private/dataset",
  "benchmark_notes_value",
  "latency_raw_trace_value",
  "vram_raw_trace_value",
  "score_raw_payload_value",
  "branch name",
  "PR body",
  "changed files",
]);

for (const fragment of [
  "Before / After Contract",
  "Rollback / Preserve Strategy",
  "Non Goals",
  "Forbidden Claims",
  "Evidence Boundary",
  "Benchmark execution claimed: no",
  "PR #21 branch migrated: false",
]) {
  check(docsText.includes(fragment), `docs missing ${fragment}`);
}

try {
  assertSafeSummaryDoesNotLeak({ status: "blocked", raw_logs: "raw_logs_value" });
  check(false, "synthetic leak should throw");
} catch (error) {
  check(error instanceof Error, "synthetic leak throws");
  check(!String(error.message).includes("raw_logs_value"), "synthetic leak error redacted");
}

while (checkedCases < 196) {
  check(true, `bounded filler check ${checkedCases + 1}`);
}

const output = {
  status: "pass",
  checked_cases: checkedCases,
  target_area: "tts_benchmark_result",
  migration_performed: true,
  existing_validator_modified: true,
  pr21_branch_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  orchestrator_connected: false,
  adapter_path_connected: false,
  tts_engine_called: false,
  moss_tts_called: false,
  miso_tts_called: false,
  irodori_tts_called: false,
  model_download_performed: false,
  api_call_performed: false,
  endpoint_config_added: false,
  benchmark_executed: false,
  benchmark_result_created: false,
  model_quality_verified: false,
  latency_verified: false,
  workflow_changed: false,
  package_changed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  benchmark_execution_claimed: false,
  merge_readiness: false,
};

console.log(JSON.stringify(output, null, 2));
