export const TTS_ENGINE_CAPABILITY_SCHEMA = "voxweave_tts_engine_capability_v1";
export const TTS_ENGINE_CAPABILITY_SAFE_SUMMARY_SCHEMA =
  "voxweave_tts_engine_capability_safe_summary_v1";

export const REQUIRED_TTS_ENGINE_PROFILE_FIELDS = Object.freeze([
  "engine_id",
  "engine_family",
  "candidate_status",
  "runtime_connected",
  "production_ready",
  "license_review_status",
  "supports_multilingual",
  "supported_languages",
  "supports_voice_cloning",
  "supports_long_form",
  "supports_pause_control",
  "supports_pronunciation_control",
  "supports_code_switching",
  "supports_streaming",
  "supports_realtime",
  "requires_reference_voice_consent",
  "requires_human_review",
  "benchmark_required",
  "latency_benchmark_status",
  "gpu_benchmark_status",
  "vram_benchmark_status",
  "pause_control_benchmark_status",
  "pronunciation_benchmark_status",
  "subtitle_alignment_benchmark_status",
  "lip_sync_alignment_benchmark_status",
  "live2d_alignment_benchmark_status",
  "notes_redacted",
]);

export const TTS_ENGINE_CANDIDATE_STATUSES = Object.freeze([
  "candidate_only",
  "lab_only",
  "benchmark_required",
  "blocked",
]);

export const UNSAFE_TTS_ENGINE_PROFILE_FIELDS = Object.freeze([
  "endpoint",
  "endpoint_url",
  "api_key",
  "token",
  "secret",
  "authorization",
  "raw_benchmark_logs",
  "raw_audio",
  "raw_reference_voice",
  "dataset_path",
  "model_path",
  "model_download_url",
  "private_path",
  "raw_pr_body",
  "raw_artifact_text",
]);
