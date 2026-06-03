#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildLive2dCueSafeSummary,
  validateLive2dCue,
} from "../src/live2dCue/live2dCueValidator.js";

function cue(overrides = {}) {
  return {
    live2d_policy_id: "live2d-policy-1",
    cue_id: "cue-1",
    segment_ref: "segment-ref-1",
    subtitle_ref: "subtitle-ref-1",
    pause_cue_ref: "pause-ref-1",
    lip_sync_ref: "lip-sync-ref-1",
    language: "ja",
    locale: "ja-JP",
    cue_type: "expression",
    expression: "soft_smile",
    motion: "none",
    parameter_target: "none",
    start_ms: 0,
    end_ms: 500,
    duration_ms: 500,
    intensity: 0.5,
    transition_ms: 120,
    recovery_ms: 200,
    source_type: "subtitle_timing",
    sync_mode: "placeholder",
    subtitle_alignment_status: "placeholder",
    pause_alignment_status: "placeholder",
    lip_sync_alignment_status: "placeholder",
    requires_human_review: false,
    approved_for_runtime: false,
    safety_status: "candidate",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

function assertValid(overrides = {}) {
  const result = validateLive2dCue(cue(overrides));
  assert.equal(result.blocked, false);
  assert.equal(result.runtime_ready, false);
  return result;
}

function assertBlocked(overrides, reasonCode) {
  const result = validateLive2dCue(cue(overrides));
  assert.equal(result.blocked, true, `${reasonCode} should block`);
  assert.equal(result.reason_codes.includes(reasonCode), true, `${reasonCode} missing`);
  return result;
}

assertValid();
assertValid({ cue_type: "blink", expression: "none", start_ms: 0, end_ms: 0, duration_ms: 0 });
assertBlocked({ cue_type: "expression", start_ms: 0, end_ms: 0, duration_ms: 0 }, "zero_duration_live2d_requires_instant_or_idle_cue_type");
assertBlocked({ start_ms: 500, end_ms: 300, duration_ms: 0 }, "live2d_end_before_start");
assertBlocked({ start_ms: 0, end_ms: 500, duration_ms: 400 }, "live2d_duration_mismatch");
assertBlocked({ end_ms: 5001, duration_ms: 5001, requires_human_review: false }, "long_live2d_cue_requires_human_review");
assertValid({
  end_ms: 5001,
  duration_ms: 5001,
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ end_ms: 16000, duration_ms: 16000, requires_human_review: true }, "live2d_duration_too_long");
assertBlocked({ intensity: -0.1 }, "live2d_intensity_invalid");
assertBlocked({ intensity: 1.1 }, "live2d_intensity_invalid");
assertBlocked({ intensity: 0, cue_type: "expression", expression: "smile" }, "zero_intensity_live2d_requires_idle_none_or_recovery");
assertValid({ intensity: 0, cue_type: "idle", expression: "none", motion: "none" });
assertBlocked({ intensity: 0.9, requires_human_review: false }, "high_intensity_live2d_requires_human_review");
assertBlocked({ transition_ms: 1001, requires_human_review: false }, "live2d_transition_requires_human_review");
assertBlocked({ transition_ms: 3500, requires_human_review: true }, "live2d_transition_too_long");
assertBlocked({ intensity: 0.9, recovery_ms: 0, requires_human_review: true }, "live2d_high_intensity_requires_recovery");
assertBlocked({ recovery_ms: 6000, requires_human_review: false }, "live2d_recovery_requires_human_review");
assertBlocked({ recovery_ms: 11000, requires_human_review: true }, "live2d_recovery_too_long");
assertBlocked({ cue_type: "blocked" }, "live2d_cue_type_blocked");
assertBlocked({ cue_type: "expression", expression: "none" }, "live2d_expression_cue_requires_expression");
assertBlocked({ cue_type: "motion", expression: "none", motion: "none" }, "live2d_motion_cue_requires_motion");
assertBlocked({
  cue_type: "parameter",
  expression: "none",
  parameter_target: "none",
}, "live2d_parameter_cue_requires_parameter_target");
assertBlocked({
  cue_type: "blink",
  expression: "smile",
  requires_human_review: false,
}, "live2d_non_expression_cue_expression_requires_review");
assertValid({
  cue_type: "blink",
  expression: "smile",
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({
  cue_type: "expression",
  motion: "small_nod",
  requires_human_review: false,
}, "live2d_non_motion_cue_motion_requires_review");
assertBlocked({
  cue_type: "expression",
  parameter_target: "ParamAngleX",
  requires_human_review: false,
}, "live2d_non_parameter_cue_parameter_requires_review");
assertBlocked({ expression: "blocked" }, "live2d_expression_blocked");
assertBlocked({ motion: "blocked" }, "live2d_motion_blocked");
assertBlocked({ parameter_target: "blocked" }, "live2d_parameter_target_blocked");
assertBlocked({
  cue_type: "expression",
  parameter_target: "ParamMouthOpenY",
  requires_human_review: true,
}, "live2d_parameter_target_cue_type_mismatch");
assertValid({
  cue_type: "breath",
  expression: "none",
  parameter_target: "ParamBreath",
});
assertBlocked({ source_type: "blocked" }, "live2d_source_type_blocked");
assertBlocked({ source_type: "voice_lab_candidate", requires_human_review: false }, "live2d_voice_lab_candidate_source_requires_human_review");
assertBlocked({ source_type: "benchmark_result", requires_human_review: false }, "live2d_benchmark_result_source_requires_human_review");
assertBlocked({ source_type: "manual_review", requires_human_review: false }, "live2d_manual_review_source_requires_human_review");
assertValid({
  source_type: "manual_review",
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ sync_mode: "blocked" }, "live2d_sync_mode_blocked");
assertBlocked({ sync_mode: "review_required", requires_human_review: false }, "live2d_review_required_sync_mode_requires_human_review");
assertValid({
  sync_mode: "review_required",
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ subtitle_alignment_status: "blocked" }, "subtitle_alignment_status_blocked");
assertBlocked({ pause_alignment_status: "blocked" }, "pause_alignment_status_blocked");
assertBlocked({ lip_sync_alignment_status: "blocked" }, "lip_sync_alignment_status_blocked");
assertBlocked({ subtitle_alignment_status: "review_required", requires_human_review: false }, "live2d_subtitle_alignment_review_requires_human_review");
assertBlocked({ pause_alignment_status: "review_required", requires_human_review: false }, "live2d_pause_alignment_review_requires_human_review");
assertBlocked({ lip_sync_alignment_status: "review_required", requires_human_review: false }, "live2d_lip_sync_alignment_review_requires_human_review");
assertBlocked({
  approved_for_runtime: true,
  safety_status: "candidate",
}, "live2d_runtime_approval_requires_approved_safety_status");
assertValid({
  approved_for_runtime: true,
  safety_status: "approved",
});
assertBlocked({
  language: "unknown",
  locale: "unknown",
  requires_human_review: false,
}, "live2d_unknown_locale_requires_human_review");
assertValid({
  language: "unknown",
  locale: "unknown",
  requires_human_review: true,
  safety_status: "review_required",
});
assertBlocked({ segment_ref: "raw text or https://bad.invalid" }, "live2d_reference_invalid");
assertBlocked({ segment_ref: "これはセグメントです" }, "live2d_reference_invalid");
assertBlocked({ subtitle_ref: "endpoint=https://bad.invalid" }, "live2d_reference_invalid");
assertBlocked({ subtitle_ref: "https://bad.invalid" }, "live2d_reference_invalid");
assertBlocked({ pause_cue_ref: '<break time="1s"/>' }, "live2d_reference_invalid");
assertBlocked({ lip_sync_ref: "C:\\private\\lip-sync" }, "live2d_reference_invalid");
assertBlocked({ raw_live2d_payload: "raw Live2D payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_live2d_motion_file: "motion file" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_live2d_expression_file: "expression file" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_live2d_parameter_map: "parameter map" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_expression_payload: "raw expression payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_motion_payload: "raw motion payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_parameter_payload: "raw parameter payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ renderer_endpoint: "https://renderer.invalid" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ renderer_payload: "renderer payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ renderer_target: "renderer target" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ motion_file_path: "motion/path" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ expression_file_path: "expression/path" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ model3_json_path: "model3/path" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ physics_json_path: "physics/path" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ vendor_live2d_payload: "vendor payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ engine_live2d_payload: "engine payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_subtitle_payload: "raw subtitle payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_pause_payload: "raw pause payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_lip_sync_payload: "raw lip sync payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ raw_tts_payload: "raw TTS payload" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ endpoint: "https://live2d.invalid" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ api_key: "api-key" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ token: "token" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ secret: "secret" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ model_path: "model/path" }, "unsafe_live2d_cue_fields_present");
assertBlocked({ dataset_path: "dataset/path" }, "unsafe_live2d_cue_fields_present");

const summary = buildLive2dCueSafeSummary([
  cue(),
  cue({
    end_ms: 5001,
    duration_ms: 5001,
    requires_human_review: true,
    safety_status: "review_required",
  }),
  cue({
    intensity: 0.9,
    requires_human_review: true,
    recovery_ms: 200,
    safety_status: "review_required",
  }),
  cue({ approved_for_runtime: true, safety_status: "approved" }),
  cue({ cue_type: "blocked" }),
  cue({ raw_live2d_payload: "raw Live2D payload" }),
]);

assert.equal(summary.live2d_cue_count, 6);
assert.equal(summary.candidate_count, 1);
assert.equal(summary.review_required_count, 2);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 2);
assert.equal(summary.long_cue_review_required_count, 1);
assert.equal(summary.high_intensity_review_required_count, 1);
assert.equal(summary.recovery_required_count, 1);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "live2d-policy-1",
  "cue-1",
  "live2d_policy_id",
  "cue_id",
  "segment_ref",
  "subtitle_ref",
  "pause_cue_ref",
  "lip_sync_ref",
  "segment-ref-1",
  "subtitle-ref-1",
  "pause-ref-1",
  "lip-sync-ref-1",
  "segment-ref-001",
  "subtitle-ref-001",
  "pause-cue-ref-001",
  "lip-sync-ref-001",
  "language",
  "locale",
  "\"ja\"",
  "\"en\"",
  "\"zh\"",
  "\"ko\"",
  "\"ar\"",
  "ja-JP",
  "en-US",
  "ar-MSA",
  "cue_type",
  "expression",
  "motion",
  "parameter_target",
  "soft_smile",
  "small_nod",
  "ParamMouthOpenY",
  "ParamBreath",
  "ParamAngleX",
  "subtitle_alignment_status",
  "pause_alignment_status",
  "lip_sync_alignment_status",
  "placeholder",
  "not_aligned",
  "raw Live2D payload",
  "renderer_endpoint",
  "renderer_payload",
  "raw expression payload",
  "raw motion payload",
  "raw parameter payload",
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
  checked: 142,
  safe_summary_only: true,
}, null, 2));
