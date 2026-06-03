export const LIVE2D_CUE_POLICY_SCHEMA = "voxweave_live2d_cue_policy_v1";
export const LIVE2D_CUE_SAFE_SUMMARY_SCHEMA =
  "voxweave_live2d_cue_safe_summary_v1";

export const REQUIRED_LIVE2D_CUE_FIELDS = Object.freeze([
  "live2d_policy_id",
  "cue_id",
  "segment_ref",
  "subtitle_ref",
  "pause_cue_ref",
  "lip_sync_ref",
  "language",
  "locale",
  "cue_type",
  "expression",
  "motion",
  "parameter_target",
  "start_ms",
  "end_ms",
  "duration_ms",
  "intensity",
  "transition_ms",
  "recovery_ms",
  "source_type",
  "sync_mode",
  "subtitle_alignment_status",
  "pause_alignment_status",
  "lip_sync_alignment_status",
  "requires_human_review",
  "approved_for_runtime",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const LIVE2D_CUE_TYPES = Object.freeze([
  "expression",
  "motion",
  "parameter",
  "breath",
  "blink",
  "idle",
  "recovery",
  "none",
  "blocked",
]);

export const LIVE2D_EXPRESSIONS = Object.freeze([
  "neutral",
  "soft_smile",
  "smile",
  "surprised",
  "sad",
  "angry_soft",
  "thinking",
  "blink",
  "none",
  "blocked",
]);

export const LIVE2D_MOTIONS = Object.freeze([
  "small_nod",
  "small_shake",
  "breath_idle",
  "look_left",
  "look_right",
  "look_center",
  "idle",
  "none",
  "blocked",
]);

export const LIVE2D_PARAMETER_TARGETS = Object.freeze([
  "ParamMouthOpenY",
  "ParamEyeLOpen",
  "ParamEyeROpen",
  "ParamAngleX",
  "ParamAngleY",
  "ParamAngleZ",
  "ParamBodyAngleX",
  "ParamBreath",
  "none",
  "blocked",
]);

export const LIVE2D_SOURCE_TYPES = Object.freeze([
  "tts_timing",
  "subtitle_timing",
  "pause_control",
  "lip_sync_cue",
  "manual_review",
  "voice_lab_candidate",
  "benchmark_result",
  "blocked",
]);

export const LIVE2D_SYNC_MODES = Object.freeze([
  "placeholder",
  "not_aligned",
  "time_range",
  "segment_based",
  "review_required",
  "blocked",
]);

export const LIVE2D_ALIGNMENT_STATUSES = Object.freeze([
  "placeholder",
  "not_aligned",
  "review_required",
  "approved",
  "blocked",
]);

export const LIVE2D_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);

export const LIVE2D_LANGUAGES = Object.freeze([
  "ja",
  "en",
  "zh",
  "ko",
  "ar",
  "multi",
  "unknown",
]);

export const LIVE2D_LOCALES = Object.freeze([
  "ja-JP",
  "en-US",
  "en-GB",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "ko-KR",
  "ar-MSA",
  "ar-SA",
  "ar-EG",
  "multi",
  "unknown",
]);

export const UNSAFE_LIVE2D_CUE_FIELDS = Object.freeze([
  "raw_live2d_payload",
  "raw_expression_payload",
  "raw_motion_payload",
  "raw_parameter_payload",
  "raw_tts_payload",
  "raw_audio",
  "endpoint",
  "endpoint_url",
  "api_key",
  "token",
  "secret",
  "authorization",
  "model_path",
  "dataset_path",
  "private_path",
  "raw_pr_body",
  "raw_artifact_text",
]);
