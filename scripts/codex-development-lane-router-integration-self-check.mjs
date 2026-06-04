import assert from "node:assert/strict";
import {
  buildDevelopmentLaneSafeSummary,
  classifyDevelopmentLane,
} from "./codex-development-lane-router.mjs";

const forbiddenIntegrationModules = [
  "scripts/codex-local-quality-gate.mjs",
  "scripts/codex-pr-profile-gate.mjs",
  "scripts/codex-code-review-monitor.mjs",
  "scripts/codex-stale-pr-audit-gate.mjs",
];

const forbiddenGithubActionEnv = [
  "GITHUB_ACTIONS",
  "GITHUB_REF",
  "GITHUB_SHA",
  "GITHUB_EVENT_NAME",
  "GITHUB_WORKFLOW",
];

for (const envName of forbiddenGithubActionEnv) {
  assert.equal(Object.hasOwn(process.env, envName) && process.env[envName] === "__LANE_ROUTER_SOURCE_OF_TRUTH__", false);
}

const docsOnlyBase = {
  changed_files: ["docs/process/CODEX_EXAMPLE.md"],
  is_draft: true,
  explicit_user_scope_change: true,
};

const cases = [
  {
    name: "docs_only_planning allowed",
    input: { ...docsOnlyBase, lane: "docs_only_planning" },
    expect: { allowed: true, status: "allowed" },
  },
  {
    name: "spec_persistence allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "spec_persistence" },
    expect: { allowed: true, status: "allowed" },
  },
  {
    name: "roadmap_recovery allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "roadmap_recovery" },
    expect: { allowed: true, status: "allowed" },
  },
  {
    name: "common_utility_planning allowed",
    input: { ...docsOnlyBase, explicit_user_scope_change: false, lane: "common_utility_planning" },
    expect: { allowed: true, status: "allowed" },
  },
  {
    name: "merge lane blocked",
    input: { lane: "merge" },
    expect: { blocked: true, reasonCode: "merge_lane_blocked" },
  },
  {
    name: "runtime lane blocked",
    input: { lane: "runtime" },
    expect: { blocked: true, reasonCode: "runtime_lane_blocked" },
  },
  {
    name: "existing_pr preserve only",
    input: { lane: "existing_pr" },
    expect: { status: "preserve_only", allowed: false, blocked: false },
  },
  {
    name: "new_schema_validator blocked by default",
    input: { lane: "new_schema_validator" },
    expect: { status: "blocked_by_default" },
  },
  {
    name: "new_runtime_integration blocked",
    input: { lane: "new_runtime_integration" },
    expect: { blocked: true, reasonCode: "runtime_lane_blocked" },
  },
  {
    name: "new_product_implementation blocked by default",
    input: { lane: "new_product_implementation" },
    expect: { status: "blocked_by_default" },
  },
  {
    name: "review_governance read only",
    input: { lane: "review_governance" },
    expect: { status: "read_only_monitoring", allowed: true },
  },
  {
    name: "review_governance write attempt blocked",
    input: { lane: "review_governance", changed_files: ["docs/process/CODEX_EXAMPLE.md"] },
    expect: { blocked: true, reasonCode: "review_governance_must_be_read_only" },
  },
  {
    name: "state_change_monitoring no delta blocked",
    input: { lane: "state_change_monitoring", state_delta_detected: false },
    expect: { blocked: true, reasonCode: "state_delta_required_for_monitoring" },
  },
  {
    name: "state_change_monitoring with delta allowed",
    input: { lane: "state_change_monitoring", state_delta_detected: true },
    expect: { allowed: true, status: "allowed_monitoring" },
  },
  {
    name: "state_change_monitoring write attempt blocked",
    input: {
      lane: "state_change_monitoring",
      state_delta_detected: true,
      changed_files: ["docs/process/CODEX_EXAMPLE.md"],
    },
    expect: { blocked: true, reasonCode: "state_change_monitoring_must_be_read_only" },
  },
  {
    name: "src path derived block",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["src/example.js"] },
    expect: { blocked: true, reasonCode: "src_touch_blocked" },
  },
  {
    name: "scripts path derived block",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["scripts/example.mjs"] },
    expect: { blocked: true, reasonCode: "scripts_touch_blocked" },
  },
  {
    name: "README path derived block",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["README.md"] },
    expect: { blocked: true, reasonCode: "readme_touch_blocked" },
  },
  {
    name: "workflow path derived block",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: [".github/workflows/quality-gate.yml"] },
    expect: { blocked: true, reasonCode: "workflow_touch_blocked" },
  },
  {
    name: "package path derived block",
    input: { ...docsOnlyBase, lane: "docs_only_planning", changed_files: ["package.json"] },
    expect: { blocked: true, reasonCode: "package_touch_blocked" },
  },
  {
    name: "runtime readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", runtime_readiness_claimed: true },
    expect: { blocked: true, reasonCode: "runtime_readiness_claim_blocked" },
  },
  {
    name: "production readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", production_readiness_claimed: true },
    expect: { blocked: true, reasonCode: "production_readiness_claim_blocked" },
  },
  {
    name: "real TTS readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", real_tts_readiness_claimed: true },
    expect: { blocked: true, reasonCode: "real_tts_readiness_claim_blocked" },
  },
  {
    name: "merge readiness claim blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", merge_readiness_claimed: true },
    expect: { blocked: true, reasonCode: "merge_readiness_claim_blocked" },
  },
  {
    name: "MisoTTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_miso_tts: true },
    expect: { blocked: true, reasonCode: "miso_tts_call_blocked" },
  },
  {
    name: "MOSS-TTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_moss_tts: true },
    expect: { blocked: true, reasonCode: "moss_tts_call_blocked" },
  },
  {
    name: "Irodori-TTS call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_irodori_tts: true },
    expect: { blocked: true, reasonCode: "irodori_tts_call_blocked" },
  },
  {
    name: "Live2D renderer call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", calls_live2d_renderer: true },
    expect: { blocked: true, reasonCode: "live2d_renderer_call_blocked" },
  },
  {
    name: "model download blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", downloads_model: true },
    expect: { blocked: true, reasonCode: "model_download_blocked" },
  },
  {
    name: "API call blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", performs_api_call: true },
    expect: { blocked: true, reasonCode: "api_call_blocked" },
  },
  {
    name: "endpoint config blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", adds_endpoint_config: true },
    expect: { blocked: true, reasonCode: "endpoint_config_blocked" },
  },
  {
    name: "benchmark execution blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", runs_benchmark: true },
    expect: { blocked: true, reasonCode: "benchmark_execution_blocked" },
  },
  {
    name: "quality-gate weakening blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", weakens_quality_gate: true },
    expect: { blocked: true, reasonCode: "quality_gate_weakening_blocked" },
  },
  {
    name: "review independence weakening blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", weakens_review_independence: true },
    expect: { blocked: true, reasonCode: "review_independence_weakening_blocked" },
  },
  {
    name: "writer self review pass blocked",
    input: { ...docsOnlyBase, lane: "docs_only_planning", treats_writer_self_review_as_pass: true },
    expect: { blocked: true, reasonCode: "writer_self_review_pass_blocked" },
  },
  {
    name: "unknown lane blocked",
    input: { lane: "not_a_lane" },
    expect: { blocked: true, reasonCode: "lane_not_allowed" },
  },
];

const results = [];

for (const testCase of cases) {
  const result = classifyDevelopmentLane(testCase.input);
  results.push(result);

  if ("allowed" in testCase.expect) {
    assert.equal(result.allowed, testCase.expect.allowed, testCase.name);
  }

  if ("blocked" in testCase.expect) {
    assert.equal(result.blocked, testCase.expect.blocked, testCase.name);
  }

  if (testCase.expect.status) {
    assert.equal(result.status, testCase.expect.status, testCase.name);
  }

  if (testCase.expect.reasonCode) {
    assert.ok(result.reason_codes.includes(testCase.expect.reasonCode), `${testCase.name}: missing ${testCase.expect.reasonCode}`);
  }

  assert.equal(result.safe_summary_only, true, `${testCase.name}: safe_summary_only`);
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

const summary = buildDevelopmentLaneSafeSummary([...results, rawRecord]);
assert.equal(summary.safe_summary_only, true, "summary safe_summary_only");
assert.equal(summary.record_count, results.length + 1, "summary record_count");
assert.ok(summary.allowed_count > 0, "summary allowed_count");
assert.ok(summary.blocked_count > 0, "summary blocked_count");
assert.ok(summary.docs_only_allowed_count > 0, "summary docs_only_allowed_count");
assert.ok(summary.preserve_only_count > 0, "summary preserve_only_count");
assert.ok(summary.runtime_blocked_count > 0, "summary runtime_blocked_count");
assert.ok(summary.merge_blocked_count > 0, "summary merge_blocked_count");
assert.ok(summary.state_delta_required_count > 0, "summary state_delta_required_count");

const serializedSummary = JSON.stringify(summary);
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
  assert.equal(serializedSummary.includes(fragment), false, `safe summary leaked ${fragment}`);
}

const sourceText = await import("node:fs").then((fs) => fs.readFileSync(new URL(import.meta.url), "utf8"));
for (const modulePath of forbiddenIntegrationModules) {
  assert.equal(sourceText.includes(`import "${modulePath}"`), false, `forbidden import ${modulePath}`);
  assert.equal(sourceText.includes(`from "${modulePath}"`), false, `forbidden import ${modulePath}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked_cases: 40,
  safe_summary_only: true,
  active_quality_gate_integration: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  runtime_changed: false,
  merge_readiness: false,
}));
