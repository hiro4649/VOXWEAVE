#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildTtsEngineCapabilitySafeSummary,
  validateTtsEngineCapabilityProfile,
} from "../src/ttsEngineCapability/ttsEngineCapabilityValidator.js";

function mossTtsProfile(overrides = {}) {
  return {
    engine_id: "moss-tts-v1.5",
    engine_family: "moss-tts",
    candidate_status: "benchmark_required",
    runtime_connected: false,
    production_ready: false,
    license_review_status: "required",
    supports_multilingual: true,
    supported_languages: ["ja", "en", "zh", "ko", "ar"],
    supports_voice_cloning: true,
    supports_long_form: true,
    supports_pause_control: true,
    supports_pronunciation_control: true,
    supports_code_switching: true,
    supports_streaming: false,
    supports_realtime: false,
    requires_reference_voice_consent: true,
    requires_human_review: true,
    benchmark_required: true,
    latency_benchmark_status: "required",
    gpu_benchmark_status: "required",
    vram_benchmark_status: "required",
    pause_control_benchmark_status: "required",
    pronunciation_benchmark_status: "required",
    subtitle_alignment_benchmark_status: "required",
    lip_sync_alignment_benchmark_status: "required",
    live2d_alignment_benchmark_status: "required",
    notes_redacted: "MOSS-TTS-Realtime is separate_low_latency_candidate; vLLM-Omni and SGLang-Omni require verification.",
    ...overrides,
  };
}

function mockTtsProfile(overrides = {}) {
  return {
    engine_id: "mock-tts",
    engine_family: "mock",
    candidate_status: "lab_only",
    runtime_connected: false,
    production_ready: false,
    license_review_status: "not_required_for_mock",
    supports_multilingual: false,
    supported_languages: ["ja"],
    supports_voice_cloning: false,
    supports_long_form: false,
    supports_pause_control: false,
    supports_pronunciation_control: false,
    supports_code_switching: false,
    supports_streaming: false,
    supports_realtime: false,
    requires_reference_voice_consent: false,
    requires_human_review: false,
    benchmark_required: false,
    latency_benchmark_status: "not_started",
    gpu_benchmark_status: "not_required_for_mock",
    vram_benchmark_status: "not_required_for_mock",
    pause_control_benchmark_status: "not_started",
    pronunciation_benchmark_status: "not_started",
    subtitle_alignment_benchmark_status: "not_started",
    lip_sync_alignment_benchmark_status: "not_started",
    live2d_alignment_benchmark_status: "not_started",
    notes_redacted: "mock TTS only; no production readiness claim.",
    ...overrides,
  };
}

const moss = validateTtsEngineCapabilityProfile(mossTtsProfile());
assert.equal(moss.runtime_connected, false);
assert.equal(moss.production_ready, false);
assert.equal(moss.blocked, false);
assert.equal(moss.runtime_adoption_allowed, false);

const cloningWithoutConsent = validateTtsEngineCapabilityProfile(mossTtsProfile({
  requires_reference_voice_consent: false,
}));
assert.equal(cloningWithoutConsent.blocked, true);
assert.equal(
  cloningWithoutConsent.reason_codes.includes("voice_cloning_reference_consent_required"),
  true,
);

const cloningWithoutHumanReview = validateTtsEngineCapabilityProfile(mossTtsProfile({
  requires_human_review: false,
}));
assert.equal(cloningWithoutHumanReview.blocked, true);
assert.equal(
  cloningWithoutHumanReview.reason_codes.includes("voice_cloning_human_review_required"),
  true,
);

const productionReady = validateTtsEngineCapabilityProfile(mockTtsProfile({
  production_ready: true,
}));
assert.equal(productionReady.blocked, true);
assert.equal(
  productionReady.reason_codes.includes("production_ready_claim_prohibited_for_candidate_slice"),
  true,
);

const runtimeConnected = validateTtsEngineCapabilityProfile(mockTtsProfile({
  runtime_connected: true,
}));
assert.equal(runtimeConnected.blocked, true);
assert.equal(
  runtimeConnected.reason_codes.includes("runtime_connection_prohibited_for_candidate_slice"),
  true,
);

const unsafe = validateTtsEngineCapabilityProfile(mossTtsProfile({
  endpoint: "https://tts-engine.invalid",
  api_key: "api-key",
  token: "token",
  secret: "secret",
  authorization: "Bearer secret",
  raw_audio: "raw audio",
  dataset_path: "dataset/path",
  model_path: "model/path",
}));
assert.equal(unsafe.blocked, true);
assert.equal(unsafe.unsafe_fields_present.length >= 8, true);

const summary = buildTtsEngineCapabilitySafeSummary([
  mossTtsProfile(),
  mockTtsProfile(),
  mockTtsProfile({ production_ready: true }),
  mockTtsProfile({ runtime_connected: true }),
  mossTtsProfile({
    endpoint: "https://tts-engine.invalid",
    api_key: "api-key",
    token: "token",
    secret: "secret",
    authorization: "Bearer secret",
    raw_audio: "raw audio",
    dataset_path: "dataset/path",
    model_path: "model/path",
  }),
]);

assert.equal(summary.engine_count, 5);
assert.equal(summary.benchmark_required_count, 2);
assert.equal(summary.runtime_connected_count, 0);
assert.equal(summary.production_ready_count, 0);
assert.equal(summary.blocked_count, 3);
assert.equal(summary.voice_consent_required_count, 2);
assert.equal(summary.human_review_required_count, 2);
assert.equal(summary.runtime_connected, false);
assert.equal(summary.production_readiness_claimed, false);
assert.equal(summary.runtime_readiness_claimed, false);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "https://tts-engine.invalid",
  "endpoint",
  "api_key",
  "api-key",
  "token",
  "secret",
  "authorization",
  "Bearer",
  "raw audio",
  "raw_audio",
  "dataset/path",
  "dataset_path",
  "model/path",
  "model_path",
  "model_download_url",
  "private_path",
  "raw_benchmark_logs",
  "raw_reference_voice",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 10,
  safe_summary_only: true,
}, null, 2));
