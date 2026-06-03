export const MULTILINGUAL_LOCALE_POLICY_SCHEMA =
  "voxweave_multilingual_locale_policy_v1";
export const MULTILINGUAL_LOCALE_SAFE_SUMMARY_SCHEMA =
  "voxweave_multilingual_locale_safe_summary_v1";

export const REQUIRED_MULTILINGUAL_LOCALE_FIELDS = Object.freeze([
  "locale_policy_id",
  "language",
  "locale",
  "script",
  "direction",
  "engine_family",
  "engine_id_redacted",
  "candidate_status",
  "supports_runtime",
  "supports_voice_cloning",
  "supports_code_switching",
  "supports_multilingual",
  "requires_human_review",
  "requires_reference_voice_consent",
  "requires_pronunciation_review",
  "pronunciation_hint_policy_status",
  "subtitle_direction_policy_status",
  "lip_sync_policy_status",
  "live2d_policy_status",
  "fallback_policy",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const MULTILINGUAL_LANGUAGES = Object.freeze([
  "ja",
  "en",
  "zh",
  "ko",
  "ar",
  "multi",
  "unknown",
  "blocked",
]);

export const MULTILINGUAL_LOCALES = Object.freeze([
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

export const MULTILINGUAL_SCRIPTS = Object.freeze([
  "kana",
  "kanji",
  "latin",
  "simplified_chinese",
  "traditional_chinese",
  "hangul",
  "arabic",
  "mixed",
  "unknown",
  "blocked",
]);

export const MULTILINGUAL_DIRECTIONS = Object.freeze([
  "ltr",
  "rtl",
  "mixed",
  "unknown",
  "blocked",
]);

export const MULTILINGUAL_CANDIDATE_STATUSES = Object.freeze([
  "candidate_only",
  "lab_only",
  "benchmark_required",
  "blocked",
]);

export const MULTILINGUAL_FALLBACK_POLICIES = Object.freeze([
  "text_only",
  "safe_placeholder_voice",
  "human_review_required",
  "blocked",
]);

export const MULTILINGUAL_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);
