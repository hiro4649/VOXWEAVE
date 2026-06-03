import {
  REFERENCE_VOICE_CONSENT_STATUSES,
  REQUIRED_CANDIDATE_METADATA,
  REVIEW_STATUSES,
  UNSAFE_VOICE_LAB_FIELDS,
  VOICE_LAB_SAFE_SUMMARY_SCHEMA,
} from "./voiceLabSchema.js";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

export function validateVoiceLabCandidate(candidate = {}) {
  const missing_metadata = REQUIRED_CANDIDATE_METADATA.filter(
    (field) => !hasValue(candidate[field]),
  );
  const unsafe_fields_present = UNSAFE_VOICE_LAB_FIELDS.filter(
    (field) => candidate[field] !== undefined,
  );
  const review_status = REVIEW_STATUSES.includes(candidate.review_status)
    ? candidate.review_status
    : "blocked";
  const reference_voice_consent_status = REFERENCE_VOICE_CONSENT_STATUSES.includes(
    candidate.reference_voice_consent_status,
  )
    ? candidate.reference_voice_consent_status
    : "blocked";

  const explicitConsent = reference_voice_consent_status === "explicit_consent";
  const approvedReview = review_status === "approved";
  const metadataComplete = missing_metadata.length === 0;
  const unsafeClean = unsafe_fields_present.length === 0;
  const approved_for_runtime = Boolean(candidate.approved_for_runtime);
  const runtime_eligible =
    approved_for_runtime && approvedReview && explicitConsent && metadataComplete && unsafeClean;
  const can_promote_to_approved = approvedReview && explicitConsent && metadataComplete && unsafeClean;

  return {
    candidate_id: String(candidate.candidate_id ?? ""),
    review_status,
    reference_voice_consent_status,
    can_promote_to_approved,
    runtime_eligible,
    runtime_connected: false,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      approvedReview,
      explicitConsent,
      metadataComplete,
      unsafeClean,
      approved_for_runtime,
    }),
    safe_summary_only: true,
  };
}

function buildReasonCodes({
  approvedReview,
  explicitConsent,
  metadataComplete,
  unsafeClean,
  approved_for_runtime,
}) {
  const reasons = [];
  if (!explicitConsent) reasons.push("reference_voice_explicit_consent_required");
  if (!approvedReview) reasons.push("human_review_approval_required");
  if (!metadataComplete) reasons.push("required_metadata_missing");
  if (!unsafeClean) reasons.push("unsafe_voice_lab_fields_present");
  if (!approved_for_runtime) reasons.push("runtime_approval_flag_required");
  return reasons;
}

export function buildVoiceLabSafeSummary(candidates = []) {
  const validations = candidates.map((candidate) => validateVoiceLabCandidate(candidate));
  const approved_count = validations.filter((item) => item.runtime_eligible).length;
  const blocked_count = validations.filter(
    (item) => item.reason_codes.length > 0 || item.unsafe_fields_present.length > 0,
  ).length;
  const review_required_count = validations.filter(
    (item) => item.review_status !== "approved" || !item.can_promote_to_approved,
  ).length;

  return {
    schema: VOICE_LAB_SAFE_SUMMARY_SCHEMA,
    candidate_count: validations.length,
    approved_count,
    review_required_count,
    blocked_count,
    voice_lab_enabled: true,
    runtime_connected: false,
    production_readiness_claimed: false,
    runtime_readiness_claimed: false,
    safe_summary_only: true,
  };
}
