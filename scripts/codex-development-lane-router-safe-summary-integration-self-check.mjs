import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyDevelopmentLane } from "./codex-development-lane-router.mjs";
import { buildDevelopmentLaneIntegrationSafeSummary } from "./codex-development-lane-router-safe-summary-integration.mjs";

const docsOnlyBase = {
  changed_files: ["docs/process/CODEX_EXAMPLE.md"],
  is_draft: true,
  explicit_user_scope_change: true,
};

const workflowPath = [".github", "workflows", "quality-gate.yml"].join("/");

const cases = [
  ["docs_only_planning allowed", { ...docsOnlyBase, lane: "docs_only_planning" }, { allowed_count_min: 1, docs_only_allowed_count_min: 1 }],
  ["spec_persistence allowed", { ...docsOnlyBase, explicit_user_scope_change: false, lane: "spec_persistence" }, { allowed_count_min: 1, docs_only_allowed_count_min: 1 }],
  ["roadmap_recovery allowed", { ...docsOnlyBase, explicit_user_scope_change: false, lane: "roadmap_recovery" }, { allowed_count_min: 1, docs_only_allowed_count_min: 1 }],
  ["common_utility_planning allowed", { ...docsOnlyBase, explicit_user_scope_change: false, lane: "common_utility_planning" }, { allowed_count_min: 1, docs_only_allowed_count_min: 1 }],
  ["merge lane blocked", { lane: "merge" }, { merge_blocked_count_min: 1, blocked_count_min: 1, reasonCode: "merge_lane_blocked" }],
  ["runtime lane blocked", { lane: "runtime" }, { runtime_blocked_count_min: 1, blocked_count_min: 1, reasonCode: "runtime_lane_blocked" }],
  ["existing_pr preserve_only", { lane: "existing_pr" }, { preserve_only_count_min: 1, reasonCode: "existing_pr_preserve_only" }],
  ["new_schema_validator blocked_by_default", { lane: "new_schema_validator" }, { blocked_count_min: 1 }],
  ["new_runtime_integration blocked", { lane: "new_runtime_integration" }, { runtime_blocked_count_min: 1, blocked_count_min: 1, reasonCode: "runtime_lane_blocked" }],
  ["new_product_implementation blocked_by_default", { lane: "new_product_implementation" }, { blocked_count_min: 1 }],
  ["review_governance read_only_monitoring", { lane: "review_governance" }, { allowed_count_min: 1 }],
  ["review_governance with changed_files blocked", { lane: "review_governance", changed_files: ["docs/process/CODEX_EXAMPLE.md"] }, { blocked_count_min: 1, reasonCode: "review_governance_must_be_read_only" }],
  ["state_change_monitoring without delta blocked", { lane: "state_change_monitoring", state_delta_detected: false }, { state_delta_required_count_min: 1, blocked_count_min: 1, reasonCode: "state_delta_required_for_monitoring" }],
  ["state_change_monitoring with delta allowed", { lane: "state_change_monitoring", state_delta_detected: true }, { allowed_count_min: 1 }],
  ["state_change_monitoring with changed_files blocked", { lane: "state_change_monitoring", state_delta_detected: true, changed_files: ["docs/process/CODEX_EXAMPLE.md"] }, { blocked_count_min: 1, reasonCode: "state_change_monitoring_must_be_read_only" }],
  ["src path blocked", { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["src/example.js"] }, { blocked_count_min: 1, reasonCode: "src_touch_blocked" }],
  ["scripts path blocked", { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["scripts/example.mjs"] }, { blocked_count_min: 1, reasonCode: "scripts_touch_blocked" }],
  ["README path blocked", { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["README.md"] }, { blocked_count_min: 1, reasonCode: "readme_touch_blocked" }],
  ["workflow path blocked", { ...docsOnlyBase, lane: "docs_only_planning", changed_files: [workflowPath] }, { blocked_count_min: 1, reasonCode: "workflow_touch_blocked" }],
  ["package path blocked", { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["package.json"] }, { blocked_count_min: 1, reasonCode: "package_touch_blocked" }],
  ["runtime readiness claim blocked", { ...docsOnlyBase, lane: "docs_only_planning", runtime_readiness_claimed: true }, { blocked_count_min: 1, reasonCode: "runtime_readiness_claim_blocked" }],
  ["production readiness claim blocked", { ...docsOnlyBase, lane: "docs_only_planning", production_readiness_claimed: true }, { blocked_count_min: 1, reasonCode: "production_readiness_claim_blocked" }],
  ["real TTS readiness claim blocked", { ...docsOnlyBase, lane: "docs_only_planning", real_tts_readiness_claimed: true }, { blocked_count_min: 1, reasonCode: "real_tts_readiness_claim_blocked" }],
  ["merge readiness claim blocked", { ...docsOnlyBase, lane: "docs_only_planning", merge_readiness_claimed: true }, { blocked_count_min: 1, reasonCode: "merge_readiness_claim_blocked" }],
  ["MisoTTS call blocked", { ...docsOnlyBase, lane: "docs_only_planning", calls_miso_tts: true }, { blocked_count_min: 1, reasonCode: "miso_tts_call_blocked" }],
  ["MOSS-TTS call blocked", { ...docsOnlyBase, lane: "docs_only_planning", calls_moss_tts: true }, { blocked_count_min: 1, reasonCode: "moss_tts_call_blocked" }],
  ["Irodori-TTS call blocked", { ...docsOnlyBase, lane: "docs_only_planning", calls_irodori_tts: true }, { blocked_count_min: 1, reasonCode: "irodori_tts_call_blocked" }],
  ["Live2D renderer call blocked", { ...docsOnlyBase, lane: "docs_only_planning", calls_live2d_renderer: true }, { blocked_count_min: 1, reasonCode: "live2d_renderer_call_blocked" }],
  ["model download blocked", { ...docsOnlyBase, lane: "docs_only_planning", downloads_model: true }, { blocked_count_min: 1, reasonCode: "model_download_blocked" }],
  ["API call blocked", { ...docsOnlyBase, lane: "docs_only_planning", performs_api_call: true }, { blocked_count_min: 1, reasonCode: "api_call_blocked" }],
  ["endpoint config blocked", { ...docsOnlyBase, lane: "docs_only_planning", adds_endpoint_config: true }, { blocked_count_min: 1, reasonCode: "endpoint_config_blocked" }],
  ["benchmark execution blocked", { ...docsOnlyBase, lane: "docs_only_planning", runs_benchmark: true }, { blocked_count_min: 1, reasonCode: "benchmark_execution_blocked" }],
  ["quality-gate weakening blocked", { ...docsOnlyBase, lane: "docs_only_planning", weakens_quality_gate: true }, { blocked_count_min: 1, reasonCode: "quality_gate_weakening_blocked" }],
  ["review independence weakening blocked", { ...docsOnlyBase, lane: "docs_only_planning", weakens_review_independence: true }, { blocked_count_min: 1, reasonCode: "review_independence_weakening_blocked" }],
  ["writer self review pass blocked", { ...docsOnlyBase, lane: "docs_only_planning", treats_writer_self_review_as_pass: true }, { blocked_count_min: 1, reasonCode: "writer_self_review_pass_blocked" }],
  ["unknown lane blocked", { lane: "unknown_lane" }, { blocked_count_min: 1, reasonCode: "lane_not_allowed" }],
];

const integrationBlockedCases = [
  ["active quality-gate integration blocked", "active_quality_gate_integration", "active_quality_gate_integration_not_allowed"],
  ["pass/fail semantics change blocked", "pass_fail_semantics_changed", "pass_fail_semantics_change_not_allowed"],
  ["target quality score change blocked", "target_quality_score_changed", "target_quality_score_change_not_allowed"],
  ["workflow change blocked", "workflow_changed", "workflow_change_not_allowed"],
  ["package change blocked", "package_changed", "package_change_not_allowed"],
  ["runtime change blocked", "runtime_changed", "runtime_change_not_allowed"],
  ["review governance behavior change blocked", "review_governance_behavior_changed", "review_governance_behavior_change_not_allowed"],
  ["merge readiness blocked", "merge_readiness", "merge_readiness_not_allowed"],
];

function assertFixedFlags(summary, name) {
  assert.equal(summary.active_quality_gate_integration, false, `${name}: active_quality_gate_integration`);
  assert.equal(summary.pass_fail_semantics_changed, false, `${name}: pass_fail_semantics_changed`);
  assert.equal(summary.target_quality_score_changed, false, `${name}: target_quality_score_changed`);
  assert.equal(summary.workflow_changed, false, `${name}: workflow_changed`);
  assert.equal(summary.package_changed, false, `${name}: package_changed`);
  assert.equal(summary.runtime_changed, false, `${name}: runtime_changed`);
  assert.equal(summary.review_governance_behavior_changed, false, `${name}: review_governance_behavior_changed`);
  assert.equal(summary.merge_readiness, false, `${name}: merge_readiness`);
  assert.equal(summary.safe_summary_only, true, `${name}: safe_summary_only`);
}

function assertReasonCode(summary, reasonCode, name) {
  assert.ok(JSON.stringify(summary).includes(reasonCode), `${name}: missing ${reasonCode}`);
}

const records = [];

for (const [name, input, expect] of cases) {
  records.push(input);
  const summary = buildDevelopmentLaneIntegrationSafeSummary({
    records: [input],
    source: "local_rehearsal",
  });

  assert.equal(summary.status, "pass", name);
  assertFixedFlags(summary, name);
  assert.equal(summary.lane_summary.record_count, 1, `${name}: record_count`);

  for (const [key, value] of Object.entries(expect)) {
    if (key === "reasonCode") {
      assertReasonCode(classifyDevelopmentLane(input), value, name);
      continue;
    }

    const summaryKey = key.replace("_min", "");
    assert.ok(summary.lane_summary[summaryKey] >= value, `${name}: ${summaryKey}`);
  }
}

for (const [name, field, reasonCode] of integrationBlockedCases) {
  const summary = buildDevelopmentLaneIntegrationSafeSummary({
    records: [{ ...docsOnlyBase, lane: "docs_only_planning" }],
    source: "local_rehearsal",
    [field]: true,
  });

  assert.equal(summary.status, "blocked", name);
  assertFixedFlags(summary, name);
  assert.ok(summary.reason_codes.includes(reasonCode), `${name}: missing ${reasonCode}`);
}

const invalidSourceSummary = buildDevelopmentLaneIntegrationSafeSummary({
  records: [{ ...docsOnlyBase, lane: "docs_only_planning" }],
  source: "https://bad.invalid",
});
assert.equal(invalidSourceSummary.status, "blocked", "invalid source blocked");
assert.equal(invalidSourceSummary.source, "unknown", "invalid source redacted");
assert.ok(invalidSourceSummary.reason_codes.includes("source_not_allowed"), "invalid source reason");
assertFixedFlags(invalidSourceSummary, "invalid source");

const invalidRecordsSummary = buildDevelopmentLaneIntegrationSafeSummary({
  records: "not-an-array",
  source: "local_rehearsal",
});
assert.equal(invalidRecordsSummary.status, "blocked", "non-array records blocked");
assert.ok(invalidRecordsSummary.reason_codes.includes("records_must_be_array"), "records reason");
assert.equal(invalidRecordsSummary.lane_summary.record_count, 0, "empty lane summary for invalid records");
assertFixedFlags(invalidRecordsSummary, "invalid records");

const rawRecord = {
  lane: "docs_only_planning",
  changed_files: [
    "docs/process/CODEX_EXAMPLE.md",
    "src/example.js",
    "scripts/example.mjs",
    "README.md",
    workflowPath,
    "package.json",
  ],
  branch_name: "codex/private-branch-name",
  pr_body: "raw PR body",
  endpoint: "https://bad.invalid",
  api_key: "bad",
  token: "bad",
  secret: "bad",
  model_path: "C:/private/model",
  dataset_path: "C:/private/dataset",
  raw_payload: "bad",
  raw_logs: "bad",
  private_source: "local_rehearsal_private_suffix",
};

const aggregateSummary = buildDevelopmentLaneIntegrationSafeSummary({
  records: [...records, rawRecord],
  source: "future_quality_gate_safe_summary",
});

assert.equal(aggregateSummary.status, "pass", "aggregate status");
assert.equal(aggregateSummary.source, "future_quality_gate_safe_summary", "aggregate source");
assertFixedFlags(aggregateSummary, "aggregate");
assert.equal(aggregateSummary.lane_summary.safe_summary_only, true, "lane_summary safe_summary_only");

const serializedSummary = JSON.stringify(aggregateSummary);
const forbiddenSummaryFragments = [
  "docs/process/CODEX_EXAMPLE.md",
  "src/example.js",
  "scripts/example.mjs",
  "README.md",
  workflowPath,
  "package.json",
  "codex/private-branch-name",
  "raw PR body",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model_path",
  "dataset_path",
  "raw_payload",
  "raw_logs",
  "https://bad.invalid",
  "C:/private/model",
  "C:/private/dataset",
  "local_rehearsal_private_suffix",
  "future_quality_gate_safe_summary_private_suffix",
];

for (const fragment of forbiddenSummaryFragments) {
  assert.equal(serializedSummary.includes(fragment), false, `integration summary leaked ${fragment}`);
}

assert.equal(JSON.stringify(invalidSourceSummary).includes("https://bad.invalid"), false, "invalid source leaked");

const forbiddenActiveGateNames = [
  ["codex-local", "quality-gate.mjs"].join("-"),
  ["codex-pr", "profile-gate.mjs"].join("-"),
  ["codex-code", "review-monitor.mjs"].join("-"),
  ["codex-stale-pr", "audit-gate.mjs"].join("-"),
  [".github/workflows", "quality-gate.yml"].join("/"),
];

const checkedSourceFiles = [
  "scripts/codex-development-lane-router-safe-summary-integration.mjs",
  "scripts/codex-development-lane-router-safe-summary-integration-self-check.mjs",
];

for (const file of checkedSourceFiles) {
  const sourceText = readFileSync(file, "utf8");
  for (const forbiddenName of forbiddenActiveGateNames) {
    assert.equal(sourceText.includes(forbiddenName), false, `${file} includes ${forbiddenName}`);
  }
}

console.log(JSON.stringify({
  status: "pass",
  checked_cases: cases.length + integrationBlockedCases.length + 4,
  active_quality_gate_integration: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  safe_summary_only: true,
}));
