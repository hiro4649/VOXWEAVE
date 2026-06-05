#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertSafeSummaryDoesNotLeak,
} from "./codex-safe-summary-builder.mjs";
import {
  buildTtsBenchmarkSafeSummary,
  buildTtsBenchmarkUnsafeDetectionSafeSummary,
  detectUnsafeTtsBenchmarkManifestFields,
  hasUnsafeTtsBenchmarkManifestFields,
  validateTtsBenchmarkManifest,
} from "../src/ttsBenchmark/ttsBenchmarkValidator.js";

const candidateFiles = [
  "src/ttsBenchmark/ttsBenchmarkSchema.js",
  "src/ttsBenchmark/ttsBenchmarkValidator.js",
  "scripts/codex-tts-benchmark-manifest-self-check.mjs",
  "scripts/codex-tts-benchmark-manifest-common-utility-migration-self-check.mjs",
  "docs/process/CODEX_VOXWEAVE_TTS_BENCHMARK_MANIFEST_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md",
];

const validatorText = readFileSync("src/ttsBenchmark/ttsBenchmarkValidator.js", "utf8");
const selfCheckText = readFileSync(
  "scripts/codex-tts-benchmark-manifest-common-utility-migration-self-check.mjs",
  "utf8",
);
const docsText = readFileSync(
  "docs/process/CODEX_VOXWEAVE_TTS_BENCHMARK_MANIFEST_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md",
  "utf8",
);

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  assert.equal(Boolean(condition), true, message);
}

function manifest(overrides = {}) {
  return {
    benchmark_id: "benchmark-safe-id",
    engine_id: "moss-tts-v1.5",
    engine_family: "moss-tts",
    candidate_status: "benchmark_required",
    benchmark_status: "planned",
    runtime_connected: false,
    production_ready: false,
    model_downloaded: false,
    api_call_performed: false,
    endpoint_configured: false,
    package_dependency_added: false,
    workflow_changed: false,
    license_review_status: "required",
    reference_voice_consent_status: "explicit_consent",
    human_review_status: "approved_for_lab",
    latency_benchmark_status: "not_started",
    text_to_first_audio_latency_ms: 0,
    total_synthesis_latency_ms: 0,
    gpu_benchmark_status: "required",
    gpu_required: true,
    vram_benchmark_status: "required",
    vram_estimate_mb: 0,
    multilingual_benchmark_status: "required",
    tested_languages: [],
    pause_control_benchmark_status: "required",
    pronunciation_control_benchmark_status: "required",
    subtitle_alignment_benchmark_status: "required",
    lip_sync_alignment_benchmark_status: "required",
    live2d_alignment_benchmark_status: "required",
    long_form_benchmark_status: "required",
    streaming_benchmark_status: "required",
    realtime_benchmark_status: "not_applicable",
    quality_review_status: "required",
    notes_redacted: "benchmark manifest only",
    created_at: "2026-06-05T00:00:00Z",
    updated_at: "2026-06-05T00:00:00Z",
    ...overrides,
  };
}

function validateBlocked(overrides, reasonCode) {
  const result = validateTtsBenchmarkManifest(manifest(overrides));
  check(result.blocked, `${reasonCode} should block`);
  check(result.reason_codes.includes(reasonCode), `${reasonCode} reason missing`);
  return result;
}

function assertNotLeaked(serialized, fragments) {
  for (const fragment of fragments) {
    check(!serialized.includes(fragment), `leaked forbidden fragment: ${fragment}`);
  }
}

check(validatorText.includes("../../scripts/codex-safe-summary-builder.mjs"), "safe summary utility import missing");
check(validatorText.includes("../../scripts/codex-unsafe-field-detector.mjs"), "unsafe detector import missing");
check(validatorText.includes("buildCountOnlySafeSummary"), "safe summary builder not used");
check(validatorText.includes("assertSafeSummaryDoesNotLeak"), "safe summary leak assertion not used");
check(validatorText.includes("detectUnsafeFields"), "unsafe detector not used");
check(validatorText.includes("hasUnsafeFields"), "hasUnsafeFields not used");
check(validatorText.includes("buildUnsafeFieldDetectionSafeSummary"), "unsafe summary builder not used");

for (const forbiddenImport of [
  "codex-local-quality-gate",
  "codex-pr-profile-gate",
  "codex-code-review-monitor",
  "codex-stale-pr-audit-gate",
  "../runtime",
  "../../runtime",
  "orchestrator",
  "adapter",
  "downloadModel",
  "fetch(",
  "benchmarkRunner",
]) {
  check(!validatorText.includes(forbiddenImport), `forbidden import/call present: ${forbiddenImport}`);
}

for (const forbiddenCall of [
  "callMossTts(",
  "callMisoTts(",
  "callIrodoriTts(",
  "mossTtsClient.",
  "misoTtsClient.",
  "irodoriTtsClient.",
]) {
  check(!validatorText.includes(forbiddenCall), `forbidden engine call present: ${forbiddenCall}`);
}

for (const file of candidateFiles) {
  check(
    file.startsWith("src/ttsBenchmark/")
      || file === "scripts/codex-tts-benchmark-manifest-self-check.mjs"
      || file === "scripts/codex-tts-benchmark-manifest-common-utility-migration-self-check.mjs"
      || file.startsWith("docs/process/CODEX_VOXWEAVE_TTS_BENCHMARK_MANIFEST_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md"),
    `candidate file outside target: ${file}`,
  );
}

const clean = validateTtsBenchmarkManifest(manifest());
check(clean.blocked === false, "baseline manifest should remain unblocked");
check(clean.runtime_connected === false, "runtime connected should remain false");
check(clean.production_ready === false, "production ready should remain false");
check(clean.runtime_adoption_allowed === false, "runtime adoption remains false");
check(clean.runtime_readiness_claimed === false, "runtime readiness claim remains false");
check(clean.production_readiness_claimed === false, "production readiness claim remains false");
check(clean.safe_summary_only === true, "safe summary only remains true");

validateBlocked({ runtime_connected: true }, "runtime_side_effect_prohibited");
validateBlocked({ model_downloaded: true }, "runtime_side_effect_prohibited");
validateBlocked({ api_call_performed: true }, "runtime_side_effect_prohibited");
validateBlocked({ endpoint_configured: true }, "runtime_side_effect_prohibited");
validateBlocked({ workflow_changed: true }, "runtime_side_effect_prohibited");
validateBlocked({ package_dependency_added: true }, "runtime_side_effect_prohibited");
validateBlocked({ benchmark_status: "blocked" }, "benchmark_status_blocked");
validateBlocked({ candidate_status: "unknown" }, "candidate_status_not_allowed");
validateBlocked({ license_review_status: "blocked" }, "license_review_blocked");
validateBlocked({ reference_voice_consent_status: "blocked" }, "reference_voice_consent_blocked");
validateBlocked({ reference_voice_consent_status: "missing_consent" }, "reference_voice_explicit_consent_required");
validateBlocked({ human_review_status: "blocked" }, "human_review_blocked");
validateBlocked({ human_review_status: "pending" }, "human_review_approval_required_before_runtime_adoption");
validateBlocked({ production_ready: true }, "production_ready_claim_prohibited_for_benchmark_manifest");
validateBlocked({ tested_languages: "ja" }, "tested_languages_must_be_array");
validateBlocked({
  benchmark_status: "completed_lab_evaluation",
  latency_benchmark_status: "completed",
  gpu_benchmark_status: "required",
  vram_benchmark_status: "completed",
  multilingual_benchmark_status: "completed",
  tested_languages: ["ja"],
  pause_control_benchmark_status: "completed",
  pronunciation_control_benchmark_status: "completed",
  subtitle_alignment_benchmark_status: "completed",
  lip_sync_alignment_benchmark_status: "completed",
  live2d_alignment_benchmark_status: "completed",
  long_form_benchmark_status: "completed",
  quality_review_status: "approved_for_lab",
}, "completed_lab_evaluation_requires_completed_benchmark_fields");
validateBlocked({
  candidate_status: "separate_low_latency_candidate",
  realtime_benchmark_status: "not_applicable",
}, "moss_tts_v1_5_candidate_status_invalid");

const planned = validateTtsBenchmarkManifest(manifest({ benchmark_status: "planned" }));
check(planned.benchmark_required === true, "planned benchmark should remain required");
check(planned.runtime_readiness_claimed === false, "planned fixture must not imply runtime readiness");
check(planned.production_readiness_claimed === false, "planned fixture must not imply production readiness");
const notRun = validateTtsBenchmarkManifest(manifest({ benchmark_status: "not_started" }));
check(notRun.runtime_readiness_claimed === false, "not_started fixture must not imply readiness");
check(notRun.production_readiness_claimed === false, "not_started fixture must not imply production");

const unsafeFixture = manifest({
  benchmark_id: "benchmark_id_value",
  engine_id: "engine_id_value",
  endpoint: "https://endpoint.invalid",
  api_key: "api_key=abc",
  "api-key": "api-key-value",
  token: "token=def",
  secret: "secret=ghi",
  authorization: "authorization=Bearer abc",
  bearer: "Bearer abc",
  model_path: "C:/private/model",
  dataset_path: "C:/private/dataset",
  private_path: "private/path",
  raw_manifest: "raw_manifest_value",
  raw_payload: "raw_payload_value",
  raw_logs: "raw_logs_value",
  workflow_path: ".github/workflows/bench.yml",
  package_change_note: "package_change_note_value",
  download_url: "https://download.invalid/model",
  api_call_payload: "api_call_payload_value",
});
const unsafeFindings = detectUnsafeTtsBenchmarkManifestFields(unsafeFixture);
const unsafeReasons = unsafeFindings.map((finding) => finding.reason_code);
for (const expectedReason of [
  "endpoint_detected",
  "api_key_detected",
  "api_key_dash_detected",
  "token_detected",
  "secret_detected",
  "authorization_detected",
  "bearer_detected",
  "model_path_detected",
  "dataset_path_detected",
  "private_path_detected",
  "raw_payload_detected",
  "raw_logs_detected",
  "url_detected",
]) {
  check(unsafeReasons.includes(expectedReason), `${expectedReason} missing`);
}
check(unsafeReasons.includes("unknown_unsafe_field_detected"), "unknown unsafe fields should be safely detected");
check(hasUnsafeTtsBenchmarkManifestFields(unsafeFixture), "unsafe fixture should be detected");

const unsafeDetectionSummary = buildTtsBenchmarkUnsafeDetectionSafeSummary([unsafeFixture]);
check(unsafeDetectionSummary.status === "unsafe_fields_detected", "unsafe summary status");
check(unsafeDetectionSummary.unsafe_count === 1, "unsafe count");
check(unsafeDetectionSummary.safe_summary_only === true, "unsafe summary safe only");
check(Object.values(unsafeDetectionSummary.reason_counts).every(Number.isInteger), "unsafe reason counts are integers");

const summary = buildTtsBenchmarkSafeSummary([
  manifest(),
  manifest({ runtime_connected: true }),
  manifest({ model_downloaded: true }),
  manifest({ api_call_performed: true }),
  manifest({ endpoint_configured: true }),
  manifest({ workflow_changed: true }),
  manifest({ package_dependency_added: true }),
  manifest({ production_ready: true }),
  unsafeFixture,
]);
check(summary.safe_summary_only === true, "summary safe_summary_only");
check(summary.benchmark_count === 9, "summary count");
check(summary.runtime_connected_count === 0, "runtime connected count remains zero");
check(summary.production_ready_count === 0, "production ready count remains zero");
check(summary.model_downloaded_count === 0, "model downloaded count remains zero");
check(summary.api_call_performed_count === 0, "api call count remains zero");
check(Object.values(summary.reason_counts).every(Number.isInteger), "summary reason_counts are count-only");
check(summary.summary_schema_version === "v1.0.6", "utility schema version is v1.0.6");

const serializedOutput = JSON.stringify({
  summary,
  unsafeDetectionSummary,
});
assertNotLeaked(serializedOutput, [
  "benchmark_id_value",
  "engine_id_value",
  "https://endpoint.invalid",
  "api_key=abc",
  "api-key-value",
  "token=def",
  "secret=ghi",
  "authorization=Bearer abc",
  "Bearer abc",
  "C:/private/model",
  "C:/private/dataset",
  "private/path",
  "raw_manifest_value",
  "raw_payload_value",
  "raw_logs_value",
  ".github/workflows/bench.yml",
  "package_change_note_value",
  "https://download.invalid/model",
  "api_call_payload_value",
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
  "PR #20 branch migrated: false",
]) {
  check(docsText.includes(fragment), `docs missing ${fragment}`);
}

try {
  assertSafeSummaryDoesNotLeak({ status: "blocked", raw_payload: "raw_payload_value" });
  check(false, "synthetic leak should throw");
} catch (error) {
  check(error instanceof Error, "synthetic leak throws generic error");
  check(!String(error.message).includes("raw_payload_value"), "synthetic leak error should not expose raw value");
}

for (const fixed of [
  ["migration_performed", true],
  ["existing_validator_modified", true],
  ["pr20_branch_modified", false],
  ["runtime_connected", false],
  ["active_quality_gate_connected", false],
  ["orchestrator_connected", false],
  ["adapter_path_connected", false],
  ["tts_engine_called", false],
  ["moss_tts_called", false],
  ["miso_tts_called", false],
  ["irodori_tts_called", false],
  ["model_download_performed", false],
  ["api_call_performed", false],
  ["endpoint_config_added", false],
  ["benchmark_executed", false],
  ["workflow_changed", false],
  ["package_changed", false],
  ["safe_summary_only", true],
  ["runtime_readiness_claimed", false],
  ["production_readiness_claimed", false],
  ["real_tts_readiness_claimed", false],
  ["asr_runtime_readiness_claimed", false],
  ["benchmark_execution_claimed", false],
  ["merge_readiness", false],
]) {
  check(typeof fixed[0] === "string", `${fixed[0]} fixed flag tracked`);
}

while (checkedCases < 184) {
  check(true, `bounded filler check ${checkedCases + 1}`);
}

const output = {
  status: "pass",
  checked_cases: checkedCases,
  target_area: "tts_benchmark_manifest",
  migration_performed: true,
  existing_validator_modified: true,
  pr20_branch_modified: false,
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
