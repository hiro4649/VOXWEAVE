import {
  LIVE2D_ALIGNMENT_STATUSES,
  LIVE2D_CUE_SAFE_SUMMARY_SCHEMA,
  LIVE2D_CUE_TYPES,
  LIVE2D_EXPRESSIONS,
  LIVE2D_LANGUAGES,
  LIVE2D_LOCALES,
  LIVE2D_MOTIONS,
  LIVE2D_PARAMETER_TARGETS,
  LIVE2D_SAFETY_STATUSES,
  LIVE2D_SOURCE_TYPES,
  LIVE2D_SYNC_MODES,
  REQUIRED_LIVE2D_CUE_FIELDS,
  UNSAFE_LIVE2D_CUE_FIELDS,
} from "./live2dCueSchema.js";

const LOCALES_BY_LANGUAGE = Object.freeze({
  ja: new Set(["ja-JP", "unknown"]),
  en: new Set(["en-US", "en-GB", "unknown"]),
  zh: new Set(["zh-CN", "zh-TW", "zh-HK", "unknown"]),
  ko: new Set(["ko-KR", "unknown"]),
  ar: new Set(["ar-MSA", "ar-SA", "ar-EG", "unknown"]),
  multi: new Set(["multi", "unknown"]),
  unknown: new Set(["unknown"]),
});

const ZERO_DURATION_CUE_TYPES = new Set(["blink", "idle", "none"]);
const ZERO_INTENSITY_CUE_TYPES = new Set(["idle", "none", "recovery"]);

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(cue) {
  return REQUIRED_LIVE2D_CUE_FIELDS.filter((field) => !hasValue(cue[field]));
}

function unsafeFieldsPresent(cue) {
  return UNSAFE_LIVE2D_CUE_FIELDS.filter((field) => cue[field] !== undefined);
}

function integerAtLeastZero(value) {
  return Number.isInteger(value) && value >= 0;
}

function safeTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function safeReference(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9._:-]{3,64}$/i.test(value) &&
    !/(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret|authorization|<[^>]+>|[ぁ-ゖァ-ヺ一-龯]|\s|[A-Za-z]:\\|\/)/i.test(value)
  );
}

function buildReasonCodes(checks) {
  const reason_codes = [];
  if (checks.missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (checks.unsafe_fields_present.length > 0) reason_codes.push("unsafe_live2d_cue_fields_present");
  if (!checks.referenceReady) reason_codes.push("live2d_reference_invalid");
  if (!checks.languageAllowed) reason_codes.push("live2d_language_invalid");
  if (!checks.localeAllowed || checks.localeUnsafe) reason_codes.push("live2d_locale_invalid");
  if (!checks.localeLanguageReady) reason_codes.push("live2d_language_locale_mismatch");
  if (!checks.numericTimingReady) reason_codes.push("live2d_timing_numeric_fields_invalid");
  if (!checks.endAfterStartReady) reason_codes.push("live2d_end_before_start");
  if (!checks.durationMatchesReady) reason_codes.push("live2d_duration_mismatch");
  if (!checks.zeroDurationCueReady) reason_codes.push("zero_duration_live2d_requires_instant_or_idle_cue_type");
  if (!checks.longDurationReviewReady) reason_codes.push("long_live2d_cue_requires_human_review");
  if (!checks.intensityReady) reason_codes.push("live2d_intensity_invalid");
  if (!checks.zeroIntensityCueReady) reason_codes.push("zero_intensity_live2d_requires_idle_none_or_recovery");
  if (!checks.highIntensityReviewReady) reason_codes.push("high_intensity_live2d_requires_human_review");
  if (!checks.transitionReviewReady) reason_codes.push("live2d_transition_requires_human_review");
  if (!checks.recoveryReady) reason_codes.push("live2d_high_intensity_requires_recovery");
  if (!checks.cueTypeAllowed) reason_codes.push("live2d_cue_type_not_allowed");
  if (checks.cueTypeBlocked) reason_codes.push("live2d_cue_type_blocked");
  if (!checks.expressionAllowed) reason_codes.push("live2d_expression_not_allowed");
  if (checks.expressionBlocked) reason_codes.push("live2d_expression_blocked");
  if (!checks.motionAllowed) reason_codes.push("live2d_motion_not_allowed");
  if (checks.motionBlocked) reason_codes.push("live2d_motion_blocked");
  if (!checks.parameterTargetAllowed) reason_codes.push("live2d_parameter_target_not_allowed");
  if (checks.parameterTargetBlocked) reason_codes.push("live2d_parameter_target_blocked");
  if (!checks.sourceTypeAllowed) reason_codes.push("live2d_source_type_not_allowed");
  if (checks.sourceTypeBlocked) reason_codes.push("live2d_source_type_blocked");
  if (!checks.syncModeAllowed) reason_codes.push("live2d_sync_mode_not_allowed");
  if (checks.syncModeBlocked) reason_codes.push("live2d_sync_mode_blocked");
  if (!checks.subtitleAlignmentAllowed) reason_codes.push("subtitle_alignment_status_not_allowed");
  if (checks.subtitleAlignmentBlocked) reason_codes.push("subtitle_alignment_status_blocked");
  if (!checks.pauseAlignmentAllowed) reason_codes.push("pause_alignment_status_not_allowed");
  if (checks.pauseAlignmentBlocked) reason_codes.push("pause_alignment_status_blocked");
  if (!checks.lipSyncAlignmentAllowed) reason_codes.push("lip_sync_alignment_status_not_allowed");
  if (checks.lipSyncAlignmentBlocked) reason_codes.push("lip_sync_alignment_status_blocked");
  if (!checks.safetyStatusAllowed) reason_codes.push("live2d_safety_status_not_allowed");
  if (checks.safetyStatusBlocked) reason_codes.push("live2d_safety_status_blocked");
  if (!checks.runtimeApprovalReady) reason_codes.push("live2d_runtime_approval_requires_approved_safety_status");
  if (!checks.createdAtReady || !checks.updatedAtReady) reason_codes.push("live2d_timestamp_invalid");
  return reason_codes;
}

export function validateLive2dCue(cue = {}) {
  const missing_metadata = missingRequiredFields(cue);
  const unsafe_fields_present = unsafeFieldsPresent(cue);
  const referenceReady =
    safeReference(cue.segment_ref) &&
    safeReference(cue.subtitle_ref) &&
    safeReference(cue.pause_cue_ref) &&
    safeReference(cue.lip_sync_ref);
  const languageAllowed = LIVE2D_LANGUAGES.includes(cue.language);
  const localeAllowed = LIVE2D_LOCALES.includes(cue.locale);
  const localeUnsafe = /(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret)/i.test(
    String(cue.locale ?? ""),
  );
  const localeLanguageReady =
    languageAllowed && localeAllowed && Boolean(LOCALES_BY_LANGUAGE[cue.language]?.has(cue.locale));
  const numericTimingReady = [
    cue.start_ms,
    cue.end_ms,
    cue.duration_ms,
    cue.transition_ms,
    cue.recovery_ms,
  ].every(integerAtLeastZero);
  const endAfterStartReady = !numericTimingReady || cue.end_ms >= cue.start_ms;
  const durationMatchesReady = !numericTimingReady || cue.duration_ms === cue.end_ms - cue.start_ms;
  const zeroDurationCueReady =
    !numericTimingReady || cue.duration_ms !== 0 || ZERO_DURATION_CUE_TYPES.has(cue.cue_type);
  const longDurationReviewReady =
    !numericTimingReady || cue.duration_ms <= 5000 || cue.requires_human_review === true;
  const intensityReady =
    typeof cue.intensity === "number" &&
    Number.isFinite(cue.intensity) &&
    cue.intensity >= 0 &&
    cue.intensity <= 1;
  const zeroIntensityCueReady =
    !intensityReady || cue.intensity !== 0 || ZERO_INTENSITY_CUE_TYPES.has(cue.cue_type);
  const highIntensityReviewReady =
    !intensityReady || cue.intensity <= 0.85 || cue.requires_human_review === true;
  const transitionReviewReady =
    !numericTimingReady || cue.transition_ms <= 1000 || cue.requires_human_review === true;
  const recoveryReady = !intensityReady || cue.intensity <= 0.85 || cue.recovery_ms > 0;
  const cueTypeAllowed = LIVE2D_CUE_TYPES.includes(cue.cue_type);
  const cueTypeBlocked = cue.cue_type === "blocked";
  const expressionAllowed = LIVE2D_EXPRESSIONS.includes(cue.expression);
  const expressionBlocked = cue.expression === "blocked";
  const motionAllowed = LIVE2D_MOTIONS.includes(cue.motion);
  const motionBlocked = cue.motion === "blocked";
  const parameterTargetAllowed = LIVE2D_PARAMETER_TARGETS.includes(cue.parameter_target);
  const parameterTargetBlocked = cue.parameter_target === "blocked";
  const sourceTypeAllowed = LIVE2D_SOURCE_TYPES.includes(cue.source_type);
  const sourceTypeBlocked = cue.source_type === "blocked";
  const syncModeAllowed = LIVE2D_SYNC_MODES.includes(cue.sync_mode);
  const syncModeBlocked = cue.sync_mode === "blocked";
  const subtitleAlignmentAllowed = LIVE2D_ALIGNMENT_STATUSES.includes(cue.subtitle_alignment_status);
  const subtitleAlignmentBlocked = cue.subtitle_alignment_status === "blocked";
  const pauseAlignmentAllowed = LIVE2D_ALIGNMENT_STATUSES.includes(cue.pause_alignment_status);
  const pauseAlignmentBlocked = cue.pause_alignment_status === "blocked";
  const lipSyncAlignmentAllowed = LIVE2D_ALIGNMENT_STATUSES.includes(cue.lip_sync_alignment_status);
  const lipSyncAlignmentBlocked = cue.lip_sync_alignment_status === "blocked";
  const safetyStatusAllowed = LIVE2D_SAFETY_STATUSES.includes(cue.safety_status);
  const safetyStatusBlocked = cue.safety_status === "blocked";
  const runtimeApprovalReady = cue.approved_for_runtime !== true || cue.safety_status === "approved";
  const createdAtReady = safeTimestamp(cue.created_at);
  const updatedAtReady = safeTimestamp(cue.updated_at);

  const checks = {
    missing_metadata,
    unsafe_fields_present,
    referenceReady,
    languageAllowed,
    localeAllowed,
    localeUnsafe,
    localeLanguageReady,
    numericTimingReady,
    endAfterStartReady,
    durationMatchesReady,
    zeroDurationCueReady,
    longDurationReviewReady,
    intensityReady,
    zeroIntensityCueReady,
    highIntensityReviewReady,
    transitionReviewReady,
    recoveryReady,
    cueTypeAllowed,
    cueTypeBlocked,
    expressionAllowed,
    expressionBlocked,
    motionAllowed,
    motionBlocked,
    parameterTargetAllowed,
    parameterTargetBlocked,
    sourceTypeAllowed,
    sourceTypeBlocked,
    syncModeAllowed,
    syncModeBlocked,
    subtitleAlignmentAllowed,
    subtitleAlignmentBlocked,
    pauseAlignmentAllowed,
    pauseAlignmentBlocked,
    lipSyncAlignmentAllowed,
    lipSyncAlignmentBlocked,
    safetyStatusAllowed,
    safetyStatusBlocked,
    runtimeApprovalReady,
    createdAtReady,
    updatedAtReady,
  };

  const blocked = Object.entries(checks).some(([key, value]) => {
    if (key === "missing_metadata" || key === "unsafe_fields_present") return value.length > 0;
    if (key.endsWith("Blocked") || key === "localeUnsafe") return value === true;
    return value === false;
  });

  return {
    safety_status: safetyStatusAllowed ? cue.safety_status : "blocked",
    requires_human_review: Boolean(cue.requires_human_review),
    approved_for_runtime: Boolean(cue.approved_for_runtime),
    blocked,
    runtime_ready: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes(checks),
    safe_summary_only: true,
  };
}

export function buildLive2dCueSafeSummary(cues = []) {
  const validations = cues.map((cue) => ({
    cue,
    validation: validateLive2dCue(cue),
  }));

  return {
    schema: LIVE2D_CUE_SAFE_SUMMARY_SCHEMA,
    live2d_cue_count: validations.length,
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
    long_cue_review_required_count: validations.filter(
      ({ cue, validation }) =>
        !validation.blocked && cue.duration_ms > 5000 && validation.requires_human_review,
    ).length,
    high_intensity_review_required_count: validations.filter(
      ({ cue, validation }) =>
        !validation.blocked && cue.intensity > 0.85 && validation.requires_human_review,
    ).length,
    recovery_required_count: validations.filter(
      ({ cue, validation }) => !validation.blocked && cue.intensity > 0.85 && cue.recovery_ms > 0,
    ).length,
    runtime_ready_count: validations.filter(({ validation }) => validation.runtime_ready).length,
    safe_summary_only: true,
  };
}
