#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildTtsBenchmarkUnsafeDetectionSafeSummary,
  buildTtsBenchmarkSafeSummary,
  detectUnsafeTtsBenchmarkManifestFields,
  hasUnsafeTtsBenchmarkManifestFields,
  validateTtsBenchmarkManifest,
} from "../src/ttsBenchmark/ttsBenchmarkValidator.js";

function mossBenchmark(overrides = {}) {
  return {
    benchmark_id: "benchmark-1",
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
    notes_redacted: "candidate benchmark manifest only",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

function completedMossBenchmark(overrides = {}) {
  return mossBenchmark({
    benchmark_status: "completed_lab_evaluation",
    latency_benchmark_status: "completed",
    text_to_first_audio_latency_ms: 140,
    total_synthesis_latency_ms: 900,
    gpu_benchmark_status: "completed",
    vram_benchmark_status: "completed",
    multilingual_benchmark_status: "completed",
    tested_languages: ["ja", "en"],
    pause_control_benchmark_status: "completed",
    pronunciation_control_benchmark_status: "completed",
    subtitle_alignment_benchmark_status: "completed",
    lip_sync_alignment_benchmark_status: "completed",
    live2d_alignment_benchmark_status: "completed",
    long_form_benchmark_status: "completed",
    quality_review_status: "approved_for_lab",
    ...overrides,
  });
}

function mossRealtimeBenchmark(overrides = {}) {
  return mossBenchmark({
    benchmark_id: "benchmark-2",
    engine_id: "moss-tts-realtime",
    candidate_status: "separate_low_latency_candidate",
    benchmark_status: "planned",
    realtime_benchmark_status: "required",
    notes_redacted: "separate low-latency benchmark candidate",
    ...overrides,
  });
}

function mockBenchmark(overrides = {}) {
  return {
    benchmark_id: "benchmark-3",
    engine_id: "mock-tts",
    engine_family: "mock",
    candidate_status: "lab_only",
    benchmark_status: "lab_only",
    runtime_connected: false,
    production_ready: false,
    model_downloaded: false,
    api_call_performed: false,
    endpoint_configured: false,
    package_dependency_added: false,
    workflow_changed: false,
    license_review_status: "not_required_for_mock",
    reference_voice_consent_status: "not_required_for_mock",
    human_review_status: "not_required_for_mock",
    latency_benchmark_status: "not_required_for_mock",
    text_to_first_audio_latency_ms: 0,
    total_synthesis_latency_ms: 0,
    gpu_benchmark_status: "not_required_for_mock",
    gpu_required: false,
    vram_benchmark_status: "not_required_for_mock",
    vram_estimate_mb: 0,
    multilingual_benchmark_status: "not_required_for_mock",
    tested_languages: ["ja"],
    pause_control_benchmark_status: "not_required_for_mock",
    pronunciation_control_benchmark_status: "not_required_for_mock",
    subtitle_alignment_benchmark_status: "not_required_for_mock",
    lip_sync_alignment_benchmark_status: "not_required_for_mock",
    live2d_alignment_benchmark_status: "not_required_for_mock",
    long_form_benchmark_status: "not_required_for_mock",
    streaming_benchmark_status: "not_required_for_mock",
    realtime_benchmark_status: "not_required_for_mock",
    quality_review_status: "not_required_for_mock",
    notes_redacted: "mock benchmark manifest only",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

const moss = validateTtsBenchmarkManifest(mossBenchmark());
assert.equal(moss.runtime_connected, false);
assert.equal(moss.production_ready, false);
assert.equal(moss.model_downloaded, false);
assert.equal(moss.api_call_performed, false);
assert.equal(moss.blocked, false);

const unknownCandidateStatus = validateTtsBenchmarkManifest(mossBenchmark({
  candidate_status: "unknown",
}));
assert.equal(unknownCandidateStatus.blocked, true);
assert.equal(unknownCandidateStatus.reason_codes.includes("candidate_status_not_allowed"), true);

const blockedBenchmarkStatus = validateTtsBenchmarkManifest(mossBenchmark({
  benchmark_status: "blocked",
}));
assert.equal(blockedBenchmarkStatus.blocked, true);
assert.equal(blockedBenchmarkStatus.reason_codes.includes("benchmark_status_blocked"), true);

const blockedLicenseReview = validateTtsBenchmarkManifest(mossBenchmark({
  license_review_status: "blocked",
}));
assert.equal(blockedLicenseReview.blocked, true);
assert.equal(blockedLicenseReview.reason_codes.includes("license_review_blocked"), true);

const blockedHumanReview = validateTtsBenchmarkManifest(mossBenchmark({
  human_review_status: "blocked",
}));
assert.equal(blockedHumanReview.blocked, true);
assert.equal(blockedHumanReview.reason_codes.includes("human_review_blocked"), true);

const blockedReferenceConsent = validateTtsBenchmarkManifest(mossBenchmark({
  reference_voice_consent_status: "blocked",
}));
assert.equal(blockedReferenceConsent.blocked, true);
assert.equal(
  blockedReferenceConsent.reason_codes.includes("reference_voice_consent_blocked"),
  true,
);

const mossV15RealtimeStatus = validateTtsBenchmarkManifest(mossBenchmark({
  candidate_status: "separate_low_latency_candidate",
  realtime_benchmark_status: "required",
}));
assert.equal(mossV15RealtimeStatus.blocked, true);
assert.equal(
  mossV15RealtimeStatus.reason_codes.includes("moss_tts_v1_5_candidate_status_invalid"),
  true,
);

const mossRealtimeCandidateOnly = validateTtsBenchmarkManifest(mossRealtimeBenchmark({
  candidate_status: "candidate_only",
}));
assert.equal(mossRealtimeCandidateOnly.blocked, true);
assert.equal(
  mossRealtimeCandidateOnly.reason_codes.includes("moss_tts_realtime_candidate_status_invalid"),
  true,
);

const realtimeWithoutBenchmark = validateTtsBenchmarkManifest(mossRealtimeBenchmark({
  realtime_benchmark_status: "not_applicable",
}));
assert.equal(realtimeWithoutBenchmark.blocked, true);
assert.equal(
  realtimeWithoutBenchmark.reason_codes.includes("realtime_candidate_requires_realtime_benchmark"),
  true,
);

const endpointConfigured = validateTtsBenchmarkManifest(mossBenchmark({ endpoint_configured: true }));
assert.equal(endpointConfigured.blocked, true);
assert.equal(endpointConfigured.reason_codes.includes("runtime_side_effect_prohibited"), true);

const packageDependency = validateTtsBenchmarkManifest(mossBenchmark({ package_dependency_added: true }));
assert.equal(packageDependency.blocked, true);
assert.equal(packageDependency.reason_codes.includes("runtime_side_effect_prohibited"), true);

const workflowChanged = validateTtsBenchmarkManifest(mossBenchmark({ workflow_changed: true }));
assert.equal(workflowChanged.blocked, true);
assert.equal(workflowChanged.reason_codes.includes("runtime_side_effect_prohibited"), true);

const completedWithNoLanguages = validateTtsBenchmarkManifest(completedMossBenchmark({
  tested_languages: [],
}));
assert.equal(completedWithNoLanguages.blocked, true);
assert.equal(
  completedWithNoLanguages.reason_codes.includes(
    "tested_languages_required_for_completed_lab_evaluation",
  ),
  true,
);

const invalidLanguages = validateTtsBenchmarkManifest(mossBenchmark({
  tested_languages: "ja",
}));
assert.equal(invalidLanguages.blocked, true);
assert.equal(invalidLanguages.reason_codes.includes("tested_languages_must_be_array"), true);

const completedWithIncompleteFields = validateTtsBenchmarkManifest(completedMossBenchmark({
  gpu_benchmark_status: "required",
}));
assert.equal(completedWithIncompleteFields.blocked, true);
assert.equal(
  completedWithIncompleteFields.reason_codes.includes(
    "completed_lab_evaluation_requires_completed_benchmark_fields",
  ),
  true,
);

const completedLab = validateTtsBenchmarkManifest(completedMossBenchmark());
assert.equal(completedLab.blocked, false);
assert.equal(completedLab.production_ready, false);
assert.equal(completedLab.runtime_adoption_allowed, false);
assert.equal(completedLab.runtime_readiness_claimed, false);
assert.equal(completedLab.production_readiness_claimed, false);

const mossRealtime = validateTtsBenchmarkManifest(mossRealtimeBenchmark());
assert.equal(mossRealtime.blocked, false);
assert.equal(mossRealtime.runtime_connected, false);
assert.equal(mossRealtime.production_ready, false);

const missingConsent = validateTtsBenchmarkManifest(mossBenchmark({
  reference_voice_consent_status: "missing_consent",
}));
assert.equal(missingConsent.blocked, true);
assert.equal(missingConsent.reason_codes.includes("reference_voice_explicit_consent_required"), true);

const humanReviewPending = validateTtsBenchmarkManifest(mossBenchmark({
  human_review_status: "pending",
}));
assert.equal(humanReviewPending.blocked, true);
assert.equal(
  humanReviewPending.reason_codes.includes("human_review_approval_required_before_runtime_adoption"),
  true,
);

const latencyOnly = validateTtsBenchmarkManifest(mossBenchmark({
  text_to_first_audio_latency_ms: 90,
  total_synthesis_latency_ms: 500,
}));
assert.equal(latencyOnly.runtime_readiness_claimed, false);
assert.equal(latencyOnly.runtime_adoption_allowed, false);

const mockProduction = validateTtsBenchmarkManifest(mockBenchmark({ production_ready: true }));
assert.equal(mockProduction.blocked, true);
assert.equal(
  mockProduction.reason_codes.includes("production_ready_claim_prohibited_for_benchmark_manifest"),
  true,
);

const unsafe = validateTtsBenchmarkManifest(mossBenchmark({
  endpoint: "https://tts-benchmark.invalid",
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
}));
assert.equal(unsafe.blocked, true);
assert.equal(unsafe.reason_codes.includes("unsafe_tts_benchmark_fields_present"), true);

const summary = buildTtsBenchmarkSafeSummary([
  mossBenchmark(),
  mossRealtimeBenchmark(),
  mockBenchmark(),
  mossBenchmark({ endpoint_configured: true }),
  mossBenchmark({ package_dependency_added: true }),
  mossBenchmark({ workflow_changed: true }),
  completedMossBenchmark(),
  mossBenchmark({ reference_voice_consent_status: "missing_consent" }),
  mossBenchmark({ human_review_status: "pending" }),
  mockBenchmark({ production_ready: true }),
  mossBenchmark({
    endpoint: "https://tts-benchmark.invalid",
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
  }),
]);

assert.equal(summary.benchmark_count, 11);
assert.equal(summary.runtime_connected_count, 0);
assert.equal(summary.production_ready_count, 0);
assert.equal(summary.model_downloaded_count, 0);
assert.equal(summary.api_call_performed_count, 0);
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
  "https://tts-benchmark.invalid",
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
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

assert.equal(Object.values(summary.reason_counts).every((value) => Number.isInteger(value)), true);
assert.equal(summary.summary_schema_version, "v1.0.6");

const benchmarkExecution = validateTtsBenchmarkManifest(mossBenchmark({
  benchmark_executed: true,
  benchmark_status: "planned",
}));
assert.equal(benchmarkExecution.runtime_readiness_claimed, false);
assert.equal(benchmarkExecution.production_readiness_claimed, false);
assert.equal(benchmarkExecution.runtime_adoption_allowed, false);

const modelDownloaded = validateTtsBenchmarkManifest(mossBenchmark({ model_downloaded: true }));
assert.equal(modelDownloaded.blocked, true);
assert.equal(modelDownloaded.reason_codes.includes("runtime_side_effect_prohibited"), true);

const apiCalled = validateTtsBenchmarkManifest(mossBenchmark({ api_call_performed: true }));
assert.equal(apiCalled.blocked, true);
assert.equal(apiCalled.reason_codes.includes("runtime_side_effect_prohibited"), true);

const runtimeConnected = validateTtsBenchmarkManifest(mossBenchmark({ runtime_connected: true }));
assert.equal(runtimeConnected.blocked, true);
assert.equal(runtimeConnected.reason_codes.includes("runtime_side_effect_prohibited"), true);

const unsafeDetection = detectUnsafeTtsBenchmarkManifestFields(mossBenchmark({
  raw_manifest: "raw_manifest_value",
  raw_payload: "raw_payload_value",
  raw_logs: "raw_logs_value",
  workflow_path: ".github/workflows/bench.yml",
  package_change_note: "package_change_note_value",
  download_url: "https://download.invalid/model",
  api_call_payload: "api_call_payload_value",
  private_path: "private/path",
  "api-key": "api-key-value",
  bearer: "Bearer abc",
}));
assert.equal(unsafeDetection.length > 0, true);
assert.equal(hasUnsafeTtsBenchmarkManifestFields({ raw_manifest: "raw_manifest_value" }), true);
const unsafeSummary = buildTtsBenchmarkUnsafeDetectionSafeSummary([
  mossBenchmark({ raw_manifest: "raw_manifest_value" }),
  mossBenchmark({ download_url: "https://download.invalid/model" }),
]);
assert.equal(unsafeSummary.safe_summary_only, true);
assert.equal(unsafeSummary.unsafe_count, 2);
const unsafeSerialized = JSON.stringify(unsafeSummary);
for (const forbidden of [
  "raw_manifest_value",
  "https://download.invalid/model",
  ".github/workflows/bench.yml",
  "package_change_note_value",
  "api_call_payload_value",
]) {
  assert.equal(unsafeSerialized.includes(forbidden), false, `unsafe detector leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 31,
  safe_summary_only: true,
}, null, 2));
