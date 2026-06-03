#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildPauseControlSafeSummary,
  validatePauseCue,
} from "../src/pauseControl/pauseControlValidator.js";

function pauseCue(overrides = {}) {
  return {
    pause_cue_id: "pause-cue-1",
    duration_ms: 700,
    reason: "thinking",
    position: "inside_utterance",
    language: "ja",
    locale: "ja-JP",
    allowed_for_runtime: false,
    requires_human_review: false,
    tts_engine_mapping_status: "placeholder",
    tts_engine_mapping: "placeholder",
    subtitle_behavior: "show_ellipsis",
    lip_sync_behavior: "mouth_closed",
    live2d_cue: "small_blink",
    safety_status: "candidate",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

const thinking = validatePauseCue(pauseCue());
assert.equal(thinking.blocked, false);
assert.equal(thinking.runtime_ready, false);

const zeroSentenceBoundary = validatePauseCue(pauseCue({
  duration_ms: 0,
  reason: "sentence_boundary",
}));
assert.equal(zeroSentenceBoundary.blocked, false);

const zeroThinking = validatePauseCue(pauseCue({ duration_ms: 0 }));
assert.equal(zeroThinking.blocked, true);
assert.equal(zeroThinking.reason_codes.includes("zero_duration_requires_sentence_boundary"), true);

const longWithoutReview = validatePauseCue(pauseCue({ duration_ms: 1600 }));
assert.equal(longWithoutReview.blocked, true);
assert.equal(longWithoutReview.reason_codes.includes("long_pause_requires_human_review"), true);

const longWithReview = validatePauseCue(pauseCue({
  duration_ms: 1600,
  requires_human_review: true,
  safety_status: "review_required",
}));
assert.equal(longWithReview.blocked, false);
assert.equal(longWithReview.runtime_ready, false);

const tooLong = validatePauseCue(pauseCue({
  duration_ms: 3500,
  requires_human_review: true,
}));
assert.equal(tooLong.blocked, true);
assert.equal(tooLong.reason_codes.includes("pause_duration_invalid"), true);

const blockedReason = validatePauseCue(pauseCue({ reason: "blocked" }));
assert.equal(blockedReason.blocked, true);
assert.equal(blockedReason.reason_codes.includes("pause_reason_blocked"), true);

const blockedSubtitle = validatePauseCue(pauseCue({ subtitle_behavior: "blocked" }));
assert.equal(blockedSubtitle.blocked, true);
assert.equal(blockedSubtitle.reason_codes.includes("subtitle_behavior_blocked"), true);

const blockedLipSync = validatePauseCue(pauseCue({ lip_sync_behavior: "blocked" }));
assert.equal(blockedLipSync.blocked, true);
assert.equal(blockedLipSync.reason_codes.includes("lip_sync_behavior_blocked"), true);

const blockedLive2d = validatePauseCue(pauseCue({ live2d_cue: "blocked" }));
assert.equal(blockedLive2d.blocked, true);
assert.equal(blockedLive2d.reason_codes.includes("live2d_cue_blocked"), true);

const approvedRuntime = validatePauseCue(pauseCue({
  allowed_for_runtime: true,
  safety_status: "approved",
}));
assert.equal(approvedRuntime.blocked, false);
assert.equal(approvedRuntime.runtime_ready, false);

const rawSyntaxMapping = validatePauseCue(pauseCue({
  tts_engine_mapping: "[pause 0.7s]",
}));
assert.equal(rawSyntaxMapping.blocked, true);
assert.equal(rawSyntaxMapping.reason_codes.includes("tts_engine_mapping_must_remain_placeholder"), true);

const unsafe = validatePauseCue(pauseCue({
  raw_pause_syntax: "[pause 0.7s]",
  engine_specific_syntax: "[pause 0.7s]",
  raw_prompt: "raw prompt",
  raw_text: "raw text",
  raw_audio: "raw audio",
  endpoint: "https://pause.invalid",
  api_key: "api-key",
  token: "token",
  secret: "secret",
  model_path: "model/path",
  dataset_path: "dataset/path",
}));
assert.equal(unsafe.blocked, true);
assert.equal(unsafe.reason_codes.includes("unsafe_pause_control_fields_present"), true);

const summary = buildPauseControlSafeSummary([
  pauseCue(),
  pauseCue({ duration_ms: 0, reason: "sentence_boundary" }),
  pauseCue({ duration_ms: 0 }),
  pauseCue({ duration_ms: 1600 }),
  pauseCue({ duration_ms: 1600, requires_human_review: true, safety_status: "review_required" }),
  pauseCue({ safety_status: "approved", allowed_for_runtime: true }),
  pauseCue({
    tts_engine_mapping: "[pause 0.7s]",
    raw_pause_syntax: "[pause 0.7s]",
    endpoint: "https://pause.invalid",
    api_key: "api-key",
    token: "token",
    secret: "secret",
    raw_audio: "raw audio",
    model_path: "model/path",
    dataset_path: "dataset/path",
  }),
]);

assert.equal(summary.pause_cue_count, 7);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "[pause 0.7s]",
  "raw_pause_syntax",
  "engine_specific_syntax",
  "raw text",
  "raw_text",
  "raw prompt",
  "raw_prompt",
  "raw audio",
  "raw_audio",
  "endpoint",
  "https://pause.invalid",
  "api_key",
  "token",
  "secret",
  "model/path",
  "model_path",
  "dataset/path",
  "dataset_path",
  "private_path",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 15,
  safe_summary_only: true,
}, null, 2));
