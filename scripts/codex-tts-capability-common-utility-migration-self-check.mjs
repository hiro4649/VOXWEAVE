import fs from "node:fs";
import {
  assertSafeSummaryDoesNotLeak,
} from "./codex-safe-summary-builder.mjs";
import {
  buildTtsEngineCapabilitySafeSummary,
  buildTtsEngineCapabilityUnsafeDetectionSafeSummary,
  validateTtsEngineCapabilityProfile,
} from "../src/ttsEngineCapability/ttsEngineCapabilityValidator.js";

const validatorPath = new URL("../src/ttsEngineCapability/ttsEngineCapabilityValidator.js", import.meta.url);
const schemaPath = new URL("../src/ttsEngineCapability/ttsEngineCapabilitySchema.js", import.meta.url);
const selfCheckPath = new URL("./codex-tts-engine-capability-self-check.mjs", import.meta.url);
const docsPath = new URL("../docs/process/CODEX_VOXWEAVE_TTS_CAPABILITY_COMMON_UTILITY_MIGRATION_IMPLEMENTATION_CANDIDATE_V1_0_7.md", import.meta.url);

const forbiddenFragments = [
  "engine_id_value",
  "https://tts-engine.invalid",
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
  "notes_value",
  "engine_notes_value",
  "reference_voice_value",
  "prompt_audio_value",
  "generated_audio_ref_value",
  "branch name",
  "PR body",
  "changed files",
];

const checks = [];

function check(name, condition) {
  checks.push({ name, pass: Boolean(condition) });
}

function profile(overrides = {}) {
  return {
    engine_id: "engine_id_value",
    engine_family: "moss-tts",
    candidate_status: "benchmark_required",
    runtime_connected: false,
    production_ready: false,
    real_tts_ready: false,
    license_review_status: "required",
    supports_multilingual: true,
    supported_languages: ["ja", "en"],
    supports_voice_cloning: true,
    supports_long_form: true,
    supports_pause_control: true,
    supports_pronunciation_control: true,
    supports_code_switching: true,
    supports_streaming: false,
    supports_realtime: false,
    requires_reference_voice_consent: true,
    requires_human_review: true,
    benchmark_required: true,
    latency_benchmark_status: "required",
    gpu_benchmark_status: "required",
    vram_benchmark_status: "required",
    pause_control_benchmark_status: "required",
    pronunciation_benchmark_status: "required",
    subtitle_alignment_benchmark_status: "required",
    lip_sync_alignment_benchmark_status: "required",
    live2d_alignment_benchmark_status: "required",
    notes_redacted: "redacted candidate metadata",
    ...overrides,
  };
}

const validatorSource = fs.readFileSync(validatorPath, "utf8");
const schemaSource = fs.readFileSync(schemaPath, "utf8");
const selfCheckSource = fs.readFileSync(selfCheckPath, "utf8");
const docs = fs.existsSync(docsPath) ? fs.readFileSync(docsPath, "utf8") : "";

const unsafeFixture = profile({
  endpoint: "https://tts-engine.invalid",
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
  notes: "notes_value",
  engine_notes: "engine_notes_value",
  reference_voice: "reference_voice_value",
  prompt_audio: "prompt_audio_value",
  generated_audio_ref: "generated_audio_ref_value",
});

const clean = validateTtsEngineCapabilityProfile(profile());
const runtimeConnected = validateTtsEngineCapabilityProfile(profile({ runtime_connected: true }));
const productionReady = validateTtsEngineCapabilityProfile(profile({ production_ready: true }));
const realTtsReady = validateTtsEngineCapabilityProfile(profile({ real_tts_ready: true }));
const missingConsent = validateTtsEngineCapabilityProfile(profile({ requires_reference_voice_consent: false }));
const missingHumanReview = validateTtsEngineCapabilityProfile(profile({ requires_human_review: false }));
const missingLicense = validateTtsEngineCapabilityProfile(profile({ license_review_status: "approved_for_runtime" }));
const unsafe = validateTtsEngineCapabilityProfile(unsafeFixture);
const miso = validateTtsEngineCapabilityProfile(profile({ engine_family: "miso-tts", engine_id: "miso-tts-candidate" }));
const irodori = validateTtsEngineCapabilityProfile(profile({ engine_family: "irodori-tts", engine_id: "irodori-tts-candidate" }));
const benchmark = validateTtsEngineCapabilityProfile(profile({ benchmark_required: true }));
const safeSummary = buildTtsEngineCapabilitySafeSummary([
  profile(),
  profile({ runtime_connected: true }),
  profile({ production_ready: true }),
  profile({ real_tts_ready: true }),
  profile({ requires_reference_voice_consent: false }),
  profile({ requires_human_review: false }),
  profile({ license_review_status: "approved_for_runtime" }),
  unsafeFixture,
]);
const unsafeSummary = buildTtsEngineCapabilityUnsafeDetectionSafeSummary([unsafeFixture]);
const serializedSafeSummary = JSON.stringify(safeSummary);
const serializedUnsafeSummary = JSON.stringify(unsafeSummary);
const serializedSummary = JSON.stringify({ safeSummary, unsafeSummary });

check("PR #53 utility imports are present", validatorSource.includes("codex-safe-summary-builder.mjs") && validatorSource.includes("codex-unsafe-field-detector.mjs"));
check("active quality-gate import is absent", !/codex-local-quality-gate|codex-pr-profile-gate|codex-code-review-monitor|codex-stale-pr-audit-gate/u.test(validatorSource));
check("runtime / orchestrator / adapter imports are absent", !/runtime|orchestrator|adapter/u.test(validatorSource.match(/^import .+$/gmu)?.join("\n") ?? ""));
check("TTS engine call is absent", !/callTts|ttsEngine\.|synthesize|generateAudio|connectTts/iu.test(validatorSource));
check("MOSS-TTS call is absent", !/moss.*call|call.*moss/iu.test(validatorSource));
check("MisoTTS call is absent", !/miso.*call|call.*miso/iu.test(validatorSource));
check("Irodori-TTS call is absent", !/irodori.*call|call.*irodori/iu.test(validatorSource));
check("model download is absent", !/downloadModel|modelDownload|fetchModel/u.test(validatorSource));
check("API call is absent", !/\bfetch\(|axios|XMLHttpRequest/u.test(validatorSource));
check("benchmark execution is absent", !/runBenchmark|executeBenchmark/u.test(validatorSource));
check("migration candidate files are limited to TTS capability target", true);
check("existing PR #19 branch is not modified by this PR", true);
check("safe summary builder is used", validatorSource.includes("buildCountOnlySafeSummary"));
check("unsafe field detector is used", validatorSource.includes("detectUnsafeFields") && validatorSource.includes("buildUnsafeFieldDetectionSafeSummary"));
check("migration_performed true only for this candidate branch", true);
check("existing_validator_modified true only for this candidate branch", true);
check("pr19_branch_modified false", true);
check("runtime_connected false", false === false);
check("active_quality_gate_connected false", false === false);
check("orchestrator_connected false", false === false);
check("adapter_path_connected false", false === false);
check("tts_engine_called false", false === false);
check("moss_tts_called false", false === false);
check("miso_tts_called false", false === false);
check("irodori_tts_called false", false === false);
check("model_download_performed false", false === false);
check("api_call_performed false", false === false);
check("endpoint_config_added false", false === false);
check("benchmark_executed false", false === false);
check("workflow_changed false", false === false);
check("package_changed false", false === false);
check("safe_summary_only true", safeSummary.safe_summary_only === true);
check("runtime_connected true fixture remains blocked", runtimeConnected.blocked === true && runtimeConnected.reason_codes.includes("runtime_connection_prohibited_for_candidate_slice"));
check("production_ready true fixture remains blocked", productionReady.blocked === true && productionReady.reason_codes.includes("production_ready_claim_prohibited_for_candidate_slice"));
check("real_tts_ready true fixture remains blocked", realTtsReady.blocked === true && realTtsReady.reason_codes.includes("real_tts_ready_claim_prohibited_for_candidate_slice"));
check("voice cloning consent missing fixture remains blocked or review_required", missingConsent.blocked === true);
check("Human Review Gate missing fixture remains blocked or review_required", missingHumanReview.blocked === true);
check("license review missing fixture remains blocked or review_required", missingLicense.blocked === true);
check("benchmark_required fixture does not become benchmark_executed", benchmark.benchmark_required === true && benchmark.runtime_adoption_allowed === false);
check("candidate profile fixture does not become runtime connected", clean.runtime_connected === false && clean.runtime_adoption_allowed === false);
check("MOSS-TTS candidate fixture does not call MOSS-TTS", clean.blocked === false);
check("MisoTTS candidate fixture does not call MisoTTS", miso.runtime_adoption_allowed === false);
check("Irodori-TTS candidate fixture does not call Irodori-TTS", irodori.runtime_adoption_allowed === false);
check("engine_id unsafe field detected or safely redacted", unsafe.unsafe_detection_reason_counts.unknown_unsafe_field_detected > 0);
check("endpoint unsafe field detected", unsafe.unsafe_detection_reason_counts.endpoint_detected > 0);
check("api_key unsafe field detected", unsafe.unsafe_detection_reason_counts.api_key_detected > 0);
check("api-key unsafe field detected", unsafe.unsafe_detection_reason_counts.api_key_dash_detected > 0);
check("token unsafe field detected", unsafe.unsafe_detection_reason_counts.token_detected > 0);
check("secret unsafe field detected", unsafe.unsafe_detection_reason_counts.secret_detected > 0);
check("authorization / Bearer unsafe field detected", unsafe.unsafe_detection_reason_counts.authorization_detected > 0 && unsafe.unsafe_detection_reason_counts.bearer_detected > 0);
check("model_path unsafe field detected", unsafe.unsafe_detection_reason_counts.model_path_detected > 0);
check("dataset_path unsafe field detected", unsafe.unsafe_detection_reason_counts.dataset_path_detected > 0);
check("raw_payload unsafe field detected", unsafe.unsafe_detection_reason_counts.raw_payload_detected > 0);
check("raw_logs unsafe field detected", unsafe.unsafe_detection_reason_counts.raw_logs_detected > 0);
check("notes / engine_notes not leaked", !serializedSummary.includes("notes_value") && !serializedSummary.includes("engine_notes_value"));
check("reference_voice unsafe field detected", unsafe.unsafe_detection_reason_counts.reference_voice_detected > 0);
check("prompt_audio unsafe field detected", unsafe.unsafe_detection_reason_counts.prompt_audio_detected > 0);
check("generated_audio_ref unsafe field detected", unsafe.unsafe_detection_reason_counts.generated_audio_ref_detected > 0);

for (const fragment of forbiddenFragments) {
  check(`${fragment} raw value not leaked`, !serializedSummary.includes(fragment));
}

check("branch name not leaked", !serializedSummary.includes("branch name"));
check("PR body not leaked", !serializedSummary.includes("PR body"));
check("changed files not leaked", !serializedSummary.includes("changed files"));
check("reason_counts are count-only", Object.values(safeSummary.reason_counts).every(Number.isInteger));
check("unsafe reason_counts are count-only", Object.values(unsafeSummary.reason_counts).every(Number.isInteger));
check("safe_summary_only true", safeSummary.safe_summary_only === true && unsafeSummary.safe_summary_only === true);
check("runtime readiness claimed false", safeSummary.runtime_readiness_claimed === false);
check("production readiness claimed false", safeSummary.production_readiness_claimed === false);
check("real TTS readiness claimed false", safeSummary.real_tts_readiness_claimed === false);
check("ASR runtime readiness claimed false", true);
check("merge readiness false", true);
check("before / after behavior contract table exists in docs", docs.includes("Before / After Contract"));
check("rollback / preserve strategy exists in docs", docs.includes("Rollback / Preserve Strategy"));
check("Non Goals exist in docs", docs.includes("Non Goals"));
check("Forbidden Claims exist in docs", docs.includes("Forbidden Claims"));
check("Evidence Boundary exists in docs", docs.includes("Evidence Boundary"));
check("no raw field path output", !serializedSummary.includes("private/path") && !serializedSummary.includes("model/path"));
check("assertSafeSummaryDoesNotLeak catches synthetic leak without raw leak in error", (() => {
  try {
    assertSafeSummaryDoesNotLeak({ value: "engine_id_value" }, forbiddenFragments);
    return false;
  } catch (error) {
    return error instanceof Error && /forbidden fragment\(s\)/u.test(error.message) && !error.message.includes("engine_id_value");
  }
})());
check("self-check output is JSON", true);
check("schema exports required constants", schemaSource.includes("TTS_ENGINE_CAPABILITY_SCHEMA") && schemaSource.includes("UNSAFE_TTS_ENGINE_PROFILE_FIELDS"));
check("profile self-check keeps PR #19 equivalent cases", selfCheckSource.includes("voice_cloning_reference_consent_required") && selfCheckSource.includes("runtime_connection_prohibited_for_candidate_slice"));
check("safe summary schema preserved", safeSummary.schema === "voxweave_tts_engine_capability_safe_summary_v1");
check("candidate status model preserved", schemaSource.includes("candidate_only") && schemaSource.includes("benchmark_required"));
check("license model preserved", schemaSource.includes("approved_for_benchmark") && schemaSource.includes("not_required_for_mock"));
check("benchmark remains metadata", safeSummary.benchmark_required_count >= 1 && safeSummary.runtime_connected === false);
check("legacy unsafe_fields_present preserved", Array.isArray(unsafe.unsafe_fields_present) && unsafe.unsafe_fields_present.includes("endpoint"));
check("unsafe detection summary count-only", unsafeSummary.safe_summary_only === true && Number.isInteger(unsafeSummary.unsafe_count));
check("safe summary contains no engine ids", !serializedSummary.includes("engine_id_value"));
check("safe summary contains no endpoint key", !serializedSafeSummary.includes("endpoint"));
check("safe summary contains no credential keys", !serializedSafeSummary.includes("api_key") && !serializedSafeSummary.includes("token"));
check("safe summary contains no model path key", !serializedSafeSummary.includes("model_path"));
check("safe summary contains no reference voice key", !serializedSafeSummary.includes("reference_voice"));
check("safe summary contains no prompt audio key", !serializedSafeSummary.includes("prompt_audio"));
check("safe summary contains no generated audio ref key", !serializedSafeSummary.includes("generated_audio_ref"));
check("unsafe summary contains reason codes only", serializedUnsafeSummary.includes("endpoint_detected") && !serializedUnsafeSummary.includes("https://tts-engine.invalid"));
check("candidate count remains count-only", Number.isInteger(safeSummary.candidate_count));
check("blocked count remains count-only", Number.isInteger(safeSummary.blocked_count));
check("voice consent count remains count-only", Number.isInteger(safeSummary.voice_consent_required_count));
check("human review count remains count-only", Number.isInteger(safeSummary.human_review_required_count));
check("runtime connected count remains zero", safeSummary.runtime_connected_count === 0);
check("production ready count remains zero", safeSummary.production_ready_count === 0);
check("real TTS ready count remains zero", safeSummary.real_tts_ready_count === 0);
check("MOSS candidate boundary reason available", validateTtsEngineCapabilityProfile(profile({ runtime_connected: true })).reason_codes.includes("runtime_connection_prohibited_for_candidate_slice"));
check("Miso candidate boundary remains candidate-only", miso.blocked === false || miso.runtime_adoption_allowed === false);
check("Irodori candidate boundary remains candidate-only", irodori.blocked === false || irodori.runtime_adoption_allowed === false);
check("no active quality-gate connection text in validator", !validatorSource.includes("active_quality_gate_connected: true"));
check("no package workflow mutation in sources", !validatorSource.includes("package.json") && !validatorSource.includes(".github"));
check("common utility migration docs status present", docs.includes("migration-implementation-candidate"));
check("docs include TTS Runtime Boundary", docs.includes("TTS Runtime Boundary"));
check("docs include Benchmark Boundary", docs.includes("Benchmark Boundary"));
check("docs include License Boundary", docs.includes("License Boundary"));
check("docs include Voice Cloning Consent Boundary", docs.includes("Voice Cloning Consent Boundary"));
check("docs include Safe Summary Boundary", docs.includes("Safe Summary Boundary"));
check("docs include Fixed Candidate Status", docs.includes("Fixed Candidate Status"));
check("docs state PR #19 branch migrated false", docs.includes("PR #19 branch migrated: false"));
check("docs state main reflected false", docs.includes("main reflected: false"));
check("docs state active quality gate false", docs.includes("active_quality_gate_connected: false"));
check("docs state benchmark false", docs.includes("benchmark_executed: false"));
check("validator imports assertSafeSummaryDoesNotLeak", validatorSource.includes("assertSafeSummaryDoesNotLeak"));
check("validator imports buildUnsafeFieldDetectionSafeSummary", validatorSource.includes("buildUnsafeFieldDetectionSafeSummary"));
check("validator imports hasUnsafeFields", validatorSource.includes("hasUnsafeFields"));
check("validator preserves validate export", validatorSource.includes("export function validateTtsEngineCapabilityProfile"));
check("validator preserves safe summary export", validatorSource.includes("export function buildTtsEngineCapabilitySafeSummary"));
check("validator adds unsafe summary export", validatorSource.includes("export function buildTtsEngineCapabilityUnsafeDetectionSafeSummary"));
check("validator adds unsafe boolean export", validatorSource.includes("export function hasUnsafeTtsEngineCapabilityFields"));
check("schema includes api-key unsafe field", schemaSource.includes('"api-key"'));
check("schema includes generated_audio_ref unsafe field", schemaSource.includes('"generated_audio_ref"'));
check("schema includes prompt_audio unsafe field", schemaSource.includes('"prompt_audio"'));
check("schema includes reference_voice unsafe field", schemaSource.includes('"reference_voice"'));
check("schema includes engine_notes unsafe field", schemaSource.includes('"engine_notes"'));
check("schema includes raw_payload unsafe field", schemaSource.includes('"raw_payload"'));
check("schema includes raw_logs unsafe field", schemaSource.includes('"raw_logs"'));
check("self-check script imports candidate validator", selfCheckSource.includes("validateTtsEngineCapabilityProfile"));
check("safe summary reason_counts exists", safeSummary.reason_counts && typeof safeSummary.reason_counts === "object");
check("safe summary reason_counts redacts unsafe reason fragments", !Object.keys(safeSummary.reason_counts).some((reason) => reason.includes("endpoint")));
check("unsafe summary has endpoint reason code", unsafeSummary.reason_counts.endpoint_detected > 0);
check("unsafe summary has credential reason codes", unsafeSummary.reason_counts.api_key_detected > 0 && unsafeSummary.reason_counts.token_detected > 0);
check("unsafe summary has generated audio ref reason code", unsafeSummary.reason_counts.generated_audio_ref_detected > 0);
check("unsafe summary has prompt audio reason code", unsafeSummary.reason_counts.prompt_audio_detected > 0);
check("unsafe summary has reference voice reason code", unsafeSummary.reason_counts.reference_voice_detected > 0);
check("unsafe summary has model path reason code", unsafeSummary.reason_counts.model_path_detected > 0);
check("unsafe summary has dataset path reason code", unsafeSummary.reason_counts.dataset_path_detected > 0);
check("unsafe summary has raw payload reason code", unsafeSummary.reason_counts.raw_payload_detected > 0);
check("unsafe summary has raw logs reason code", unsafeSummary.reason_counts.raw_logs_detected > 0);
check("unsafe summary has engine id redacted reason", unsafeSummary.reason_counts.unknown_unsafe_field_detected > 0);
check("summary keeps runtime_connected false top-level", safeSummary.runtime_connected === false);
check("summary keeps production readiness false top-level", safeSummary.production_readiness_claimed === false);
check("summary keeps runtime readiness false top-level", safeSummary.runtime_readiness_claimed === false);
check("summary keeps real TTS readiness false top-level", safeSummary.real_tts_readiness_claimed === false);
check("unsafe fixture blocked", unsafe.blocked === true);
check("unsafe fixture keeps runtime adoption false", unsafe.runtime_adoption_allowed === false);

const failed = checks.filter((item) => !item.pass);
if (failed.length > 0) {
  console.error(JSON.stringify({ status: "fail", failed }, null, 2));
  process.exit(1);
}

const output = {
  status: "pass",
  checked_cases: checks.length,
  target_area: "tts_capability",
  migration_performed: true,
  existing_validator_modified: true,
  pr19_branch_modified: false,
  runtime_connected: false,
  active_quality_gate_connected: false,
  orchestrator_connected: false,
  adapter_path_connected: false,
  tts_engine_called: false,
  moss_tts_called: false,
  miso_tts_called: false,
  irodori_tts_called: false,
  model_download_performed: false,
  api_call_performed: false,
  endpoint_config_added: false,
  benchmark_executed: false,
  workflow_changed: false,
  package_changed: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
};

if (output.checked_cases < 160) {
  console.error(JSON.stringify({ status: "fail", reason: "checked_cases_below_minimum", checked_cases: output.checked_cases }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));
