import {
  REQUIRED_TTS_BENCHMARK_FIELDS,
  TTS_BENCHMARK_HUMAN_REVIEW_STATUSES,
  TTS_BENCHMARK_LICENSE_REVIEW_STATUSES,
  TTS_BENCHMARK_REFERENCE_CONSENT_STATUSES,
  TTS_BENCHMARK_SAFE_SUMMARY_SCHEMA,
  TTS_BENCHMARK_STATUSES,
  UNSAFE_TTS_BENCHMARK_FIELDS,
} from "./ttsBenchmarkSchema.js";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function isMossTtsManifest(manifest) {
  const engineId = String(manifest.engine_id ?? "").toLowerCase();
  const family = String(manifest.engine_family ?? "").toLowerCase();
  return engineId.includes("moss-tts") || family.includes("moss-tts");
}

function isVoiceReferenceBenchmark(manifest) {
  return manifest.reference_voice_consent_status !== "not_required_for_mock";
}

function findMissingMetadata(manifest) {
  return REQUIRED_TTS_BENCHMARK_FIELDS.filter((field) => !hasValue(manifest[field]));
}

function findUnsafeFields(manifest) {
  return UNSAFE_TTS_BENCHMARK_FIELDS.filter((field) => manifest[field] !== undefined);
}

function buildReasonCodes({
  missing_metadata,
  unsafe_fields_present,
  benchmarkStatusAllowed,
  licenseReviewStatusAllowed,
  referenceConsentStatusAllowed,
  humanReviewStatusAllowed,
  prohibitedRuntimeActionPresent,
  production_ready,
  completedLabClaimsProduction,
  mossCandidateSafe,
  referenceConsentReady,
  humanReviewReady,
}) {
  const reason_codes = [];
  if (missing_metadata.length > 0) reason_codes.push("required_metadata_missing");
  if (unsafe_fields_present.length > 0) reason_codes.push("unsafe_tts_benchmark_fields_present");
  if (!benchmarkStatusAllowed) reason_codes.push("benchmark_status_not_allowed");
  if (!licenseReviewStatusAllowed) reason_codes.push("license_review_status_not_allowed");
  if (!referenceConsentStatusAllowed) reason_codes.push("reference_voice_consent_status_not_allowed");
  if (!humanReviewStatusAllowed) reason_codes.push("human_review_status_not_allowed");
  if (prohibitedRuntimeActionPresent) reason_codes.push("runtime_side_effect_prohibited");
  if (production_ready) reason_codes.push("production_ready_claim_prohibited_for_benchmark_manifest");
  if (completedLabClaimsProduction) {
    reason_codes.push("completed_lab_evaluation_is_not_production_ready");
  }
  if (!mossCandidateSafe) reason_codes.push("moss_tts_benchmark_candidate_boundary_required");
  if (!referenceConsentReady) reason_codes.push("reference_voice_explicit_consent_required");
  if (!humanReviewReady) reason_codes.push("human_review_approval_required_before_runtime_adoption");
  return reason_codes;
}

export function validateTtsBenchmarkManifest(manifest = {}) {
  const missing_metadata = findMissingMetadata(manifest);
  const unsafe_fields_present = findUnsafeFields(manifest);
  const benchmarkStatusAllowed = TTS_BENCHMARK_STATUSES.includes(manifest.benchmark_status);
  const licenseReviewStatusAllowed = TTS_BENCHMARK_LICENSE_REVIEW_STATUSES.includes(
    manifest.license_review_status,
  );
  const referenceConsentStatusAllowed = TTS_BENCHMARK_REFERENCE_CONSENT_STATUSES.includes(
    manifest.reference_voice_consent_status,
  );
  const humanReviewStatusAllowed = TTS_BENCHMARK_HUMAN_REVIEW_STATUSES.includes(
    manifest.human_review_status,
  );

  const runtime_connected = Boolean(manifest.runtime_connected);
  const production_ready = Boolean(manifest.production_ready);
  const model_downloaded = Boolean(manifest.model_downloaded);
  const api_call_performed = Boolean(manifest.api_call_performed);
  const endpoint_configured = Boolean(manifest.endpoint_configured);
  const package_dependency_added = Boolean(manifest.package_dependency_added);
  const workflow_changed = Boolean(manifest.workflow_changed);
  const prohibitedRuntimeActionPresent =
    runtime_connected ||
    model_downloaded ||
    api_call_performed ||
    endpoint_configured ||
    package_dependency_added ||
    workflow_changed;
  const completedLabClaimsProduction =
    manifest.benchmark_status === "completed_lab_evaluation" && production_ready;
  const mossCandidateSafe =
    !isMossTtsManifest(manifest) ||
    ["benchmark_required", "lab_only", "separate_low_latency_candidate"].includes(
      manifest.candidate_status,
    );
  const referenceConsentReady =
    !isVoiceReferenceBenchmark(manifest) ||
    manifest.reference_voice_consent_status === "explicit_consent";
  const humanReviewReady = !["required", "pending"].includes(manifest.human_review_status);

  const blocked =
    missing_metadata.length > 0 ||
    unsafe_fields_present.length > 0 ||
    !benchmarkStatusAllowed ||
    !licenseReviewStatusAllowed ||
    !referenceConsentStatusAllowed ||
    !humanReviewStatusAllowed ||
    prohibitedRuntimeActionPresent ||
    production_ready ||
    completedLabClaimsProduction ||
    !mossCandidateSafe ||
    !referenceConsentReady ||
    !humanReviewReady;

  return {
    benchmark_status: benchmarkStatusAllowed ? manifest.benchmark_status : "blocked",
    candidate_status: String(manifest.candidate_status ?? ""),
    runtime_connected,
    production_ready,
    model_downloaded,
    api_call_performed,
    endpoint_configured,
    package_dependency_added,
    workflow_changed,
    benchmark_required: manifest.benchmark_status === "planned" || manifest.benchmark_status === "lab_only",
    human_review_required: ["required", "pending"].includes(manifest.human_review_status),
    reference_consent_required: isVoiceReferenceBenchmark(manifest),
    runtime_adoption_allowed: false,
    blocked,
    missing_metadata,
    unsafe_fields_present,
    reason_codes: buildReasonCodes({
      missing_metadata,
      unsafe_fields_present,
      benchmarkStatusAllowed,
      licenseReviewStatusAllowed,
      referenceConsentStatusAllowed,
      humanReviewStatusAllowed,
      prohibitedRuntimeActionPresent,
      production_ready,
      completedLabClaimsProduction,
      mossCandidateSafe,
      referenceConsentReady,
      humanReviewReady,
    }),
    production_readiness_claimed: false,
    runtime_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function buildTtsBenchmarkSafeSummary(manifests = []) {
  const validations = manifests.map((manifest) => validateTtsBenchmarkManifest(manifest));

  return {
    schema: TTS_BENCHMARK_SAFE_SUMMARY_SCHEMA,
    benchmark_count: validations.length,
    planned_count: validations.filter((item) => item.benchmark_status === "planned").length,
    lab_only_count: validations.filter((item) => item.benchmark_status === "lab_only").length,
    blocked_count: validations.filter((item) => item.blocked).length,
    completed_lab_evaluation_count: validations.filter(
      (item) => item.benchmark_status === "completed_lab_evaluation",
    ).length,
    runtime_connected_count: validations.filter((item) => !item.blocked && item.runtime_connected)
      .length,
    production_ready_count: validations.filter((item) => !item.blocked && item.production_ready)
      .length,
    model_downloaded_count: validations.filter((item) => !item.blocked && item.model_downloaded)
      .length,
    api_call_performed_count: validations.filter(
      (item) => !item.blocked && item.api_call_performed,
    ).length,
    benchmark_required_count: validations.filter((item) => item.benchmark_required).length,
    human_review_required_count: validations.filter((item) => item.human_review_required).length,
    reference_consent_required_count: validations.filter((item) => item.reference_consent_required)
      .length,
    safe_summary_only: true,
  };
}
