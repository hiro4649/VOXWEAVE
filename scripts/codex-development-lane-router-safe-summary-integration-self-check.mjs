import assert from "node:assert/strict";
import { buildDevelopmentLaneIntegrationSafeSummary } from "./codex-development-lane-router-safe-summary-integration.mjs";

const docsOnlyBase = {
  changed_files: ["docs/process/CODEX_EXAMPLE.md"],
  is_draft: true,
  explicit_user_scope_change: true,
};

const cases = [
  {
    name: "docs_only_planning allowed",
    input: { ...docsOnlyBase, lane: "docs_only_planning" },
    expect: { allowed_count_min: 1, docs_only_allowed_count_min: 1 },
  },
  {
    name: "spec_persistence allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "spec_persistence" },
    expect: { allowed_count_min: 1, docs_only_allowed_count_min: 1 },
  },
  {
    name: "roadmap_recovery allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "roadmap_recovery" },
    expect: { allowed_count_min: 1, docs_only_allowed_count_min: 1 },
  },
  {
    name: "common_utility_planning allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "common_utility_planning" },
    expect: { allowed_count_min: 1, docs_only_allowed_count_min: 1 },
  },
  {
    name: "merge lane blocked",
    input: { lane: "merge" },
    expect: { merge_blocked_count_min: 1, blocked_count_min: 1 },
  },
  {
    name: "runtime lane blocked",
    input: { lane: "runtime" },
    expect: { runtime_blocked_count_min: 1, blocked_count_min: 1 },
  },
  {
    name: "existing_pr preserve_only",
    input: { lane: "existing_pr" },
    expect: { preserve_only_count_min: 1 },
  },
  {
    name: "new_schema_validator blocked_by_default",
    input: { lane: "new_schema_validator" },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "new_runtime_integration blocked",
    input: { lane: "new_runtime_integration" },
    expect: { runtime_blocked_count_min: 1, blocked_count_min: 1 },
  },
  {
    name: "new_product_implementation blocked_by_default",
    input: { lane: "new_product_implementation" },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "review_governance read_only_monitoring",
    input: { lane: "review_governance" },
    expect: { allowed_count_min: 1 },
  },
  {
    name: "review_governance with changed_files blocked",
    input: { lane: "review_governance", changed_files: ["docs/process/CODEX_EXAMPLE.md"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "state_change_monitoring without delta blocked",
    input: { lane: "state_change_monitoring", state_delta_detected: false },
    expect: { state_delta_required_count_min: 1, blocked_count_min: 1 },
  },
  {
    name: "state_change_monitoring with delta allowed",
    input: { lane: "state_change_monitoring", state_delta_detected: true },
    expect: { allowed_count_min: 1 },
  },
  {
    name: "state_change_monitoring with changed_files blocked",
    input: {
      lane: "state_change_monitoring",
      state_delta_detected: true,
      changed_files: ["docs/process/CODEX_EXAMPLE.md"],
    },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "src path blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["src/example.js"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "scripts path blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["scripts/example.mjs"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "README path blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["README.md"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "workflow path blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: [".github/workflows/quality-gate.yml"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "package path blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["package.json"] },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "runtime readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", runtime_readiness_claimed: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "production readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", production_readiness_claimed: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "real TTS readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", real_tts_readiness_claimed: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "merge readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", merge_readiness_claimed: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "MisoTTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_miso_tts: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "MOSS-TTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_moss_tts: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "Irodori-TTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_irodori_tts: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "Live2D renderer call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_live2d_renderer: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "model download blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", downloads_model: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "API call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", performs_api_call: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "endpoint config blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", adds_endpoint_config: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "benchmark execution blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", runs_benchmark: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "quality-gate weakening blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", weakens_quality_gate: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "review independence weakening blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", weakens_review_independence: true },
    expect: { blocked_count_min: 1 },
  },
  {
    name: "writer self review pass blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", treats_writer_self_review_as_pass: true },
    expect: { blocked_count_min: 1 },
  },
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

const records = cases.map((testCase) => testCase.input);

for (const testCase of cases) {
  const summary = buildDevelopmentLaneIntegrationSafeSummary({
    records: [testCase.input],
    source: "local_rehearsal",
    active_quality_gate_integration: false,
  });

  assert.equal(summary.status, "pass", testCase.name);
  assertFixedFlags(summary, testCase.name);
  assert.equal(summary.lane_summary.record_count, 1, `${testCase.name}: record_count`);

  for (const [key, value] of Object.entries(testCase.expect)) {
    const summaryKey = key.replace("_min", "");
    assert.ok(summary.lane_summary[summaryKey] >= value, `${testCase.name}: ${summaryKey}`);
  }
}

const rawRecord = {
  lane: "docs_only_planning",
  changed_files: [
    "docs/process/CODEX_EXAMPLE.md",
    "src/example.js",
    "scripts/example.mjs",
    "README.md",
    ".github/workflows/quality-gate.yml",
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
};

const aggregateSummary = buildDevelopmentLaneIntegrationSafeSummary({
  records: [...records, rawRecord],
  source: "future_quality_gate_safe_summary",
  active_quality_gate_integration: false,
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
  ".github/workflows/quality-gate.yml",
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
];

for (const fragment of forbiddenSummaryFragments) {
  assert.equal(serializedSummary.includes(fragment), false, `integration summary leaked ${fragment}`);
}

const blockedSummary = buildDevelopmentLaneIntegrationSafeSummary({
  records: "not-an-array",
  source: "local_rehearsal",
  active_quality_gate_integration: false,
});
assert.equal(blockedSummary.status, "blocked", "non-array records blocked");
assertFixedFlags(blockedSummary, "blocked");

console.log(JSON.stringify({
  status: "pass",
  checked_cases: cases.length,
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
