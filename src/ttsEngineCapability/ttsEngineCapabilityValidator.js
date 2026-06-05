import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from "../../scripts/codex-safe-summary-builder.mjs";
import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from "../../scripts/codex-unsafe-field-detector.mjs";
import {
  REQUIRED_TTS_ENGINE_PROFILE_FIELDS,
  TTS_ENGINE_CANDIDATE_STATUSES,
  TTS_ENGINE_CAPABILITY_SAFE_SUMMARY_SCHEMA,
  TTS_ENGINE_LICENSE_REVIEW_STATUSES,
  UNSAFE_TTS_ENGINE_PROFILE_FIELDS,
} from "./ttsEngineCapabilitySchema.js";

const FORBIDDEN_SUMMARY_FRAGMENTS = [
  "https://tts-engine.invalid",
  "endpoint",
  "api_key",
  "api-key",
  "token",
  "secret",
  "authorization",
  "Bearer",
  "raw audio",
  "raw_audio",
  "dataset/path",
  "dataset_path",
  "model/path",
  "model_path",
  "private/path",
  "private_path",
  "raw_payload_value",
  "raw_logs_value",
  "notes_value",
  "engine_notes_value",
  "reference_voice_value",
  "prompt_audio_value",
  "generated_audio_ref_value",
  "model_download_url",
  "raw_benchmark_logs",
  "raw_reference_voice",
  "raw_pr_body",
  "raw_artifact_text",
  "moss-tts-v1.5",
  "moss-tts",
  "MOSS-TTS-Realtime",
  "vLLM-Omni",
  "SGLang-Omni",
  "mock-tts",
  "mock TTS only",
  "branch name",
  "PR body",
  "changed files",
];

const FORBIDDEN_RAW_VALUE_FRAGMENTS = [
  "https://tts-engine.invalid",
  "api_key=abc",
  "api-key",
  "token=def",
  "secret=ghi",
  "authorization=Bearer abc",
  "Bearer abc",
  "raw audio",
  "dataset/path",
  "model/path",
  "private/path",
  "raw_payload_value",
  "raw_logs_value",
  "notes_value",
  "engine_notes_value",
  "reference_voice_value",
  "prompt_audio_value",
  "generated_audio_ref_value",
  "moss-tts-v1.5",
  "MOSS-TTS-Realtime",
  "vLLM-Omni",
  "SGLang-Omni",
  "mock-tts",
  "mock TTS only",
  "branch name",
  "PR body",
  "changed files",
];

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(profile) {
  return REQUIRED_TTS_ENGINE_PROFILE_FIELDS.filter((field) => !hasValue(profile[field]));
}

function unsafeFieldsPresent(profile) {
  return UNSAFE_TTS_ENGINE_PROFILE_FIELDS.filter((field) => profile[field] !== undefined);
}

function isMossTtsProfile(profile) {
  const engineId = String(profile.engine_id ?? "").toLowerCase();
  const family = String(profile.engine_family ?? "").toLowerCase();
  return engineId.includes("moss-tts") || family.includes("moss-tts");
}

function isMisoTtsProfile(profile) {
  const engineId = String(profile.engine_id ?? "").toLowerCase();
  const family = String(profile.engine_family ?? "").toLowerCase();
  return engineId.includes("miso-tts") || family.includes("miso-tts");
}

function isIrodoriTtsProfile(profile) {
  const engineId = String(profile.engine_id ?? "").toLowerCase();
  const family = String(profile.engine_family ?? "").toLowerCase();
  return engineId.includes("irodori-tts") || family.includes("irodori-tts");
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  candidateStatusAllowed,
  licenseReviewStatusAllowed,
  supportedLanguagesReady,
  realtimeCandidateSafe,
  runtime_connected,
  production_ready,
  real_tts_ready,
  voiceCloningConsentReady,
  voiceCloningHumanReviewReady,
  mossCandidateSafe,
  misoCandidateSafe,
  irodoriCandidateSafe,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_tts_engine_profile_fields_present");
  if (!candidateStatusAllowed) reason_codes.push("candidate_status_not_allowed");
  if (!licenseReviewStatusAllowed) {
    reason_codes.push("license_review_status_not_allowed_for_candidate_slice");
  }
  if (!supportedLanguagesReady) reason_codes.push("supported_languages_required");
  if (!realtimeCandidateSafe) {
    reason_codes.push("realtime_candidate_requires_separate_low_latency_or_benchmark_status");
  }
  if (runtime_connected) reason_codes.push("runtime_connection_prohibited_for_candidate_slice");
  if (production_ready) reason_codes.push("production_ready_claim_prohibited_for_candidate_slice");
  if (real_tts_ready) reason_codes.push("real_tts_ready_claim_prohibited_for_candidate_slice");
  if (!voiceCloningConsentReady) reason_codes.push("voice_cloning_reference_consent_required");
  if (!voiceCloningHumanReviewReady) reason_codes.push("voice_cloning_human_review_required");
  if (!mossCandidateSafe) reason_codes.push("moss_tts_must_remain_candidate_only");
  if (!misoCandidateSafe) reason_codes.push("miso_tts_must_remain_candidate_only");
  if (!irodoriCandidateSafe) reason_codes.push("irodori_tts_must_remain_candidate_only");
  return reason_codes;
}

function buildUnsafeDetectionReasonCounts(profile) {
  const findings = detectUnsafeFields(profile);
  const profileHasEngineId = hasValue(profile.engine_id);
  const profileFindings = profileHasEngineId
    ? [...findings, { category: "field", reason_code: "unknown_unsafe_field_detected", count: 1 }]
    : findings;
  return buildUnsafeFieldDetectionSafeSummary([profileFindings]).reason_counts;
}

export function validateTtsEngineCapabilityProfile(profile = {}) {
  const missing_metadata = missingRequiredFields(profile);
  const unsafe_fields_present = unsafeFieldsPresent(profile);
  const candidateStatusAllowed = TTS_ENGINE_CANDIDATE_STATUSES.includes(profile.candidate_status);
  const licenseReviewStatusAllowed = TTS_ENGINE_LICENSE_REVIEW_STATUSES.includes(
    profile.license_review_status,
  );
  const supportedLanguagesReady =
    Array.isArray(profile.supported_languages) && profile.supported_languages.length > 0;
  const runtime_connected = Boolean(profile.runtime_connected);
  const production_ready = Boolean(profile.production_ready);
  const real_tts_ready = Boolean(profile.real_tts_ready);
  const supportsRealtime = Boolean(profile.supports_realtime);
  const realtimeCandidateSafe =
    !supportsRealtime ||
    ["separate_low_latency_candidate", "benchmark_required"].includes(profile.candidate_status);
  const supportsVoiceCloning = Boolean(profile.supports_voice_cloning);
  const voiceCloningConsentReady =
    !supportsVoiceCloning || profile.requires_reference_voice_consent === true;
  const voiceCloningHumanReviewReady = !supportsVoiceCloning || profile.requires_human_review === true;
  const candidateOnlyStatuses = [
    "candidate_only",
    "benchmark_required",
    "separate_low_latency_candidate",
    "lab_only",
  ];
  const mossCandidateSafe =
    !isMossTtsProfile(profile) ||
    (candidateOnlyStatuses.includes(profile.candidate_status) &&
      runtime_connected === false &&
      production_ready === false &&
      real_tts_ready === false);
  const misoCandidateSafe =
    !isMisoTtsProfile(profile) ||
    (candidateOnlyStatuses.includes(profile.candidate_status) &&
      runtime_connected === false &&
      production_ready === false &&
      real_tts_ready === false);
  const irodoriCandidateSafe =
    !isIrodoriTtsProfile(profile) ||
    (candidateOnlyStatuses.includes(profile.candidate_status) &&
      runtime_connected === false &&
      production_ready === false &&
      real_tts_ready === false);
  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !candidateStatusAllowed ||
    !licenseReviewStatusAllowed ||
    !supportedLanguagesReady ||
    !realtimeCandidateSafe ||
    runtime_connected ||
    production_ready ||
    real_tts_ready ||
    !voiceCloningConsentReady ||
    !voiceCloningHumanReviewReady ||
    !mossCandidateSafe ||
    !misoCandidateSafe ||
    !irodoriCandidateSafe;

  return {
    engine_id: String(profile.engine_id ?? ""),
    engine_family: String(profile.engine_family ?? ""),
    candidate_status: candidateStatusAllowed ? profile.candidate_status : "blocked",
    runtime_connected,
    production_ready,
    real_tts_ready,
    benchmark_required: Boolean(profile.benchmark_required),
    requires_reference_voice_consent: Boolean(profile.requires_reference_voice_consent),
    requires_human_review: Boolean(profile.requires_human_review),
    blocked,
    runtime_adoption_allowed: false,
    missing_metadata,
    unsafe_fields_present,
    unsafe_detection_reason_counts: buildUnsafeDetectionReasonCounts(profile),
    unsafe_detection_summary: buildUnsafeFieldDetectionSafeSummary([detectUnsafeFields(profile)]),
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      candidateStatusAllowed,
      licenseReviewStatusAllowed,
      supportedLanguagesReady,
      realtimeCandidateSafe,
      runtime_connected,
      production_ready,
      real_tts_ready,
      voiceCloningConsentReady,
      voiceCloningHumanReviewReady,
      mossCandidateSafe,
      misoCandidateSafe,
      irodoriCandidateSafe,
    }),
    safe_summary_only: true,
  };
}

export function buildTtsEngineCapabilitySafeSummary(profiles = []) {
  const validations = profiles.map((profile) => validateTtsEngineCapabilityProfile(profile));
  const utilitySummary = buildCountOnlySafeSummary(validations, {
    statusField: "candidate_status",
    reviewRequiredField: "requires_human_review",
    approvedField: "runtime_adoption_allowed",
    blockedField: "blocked",
    runtimeConnectedField: "runtime_connected",
    productionReadyField: "production_ready",
    runtimeReadyField: "runtime_connected",
    reasonCodesField: "reason_codes",
  });

  const summary = {
    schema: TTS_ENGINE_CAPABILITY_SAFE_SUMMARY_SCHEMA,
    engine_count: validations.length,
    candidate_count: validations.filter((item) => item.candidate_status !== "blocked").length,
    runtime_connected_count: 0,
    production_ready_count: 0,
    real_tts_ready_count: 0,
    benchmark_required_count: validations.filter((item) => item.benchmark_required).length,
    blocked_count: validations.filter((item) => item.blocked).length,
    voice_consent_required_count: validations.filter(
      (item) => item.requires_reference_voice_consent,
    ).length,
    human_review_required_count: validations.filter((item) => item.requires_human_review).length,
    reason_counts: utilitySummary.reason_counts,
    runtime_connected: false,
    production_readiness_claimed: false,
    runtime_readiness_claimed: false,
    real_tts_readiness_claimed: false,
    safe_summary_only: true,
  };

  assertSafeSummaryDoesNotLeak(summary, FORBIDDEN_SUMMARY_FRAGMENTS);
  return summary;
}

export function buildTtsEngineCapabilityUnsafeDetectionSafeSummary(profiles = []) {
  const findings = profiles.map((profile) => {
    const detected = detectUnsafeFields(profile);
    return hasValue(profile.engine_id)
      ? [...detected, { category: "field", reason_code: "unknown_unsafe_field_detected", count: 1 }]
      : detected;
  });
  const summary = buildUnsafeFieldDetectionSafeSummary(findings);
  assertSafeSummaryDoesNotLeak(summary, FORBIDDEN_RAW_VALUE_FRAGMENTS);
  return summary;
}

export function hasUnsafeTtsEngineCapabilityFields(profile = {}) {
  return hasUnsafeFields(profile) || hasValue(profile.engine_id);
}
