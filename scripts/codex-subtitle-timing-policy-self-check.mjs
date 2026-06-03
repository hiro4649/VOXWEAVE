#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildSubtitleTimingSafeSummary,
  validateSubtitleTimingSegment,
} from "../src/subtitleTiming/subtitleTimingValidator.js";

function segment(overrides = {}) {
  return {
    subtitle_policy_id: "subtitle-policy-1",
    segment_id: "segment-1",
    text_ref: "subtitle-text-ref-001",
    language: "ja",
    locale: "ja-JP",
    script: "kana",
    direction: "ltr",
    start_ms: 0,
    end_ms: 1200,
    duration_ms: 1200,
    pause_before_ms: 0,
    pause_after_ms: 100,
    reading_speed_label: "normal",
    max_chars_per_segment: 32,
    subtitle_behavior: "show",
    pause_alignment_status: "placeholder",
    lip_sync_alignment_status: "placeholder",
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
  const result = validateSubtitleTimingSegment(segment(overrides));
  assert.equal(result.blocked, false);
  assert.equal(result.runtime_ready, false);
  return result;
}

function assertBlocked(overrides, reasonCode) {
  const result = validateSubtitleTimingSegment(segment(overrides));
  assert.equal(result.blocked, true, `${reasonCode} should block`);
  assert.equal(result.reason_codes.includes(reasonCode), true, `${reasonCode} missing`);
  return result;
}

assertValid();
assertValid({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "rtl" });
assertBlocked({
  language: "en",
  locale: "en-US",
  script: "latin",
  direction: "rtl",
  requires_human_review: false,
}, "non_arabic_rtl_requires_human_review");
assertValid({
  language: "en",
  locale: "en-US",
  script: "latin",
  direction: "rtl",
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "ltr" }, "arabic_subtitle_requires_rtl_or_unknown_direction");
assertBlocked({ start_ms: 1200, end_ms: 900, duration_ms: 0 }, "subtitle_end_before_start");
assertBlocked({ start_ms: 0, end_ms: 1200, duration_ms: 1000 }, "subtitle_duration_mismatch");
assertBlocked({ start_ms: 0, end_ms: 0, duration_ms: 0, subtitle_behavior: "show" }, "zero_duration_subtitle_requires_hidden_or_hold_behavior");
assertValid({ start_ms: 0, end_ms: 0, duration_ms: 0, subtitle_behavior: "hold_previous_segment" });
assertBlocked({ end_ms: 9001, duration_ms: 9001, requires_human_review: false }, "long_subtitle_segment_requires_human_review");
assertBlocked({ max_chars_per_segment: 0 }, "max_chars_per_segment_invalid");
assertBlocked({ max_chars_per_segment: 81 }, "max_chars_per_segment_invalid");
assertBlocked({ duration_ms: 400, end_ms: 400, max_chars_per_segment: 60 }, "subtitle_segment_too_dense_for_duration");
assertBlocked({ reading_speed_label: "very_fast", requires_human_review: false }, "very_fast_subtitle_requires_human_review");
assertBlocked({ reading_speed_label: "blocked" }, "reading_speed_label_blocked");

assertBlocked({ text_ref: "こんにちは、これは実字幕です" }, "subtitle_text_ref_invalid");
assertBlocked({ text_ref: "https://bad.invalid" }, "subtitle_text_ref_invalid");
assertBlocked({ text_ref: "<speak>Hello</speak>" }, "subtitle_text_ref_invalid");
assertValid({ text_ref: "subtitle-text-ref-001" });

assertBlocked({ language: "https://bad.invalid" }, "subtitle_language_invalid");
assertBlocked({ locale: "endpoint=https://bad.invalid" }, "subtitle_locale_invalid");
assertBlocked({ script: "blocked" }, "subtitle_script_invalid");
assertBlocked({ direction: "blocked" }, "subtitle_direction_invalid");
assertBlocked({ language: "ja", locale: "en-US" }, "subtitle_language_locale_mismatch");

assertBlocked({ subtitle_behavior: "blocked" }, "subtitle_behavior_blocked");
assertBlocked({ pause_alignment_status: "blocked" }, "pause_alignment_status_blocked");
assertBlocked({ lip_sync_alignment_status: "blocked" }, "lip_sync_alignment_status_blocked");
assertBlocked({ live2d_alignment_status: "blocked" }, "live2d_alignment_status_blocked");
assertBlocked({ pause_alignment_status: "unexpected" }, "pause_alignment_status_not_allowed");
assertBlocked({ lip_sync_alignment_status: "unexpected" }, "lip_sync_alignment_status_not_allowed");
assertBlocked({ live2d_alignment_status: "unexpected" }, "live2d_alignment_status_not_allowed");
assertBlocked({
  approved_for_runtime: true,
  safety_status: "candidate",
}, "runtime_approval_requires_approved_safety_status");
assertValid({
  approved_for_runtime: true,
  safety_status: "approved",
});
assertBlocked({ created_at: "not a timestamp" }, "subtitle_timestamp_invalid");
assertBlocked({ updated_at: "not a timestamp" }, "subtitle_timestamp_invalid");

for (const unsafeField of [
  "raw_subtitle_text",
  "raw_subtitle_payload",
  "raw_tts_payload",
  "raw_live2d_payload",
  "raw_lip_sync_payload",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model_path",
  "dataset_path",
]) {
  assertBlocked({ [unsafeField]: "unsafe" }, "unsafe_subtitle_timing_fields_present");
}

const summary = buildSubtitleTimingSafeSummary([
  segment(),
  segment({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "rtl" }),
  segment({ end_ms: 9001, duration_ms: 9001, requires_human_review: true, safety_status: "review_required" }),
  segment({ approved_for_runtime: true, safety_status: "approved" }),
  segment({ text_ref: "raw subtitle text should not be here" }),
  segment({ pause_alignment_status: "blocked" }),
]);

assert.equal(summary.subtitle_segment_count, 6);
assert.equal(summary.candidate_count, 2);
assert.equal(summary.review_required_count, 1);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 2);
assert.equal(summary.rtl_segment_count, 1);
assert.equal(summary.long_segment_review_required_count, 1);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "subtitle-policy-1",
  "segment-1",
  "subtitle-text-ref-001",
  "segment-ref-001",
  "raw subtitle text",
  "ja-JP",
  "en-US",
  "ar-MSA",
  "kana",
  "latin",
  "arabic",
  "ltr",
  "show_ellipsis",
  "hold_previous_segment",
  "placeholder",
  "not_aligned",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model_path",
  "dataset_path",
  "raw payload",
  "raw audio",
  "private path",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 74,
  safe_summary_only: true,
}, null, 2));
