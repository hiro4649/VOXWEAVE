export const PAUSE_CONTROL_SCHEMA = "voxweave_pause_control_policy_v1";
export const PAUSE_CONTROL_SAFE_SUMMARY_SCHEMA =
  "voxweave_pause_control_safe_summary_v1";

export const REQUIRED_PAUSE_CUE_FIELDS = Object.freeze([
  "pause_cue_id",
  "duration_ms",
  "reason",
  "position",
  "language",
  "locale",
  "allowed_for_runtime",
  "requires_human_review",
  "tts_engine_mapping_status",
  "tts_engine_mapping",
  "subtitle_behavior",
  "lip_sync_behavior",
  "live2d_cue",
  "safety_status",
  "created_at",
  "updated_at",
]);

export const PAUSE_REASONS = Object.freeze([
  "thinking",
  "breath",
  "dramatic_pause",
  "sentence_boundary",
  "emotion_recovery",
  "listener_wait",
  "blocked",
]);

export const PAUSE_POSITIONS = Object.freeze([
  "before_utterance",
  "inside_utterance",
  "after_utterance",
  "between_segments",
]);

export const SUBTITLE_BEHAVIORS = Object.freeze([
  "hold_previous_segment",
  "split_segment",
  "hide_during_pause",
  "show_ellipsis",
  "blocked",
]);

export const LIP_SYNC_BEHAVIORS = Object.freeze([
  "mouth_closed",
  "reduced_motion",
  "hold_last_shape",
  "blocked",
]);

export const LIVE2D_CUES = Object.freeze([
  "small_blink",
  "small_nod",
  "breath_idle",
  "soft_smile_hold",
  "none",
  "blocked",
]);

export const PAUSE_SAFETY_STATUSES = Object.freeze([
  "candidate",
  "review_required",
  "approved",
  "blocked",
]);

export const TTS_ENGINE_MAPPING_STATUSES = Object.freeze([
  "placeholder",
  "not_mapped",
  "blocked",
]);

export const UNSAFE_PAUSE_CONTROL_FIELDS = Object.freeze([
  "raw_pause_syntax",
  "engine_specific_syntax",
  "raw_subtitle_text",
  "raw_lip_sync_payload",
  "raw_live2d_payload",
  "raw_tts_engine_payload",
  "engine_pause_syntax",
  "ssml_payload",
  "vendor_pause_syntax",
  "raw_text",
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
