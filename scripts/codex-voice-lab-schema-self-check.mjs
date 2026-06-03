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
    prohibited_use_cases: ["public_figure_imitation"],
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
  dataset_path: "dataset/path",
  model_path: "model/path",
  endpoint: "https://voice-lab.invalid",
  api_key: "key",
  token: "token",
  secret: "secret",
}));
assert.equal(unsafe.runtime_eligible, false);
assert.equal(unsafe.unsafe_fields_present.length >= 7, true);

const approved = validateVoiceLabCandidate(candidate());
assert.equal(approved.runtime_eligible, true);
assert.equal(approved.runtime_connected, false);

const summary = buildVoiceLabSafeSummary([
  candidate(),
  candidate({ review_status: "pending", candidate_id: "candidate-2" }),
  candidate({ reference_voice_consent_status: "missing_consent", candidate_id: "candidate-3" }),
  candidate({ raw_reference_voice: "raw", candidate_id: "candidate-4" }),
]);

assert.equal(summary.candidate_count, 4);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 3);
assert.equal(summary.review_required_count, 3);
assert.equal(summary.runtime_connected, false);
assert.equal(summary.production_readiness_claimed, false);
assert.equal(summary.runtime_readiness_claimed, false);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "raw-audio-body",
  "raw_reference_voice",
  "dataset/path",
  "model/path",
  "voice-lab.invalid",
  "api_key",
  "token",
  "secret",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 7,
  safe_summary_only: true,
}, null, 2));
