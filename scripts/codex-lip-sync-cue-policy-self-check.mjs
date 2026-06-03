#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildLipSyncCueSafeSummary,
  validateLipSyncCue,
} from "../src/lipSyncCue/lipSyncCueValidator.js";

function cue(overrides = {}) {
  return {
    lip_sync_policy_id: "lip-policy-1",
    cue_id: "cue-1",
    segment_ref: "segment-ref-1",
    subtitle_ref: "subtitle-ref-1",
    pause_cue_ref: "pause-ref-1",
    language: "ja",
    locale: "ja-JP",
    mouth_shape: "aa",
    start_ms: 0,
    end_ms: 300,
    duration_ms: 300,
    intensity: 0.7,
    smoothing_ms: 80,
    source_type: "subtitle_timing",
    sync_mode: "placeholder",
    subtitle_alignment_status: "placeholder",
    pause_alignment_status: "placeholder",
    live2d_alignment_status: "placeholder",
    requires_human_review: false,
    approved_for_runtime: false,
    safety_status: "candidate",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

function assertValid(overrides = {}) {
  const result = validateLipSyncCue(cue(overrides));
  assert.equal(result.blocked, false);
  assert.equal(result.runtime_ready, false);
  return result;
}

function assertBlocked(overrides, reasonCode) {
  const result = validateLipSyncCue(cue(overrides));
  assert.equal(result.blocked, true, `${reasonCode} should block`);
  assert.equal(result.reason_codes.includes(reasonCode), true, `${reasonCode} missing`);
  return result;
}

assertValid();
assertValid({ mouth_shape: "closed", start_ms: 0, end_ms: 0, duration_ms: 0, intensity: 0 });
assertBlocked({ mouth_shape: "aa", start_ms: 0, end_ms: 0, duration_ms: 0 }, "zero_duration_lip_sync_requires_passive_mouth_shape");
assertBlocked({ start_ms: 500, end_ms: 300, duration_ms: 0 }, "lip_sync_end_before_start");
assertBlocked({ start_ms: 0, end_ms: 300, duration_ms: 200 }, "lip_sync_duration_mismatch");
assertBlocked({ end_ms: 3001, duration_ms: 3001, requires_human_review: false }, "long_lip_sync_cue_requires_human_review");
assertValid({
  end_ms: 3001,
  duration_ms: 3001,
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ intensity: -0.1 }, "lip_sync_intensity_invalid");
assertBlocked({ intensity: 1.1 }, "lip_sync_intensity_invalid");
assertBlocked({ intensity: 0, mouth_shape: "aa" }, "zero_intensity_lip_sync_requires_passive_mouth_shape");
assertValid({ intensity: 0, mouth_shape: "closed" });
assertBlocked({ intensity: 0.9, requires_human_review: false }, "high_intensity_lip_sync_requires_human_review");
assertBlocked({ smoothing_ms: 501, requires_human_review: false }, "lip_sync_smoothing_requires_human_review");
assertBlocked({ mouth_shape: "blocked" }, "lip_sync_mouth_shape_blocked");
assertBlocked({ source_type: "blocked" }, "lip_sync_source_type_blocked");
assertBlocked({ sync_mode: "blocked" }, "lip_sync_mode_blocked");
assertBlocked({ subtitle_alignment_status: "blocked" }, "subtitle_alignment_status_blocked");
assertBlocked({ pause_alignment_status: "blocked" }, "pause_alignment_status_blocked");
assertBlocked({ live2d_alignment_status: "blocked" }, "live2d_alignment_status_blocked");
assertBlocked({
  approved_for_runtime: true,
  safety_status: "candidate",
}, "lip_sync_runtime_approval_requires_approved_safety_status");
assertValid({
  approved_for_runtime: true,
  safety_status: "approved",
});
assertBlocked({ segment_ref: "raw text or https://bad.invalid" }, "lip_sync_reference_invalid");
assertBlocked({ subtitle_ref: "https://bad.invalid" }, "lip_sync_reference_invalid");
assertBlocked({ pause_cue_ref: "口パク" }, "lip_sync_reference_invalid");
assertBlocked({ language: "https://bad.invalid" }, "lip_sync_language_invalid");
assertBlocked({ locale: "endpoint=https://bad.invalid" }, "lip_sync_locale_invalid");
assertBlocked({ locale: "en-US" }, "lip_sync_language_locale_mismatch");
assertBlocked({ raw_mouth_payload: "raw mouth payload" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ raw_phoneme_payload: "raw phoneme payload" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ raw_viseme_payload: "raw viseme payload" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ raw_live2d_payload: "raw Live2D payload" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ raw_tts_payload: "raw TTS payload" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ endpoint: "https://lip.invalid" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ api_key: "api-key" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ token: "token" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ secret: "secret" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ model_path: "model/path" }, "unsafe_lip_sync_cue_fields_present");
assertBlocked({ dataset_path: "dataset/path" }, "unsafe_lip_sync_cue_fields_present");

const summary = buildLipSyncCueSafeSummary([
  cue(),
  cue({
    end_ms: 3001,
    duration_ms: 3001,
    requires_human_review: true,
    safety_status: "review_required",
  }),
  cue({
    intensity: 0.9,
    requires_human_review: true,
    safety_status: "review_required",
  }),
  cue({ approved_for_runtime: true, safety_status: "approved" }),
  cue({ mouth_shape: "blocked" }),
  cue({ raw_mouth_payload: "raw mouth payload" }),
]);

assert.equal(summary.lip_sync_cue_count, 6);
assert.equal(summary.candidate_count, 1);
assert.equal(summary.review_required_count, 2);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 2);
assert.equal(summary.long_cue_review_required_count, 1);
assert.equal(summary.high_intensity_review_required_count, 1);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "lip-policy-1",
  "cue-1",
  "segment-ref-1",
  "subtitle-ref-1",
  "pause-ref-1",
  "ja-JP",
  "mouth_shape",
  "aa",
  "closed",
  "raw mouth payload",
  "raw phoneme payload",
  "raw viseme payload",
  "raw Live2D payload",
  "raw TTS payload",
  "raw audio",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model path",
  "dataset path",
  "private path",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 72,
  safe_summary_only: true,
}, null, 2));
