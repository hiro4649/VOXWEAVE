import {
  LIP_SYNC_ALIGNMENT_STATUSES,
  LIP_SYNC_CUE_SAFE_SUMMARY_SCHEMA,
  LIP_SYNC_LANGUAGES,
  LIP_SYNC_LOCALES,
  LIP_SYNC_MODES,
  LIP_SYNC_MOUTH_SHAPES,
  LIP_SYNC_SAFETY_STATUSES,
  LIP_SYNC_SOURCE_TYPES,
  REQUIRED_LIP_SYNC_CUE_FIELDS,
  UNSAFE_LIP_SYNC_CUE_FIELDS,
} from "./lipSyncCueSchema.js";

const LOCALES_BY_LANGUAGE = Object.freeze({
  ja: new Set(["ja-JP", "unknown"]),
  en: new Set(["en-US", "en-GB", "unknown"]),
  zh: new Set(["zh-CN", "zh-TW", "zh-HK", "unknown"]),
  ko: new Set(["ko-KR", "unknown"]),
  ar: new Set(["ar-MSA", "ar-SA", "ar-EG", "unknown"]),
  multi: new Set(["multi", "unknown"]),
  unknown: new Set(["unknown"]),
});

const PASSIVE_MOUTH_SHAPES = new Set(["closed", "rest", "neutral"]);

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function missingRequiredFields(cue) {
  return REQUIRED_LIP_SYNC_CUE_FIELDS.filter((field) => !hasValue(cue[field]));
}

function unsafeFieldsPresent(cue) {
  return UNSAFE_LIP_SYNC_CUE_FIELDS.filter((field) => cue[field] !== undefined);
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
    !/(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret|authorization|<[^>]+>|[ぁ-ゖァ-ヺ一-龯]|\s)/i.test(value)
  );
}

function buildReasonCodes(checks) {
  const reason_codes = [];
  if (checks.missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (checks.unsafe_fields_present.length > 0) reason_codes.push("unsafe_lip_sync_cue_fields_present");
  if (!checks.referenceReady) reason_codes.push("lip_sync_reference_invalid");
  if (!checks.languageAllowed) reason_codes.push("lip_sync_language_invalid");
  if (!checks.localeAllowed || checks.localeUnsafe) reason_codes.push("lip_sync_locale_invalid");
  if (!checks.localeLanguageReady) reason_codes.push("lip_sync_language_locale_mismatch");
  if (!checks.numericTimingReady) reason_codes.push("lip_sync_timing_numeric_fields_invalid");
  if (!checks.endAfterStartReady) reason_codes.push("lip_sync_end_before_start");
  if (!checks.durationMatchesReady) reason_codes.push("lip_sync_duration_mismatch");
  if (!checks.zeroDurationMouthReady) reason_codes.push("zero_duration_lip_sync_requires_passive_mouth_shape");
  if (!checks.longDurationReviewReady) reason_codes.push("long_lip_sync_cue_requires_human_review");
  if (!checks.intensityReady) reason_codes.push("lip_sync_intensity_invalid");
  if (!checks.zeroIntensityMouthReady) reason_codes.push("zero_intensity_lip_sync_requires_passive_mouth_shape");
  if (!checks.highIntensityReviewReady) reason_codes.push("high_intensity_lip_sync_requires_human_review");
  if (!checks.smoothingReady) reason_codes.push("lip_sync_smoothing_invalid");
  if (!checks.smoothingReviewReady) reason_codes.push("lip_sync_smoothing_requires_human_review");
  if (!checks.mouthShapeAllowed) reason_codes.push("lip_sync_mouth_shape_not_allowed");
  if (checks.mouthShapeBlocked) reason_codes.push("lip_sync_mouth_shape_blocked");
  if (!checks.sourceTypeAllowed) reason_codes.push("lip_sync_source_type_not_allowed");
  if (checks.sourceTypeBlocked) reason_codes.push("lip_sync_source_type_blocked");
  if (!checks.syncModeAllowed) reason_codes.push("lip_sync_mode_not_allowed");
  if (checks.syncModeBlocked) reason_codes.push("lip_sync_mode_blocked");
  if (!checks.subtitleAlignmentAllowed) reason_codes.push("subtitle_alignment_status_not_allowed");
  if (checks.subtitleAlignmentBlocked) reason_codes.push("subtitle_alignment_status_blocked");
  if (!checks.pauseAlignmentAllowed) reason_codes.push("pause_alignment_status_not_allowed");
  if (checks.pauseAlignmentBlocked) reason_codes.push("pause_alignment_status_blocked");
  if (!checks.live2dAlignmentAllowed) reason_codes.push("live2d_alignment_status_not_allowed");
  if (checks.live2dAlignmentBlocked) reason_codes.push("live2d_alignment_status_blocked");
  if (!checks.safetyStatusAllowed) reason_codes.push("lip_sync_safety_status_not_allowed");
  if (checks.safetyStatusBlocked) reason_codes.push("lip_sync_safety_status_blocked");
  if (!checks.runtimeApprovalReady) reason_codes.push("lip_sync_runtime_approval_requires_approved_safety_status");
  if (!checks.createdAtReady || !checks.updatedAtReady) reason_codes.push("lip_sync_timestamp_invalid");
  return reason_codes;
}

export function validateLipSyncCue(cue = {}) {
  const missing_metadata = missingRequiredFields(cue);
  const unsafe_fields_present = unsafeFieldsPresent(cue);
  const referenceReady =
    safeReference(cue.segment_ref) && safeReference(cue.subtitle_ref) && safeReference(cue.pause_cue_ref);
  const languageAllowed = LIP_SYNC_LANGUAGES.includes(cue.language);
  const localeAllowed = LIP_SYNC_LOCALES.includes(cue.locale);
  const localeUnsafe = /(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret)/i.test(
    String(cue.locale ?? ""),
  );
  const localeLanguageReady =
    languageAllowed && localeAllowed && Boolean(LOCALES_BY_LANGUAGE[cue.language]?.has(cue.locale));
  const numericTimingReady = [cue.start_ms, cue.end_ms, cue.duration_ms, cue.smoothing_ms].every(
    integerAtLeastZero,
  );
  const endAfterStartReady = !numericTimingReady || cue.end_ms >= cue.start_ms;
  const durationMatchesReady = !numericTimingReady || cue.duration_ms === cue.end_ms - cue.start_ms;
  const passiveMouthShape = PASSIVE_MOUTH_SHAPES.has(cue.mouth_shape);
  const zeroDurationMouthReady = !numericTimingReady || cue.duration_ms !== 0 || passiveMouthShape;
  const longDurationReviewReady =
    !numericTimingReady || cue.duration_ms <= 3000 || cue.requires_human_review === true;
  const intensityReady =
    typeof cue.intensity === "number" &&
    Number.isFinite(cue.intensity) &&
    cue.intensity >= 0 &&
    cue.intensity <= 1;
  const zeroIntensityMouthReady = !intensityReady || cue.intensity !== 0 || passiveMouthShape;
  const highIntensityReviewReady =
    !intensityReady || cue.intensity <= 0.85 || cue.requires_human_review === true;
  const smoothingReady = integerAtLeastZero(cue.smoothing_ms);
  const smoothingReviewReady =
    !smoothingReady || cue.smoothing_ms <= 500 || cue.requires_human_review === true;
  const mouthShapeAllowed = LIP_SYNC_MOUTH_SHAPES.includes(cue.mouth_shape);
  const mouthShapeBlocked = cue.mouth_shape === "blocked";
  const sourceTypeAllowed = LIP_SYNC_SOURCE_TYPES.includes(cue.source_type);
  const sourceTypeBlocked = cue.source_type === "blocked";
  const syncModeAllowed = LIP_SYNC_MODES.includes(cue.sync_mode);
  const syncModeBlocked = cue.sync_mode === "blocked";
  const subtitleAlignmentAllowed = LIP_SYNC_ALIGNMENT_STATUSES.includes(cue.subtitle_alignment_status);
  const subtitleAlignmentBlocked = cue.subtitle_alignment_status === "blocked";
  const pauseAlignmentAllowed = LIP_SYNC_ALIGNMENT_STATUSES.includes(cue.pause_alignment_status);
  const pauseAlignmentBlocked = cue.pause_alignment_status === "blocked";
  const live2dAlignmentAllowed = LIP_SYNC_ALIGNMENT_STATUSES.includes(cue.live2d_alignment_status);
  const live2dAlignmentBlocked = cue.live2d_alignment_status === "blocked";
  const safetyStatusAllowed = LIP_SYNC_SAFETY_STATUSES.includes(cue.safety_status);
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
    zeroDurationMouthReady,
    longDurationReviewReady,
    intensityReady,
    zeroIntensityMouthReady,
    highIntensityReviewReady,
    smoothingReady,
    smoothingReviewReady,
    mouthShapeAllowed,
    mouthShapeBlocked,
    sourceTypeAllowed,
    sourceTypeBlocked,
    syncModeAllowed,
    syncModeBlocked,
    subtitleAlignmentAllowed,
    subtitleAlignmentBlocked,
    pauseAlignmentAllowed,
    pauseAlignmentBlocked,
    live2dAlignmentAllowed,
    live2dAlignmentBlocked,
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

export function buildLipSyncCueSafeSummary(cues = []) {
  const validations = cues.map((cue) => ({
    cue,
    validation: validateLipSyncCue(cue),
  }));

  return {
    schema: LIP_SYNC_CUE_SAFE_SUMMARY_SCHEMA,
    lip_sync_cue_count: validations.length,
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
        !validation.blocked && cue.duration_ms > 3000 && validation.requires_human_review,
    ).length,
    high_intensity_review_required_count: validations.filter(
      ({ cue, validation }) =>
        !validation.blocked && cue.intensity > 0.85 && validation.requires_human_review,
    ).length,
    runtime_ready_count: validations.filter(({ validation }) => validation.runtime_ready).length,
    safe_summary_only: true,
  };
}
