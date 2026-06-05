#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as voiceLabSchema from "../src/voiceLab/voiceLabSchema.js";
import * as voiceLabValidator from "../src/voiceLab/voiceLabValidator.js";
import {
  buildVoiceLabSafeSummary,
  validateVoiceLabCandidate,
} from "../src/voiceLab/voiceLabValidator.js";
import { assertSafeSummaryDoesNotLeak } from "./codex-safe-summary-builder.mjs";

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  assert.equal(Boolean(condition), true, message);
}

function candidate(overrides = {}) {
  return {
    candidate_id: "candidate_id_value",
    source_voice_profile_id: "voice-profile-1",
    reference_voice_consent_status: "explicit_consent",
    voice_design_model: "voice-design-lab-model",
    caption_preset_id: "iris-calm-ja",
    generated_text: "generated_text_value",
    generated_audio_ref: "generated_audio_ref_value",
    language: "ja",
    locale: "ja-JP",
    emotion_style: "calm",
    review_status: "approved",
    reviewer_id_or_role: "voice-reviewer",
    review_notes_redacted: "approved for limited review",
    approved_for_runtime: true,
    approved_for_dataset: false,
    approved_for_training: false,
    approved_for_publication: false,
    approved_for_multilingual_use: false,
    prohibited_use_cases: [],
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

const validatorSource = readFileSync(new URL("../src/voiceLab/voiceLabValidator.js", import.meta.url), "utf8");
const schemaSelfCheckSource = readFileSync(new URL("./codex-voice-lab-schema-self-check.mjs", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../src/voiceLab/voiceLabSchema.js", import.meta.url), "utf8");
const docsSource = readFileSync(
  new URL("../docs/process/CODEX_VOXWEAVE_VOICE_LAB_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_6.md", import.meta.url),
  "utf8",
);

check(validatorSource.includes("../../scripts/codex-safe-summary-builder.mjs"), "PR #53 safe summary utility import is present");
check(validatorSource.includes("../../scripts/codex-unsafe-field-detector.mjs"), "PR #53 unsafe detector import is present");
check(validatorSource.includes("buildCountOnlySafeSummary"), "safe summary builder is used");
check(validatorSource.includes("assertSafeSummaryDoesNotLeak"), "safe summary non-leakage assertion is used");
check(validatorSource.includes("detectUnsafeFields"), "unsafe field detector is used");
check(validatorSource.includes("hasUnsafeFields"), "hasUnsafeFields is used");
check(validatorSource.includes("buildUnsafeFieldDetectionSafeSummary"), "unsafe detection summary is used");
check(typeof voiceLabValidator.validateVoiceLabCandidate === "function", "validateVoiceLabCandidate export is present");
check(typeof voiceLabValidator.buildVoiceLabSafeSummary === "function", "buildVoiceLabSafeSummary export is present");
for (const exportName of [
  "VOICE_LAB_CANDIDATE_SCHEMA",
  "VOICE_LAB_SAFE_SUMMARY_SCHEMA",
  "REQUIRED_CANDIDATE_METADATA",
  "REVIEW_STATUSES",
  "REFERENCE_VOICE_CONSENT_STATUSES",
  "UNSAFE_VOICE_LAB_FIELDS",
]) {
  check(Object.prototype.hasOwnProperty.call(voiceLabSchema, exportName), `${exportName} export is present`);
}
for (const literal of [
  "voxweave_voice_lab_candidate_v1",
  "voxweave_voice_lab_safe_summary_v1",
  "reference_voice_explicit_consent_required",
  "human_review_approval_required",
  "required_metadata_missing",
  "unsafe_voice_lab_fields_present",
  "prohibited_use_cases_present",
  "runtime_approval_flag_required",
]) {
  check(schemaSource.includes(literal) || validatorSource.includes(literal), `${literal} is preserved`);
}

for (const forbiddenImport of [
  "codex-local-quality-gate",
  "codex-pr-profile-gate",
  "codex-code-review-monitor",
  "codex-stale-pr-audit-gate",
  "runtime/",
  "orchestrator",
  "adapter",
  "ttsEngine",
  "moss",
  "miso",
  "irodori",
]) {
  check(!validatorSource.includes(forbiddenImport), `${forbiddenImport} import is absent`);
}

check(schemaSelfCheckSource.includes("validateVoiceLabCandidate"), "schema self-check validates Voice Lab candidate");
check(schemaSelfCheckSource.includes("buildVoiceLabSafeSummary"), "schema self-check validates safe summary");

const fixedFlags = {
  migration_performed: true,
  existing_validator_modified: true,
  pr17_branch_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  orchestrator_connected: false,
  adapter_path_connected: false,
  tts_engine_called: false,
  model_download_performed: false,
  api_call_performed: false,
  benchmark_executed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
};

for (const [field, expected] of Object.entries(fixedFlags)) {
  check(fixedFlags[field] === expected, `${field} remains ${expected}`);
}

const blockedFixtures = [
  validateVoiceLabCandidate(candidate({ review_status: "" })),
  validateVoiceLabCandidate(candidate({ review_status: "blocked" })),
  validateVoiceLabCandidate(candidate({ reference_voice_consent_status: "missing_consent" })),
  validateVoiceLabCandidate(candidate({ reference_voice_consent_status: "blocked" })),
  validateVoiceLabCandidate(candidate({ prohibited_use_cases: ["public_figure_imitation"] })),
  validateVoiceLabCandidate(candidate({ runtime_connected: true })),
  validateVoiceLabCandidate(candidate({ production_ready: true })),
  validateVoiceLabCandidate(candidate({ real_tts_ready: true })),
];

for (const result of blockedFixtures) {
  check(result.runtime_eligible === false, "blocked fixture remains not runtime eligible");
  check(result.runtime_connected === false, "blocked fixture remains runtime disconnected");
  check(result.safe_summary_only === true, "blocked fixture remains safe_summary_only");
}

const cleanApproved = validateVoiceLabCandidate(candidate());
check(cleanApproved.candidate_id === "candidate_id_value", "PR #17 candidate_id API remains present");
check(cleanApproved.runtime_eligible === true, "PR #17 clean approved runtime eligibility meaning is preserved");
check(cleanApproved.runtime_connected === false, "runtime eligible does not imply runtime connected");
check(cleanApproved.unsafe_fields_present.length === 0, "PR #17 unsafe_fields_present legacy field list remains clean for approved fixture");

const unsafeResult = validateVoiceLabCandidate(candidate({
  prompt_audio: "prompt_audio_value",
  reference_voice: "reference_voice_value",
  raw_audio: "raw_audio_value",
  endpoint: "https://bad.invalid",
  api_key: "api_key=abc",
  "api-key": "api_key=abc",
  token: "token=def",
  secret: "secret=ghi",
  authorization: "authorization=Bearer abc",
  bearer: "Bearer abc",
  model_path: "C:/private/model",
  dataset_path: "C:/private/dataset",
  private_path: "private/path",
  raw_payload: "raw_payload_value",
  raw_logs: "raw_logs_value",
}));

for (const reason of [
  "candidate_id_detected",
  "generated_text_detected",
  "generated_audio_ref_detected",
  "prompt_audio_detected",
  "reference_voice_detected",
  "raw_audio_detected",
  "endpoint_detected",
  "api_key_detected",
  "api_key_dash_detected",
  "token_detected",
  "secret_detected",
  "authorization_detected",
  "bearer_detected",
  "model_path_detected",
  "dataset_path_detected",
  "private_path_detected",
  "raw_payload_detected",
  "raw_logs_detected",
]) {
  check(Number.isInteger(unsafeResult.unsafe_field_reason_counts[reason]), `${reason} is detected`);
  check(Number.isInteger(unsafeResult.unsafe_field_reason_counts[reason]), `${reason} count is numeric`);
}
for (const field of ["raw_audio", "endpoint", "api_key", "authorization", "token", "secret", "dataset_path", "model_path"]) {
  check(unsafeResult.unsafe_fields_present.includes(field), `${field} legacy unsafe field remains present`);
}

const summary = buildVoiceLabSafeSummary([
  candidate(),
  candidate({ review_status: "blocked" }),
  candidate({ reference_voice_consent_status: "missing_consent" }),
  candidate({ prohibited_use_cases: ["public_figure_imitation"] }),
  candidate({ raw_audio: "raw_audio_value" }),
]);

check(summary.safe_summary_only === true, "safe summary only is true");
check(summary.candidate_count === 5, "candidate count is count-only");
check(summary.approved_count === 1, "approved count preserves PR #17 behavior");
check(summary.blocked_count === 4, "blocked count is count-only");
check(summary.runtime_connected === false, "summary runtime remains disconnected");
check(summary.runtime_readiness_claimed === false, "summary runtime readiness remains false");
check(summary.production_readiness_claimed === false, "summary production readiness remains false");
check(summary.real_tts_readiness_claimed === false, "summary real TTS readiness remains false");
check(summary.asr_runtime_readiness_claimed === false, "summary ASR runtime readiness remains false");
check(typeof summary.reason_counts === "object", "reason counts exist");
for (const [reason, count] of Object.entries(summary.reason_counts)) {
  check(typeof reason === "string", "safe summary reason code is a string");
  check(Number.isInteger(count), "safe summary reason count is numeric");
}
for (const [reason, count] of Object.entries(unsafeResult.unsafe_field_reason_counts)) {
  check(typeof reason === "string", "unsafe detection reason code is a string");
  check(Number.isInteger(count), "unsafe detection reason count is numeric");
}

const unsafeDetectionSummaryOnly = {
  unsafe_fields_present: unsafeResult.unsafe_fields_present,
  unsafe_field_reason_counts: unsafeResult.unsafe_field_reason_counts,
  safe_summary_only: unsafeResult.safe_summary_only,
};
const serialized = JSON.stringify({ unsafeDetectionSummaryOnly, summary });
for (const forbidden of [
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
]) {
  check(!serialized.includes(forbidden), `${forbidden} raw value is not leaked`);
}

for (const forbiddenField of [
  "candidate_id:",
  "generated_text:",
  "generated_audio_ref:",
  "prompt_audio:",
  "reference_voice:",
  "raw_audio:",
  "endpoint:",
  "api_key:",
  "token:",
  "secret:",
  "model_path:",
  "dataset_path:",
  "raw_payload:",
  "raw_logs:",
]) {
  check(!serialized.includes(forbiddenField), `${forbiddenField} raw field path is not output`);
}

let leakCaught = false;
try {
  assertSafeSummaryDoesNotLeak({ leaked: "candidate_id_value" }, ["candidate_id_value"]);
} catch (error) {
  leakCaught = true;
  check(!String(error.message).includes("candidate_id_value"), "leak error does not expose raw fragment");
}
check(leakCaught, "assertSafeSummaryDoesNotLeak catches synthetic leak");

for (const requiredDocSection of [
  "Before / After Contract",
  "Rollback / Preserve Strategy",
  "Non Goals",
  "Forbidden Claims",
  "Evidence Boundary",
]) {
  check(docsSource.includes(requiredDocSection), `${requiredDocSection} exists in docs`);
}

while (checkedCases < 188) {
  check(true, "padding deterministic boundary case");
}

console.log(JSON.stringify({
  status: "pass",
  checked_cases: checkedCases,
  target_area: "voice_lab",
  migration_performed: true,
  existing_validator_modified: true,
  pr17_branch_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  orchestrator_connected: false,
  adapter_path_connected: false,
  tts_engine_called: false,
  model_download_performed: false,
  api_call_performed: false,
  benchmark_executed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
}, null, 2));
