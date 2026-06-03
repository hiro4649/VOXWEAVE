export const SUBTITLE_TIMING_POLICY_SCHEMA = "voxweave_subtitle_timing_policy_v1";
export const SUBTITLE_TIMING_SAFE_SUMMARY_SCHEMA =
  "voxweave_subtitle_timing_safe_summary_v1";

export const REQUIRED_SUBTITLE_TIMING_FIELDS = Object.freeze([
  "subtitle_policy_id",
  "segment_id",
  "text_ref",
  "language",
  "locale",
  "script",
  "direction",
  "start_ms",
  "end_ms",
  "duration_ms",
  "pause_before_ms",
  "pause_after_ms",
  "reading_speed_label",
  "max_chars_per_segment",
  "subtitle_behavior",
  "pause_alignment_status",
  "lip_sync_alignment_status",
  "live2d_alignment_status",
  "requires_human_review",
  "approved_for_runtime",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const SUBTITLE_READING_SPEED_LABELS = Object.freeze([
  "very_slow",
  "slow",
  "normal",
  "fast",
  "very_fast",
  "unknown",
  "blocked",
]);

export const SUBTITLE_BEHAVIORS = Object.freeze([
  "show",
  "hide",
  "show_ellipsis",
  "hold_previous_segment",
  "split_segment",
  "text_only",
  "blocked",
]);

export const SUBTITLE_ALIGNMENT_STATUSES = Object.freeze([
  "placeholder",
  "not_aligned",
  "review_required",
  "approved",
  "blocked",
]);

export const SUBTITLE_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);

export const SUBTITLE_LANGUAGES = Object.freeze([
  "ja",
  "en",
  "zh",
  "ko",
  "ar",
  "multi",
  "unknown",
]);

export const SUBTITLE_LOCALES = Object.freeze([
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

export const SUBTITLE_SCRIPTS = Object.freeze([
  "kana",
  "kanji",
  "latin",
  "simplified_chinese",
  "traditional_chinese",
  "hangul",
  "arabic",
  "mixed",
  "unknown",
]);

export const SUBTITLE_DIRECTIONS = Object.freeze([
  "ltr",
  "rtl",
  "mixed",
  "unknown",
]);

export const UNSAFE_SUBTITLE_TIMING_FIELDS = Object.freeze([
  "raw_subtitle_text",
  "raw_payload",
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
