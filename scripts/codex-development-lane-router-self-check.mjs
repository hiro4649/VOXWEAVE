import assert from "node:assert/strict";
import {
  buildDevelopmentLaneSafeSummary,
  classifyDevelopmentLane,
} from "./codex-development-lane-router.mjs";

const docsOnlyBase = {
  changed_files: ["docs/process/CODEX_EXAMPLE.md"],
  is_draft: true,
  explicit_user_scope_change: true,
};

function check(name, input, expected) {
  const result = classifyDevelopmentLane(input);

  if (expected.status) {
    assert.equal(result.status, expected.status, name);
  }

  if ("allowed" in expected) {
    assert.equal(result.allowed, expected.allowed, name);
  }

  if ("blocked" in expected) {
    assert.equal(result.blocked, expected.blocked, name);
  }

  if (expected.reasonCode) {
    assert.ok(result.reason_codes.includes(expected.reasonCode), `${name}: missing ${expected.reasonCode}`);
  }

  assert.equal(result.safe_summary_only, true, `${name}: safe_summary_only`);
  return result;
}

const results = [];

results.push(check("docs-only planning allowed", {
  ...docsOnlyBase,
  lane: "docs_only_planning",
}, { status: "allowed", allowed: true, blocked: false }));

results.push(check("docs-only planning src change blocked", {
  ...docsOnlyBase,
  lane: "docs_only_planning",
  changed_files: ["src/example.js"],
  touches_src: true,
}, { status: "blocked", allowed: false, blocked: true, reasonCode: "src_touch_blocked" }));

results.push(check("spec persistence allowed", {
  ...docsOnlyBase,
  explicit_user_scope_change: false,
  lane: "spec_persistence",
}, { status: "allowed", allowed: true, blocked: false }));

results.push(check("roadmap recovery allowed", {
  ...docsOnlyBase,
  explicit_user_scope_change: false,
  lane: "roadmap_recovery",
}, { status: "allowed", allowed: true, blocked: false }));

results.push(check("common utility planning allowed", {
  ...docsOnlyBase,
  explicit_user_scope_change: false,
  lane: "common_utility_planning",
}, { status: "allowed", allowed: true, blocked: false }));

results.push(check("merge lane blocked", { lane: "merge" }, {
  status: "blocked",
  blocked: true,
  reasonCode: "merge_lane_blocked",
}));

results.push(check("runtime lane blocked", { lane: "runtime" }, {
  status: "blocked",
  blocked: true,
  reasonCode: "runtime_lane_blocked",
}));

results.push(check("existing PR lane preserve only", { lane: "existing_pr" }, {
  status: "preserve_only",
  allowed: false,
  blocked: false,
  reasonCode: "existing_pr_preserve_only",
}));

results.push(check("new schema validator blocked by default", { lane: "new_schema_validator" }, {
  status: "blocked_by_default",
  blocked: true,
  reasonCode: "lane_not_allowed",
}));

results.push(check("new runtime integration blocked", { lane: "new_runtime_integration" }, {
  status: "blocked",
  blocked: true,
  reasonCode: "runtime_lane_blocked",
}));

results.push(check("new product implementation blocked by default", { lane: "new_product_implementation" }, {
  status: "blocked_by_default",
  blocked: true,
  reasonCode: "lane_not_allowed",
}));

results.push(check("review governance read-only monitoring", { lane: "review_governance" }, {
  status: "read_only_monitoring",
  allowed: true,
  blocked: false,
}));

results.push(check("state change monitoring without delta blocked", { lane: "state_change_monitoring" }, {
  status: "blocked_repeated_monitoring",
  allowed: false,
  blocked: true,
  reasonCode: "state_delta_required_for_monitoring",
}));

results.push(check("state change monitoring with delta allowed", {
  lane: "state_change_monitoring",
  state_delta_detected: true,
}, { status: "allowed_monitoring", allowed: true, blocked: false }));

const blockedCases = [
  ["runtime readiness claim", "runtime_readiness_claimed", "runtime_readiness_claim_blocked"],
  ["production readiness claim", "production_readiness_claimed", "production_readiness_claim_blocked"],
  ["real TTS readiness claim", "real_tts_readiness_claimed", "real_tts_readiness_claim_blocked"],
  ["merge readiness claim", "merge_readiness_claimed", "merge_readiness_claim_blocked"],
  ["MisoTTS call", "calls_miso_tts", "miso_tts_call_blocked"],
  ["MOSS-TTS call", "calls_moss_tts", "moss_tts_call_blocked"],
  ["Irodori-TTS call", "calls_irodori_tts", "irodori_tts_call_blocked"],
  ["Live2D renderer call", "calls_live2d_renderer", "live2d_renderer_call_blocked"],
  ["model download", "downloads_model", "model_download_blocked"],
  ["API call", "performs_api_call", "api_call_blocked"],
  ["endpoint config", "adds_endpoint_config", "endpoint_config_blocked"],
  ["benchmark execution", "runs_benchmark", "benchmark_execution_blocked"],
  ["quality-gate weakening", "weakens_quality_gate", "quality_gate_weakening_blocked"],
  ["review independence weakening", "weakens_review_independence", "review_independence_weakening_blocked"],
  ["writer self review pass", "treats_writer_self_review_as_pass", "writer_self_review_pass_blocked"],
];

for (const [name, field, reasonCode] of blockedCases) {
  results.push(check(`${name} blocked`, {
    ...docsOnlyBase,
    lane: "docs_only_planning",
    [field]: true,
  }, { status: "blocked", allowed: false, blocked: true, reasonCode }));
}

const summary = buildDevelopmentLaneSafeSummary([
  ...results,
  {
    lane: "docs_only_planning",
    changed_files: ["raw/path/should/not/export.js"],
    endpoint: "https://bad.invalid",
    api_key: "bad",
    token: "bad",
    secret: "bad",
    model_path: "C:/private/model",
    dataset_path: "C:/private/dataset",
    raw_payload: "bad",
  },
]);

const serializedSummary = JSON.stringify(summary);
const forbiddenSummaryFragments = [
  "raw/path/should/not/export.js",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model_path",
  "dataset_path",
  "raw_payload",
  "https://bad.invalid",
  "C:/private/model",
  "C:/private/dataset",
];

for (const fragment of forbiddenSummaryFragments) {
  assert.equal(serializedSummary.includes(fragment), false, `safe summary leaked ${fragment}`);
}

assert.equal(summary.safe_summary_only, true, "summary safe_summary_only");

console.log(JSON.stringify({
  status: "pass",
  checked_cases: 30,
  safe_summary_only: summary.safe_summary_only,
}));
