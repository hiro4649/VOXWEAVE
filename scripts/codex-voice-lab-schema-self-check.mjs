#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildVoiceLabSafeSummary,
  validateVoiceLabCandidate,
} from "../src/voiceLab/voiceLabValidator.js";

function candidate(overrides = {}) {
  return {
    candidate_id: "candidate_id_value",
    source_voice_profile_id: "voice-profile-1",
    reference_voice_consent_status: "explicit_consent",
    voice_design_model: "voice-design-lab-model",
    caption_preset_id: "iris-calm-ja",
    generated_text: "generated_text_value",
    generated_audio_ref: "generated_audio_ref_value",
    language: "ja",
    locale: "ja-JP",
    emotion_style: "calm",
    review_status: "approved",
    reviewer_id_or_role: "voice-reviewer",
    review_notes_redacted: "approved for limited review",
    approved_for_runtime: true,
    approved_for_dataset: false,
    approved_for_training: false,
    approved_for_publication: false,
    approved_for_multilingual_use: false,
    prohibited_use_cases: [],
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

const missingConsent = validateVoiceLabCandidate(candidate({
  reference_voice_consent_status: "missing_consent",
}));
assert.equal(missingConsent.can_promote_to_approved, false);
assert.equal(missingConsent.runtime_eligible, false);

const pending = validateVoiceLabCandidate(candidate({ review_status: "pending" }));
assert.equal(pending.runtime_eligible, false);

const missingMetadata = validateVoiceLabCandidate(candidate({ locale: "" }));
assert.equal(missingMetadata.runtime_eligible, false);
assert.equal(missingMetadata.missing_metadata.includes("locale"), true);

const unsafe = validateVoiceLabCandidate(candidate({
  raw_audio: "raw_audio_value",
  prompt_audio: "prompt_audio_value",
  reference_voice: "reference_voice_value",
  raw_payload: "raw_payload_value",
  raw_logs: "raw_logs_value",
  model_path: "C:/private/model",
  dataset_path: "C:/private/dataset",
  private_path: "private/path",
  endpoint: "https://bad.invalid",
  api_key: "api_key=abc",
  "api-key": "api_key=abc",
  authorization: "authorization=Bearer abc",
  token: "token=def",
  secret: "secret=ghi",
}));
assert.equal(unsafe.runtime_eligible, false);
assert.equal(unsafe.can_promote_to_approved, false);
for (const field of [
  "raw_audio",
  "dataset_path",
  "model_path",
  "endpoint",
  "api_key",
  "authorization",
  "token",
  "secret",
]) {
  assert.equal(unsafe.unsafe_fields_present.includes(field), true, `unsafe field not detected: ${field}`);
}
for (const reason of [
  "candidate_id_detected",
  "generated_text_detected",
  "generated_audio_ref_detected",
  "raw_audio_detected",
  "prompt_audio_detected",
  "reference_voice_detected",
  "raw_payload_detected",
  "raw_logs_detected",
  "model_path_detected",
  "dataset_path_detected",
  "private_path_detected",
  "endpoint_detected",
  "api_key_detected",
  "api_key_dash_detected",
  "authorization_detected",
  "token_detected",
  "secret_detected",
]) {
  assert.equal(Number.isInteger(unsafe.unsafe_field_reason_counts[reason]), true, `unsafe reason not detected: ${reason}`);
}

const approved = validateVoiceLabCandidate(candidate());
assert.equal(approved.runtime_eligible, true);
assert.equal(approved.runtime_connected, false);
assert.equal(approved.candidate_id, "candidate_id_value");
assert.equal(approved.unsafe_fields_present.length, 0);
assert.equal(Number.isInteger(approved.unsafe_field_reason_counts.candidate_id_detected), true);
assert.equal(Number.isInteger(approved.unsafe_field_reason_counts.generated_text_detected), true);
assert.equal(Number.isInteger(approved.unsafe_field_reason_counts.generated_audio_ref_detected), true);

const restrictedApproved = validateVoiceLabCandidate(candidate({
  prohibited_use_cases: ["public_figure_imitation"],
}));
assert.equal(restrictedApproved.runtime_eligible, false);
assert.equal(restrictedApproved.can_promote_to_approved, false);
assert.equal(restrictedApproved.reason_codes.includes("prohibited_use_cases_present"), true);

for (const blocked of [
  candidate({ runtime_connected: true }),
  candidate({ production_ready: true }),
  candidate({ real_tts_ready: true }),
]) {
  const result = validateVoiceLabCandidate(blocked);
  assert.equal(result.runtime_eligible, false);
}

const summary = buildVoiceLabSafeSummary([
  candidate({ candidate_id: "candidate_id_value" }),
  candidate({ review_status: "pending", candidate_id: "candidate_id_value_2" }),
  candidate({ reference_voice_consent_status: "missing_consent", candidate_id: "candidate_id_value_3" }),
  candidate({ raw_audio: "raw_audio_value", candidate_id: "candidate_id_value_4" }),
  candidate({ prohibited_use_cases: ["public_figure_imitation"], candidate_id: "candidate_id_value_5" }),
]);

assert.equal(summary.candidate_count, 5);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 4);
assert.equal(summary.review_required_count, 4);
assert.equal(summary.runtime_connected, false);
assert.equal(summary.production_readiness_claimed, false);
assert.equal(summary.runtime_readiness_claimed, false);
assert.equal(summary.real_tts_readiness_claimed, false);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "candidate_id_value",
  "generated_text_value",
  "generated_audio_ref_value",
  "prompt_audio_value",
  "reference_voice_value",
  "raw_audio_value",
  "https://bad.invalid",
  "api_key=abc",
  "token=def",
  "secret=ghi",
  "authorization=Bearer abc",
  "C:/private/model",
  "C:/private/dataset",
  "private/path",
  "raw_payload_value",
  "raw_logs_value",
  "branch name",
  "PR body",
  "changed_files",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 47,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
}, null, 2));
