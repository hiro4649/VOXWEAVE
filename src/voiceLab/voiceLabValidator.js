import {
  REFERENCE_VOICE_CONSENT_STATUSES,
  REQUIRED_CANDIDATE_METADATA,
  REVIEW_STATUSES,
  VOICE_LAB_SAFE_SUMMARY_SCHEMA,
} from "./voiceLabSchema.js";
import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
} from "../../scripts/codex-safe-summary-builder.mjs";
import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from "../../scripts/codex-unsafe-field-detector.mjs";

const FORBIDDEN_SAFE_SUMMARY_FRAGMENTS = Object.freeze([
  "candidate_id_value",
  "generated_text_value",
  "generated_audio_ref_value",
  "prompt_audio_value",
  "reference_voice_value",
  "raw_audio_value",
  "https://bad.invalid",
  "api_key=abc",
  "token=def",
  "secret=ghi",
  "authorization=Bearer abc",
  "Bearer abc",
  "C:/private/model",
  "C:/private/dataset",
  "private/path",
  "raw_payload_value",
  "raw_logs_value",
  "branch name",
  "PR body",
  "changed_files",
]);

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function hasProhibitedUseCases(candidate) {
  return Array.isArray(candidate.prohibited_use_cases)
    ? candidate.prohibited_use_cases.length > 0
    : hasValue(candidate.prohibited_use_cases);
}

function reasonCountsFromUnsafeFindings(findings) {
  return buildUnsafeFieldDetectionSafeSummary([findings]).reason_counts;
}

export function validateVoiceLabCandidate(candidate = {}) {
  const record = candidate && typeof candidate === "object" ? candidate : {};
  const missing_metadata = REQUIRED_CANDIDATE_METADATA.filter(
    (field) => !hasValue(record[field]),
  );
  const unsafeFindings = detectUnsafeFields(record);
  const unsafeDetected = hasUnsafeFields(record);
  const unsafe_field_reason_counts = reasonCountsFromUnsafeFindings(unsafeFindings);
  const review_status = REVIEW_STATUSES.includes(record.review_status)
    ? record.review_status
    : "blocked";
  const reference_voice_consent_status = REFERENCE_VOICE_CONSENT_STATUSES.includes(
    record.reference_voice_consent_status,
  )
    ? record.reference_voice_consent_status
    : "blocked";

  const explicitConsent = reference_voice_consent_status === "explicit_consent";
  const approvedReview = review_status === "approved";
  const metadataComplete = missing_metadata.length === 0;
  const unsafeClean = !unsafeDetected;
  const prohibitedUseCasesClean = !hasProhibitedUseCases(record);
  const approved_for_runtime = record.approved_for_runtime === true;
  const runtimeRequested = record.runtime_connected === true;
  const productionReadyClaimed = record.production_ready === true;
  const realTtsReadyClaimed = record.real_tts_ready === true;
  const runtime_eligible =
    approved_for_runtime &&
    approvedReview &&
    explicitConsent &&
    metadataComplete &&
    unsafeClean &&
    prohibitedUseCasesClean &&
    !runtimeRequested &&
    !productionReadyClaimed &&
    !realTtsReadyClaimed;
  const can_promote_to_approved =
    approvedReview &&
    explicitConsent &&
    metadataComplete &&
    unsafeClean &&
    prohibitedUseCasesClean &&
    !productionReadyClaimed &&
    !realTtsReadyClaimed;

  return {
    review_status,
    reference_voice_consent_status,
    can_promote_to_approved,
    runtime_eligible,
    runtime_connected: false,
    missing_metadata,
    unsafe_fields_present: Object.keys(unsafe_field_reason_counts),
    unsafe_field_reason_counts,
    reason_codes: buildReasonCodes({
      approvedReview,
      explicitConsent,
      metadataComplete,
      unsafeClean,
      prohibitedUseCasesClean,
      approved_for_runtime,
      runtimeRequested,
      productionReadyClaimed,
      realTtsReadyClaimed,
    }),
    safe_summary_only: true,
  };
}

function buildReasonCodes({
  approvedReview,
  explicitConsent,
  metadataComplete,
  unsafeClean,
  prohibitedUseCasesClean,
  approved_for_runtime,
  runtimeRequested,
  productionReadyClaimed,
  realTtsReadyClaimed,
}) {
  const reasons = [];
  if (!explicitConsent) reasons.push("reference_voice_explicit_consent_required");
  if (!approvedReview) reasons.push("human_review_approval_required");
  if (!metadataComplete) reasons.push("required_metadata_missing");
  if (!unsafeClean) reasons.push("unsafe_voice_lab_fields_present");
  if (!prohibitedUseCasesClean) reasons.push("prohibited_use_cases_present");
  if (!approved_for_runtime) reasons.push("runtime_approval_flag_required");
  if (runtimeRequested) reasons.push("runtime_connection_blocked");
  if (productionReadyClaimed) reasons.push("production_readiness_blocked");
  if (realTtsReadyClaimed) reasons.push("real_tts_readiness_blocked");
  return reasons;
}

export function buildVoiceLabSafeSummary(candidates = []) {
  const validations = Array.isArray(candidates)
    ? candidates.map((candidate) => validateVoiceLabCandidate(candidate))
    : [validateVoiceLabCandidate({})];
  const countRecords = validations.map((item) => ({
    status: item.runtime_eligible ? "approved" : item.reason_codes.length > 0 ? "blocked" : "review_required",
    approved: item.runtime_eligible,
    blocked: item.reason_codes.length > 0 || item.unsafe_fields_present.length > 0,
    review_required: item.review_status !== "approved" || !item.can_promote_to_approved,
    runtime_connected: false,
    production_ready: false,
    runtime_ready: false,
    asr_runtime_ready: false,
    reason_codes: item.reason_codes,
  }));

  const utilitySummary = buildCountOnlySafeSummary(countRecords);
  const summary = {
    schema: VOICE_LAB_SAFE_SUMMARY_SCHEMA,
    candidate_count: utilitySummary.record_count,
    approved_count: utilitySummary.approved_count,
    review_required_count: utilitySummary.review_required_count,
    blocked_count: utilitySummary.blocked_count,
    voice_lab_enabled: true,
    runtime_connected: false,
    production_readiness_claimed: false,
    runtime_readiness_claimed: false,
    real_tts_readiness_claimed: false,
    asr_runtime_readiness_claimed: false,
    safe_summary_only: true,
    reason_counts: utilitySummary.reason_counts,
    summary_schema_version: utilitySummary.summary_schema_version,
  };

  assertSafeSummaryDoesNotLeak(summary, FORBIDDEN_SAFE_SUMMARY_FRAGMENTS);
  return summary;
}
