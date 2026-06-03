export const PRONUNCIATION_HINT_SCHEMA = "voxweave_pronunciation_hint_policy_v1";
export const PRONUNCIATION_HINT_SAFE_SUMMARY_SCHEMA =
  "voxweave_pronunciation_hint_safe_summary_v1";

export const REQUIRED_PRONUNCIATION_HINT_FIELDS = Object.freeze([
  "hint_id",
  "surface",
  "normalized_surface",
  "hint_type",
  "hint_value",
  "language",
  "locale",
  "script",
  "source",
  "confidence",
  "approved_for_runtime",
  "requires_human_review",
  "engine_mapping_status",
  "engine_mapping",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const PRONUNCIATION_HINT_TYPES = Object.freeze([
  "kana",
  "pinyin",
  "ipa",
  "phoneme",
  "alias",
  "blocked",
]);

export const PRONUNCIATION_HINT_SOURCES = Object.freeze([
  "dictionary",
  "human_review",
  "voice_lab_candidate",
  "benchmark_result",
  "operator_entry",
  "blocked",
]);

export const PRONUNCIATION_HINT_SCRIPTS = Object.freeze([
  "kana",
  "kanji",
  "latin",
  "pinyin",
  "ipa",
  "arabic",
  "hangul",
  "mixed",
  "unknown",
  "blocked",
]);

export const PRONUNCIATION_HINT_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);

export const PRONUNCIATION_ENGINE_MAPPING_STATUSES = Object.freeze([
  "placeholder",
  "not_mapped",
  "blocked",
]);

export const UNSAFE_PRONUNCIATION_HINT_FIELDS = Object.freeze([
  "raw_phoneme_debug",
  "raw_prompt",
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
