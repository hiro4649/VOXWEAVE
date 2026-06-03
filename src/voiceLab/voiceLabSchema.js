export const VOICE_LAB_CANDIDATE_SCHEMA = "voxweave_voice_lab_candidate_v1";
export const VOICE_LAB_SAFE_SUMMARY_SCHEMA = "voxweave_voice_lab_safe_summary_v1";

export const REQUIRED_CANDIDATE_METADATA = Object.freeze([
  "candidate_id",
  "source_voice_profile_id",
  "reference_voice_consent_status",
  "voice_design_model",
  "caption_preset_id",
  "generated_text",
  "generated_audio_ref",
  "language",
  "locale",
  "emotion_style",
  "review_status",
  "reviewer_id_or_role",
  "review_notes_redacted",
  "approved_for_runtime",
  "approved_for_dataset",
  "approved_for_training",
  "approved_for_publication",
  "approved_for_multilingual_use",
  "prohibited_use_cases",
  "created_at",
  "updated_at",
]);

export const REVIEW_STATUSES = Object.freeze([
  "candidate",
  "pending",
  "review_required",
  "blocked",
  "rejected",
  "approved",
]);

export const REFERENCE_VOICE_CONSENT_STATUSES = Object.freeze([
  "explicit_consent",
  "missing_consent",
  "unknown",
  "blocked",
]);

export const UNSAFE_VOICE_LAB_FIELDS = Object.freeze([
  "raw_audio",
  "raw_reference_voice",
  "dataset_path",
  "model_path",
  "endpoint",
  "api_key",
  "token",
  "secret",
]);
