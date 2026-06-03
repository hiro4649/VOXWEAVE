import {
  PRONUNCIATION_ENGINE_MAPPING_STATUSES,
  PRONUNCIATION_HINT_SAFE_SUMMARY_SCHEMA,
  PRONUNCIATION_HINT_SAFETY_STATUSES,
  PRONUNCIATION_HINT_SCRIPTS,
  PRONUNCIATION_HINT_SOURCES,
  PRONUNCIATION_HINT_TYPES,
  REQUIRED_PRONUNCIATION_HINT_FIELDS,
  UNSAFE_PRONUNCIATION_HINT_FIELDS,
} from "./pronunciationHintSchema.js";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(hint) {
  return REQUIRED_PRONUNCIATION_HINT_FIELDS.filter((field) => !hasValue(hint[field]));
}

function unsafeFieldsPresent(hint) {
  return UNSAFE_PRONUNCIATION_HINT_FIELDS.filter((field) => hint[field] !== undefined);
}

function safeLanguage(value) {
  return typeof value === "string" && /^[a-z-]{2,8}$/.test(value);
}

function safeLocale(value, language) {
  return (
    typeof value === "string" &&
    (value === language || /^[a-z]{2,8}(-[A-Z0-9]{2,8})?$/.test(value))
  );
}

function safeTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function containsUnsafeText(value) {
  return /(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret|authorization)/i.test(
    String(value ?? ""),
  );
}

function hintValueReadiness(hint) {
  const value = String(hint.hint_value ?? "");
  const hintValueUnsafeReady = !containsUnsafeText(value);
  let hintValueFormatReady = true;
  if (hint.hint_type === "ipa") hintValueFormatReady = /^[\p{L}\p{M}\sˈˌ.:\-]+$/u.test(value);
  if (hint.hint_type === "pinyin") {
    hintValueFormatReady = /^[A-Za-z0-9\s:üÜāēīōūáéíóúǎěǐǒǔàèìòùüńňǹ'-]+$/u.test(value);
  }
  if (hint.hint_type === "kana") hintValueFormatReady = /^[ぁ-ゖァ-ヺー・\s]+$/u.test(value);
  if (hint.hint_type === "alias") hintValueFormatReady = /^[\p{L}\p{N}\s._-]{1,64}$/u.test(value);
  if (hint.hint_type === "phoneme") hintValueFormatReady = /^[A-Za-z0-9\s._-]{1,128}$/u.test(value);
  return { hintValueFormatReady, hintValueUnsafeReady };
}

function mappingReadiness(hint) {
  return {
    mappingPlaceholderReady:
      hint.engine_mapping_status !== "placeholder" || hint.engine_mapping === "placeholder",
    mappingNotMappedReady:
      hint.engine_mapping_status !== "not_mapped" || hint.engine_mapping === "",
    mappingBlockedReady:
      hint.engine_mapping_status !== "blocked" || hint.engine_mapping === "",
  };
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  hintTypeAllowed,
  hintTypeBlocked,
  sourceAllowed,
  sourceBlocked,
  scriptAllowed,
  scriptBlocked,
  safetyAllowed,
  safetyBlocked,
  mappingStatusAllowed,
  mappingStatusBlocked,
  confidenceReady,
  lowConfidenceReviewReady,
  runtimeApprovedSafetyReady,
  hintValueFormatReady,
  hintValueUnsafeReady,
  phonemeReviewReady,
  languageReady,
  localeReady,
  createdAtReady,
  updatedAtReady,
  mappingPlaceholderReady,
  mappingNotMappedReady,
  mappingBlockedReady,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_pronunciation_hint_fields_present");
  if (!hintTypeAllowed) reason_codes.push("hint_type_not_allowed");
  if (hintTypeBlocked) reason_codes.push("hint_type_blocked");
  if (!sourceAllowed) reason_codes.push("hint_source_not_allowed");
  if (sourceBlocked) reason_codes.push("hint_source_blocked");
  if (!scriptAllowed) reason_codes.push("hint_script_not_allowed");
  if (scriptBlocked) reason_codes.push("hint_script_blocked");
  if (!safetyAllowed) reason_codes.push("hint_safety_status_not_allowed");
  if (safetyBlocked) reason_codes.push("hint_safety_status_blocked");
  if (!mappingStatusAllowed) reason_codes.push("engine_mapping_status_not_allowed");
  if (mappingStatusBlocked) reason_codes.push("engine_mapping_status_blocked");
  if (!confidenceReady) reason_codes.push("hint_confidence_invalid");
  if (!lowConfidenceReviewReady) reason_codes.push("low_confidence_requires_human_review");
  if (!runtimeApprovedSafetyReady) reason_codes.push("runtime_approval_requires_approved_safety_status");
  if (!hintValueFormatReady) reason_codes.push("pronunciation_hint_value_invalid");
  if (!hintValueUnsafeReady) reason_codes.push("unsafe_pronunciation_hint_value");
  if (!phonemeReviewReady) reason_codes.push("phoneme_hint_requires_human_review");
  if (!languageReady) reason_codes.push("pronunciation_language_invalid");
  if (!localeReady) reason_codes.push("pronunciation_locale_invalid");
  if (!createdAtReady || !updatedAtReady) reason_codes.push("pronunciation_timestamp_invalid");
  if (!mappingPlaceholderReady) reason_codes.push("engine_mapping_must_remain_placeholder");
  if (!mappingNotMappedReady) reason_codes.push("engine_mapping_must_be_empty_when_not_mapped");
  if (!mappingBlockedReady) reason_codes.push("engine_mapping_must_be_empty_when_blocked");
  return reason_codes;
}

export function validatePronunciationHint(hint = {}) {
  const missing_metadata = missingRequiredFields(hint);
  const unsafe_fields_present = unsafeFieldsPresent(hint);
  const hintTypeAllowed = PRONUNCIATION_HINT_TYPES.includes(hint.hint_type);
  const hintTypeBlocked = hint.hint_type === "blocked";
  const sourceAllowed = PRONUNCIATION_HINT_SOURCES.includes(hint.source);
  const sourceBlocked = hint.source === "blocked";
  const scriptAllowed = PRONUNCIATION_HINT_SCRIPTS.includes(hint.script);
  const scriptBlocked = hint.script === "blocked";
  const safetyAllowed = PRONUNCIATION_HINT_SAFETY_STATUSES.includes(hint.safety_status);
  const safetyBlocked = hint.safety_status === "blocked";
  const mappingStatusAllowed = PRONUNCIATION_ENGINE_MAPPING_STATUSES.includes(
    hint.engine_mapping_status,
  );
  const mappingStatusBlocked = hint.engine_mapping_status === "blocked";
  const confidenceReady =
    typeof hint.confidence === "number" &&
    Number.isFinite(hint.confidence) &&
    hint.confidence >= 0 &&
    hint.confidence <= 1;
  const lowConfidenceReviewReady = !(hint.confidence < 0.75) || hint.requires_human_review === true;
  const runtimeApprovedSafetyReady =
    hint.approved_for_runtime !== true || hint.safety_status === "approved";
  const { hintValueFormatReady, hintValueUnsafeReady } = hintValueReadiness(hint);
  const phonemeReviewReady = hint.hint_type !== "phoneme" || hint.requires_human_review === true;
  const languageReady = safeLanguage(hint.language);
  const localeReady = safeLocale(hint.locale, hint.language);
  const createdAtReady = safeTimestamp(hint.created_at);
  const updatedAtReady = safeTimestamp(hint.updated_at);
  const {
    mappingPlaceholderReady,
    mappingNotMappedReady,
    mappingBlockedReady,
  } = mappingReadiness(hint);

  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !hintTypeAllowed ||
    hintTypeBlocked ||
    !sourceAllowed ||
    sourceBlocked ||
    !scriptAllowed ||
    scriptBlocked ||
    !safetyAllowed ||
    safetyBlocked ||
    !mappingStatusAllowed ||
    mappingStatusBlocked ||
    !confidenceReady ||
    !lowConfidenceReviewReady ||
    !runtimeApprovedSafetyReady ||
    !hintValueFormatReady ||
    !hintValueUnsafeReady ||
    !phonemeReviewReady ||
    !languageReady ||
    !localeReady ||
    !createdAtReady ||
    !updatedAtReady ||
    !mappingPlaceholderReady ||
    !mappingNotMappedReady ||
    !mappingBlockedReady;

  return {
    hint_type: hintTypeAllowed ? hint.hint_type : "blocked",
    safety_status: safetyAllowed ? hint.safety_status : "blocked",
    approved_for_runtime: Boolean(hint.approved_for_runtime),
    requires_human_review: Boolean(hint.requires_human_review),
    blocked,
    runtime_ready: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      hintTypeAllowed,
      hintTypeBlocked,
      sourceAllowed,
      sourceBlocked,
      scriptAllowed,
      scriptBlocked,
      safetyAllowed,
      safetyBlocked,
      mappingStatusAllowed,
      mappingStatusBlocked,
      confidenceReady,
      lowConfidenceReviewReady,
      runtimeApprovedSafetyReady,
      hintValueFormatReady,
      hintValueUnsafeReady,
      phonemeReviewReady,
      languageReady,
      localeReady,
      createdAtReady,
      updatedAtReady,
      mappingPlaceholderReady,
      mappingNotMappedReady,
      mappingBlockedReady,
    }),
    safe_summary_only: true,
  };
}

export function buildPronunciationHintSafeSummary(hints = []) {
  const validations = hints.map((hint) => validatePronunciationHint(hint));

  return {
    schema: PRONUNCIATION_HINT_SAFE_SUMMARY_SCHEMA,
    hint_count: validations.length,
    candidate_count: validations.filter((item) => !item.blocked && item.safety_status === "candidate")
      .length,
    review_required_count: validations.filter(
      (item) =>
        !item.blocked && (item.safety_status === "review_required" || item.requires_human_review),
    ).length,
    approved_count: validations.filter((item) => !item.blocked && item.safety_status === "approved")
      .length,
    blocked_count: validations.filter((item) => item.blocked).length,
    runtime_ready_count: validations.filter((item) => item.runtime_ready).length,
    human_review_required_count: validations.filter(
      (item) => !item.blocked && item.requires_human_review,
    ).length,
    safe_summary_only: true,
  };
}
