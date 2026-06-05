export const TTS_BENCHMARK_MANIFEST_SCHEMA = "voxweave_tts_benchmark_manifest_v1";
export const TTS_BENCHMARK_SAFE_SUMMARY_SCHEMA =
  "voxweave_tts_benchmark_safe_summary_v1";

export const REQUIRED_TTS_BENCHMARK_FIELDS = Object.freeze([
  "benchmark_id",
  "engine_id",
  "engine_family",
  "candidate_status",
  "benchmark_status",
  "runtime_connected",
  "production_ready",
  "model_downloaded",
  "api_call_performed",
  "endpoint_configured",
  "package_dependency_added",
  "workflow_changed",
  "license_review_status",
  "reference_voice_consent_status",
  "human_review_status",
  "latency_benchmark_status",
  "text_to_first_audio_latency_ms",
  "total_synthesis_latency_ms",
  "gpu_benchmark_status",
  "gpu_required",
  "vram_benchmark_status",
  "vram_estimate_mb",
  "multilingual_benchmark_status",
  "tested_languages",
  "pause_control_benchmark_status",
  "pronunciation_control_benchmark_status",
  "subtitle_alignment_benchmark_status",
  "lip_sync_alignment_benchmark_status",
  "live2d_alignment_benchmark_status",
  "long_form_benchmark_status",
  "streaming_benchmark_status",
  "realtime_benchmark_status",
  "quality_review_status",
  "notes_redacted",
  "created_at",
  "updated_at",
]);

export const TTS_BENCHMARK_STATUSES = Object.freeze([
  "not_started",
  "planned",
  "lab_only",
  "blocked",
  "completed_lab_evaluation",
]);

export const TTS_BENCHMARK_CANDIDATE_STATUSES = Object.freeze([
  "candidate_only",
  "lab_only",
  "benchmark_required",
  "separate_low_latency_candidate",
  "blocked",
]);

export const TTS_BENCHMARK_COMPLETED_FIELD_STATUSES = Object.freeze([
  "completed",
  "approved_for_lab",
  "not_required_for_mock",
]);

export const TTS_BENCHMARK_REALTIME_FIELD_STATUSES = Object.freeze([
  "required",
  "planned",
  "not_started",
  "completed_lab_evaluation",
]);

export const TTS_BENCHMARK_LICENSE_REVIEW_STATUSES = Object.freeze([
  "required",
  "pending",
  "approved_for_lab",
  "approved_for_benchmark",
  "blocked",
  "not_required_for_mock",
]);

export const TTS_BENCHMARK_REFERENCE_CONSENT_STATUSES = Object.freeze([
  "not_required_for_mock",
  "explicit_consent",
  "missing_consent",
  "unknown",
  "blocked",
]);

export const TTS_BENCHMARK_HUMAN_REVIEW_STATUSES = Object.freeze([
  "not_required_for_mock",
  "required",
  "pending",
  "approved_for_lab",
  "blocked",
]);

export const UNSAFE_TTS_BENCHMARK_FIELDS = Object.freeze([
  "raw_benchmark_logs",
  "raw_manifest",
  "raw_payload",
  "raw_logs",
  "raw_audio",
  "raw_reference_voice",
  "dataset_path",
  "model_path",
  "private_path",
  "endpoint",
  "endpoint_url",
  "api_key",
  "api-key",
  "token",
  "secret",
  "authorization",
  "bearer",
  "model_download_url",
  "download_url",
  "workflow_path",
  "package_change_note",
  "api_call_payload",
  "raw_pr_body",
  "raw_artifact_text",
  "voice_sample",
  "speaker_embedding",
]);
