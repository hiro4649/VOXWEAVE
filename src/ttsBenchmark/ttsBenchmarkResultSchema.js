export const TTS_BENCHMARK_RESULT_SCHEMA = "voxweave_tts_benchmark_result_v1";
export const TTS_BENCHMARK_RESULT_SAFE_SUMMARY_SCHEMA =
  "voxweave_tts_benchmark_result_safe_summary_v1";

export const REQUIRED_TTS_BENCHMARK_RESULT_FIELDS = Object.freeze([
  "result_id",
  "benchmark_id",
  "engine_id",
  "engine_family",
  "candidate_status",
  "benchmark_status",
  "result_status",
  "runtime_connected",
  "production_ready",
  "model_downloaded",
  "api_call_performed",
  "endpoint_configured",
  "package_dependency_added",
  "workflow_changed",
  "benchmark_executed",
  "benchmark_execution_mode",
  "license_review_status",
  "reference_voice_consent_status",
  "human_review_status",
  "text_to_first_audio_latency_ms",
  "total_synthesis_latency_ms",
  "gpu_name_redacted",
  "gpu_benchmark_status",
  "vram_used_mb",
  "vram_benchmark_status",
  "tested_languages",
  "multilingual_benchmark_status",
  "pause_control_score",
  "pause_control_benchmark_status",
  "pronunciation_control_score",
  "pronunciation_control_benchmark_status",
  "subtitle_alignment_score",
  "subtitle_alignment_benchmark_status",
  "lip_sync_alignment_score",
  "lip_sync_alignment_benchmark_status",
  "live2d_alignment_score",
  "live2d_alignment_benchmark_status",
  "long_form_stability_score",
  "long_form_benchmark_status",
  "streaming_benchmark_status",
  "realtime_benchmark_status",
  "quality_review_status",
  "human_review_required",
  "human_review_completed",
  "approved_for_runtime",
  "notes_redacted",
  "created_at",
  "updated_at",
]);

export const TTS_BENCHMARK_RESULT_STATUSES = Object.freeze([
  "not_run",
  "planned",
  "blocked",
  "failed",
  "completed_lab_evaluation",
]);

export const TTS_BENCHMARK_RESULT_CANDIDATE_STATUSES = Object.freeze([
  "candidate_only",
  "lab_only",
  "benchmark_required",
  "separate_low_latency_candidate",
  "blocked",
]);

export const TTS_BENCHMARK_RESULT_BENCHMARK_STATUSES = Object.freeze([
  "not_started",
  "planned",
  "lab_only",
  "blocked",
  "completed_lab_evaluation",
]);

export const TTS_BENCHMARK_RESULT_LICENSE_REVIEW_STATUSES = Object.freeze([
  "required",
  "pending",
  "approved_for_lab",
  "approved_for_benchmark",
  "blocked",
  "not_required_for_mock",
]);

export const TTS_BENCHMARK_RESULT_REFERENCE_CONSENT_STATUSES = Object.freeze([
  "not_required_for_mock",
  "explicit_consent",
  "missing_consent",
  "unknown",
  "blocked",
]);

export const TTS_BENCHMARK_RESULT_HUMAN_REVIEW_STATUSES = Object.freeze([
  "not_required_for_mock",
  "required",
  "pending",
  "approved_for_lab",
  "blocked",
]);

export const TTS_BENCHMARK_EXECUTION_MODES = Object.freeze([
  "not_executed",
  "mock_only",
  "lab_manual",
  "lab_automated",
  "external_report_redacted",
]);

export const RESULT_QUALITY_REVIEW_COMPLETED_STATUSES = Object.freeze([
  "completed",
  "approved_for_lab",
]);

export const UNSAFE_TTS_BENCHMARK_RESULT_FIELDS = Object.freeze([
  "raw_benchmark_logs",
  "raw_logs",
  "raw_audio",
  "raw_reference_voice",
  "generated_audio_ref",
  "dataset_path",
  "model_path",
  "endpoint",
  "endpoint_url",
  "api_key",
  "token",
  "secret",
  "authorization",
  "private_path",
  "model_download_url",
  "raw_pr_body",
  "raw_artifact_text",
  "voice_sample",
  "speaker_embedding",
  "reviewer_notes",
  "gpu_name",
  "gpu_identifier",
  "benchmark_notes",
  "latency_raw_trace",
  "vram_raw_trace",
  "score_raw_payload",
]);
