import {
  REQUIRED_TTS_ENGINE_PROFILE_FIELDS,
  TTS_ENGINE_CANDIDATE_STATUSES,
  TTS_ENGINE_CAPABILITY_SAFE_SUMMARY_SCHEMA,
  TTS_ENGINE_LICENSE_REVIEW_STATUSES,
  UNSAFE_TTS_ENGINE_PROFILE_FIELDS,
} from "./ttsEngineCapabilitySchema.js";

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

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  candidateStatusAllowed,
  licenseReviewStatusAllowed,
  supportedLanguagesReady,
  realtimeCandidateSafe,
  runtime_connected,
  production_ready,
  voiceCloningConsentReady,
  voiceCloningHumanReviewReady,
  mossCandidateSafe,
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
  if (!voiceCloningConsentReady) reason_codes.push("voice_cloning_reference_consent_required");
  if (!voiceCloningHumanReviewReady) reason_codes.push("voice_cloning_human_review_required");
  if (!mossCandidateSafe) reason_codes.push("moss_tts_must_remain_candidate_only");
  return reason_codes;
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
  const supportsRealtime = Boolean(profile.supports_realtime);
  const realtimeCandidateSafe =
    !supportsRealtime ||
    ["separate_low_latency_candidate", "benchmark_required"].includes(profile.candidate_status);
  const supportsVoiceCloning = Boolean(profile.supports_voice_cloning);
  const voiceCloningConsentReady =
    !supportsVoiceCloning || profile.requires_reference_voice_consent === true;
  const voiceCloningHumanReviewReady = !supportsVoiceCloning || profile.requires_human_review === true;
  const mossCandidateSafe =
    !isMossTtsProfile(profile) ||
    (["candidate_only", "benchmark_required", "separate_low_latency_candidate"].includes(
      profile.candidate_status,
    ) &&
      runtime_connected === false &&
      production_ready === false);
  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !candidateStatusAllowed ||
    !licenseReviewStatusAllowed ||
    !supportedLanguagesReady ||
    !realtimeCandidateSafe ||
    runtime_connected ||
    production_ready ||
    !voiceCloningConsentReady ||
    !voiceCloningHumanReviewReady ||
    !mossCandidateSafe;

  return {
    engine_id: String(profile.engine_id ?? ""),
    engine_family: String(profile.engine_family ?? ""),
    candidate_status: candidateStatusAllowed ? profile.candidate_status : "blocked",
    runtime_connected,
    production_ready,
    benchmark_required: Boolean(profile.benchmark_required),
    requires_reference_voice_consent: Boolean(profile.requires_reference_voice_consent),
    requires_human_review: Boolean(profile.requires_human_review),
    blocked,
    runtime_adoption_allowed: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      candidateStatusAllowed,
      licenseReviewStatusAllowed,
      supportedLanguagesReady,
      realtimeCandidateSafe,
      runtime_connected,
      production_ready,
      voiceCloningConsentReady,
      voiceCloningHumanReviewReady,
      mossCandidateSafe,
    }),
    safe_summary_only: true,
  };
}

export function buildTtsEngineCapabilitySafeSummary(profiles = []) {
  const validations = profiles.map((profile) => validateTtsEngineCapabilityProfile(profile));

  return {
    schema: TTS_ENGINE_CAPABILITY_SAFE_SUMMARY_SCHEMA,
    engine_count: validations.length,
    candidate_count: validations.filter((item) => item.candidate_status !== "blocked").length,
    runtime_connected_count: validations.filter((item) => !item.blocked && item.runtime_connected).length,
    production_ready_count: validations.filter((item) => !item.blocked && item.production_ready).length,
    benchmark_required_count: validations.filter((item) => item.benchmark_required).length,
    blocked_count: validations.filter((item) => item.blocked).length,
    voice_consent_required_count: validations.filter(
      (item) => item.requires_reference_voice_consent,
    ).length,
    human_review_required_count: validations.filter((item) => item.requires_human_review).length,
    runtime_connected: false,
    production_readiness_claimed: false,
    runtime_readiness_claimed: false,
    safe_summary_only: true,
  };
}
