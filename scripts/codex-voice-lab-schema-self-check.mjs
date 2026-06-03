#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildVoiceLabSafeSummary,
  validateVoiceLabCandidate,
} from "../src/voiceLab/voiceLabValidator.js";

function candidate(overrides = {}) {
  return {
    candidate_id: "candidate-1",
    source_voice_profile_id: "voice-profile-1",
    reference_voice_consent_status: "explicit_consent",
    voice_design_model: "voice-design-lab-model",
    caption_preset_id: "iris-calm-ja",
    generated_text: "review text",
    generated_audio_ref: "voice-lab-artifact-ref",
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
  raw_audio: "raw-audio-body",
  raw_prompt: "raw prompt",
  raw_caption_debug: "raw caption debug",
  colab_path: "colab/path",
  dataset_path: "dataset/path",
  model_path: "model/path",
  endpoint: "https://voice-lab.invalid",
  api_endpoint: "https://voice-lab.invalid/api",
  api_key: "key",
  authorization: "Bearer key",
  access_token: "access-token",
  private_key: "private-key",
  token: "token",
  secret: "secret",
  voice_sample: "voice sample",
  reference_audio_path: "reference/audio/path",
  training_dataset: "training dataset",
  training_dataset_path: "training/dataset/path",
  speaker_embedding: "speaker embedding",
  speaker_embedding_path: "speaker/embedding/path",
}));
assert.equal(unsafe.runtime_eligible, false);
assert.equal(unsafe.can_promote_to_approved, false);
for (const field of [
  "raw_prompt",
  "raw_caption_debug",
  "colab_path",
  "api_endpoint",
  "authorization",
  "access_token",
  "private_key",
  "voice_sample",
  "reference_audio_path",
  "training_dataset",
  "training_dataset_path",
  "speaker_embedding",
  "speaker_embedding_path",
]) {
  assert.equal(unsafe.unsafe_fields_present.includes(field), true, `unsafe field not detected: ${field}`);
}

const approved = validateVoiceLabCandidate(candidate());
assert.equal(approved.runtime_eligible, true);
assert.equal(approved.runtime_connected, false);

const restrictedApproved = validateVoiceLabCandidate(candidate({
  prohibited_use_cases: ["public_figure_imitation"],
}));
assert.equal(restrictedApproved.runtime_eligible, false);
assert.equal(restrictedApproved.can_promote_to_approved, false);
assert.equal(restrictedApproved.reason_codes.includes("prohibited_use_cases_present"), true);

const summary = buildVoiceLabSafeSummary([
  candidate({ candidate_id: "candidate-1" }),
  candidate({ review_status: "pending", candidate_id: "candidate-2" }),
  candidate({ reference_voice_consent_status: "missing_consent", candidate_id: "candidate-3" }),
  candidate({ raw_reference_voice: "raw", candidate_id: "candidate-4" }),
  candidate({ prohibited_use_cases: ["public_figure_imitation"], candidate_id: "candidate-5" }),
]);

assert.equal(summary.candidate_count, 5);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 4);
assert.equal(summary.review_required_count, 4);
assert.equal(summary.runtime_connected, false);
assert.equal(summary.production_readiness_claimed, false);
assert.equal(summary.runtime_readiness_claimed, false);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "candidate-1",
  "candidate-2",
  "candidate-3",
  "candidate-4",
  "generated_text",
  "generated_audio_ref",
  "raw-audio-body",
  "raw_audio",
  "raw_reference_voice",
  "raw_prompt",
  "raw_caption_debug",
  "colab_path",
  "dataset/path",
  "model/path",
  "voice-lab.invalid",
  "api_key",
  "api_endpoint",
  "authorization",
  "access_token",
  "private_key",
  "token",
  "secret",
  "voice_sample",
  "reference_audio_path",
  "training_dataset",
  "speaker_embedding",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 14,
  safe_summary_only: true,
}, null, 2));
