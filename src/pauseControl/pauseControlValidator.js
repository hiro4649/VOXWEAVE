import {
  LIP_SYNC_BEHAVIORS,
  LIVE2D_CUES,
  PAUSE_CONTROL_SAFE_SUMMARY_SCHEMA,
  PAUSE_POSITIONS,
  PAUSE_REASONS,
  PAUSE_SAFETY_STATUSES,
  REQUIRED_PAUSE_CUE_FIELDS,
  SUBTITLE_BEHAVIORS,
  TTS_ENGINE_MAPPING_STATUSES,
  UNSAFE_PAUSE_CONTROL_FIELDS,
} from "./pauseControlSchema.js";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(cue) {
  return REQUIRED_PAUSE_CUE_FIELDS.filter((field) => !hasValue(cue[field]));
}

function unsafeFieldsPresent(cue) {
  return UNSAFE_PAUSE_CONTROL_FIELDS.filter((field) => cue[field] !== undefined);
}

function mappingPlaceholderOnly(cue) {
  if (cue.tts_engine_mapping_status !== "placeholder") return cue.tts_engine_mapping === "";
  return cue.tts_engine_mapping === "placeholder";
}

function mappingEmptyWhenNotMapped(cue) {
  return cue.tts_engine_mapping_status !== "not_mapped" || cue.tts_engine_mapping === "";
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

function isoLikeTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  durationReady,
  durationIntegerReady,
  zeroDurationReady,
  longPauseReviewReady,
  runtimeAllowedSafetyReady,
  languageReady,
  localeReady,
  createdAtReady,
  updatedAtReady,
  reasonAllowed,
  reasonBlocked,
  positionAllowed,
  subtitleAllowed,
  subtitleBlocked,
  lipSyncAllowed,
  lipSyncBlocked,
  live2dAllowed,
  live2dBlocked,
  safetyAllowed,
  safetyBlocked,
  mappingStatusAllowed,
  mappingStatusBlocked,
  mappingEmptyReady,
  mappingPlaceholderReady,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_pause_control_fields_present");
  if (!durationReady) reason_codes.push("pause_duration_invalid");
  if (!durationIntegerReady) reason_codes.push("pause_duration_must_be_integer_ms");
  if (!zeroDurationReady) reason_codes.push("zero_duration_requires_sentence_boundary");
  if (!longPauseReviewReady) reason_codes.push("long_pause_requires_human_review");
  if (!runtimeAllowedSafetyReady) {
    reason_codes.push("runtime_allowed_requires_approved_safety_status");
  }
  if (!languageReady) reason_codes.push("pause_language_invalid");
  if (!localeReady) reason_codes.push("pause_locale_invalid");
  if (!createdAtReady || !updatedAtReady) reason_codes.push("pause_timestamp_invalid");
  if (!reasonAllowed) reason_codes.push("pause_reason_not_allowed");
  if (reasonBlocked) reason_codes.push("pause_reason_blocked");
  if (!positionAllowed) reason_codes.push("pause_position_not_allowed");
  if (!subtitleAllowed) reason_codes.push("subtitle_behavior_not_allowed");
  if (subtitleBlocked) reason_codes.push("subtitle_behavior_blocked");
  if (!lipSyncAllowed) reason_codes.push("lip_sync_behavior_not_allowed");
  if (lipSyncBlocked) reason_codes.push("lip_sync_behavior_blocked");
  if (!live2dAllowed) reason_codes.push("live2d_cue_not_allowed");
  if (live2dBlocked) reason_codes.push("live2d_cue_blocked");
  if (!safetyAllowed) reason_codes.push("safety_status_not_allowed");
  if (safetyBlocked) reason_codes.push("safety_status_blocked");
  if (!mappingStatusAllowed) reason_codes.push("tts_engine_mapping_status_not_allowed");
  if (mappingStatusBlocked) reason_codes.push("tts_engine_mapping_status_blocked");
  if (!mappingEmptyReady) reason_codes.push("tts_engine_mapping_must_be_empty_when_not_mapped");
  if (!mappingPlaceholderReady) reason_codes.push("tts_engine_mapping_must_remain_placeholder");
  return reason_codes;
}

export function validatePauseCue(cue = {}) {
  const missing_metadata = missingRequiredFields(cue);
  const unsafe_fields_present = unsafeFieldsPresent(cue);
  const durationReady =
    typeof cue.duration_ms === "number" &&
    Number.isFinite(cue.duration_ms) &&
    cue.duration_ms >= 0 &&
    cue.duration_ms <= 3000;
  const durationIntegerReady = Number.isInteger(cue.duration_ms);
  const zeroDurationReady = cue.duration_ms !== 0 || cue.reason === "sentence_boundary";
  const longPauseReviewReady = !(cue.duration_ms > 1500) || cue.requires_human_review === true;
  const runtimeAllowedSafetyReady =
    cue.allowed_for_runtime !== true || cue.safety_status === "approved";
  const languageReady = safeLanguage(cue.language);
  const localeReady = safeLocale(cue.locale, cue.language);
  const createdAtReady = isoLikeTimestamp(cue.created_at);
  const updatedAtReady = isoLikeTimestamp(cue.updated_at);
  const reasonAllowed = PAUSE_REASONS.includes(cue.reason);
  const reasonBlocked = cue.reason === "blocked";
  const positionAllowed = PAUSE_POSITIONS.includes(cue.position);
  const subtitleAllowed = SUBTITLE_BEHAVIORS.includes(cue.subtitle_behavior);
  const subtitleBlocked = cue.subtitle_behavior === "blocked";
  const lipSyncAllowed = LIP_SYNC_BEHAVIORS.includes(cue.lip_sync_behavior);
  const lipSyncBlocked = cue.lip_sync_behavior === "blocked";
  const live2dAllowed = LIVE2D_CUES.includes(cue.live2d_cue);
  const live2dBlocked = cue.live2d_cue === "blocked";
  const safetyAllowed = PAUSE_SAFETY_STATUSES.includes(cue.safety_status);
  const safetyBlocked = cue.safety_status === "blocked";
  const mappingStatusAllowed = TTS_ENGINE_MAPPING_STATUSES.includes(cue.tts_engine_mapping_status);
  const mappingStatusBlocked = cue.tts_engine_mapping_status === "blocked";
  const mappingEmptyReady = mappingEmptyWhenNotMapped(cue);
  const mappingPlaceholderReady = mappingPlaceholderOnly(cue);

  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !durationReady ||
    !durationIntegerReady ||
    !zeroDurationReady ||
    !longPauseReviewReady ||
    !runtimeAllowedSafetyReady ||
    !languageReady ||
    !localeReady ||
    !createdAtReady ||
    !updatedAtReady ||
    !reasonAllowed ||
    reasonBlocked ||
    !positionAllowed ||
    !subtitleAllowed ||
    subtitleBlocked ||
    !lipSyncAllowed ||
    lipSyncBlocked ||
    !live2dAllowed ||
    live2dBlocked ||
    !safetyAllowed ||
    safetyBlocked ||
    !mappingStatusAllowed ||
    mappingStatusBlocked ||
    !mappingEmptyReady ||
    !mappingPlaceholderReady;

  return {
    reason: reasonAllowed ? cue.reason : "blocked",
    safety_status: safetyAllowed ? cue.safety_status : "blocked",
    allowed_for_runtime: Boolean(cue.allowed_for_runtime),
    requires_human_review: Boolean(cue.requires_human_review),
    blocked,
    runtime_ready: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      durationReady,
      durationIntegerReady,
      zeroDurationReady,
      longPauseReviewReady,
      runtimeAllowedSafetyReady,
      languageReady,
      localeReady,
      createdAtReady,
      updatedAtReady,
      reasonAllowed,
      reasonBlocked,
      positionAllowed,
      subtitleAllowed,
      subtitleBlocked,
      lipSyncAllowed,
      lipSyncBlocked,
      live2dAllowed,
      live2dBlocked,
      safetyAllowed,
      safetyBlocked,
      mappingStatusAllowed,
      mappingStatusBlocked,
      mappingEmptyReady,
      mappingPlaceholderReady,
    }),
    safe_summary_only: true,
  };
}

export function buildPauseControlSafeSummary(cues = []) {
  const validations = cues.map((cue) => validatePauseCue(cue));

  return {
    schema: PAUSE_CONTROL_SAFE_SUMMARY_SCHEMA,
    pause_cue_count: validations.length,
    candidate_count: validations.filter((item) => !item.blocked && item.safety_status === "candidate")
      .length,
    review_required_count: validations.filter(
      (item) => !item.blocked && item.safety_status === "review_required",
    ).length,
    approved_count: validations.filter((item) => !item.blocked && item.safety_status === "approved")
      .length,
    blocked_count: validations.filter((item) => item.blocked).length,
    long_pause_review_required_count: validations.filter(
      (item) => !item.blocked && item.requires_human_review,
    ).length,
    runtime_ready_count: validations.filter((item) => item.runtime_ready).length,
    safe_summary_only: true,
  };
}
