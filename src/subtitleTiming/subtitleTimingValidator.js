import {
  REQUIRED_SUBTITLE_TIMING_FIELDS,
  SUBTITLE_ALIGNMENT_STATUSES,
  SUBTITLE_BEHAVIORS,
  SUBTITLE_DIRECTIONS,
  SUBTITLE_LANGUAGES,
  SUBTITLE_LOCALES,
  SUBTITLE_READING_SPEED_LABELS,
  SUBTITLE_SAFETY_STATUSES,
  SUBTITLE_SCRIPTS,
  SUBTITLE_TIMING_SAFE_SUMMARY_SCHEMA,
  UNSAFE_SUBTITLE_TIMING_FIELDS,
} from "./subtitleTimingSchema.js";

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

function missingRequiredFields(segment) {
  return REQUIRED_SUBTITLE_TIMING_FIELDS.filter((field) => !hasValue(segment[field]));
}

function unsafeFieldsPresent(segment) {
  return UNSAFE_SUBTITLE_TIMING_FIELDS.filter((field) => segment[field] !== undefined);
}

function safeTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
}

function safeTextRef(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9._:-]{3,80}$/i.test(value) &&
    !/(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret|authorization|\s{2,})/i.test(value)
  );
}

function integerAtLeastZero(value) {
  return Number.isInteger(value) && value >= 0;
}

function buildReasonCodes(checks) {
  const reason_codes = [];
  if (checks.missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (checks.unsafe_fields_present.length > 0) reason_codes.push("unsafe_subtitle_timing_fields_present");
  if (!checks.numericTimingReady) reason_codes.push("subtitle_timing_numeric_fields_invalid");
  if (!checks.endAfterStartReady) reason_codes.push("subtitle_end_before_start");
  if (!checks.durationMatchesReady) reason_codes.push("subtitle_duration_mismatch");
  if (!checks.zeroDurationBehaviorReady) reason_codes.push("zero_duration_subtitle_requires_hidden_or_hold_behavior");
  if (!checks.longDurationReviewReady) reason_codes.push("long_subtitle_segment_requires_human_review");
  if (!checks.maxCharsReady) reason_codes.push("max_chars_per_segment_invalid");
  if (!checks.textRefReady) reason_codes.push("subtitle_text_ref_invalid");
  if (!checks.languageAllowed) reason_codes.push("subtitle_language_not_allowed");
  if (!checks.localeAllowed || checks.localeUnsafe) reason_codes.push("subtitle_locale_invalid");
  if (!checks.localeLanguageReady) reason_codes.push("subtitle_locale_language_mismatch");
  if (!checks.scriptAllowed) reason_codes.push("subtitle_script_not_allowed");
  if (!checks.directionAllowed) reason_codes.push("subtitle_direction_not_allowed");
  if (!checks.rtlReady) reason_codes.push("rtl_subtitle_requires_arabic_or_human_review");
  if (!checks.readingSpeedAllowed) reason_codes.push("subtitle_reading_speed_not_allowed");
  if (checks.readingSpeedBlocked) reason_codes.push("subtitle_reading_speed_blocked");
  if (!checks.subtitleBehaviorAllowed) reason_codes.push("subtitle_behavior_not_allowed");
  if (checks.subtitleBehaviorBlocked) reason_codes.push("subtitle_behavior_blocked");
  if (!checks.pauseAlignmentAllowed) reason_codes.push("pause_alignment_status_not_allowed");
  if (checks.pauseAlignmentBlocked) reason_codes.push("pause_alignment_status_blocked");
  if (!checks.lipSyncAlignmentAllowed) reason_codes.push("lip_sync_alignment_status_not_allowed");
  if (checks.lipSyncAlignmentBlocked) reason_codes.push("lip_sync_alignment_status_blocked");
  if (!checks.live2dAlignmentAllowed) reason_codes.push("live2d_alignment_status_not_allowed");
  if (checks.live2dAlignmentBlocked) reason_codes.push("live2d_alignment_status_blocked");
  if (!checks.safetyStatusAllowed) reason_codes.push("subtitle_safety_status_not_allowed");
  if (checks.safetyStatusBlocked) reason_codes.push("subtitle_safety_status_blocked");
  if (!checks.runtimeApprovalReady) reason_codes.push("subtitle_runtime_approval_requires_approved_safety_status");
  if (!checks.createdAtReady || !checks.updatedAtReady) reason_codes.push("subtitle_timestamp_invalid");
  return reason_codes;
}

export function validateSubtitleTimingSegment(segment = {}) {
  const missing_metadata = missingRequiredFields(segment);
  const unsafe_fields_present = unsafeFieldsPresent(segment);
  const numericTimingReady = [
    segment.start_ms,
    segment.end_ms,
    segment.duration_ms,
    segment.pause_before_ms,
    segment.pause_after_ms,
  ].every(integerAtLeastZero);
  const endAfterStartReady =
    !numericTimingReady || segment.end_ms >= segment.start_ms;
  const durationMatchesReady =
    !numericTimingReady || segment.duration_ms === segment.end_ms - segment.start_ms;
  const zeroDurationBehaviorReady =
    !numericTimingReady ||
    segment.duration_ms !== 0 ||
    segment.subtitle_behavior === "hide" ||
    segment.subtitle_behavior === "hold_previous_segment";
  const longDurationReviewReady =
    !numericTimingReady || segment.duration_ms <= 8000 || segment.requires_human_review === true;
  const maxCharsReady =
    Number.isInteger(segment.max_chars_per_segment) &&
    segment.max_chars_per_segment >= 1 &&
    segment.max_chars_per_segment <= 80;
  const textRefReady = safeTextRef(segment.text_ref);
  const languageAllowed = SUBTITLE_LANGUAGES.includes(segment.language);
  const localeAllowed = SUBTITLE_LOCALES.includes(segment.locale);
  const localeUnsafe = /(https?:\/\/|endpoint\s*[=:]|api[_-]?key|token|secret)/i.test(
    String(segment.locale ?? ""),
  );
  const localeLanguageReady =
    languageAllowed && localeAllowed && Boolean(LOCALES_BY_LANGUAGE[segment.language]?.has(segment.locale));
  const scriptAllowed = SUBTITLE_SCRIPTS.includes(segment.script);
  const directionAllowed = SUBTITLE_DIRECTIONS.includes(segment.direction);
  const rtlReady =
    segment.direction !== "rtl" ||
    segment.script === "arabic" ||
    segment.language === "ar" ||
    segment.requires_human_review === true;
  const readingSpeedAllowed = SUBTITLE_READING_SPEED_LABELS.includes(segment.reading_speed_label);
  const readingSpeedBlocked = segment.reading_speed_label === "blocked";
  const subtitleBehaviorAllowed = SUBTITLE_BEHAVIORS.includes(segment.subtitle_behavior);
  const subtitleBehaviorBlocked = segment.subtitle_behavior === "blocked";
  const pauseAlignmentAllowed = SUBTITLE_ALIGNMENT_STATUSES.includes(segment.pause_alignment_status);
  const pauseAlignmentBlocked = segment.pause_alignment_status === "blocked";
  const lipSyncAlignmentAllowed = SUBTITLE_ALIGNMENT_STATUSES.includes(segment.lip_sync_alignment_status);
  const lipSyncAlignmentBlocked = segment.lip_sync_alignment_status === "blocked";
  const live2dAlignmentAllowed = SUBTITLE_ALIGNMENT_STATUSES.includes(segment.live2d_alignment_status);
  const live2dAlignmentBlocked = segment.live2d_alignment_status === "blocked";
  const safetyStatusAllowed = SUBTITLE_SAFETY_STATUSES.includes(segment.safety_status);
  const safetyStatusBlocked = segment.safety_status === "blocked";
  const runtimeApprovalReady =
    segment.approved_for_runtime !== true || segment.safety_status === "approved";
  const createdAtReady = safeTimestamp(segment.created_at);
  const updatedAtReady = safeTimestamp(segment.updated_at);

  const checks = {
    missing_metadata,
    unsafe_fields_present,
    numericTimingReady,
    endAfterStartReady,
    durationMatchesReady,
    zeroDurationBehaviorReady,
    longDurationReviewReady,
    maxCharsReady,
    textRefReady,
    languageAllowed,
    localeAllowed,
    localeUnsafe,
    localeLanguageReady,
    scriptAllowed,
    directionAllowed,
    rtlReady,
    readingSpeedAllowed,
    readingSpeedBlocked,
    subtitleBehaviorAllowed,
    subtitleBehaviorBlocked,
    pauseAlignmentAllowed,
    pauseAlignmentBlocked,
    lipSyncAlignmentAllowed,
    lipSyncAlignmentBlocked,
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
    safety_status: safetyStatusAllowed ? segment.safety_status : "blocked",
    direction: directionAllowed ? segment.direction : "unknown",
    requires_human_review: Boolean(segment.requires_human_review),
    approved_for_runtime: Boolean(segment.approved_for_runtime),
    blocked,
    runtime_ready: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes(checks),
    safe_summary_only: true,
  };
}

export function buildSubtitleTimingSafeSummary(segments = []) {
  const validations = segments.map((segment) => ({
    segment,
    validation: validateSubtitleTimingSegment(segment),
  }));

  return {
    schema: SUBTITLE_TIMING_SAFE_SUMMARY_SCHEMA,
    subtitle_segment_count: validations.length,
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
    rtl_segment_count: validations.filter(
      ({ segment, validation }) => !validation.blocked && segment.direction === "rtl",
    ).length,
    long_segment_review_required_count: validations.filter(
      ({ segment, validation }) =>
        !validation.blocked && segment.duration_ms > 8000 && validation.requires_human_review,
    ).length,
    runtime_ready_count: validations.filter(({ validation }) => validation.runtime_ready).length,
    safe_summary_only: true,
  };
}
