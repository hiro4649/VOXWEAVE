import {
  MULTILINGUAL_CANDIDATE_STATUSES,
  MULTILINGUAL_DIRECTIONS,
  MULTILINGUAL_FALLBACK_POLICIES,
  MULTILINGUAL_LANGUAGES,
  MULTILINGUAL_LOCALES,
  MULTILINGUAL_LOCALE_SAFE_SUMMARY_SCHEMA,
  MULTILINGUAL_SAFETY_STATUSES,
  MULTILINGUAL_SCRIPTS,
  REQUIRED_MULTILINGUAL_LOCALE_FIELDS,
} from "./multilingualLocaleSchema.js";

const LOCALES_BY_LANGUAGE = Object.freeze({
  ja: new Set(["ja-JP", "unknown"]),
  en: new Set(["en-US", "en-GB", "unknown"]),
  zh: new Set(["zh-CN", "zh-TW", "zh-HK", "unknown"]),
  ko: new Set(["ko-KR", "unknown"]),
  ar: new Set(["ar-MSA", "ar-SA", "ar-EG", "unknown"]),
  multi: new Set(["multi", "unknown"]),
  unknown: new Set(["unknown"]),
});

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(policy) {
  return REQUIRED_MULTILINGUAL_LOCALE_FIELDS.filter((field) => !hasValue(policy[field]));
}

function safeTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function containsUnsafeText(value) {
  return /(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret|authorization|model[_\s-]?path|dataset[_\s-]?path|[A-Za-z]:\\|\/private\/)/i.test(
    String(value ?? ""),
  );
}

function safeRedactedEngineId(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9._-]{3,64}$/i.test(value) &&
    !containsUnsafeText(value)
  );
}

function localeMatchesLanguage(language, locale) {
  const allowed = LOCALES_BY_LANGUAGE[language];
  return Boolean(allowed?.has(locale));
}

function buildReasonCodes(checks) {
  const reason_codes = [];
  if (checks.missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (!checks.languageAllowed) reason_codes.push("locale_language_not_allowed");
  if (checks.languageBlocked) reason_codes.push("locale_language_blocked");
  if (!checks.localeAllowed || checks.localeUnsafe) reason_codes.push("locale_value_invalid");
  if (!checks.localeLanguageReady) reason_codes.push("locale_language_mismatch");
  if (!checks.scriptAllowed) reason_codes.push("locale_script_not_allowed");
  if (checks.scriptBlocked) reason_codes.push("locale_script_blocked");
  if (!checks.directionAllowed) reason_codes.push("locale_direction_not_allowed");
  if (checks.directionBlocked) reason_codes.push("locale_direction_blocked");
  if (!checks.candidateStatusAllowed) reason_codes.push("locale_candidate_status_not_allowed");
  if (checks.candidateStatusBlocked) reason_codes.push("locale_candidate_status_blocked");
  if (!checks.fallbackPolicyAllowed) reason_codes.push("locale_fallback_policy_not_allowed");
  if (checks.fallbackPolicyBlocked) reason_codes.push("locale_fallback_policy_blocked");
  if (!checks.safetyStatusAllowed) reason_codes.push("locale_safety_status_not_allowed");
  if (checks.safetyStatusBlocked) reason_codes.push("locale_safety_status_blocked");
  if (!checks.arabicDirectionReady) reason_codes.push("arabic_locale_requires_rtl_or_unknown_direction");
  if (!checks.nonArabicRtlReady) reason_codes.push("non_arabic_rtl_requires_review_or_block");
  if (!checks.voiceConsentReady) reason_codes.push("voice_cloning_requires_reference_voice_consent");
  if (!checks.voiceReviewReady) reason_codes.push("voice_cloning_requires_human_review");
  if (!checks.codeSwitchingReviewReady) reason_codes.push("code_switching_requires_human_review");
  if (!checks.multilingualReady) reason_codes.push("multilingual_language_requires_multilingual_support");
  if (!checks.engineIdReady) reason_codes.push("engine_id_redacted_invalid");
  if (!checks.createdAtReady || !checks.updatedAtReady) reason_codes.push("locale_timestamp_invalid");
  return reason_codes;
}

export function validateMultilingualLocalePolicy(policy = {}) {
  const missing_metadata = missingRequiredFields(policy);
  const languageAllowed = MULTILINGUAL_LANGUAGES.includes(policy.language);
  const languageBlocked = policy.language === "blocked";
  const localeAllowed = MULTILINGUAL_LOCALES.includes(policy.locale);
  const localeUnsafe = containsUnsafeText(policy.locale);
  const localeLanguageReady =
    languageAllowed && !languageBlocked && localeAllowed && localeMatchesLanguage(policy.language, policy.locale);
  const scriptAllowed = MULTILINGUAL_SCRIPTS.includes(policy.script);
  const scriptBlocked = policy.script === "blocked";
  const directionAllowed = MULTILINGUAL_DIRECTIONS.includes(policy.direction);
  const directionBlocked = policy.direction === "blocked";
  const candidateStatusAllowed = MULTILINGUAL_CANDIDATE_STATUSES.includes(policy.candidate_status);
  const candidateStatusBlocked = policy.candidate_status === "blocked";
  const fallbackPolicyAllowed = MULTILINGUAL_FALLBACK_POLICIES.includes(policy.fallback_policy);
  const fallbackPolicyBlocked = policy.fallback_policy === "blocked";
  const safetyStatusAllowed = MULTILINGUAL_SAFETY_STATUSES.includes(policy.safety_status);
  const safetyStatusBlocked = policy.safety_status === "blocked";
  const isArabic = policy.language === "ar" || policy.script === "arabic";
  const arabicDirectionReady = !isArabic || policy.direction === "rtl" || policy.direction === "unknown";
  const nonArabicRtlReady =
    isArabic ||
    policy.direction !== "rtl" ||
    policy.safety_status === "review_required" ||
    policy.safety_status === "blocked";
  const voiceConsentReady =
    policy.supports_voice_cloning !== true || policy.requires_reference_voice_consent === true;
  const voiceReviewReady =
    policy.supports_voice_cloning !== true || policy.requires_human_review === true;
  const codeSwitchingReviewReady =
    !(policy.language === "multi" || policy.script === "mixed" || policy.supports_code_switching === true) ||
    policy.requires_human_review === true;
  const multilingualReady = policy.language !== "multi" || policy.supports_multilingual === true;
  const engineIdReady = safeRedactedEngineId(policy.engine_id_redacted);
  const createdAtReady = safeTimestamp(policy.created_at);
  const updatedAtReady = safeTimestamp(policy.updated_at);

  const checks = {
    missing_metadata,
    languageAllowed,
    languageBlocked,
    localeAllowed,
    localeUnsafe,
    localeLanguageReady,
    scriptAllowed,
    scriptBlocked,
    directionAllowed,
    directionBlocked,
    candidateStatusAllowed,
    candidateStatusBlocked,
    fallbackPolicyAllowed,
    fallbackPolicyBlocked,
    safetyStatusAllowed,
    safetyStatusBlocked,
    arabicDirectionReady,
    nonArabicRtlReady,
    voiceConsentReady,
    voiceReviewReady,
    codeSwitchingReviewReady,
    multilingualReady,
    engineIdReady,
    createdAtReady,
    updatedAtReady,
  };

  const blocked = Object.entries(checks).some(([key, value]) => {
    if (key === "missing_metadata") return value.length > 0;
    if (key.endsWith("Blocked") || key === "localeUnsafe") return value === true;
    return value === false;
  });

  return {
    safety_status: safetyStatusAllowed ? policy.safety_status : "blocked",
    requires_human_review: Boolean(policy.requires_human_review),
    requires_reference_voice_consent: Boolean(policy.requires_reference_voice_consent),
    supports_runtime: Boolean(policy.supports_runtime),
    supports_code_switching: Boolean(policy.supports_code_switching),
    blocked,
    runtime_ready: false,
    missing_metadata,
    reason_codes: buildReasonCodes(checks),
    safe_summary_only: true,
  };
}

export function buildMultilingualLocaleSafeSummary(policies = []) {
  const validations = policies.map((policy) => ({
    policy,
    validation: validateMultilingualLocalePolicy(policy),
  }));

  return {
    schema: MULTILINGUAL_LOCALE_SAFE_SUMMARY_SCHEMA,
    locale_policy_count: validations.length,
    candidate_count: validations.filter(
      ({ validation }) => !validation.blocked && validation.safety_status === "candidate",
    ).length,
    review_required_count: validations.filter(
      ({ validation }) =>
        !validation.blocked &&
        (validation.safety_status === "review_required" || validation.requires_human_review),
    ).length,
    approved_count: validations.filter(
      ({ validation }) => !validation.blocked && validation.safety_status === "approved",
    ).length,
    blocked_count: validations.filter(({ validation }) => validation.blocked).length,
    rtl_policy_count: validations.filter(
      ({ policy, validation }) => !validation.blocked && policy.direction === "rtl",
    ).length,
    code_switching_review_required_count: validations.filter(
      ({ policy, validation }) =>
        !validation.blocked && policy.supports_code_switching && validation.requires_human_review,
    ).length,
    voice_consent_required_count: validations.filter(
      ({ validation }) => !validation.blocked && validation.requires_reference_voice_consent,
    ).length,
    human_review_required_count: validations.filter(
      ({ validation }) => !validation.blocked && validation.requires_human_review,
    ).length,
    runtime_ready_count: validations.filter(({ validation }) => validation.runtime_ready).length,
    safe_summary_only: true,
  };
}
