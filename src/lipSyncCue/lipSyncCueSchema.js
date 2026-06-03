export const LIP_SYNC_CUE_POLICY_SCHEMA = "voxweave_lip_sync_cue_policy_v1";
export const LIP_SYNC_CUE_SAFE_SUMMARY_SCHEMA =
  "voxweave_lip_sync_cue_safe_summary_v1";

export const REQUIRED_LIP_SYNC_CUE_FIELDS = Object.freeze([
  "lip_sync_policy_id",
  "cue_id",
  "segment_ref",
  "subtitle_ref",
  "pause_cue_ref",
  "language",
  "locale",
  "mouth_shape",
  "start_ms",
  "end_ms",
  "duration_ms",
  "intensity",
  "smoothing_ms",
  "source_type",
  "sync_mode",
  "subtitle_alignment_status",
  "pause_alignment_status",
  "live2d_alignment_status",
  "requires_human_review",
  "approved_for_runtime",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const LIP_SYNC_MOUTH_SHAPES = Object.freeze([
  "closed",
  "neutral",
  "aa",
  "ih",
  "ou",
  "ee",
  "oh",
  "bmp",
  "fv",
  "l",
  "rest",
  "unknown",
  "blocked",
]);

export const LIP_SYNC_SOURCE_TYPES = Object.freeze([
  "tts_alignment",
  "subtitle_timing",
  "pause_control",
  "manual_review",
  "voice_lab_candidate",
  "benchmark_result",
  "blocked",
]);

export const LIP_SYNC_MODES = Object.freeze([
  "placeholder",
  "not_aligned",
  "time_range",
  "segment_based",
  "review_required",
  "blocked",
]);

export const LIP_SYNC_ALIGNMENT_STATUSES = Object.freeze([
  "placeholder",
  "not_aligned",
  "review_required",
  "approved",
  "blocked",
]);

export const LIP_SYNC_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);

export const LIP_SYNC_LANGUAGES = Object.freeze([
  "ja",
  "en",
  "zh",
  "ko",
  "ar",
  "multi",
  "unknown",
]);

export const LIP_SYNC_LOCALES = Object.freeze([
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

export const UNSAFE_LIP_SYNC_CUE_FIELDS = Object.freeze([
  "raw_mouth_payload",
  "raw_phoneme_payload",
  "raw_viseme_payload",
  "raw_live2d_payload",
  "raw_tts_payload",
  "raw_subtitle_payload",
  "raw_pause_payload",
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
  "vendor_lip_sync_payload",
  "engine_lip_sync_payload",
]);
