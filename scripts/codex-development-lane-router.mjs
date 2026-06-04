const LANES = new Set([
  "merge",
  "runtime",
  "existing_pr",
  "docs_only_planning",
  "spec_persistence",
  "roadmap_recovery",
  "common_utility_planning",
  "new_schema_validator",
  "new_runtime_integration",
  "new_product_implementation",
  "review_governance",
  "state_change_monitoring",
]);

const DOCS_ONLY_LANES = new Set([
  "docs_only_planning",
  "spec_persistence",
  "roadmap_recovery",
  "common_utility_planning",
]);

const BLOCKED_FIELDS = [
  ["runtime_readiness_claimed", "runtime_readiness_claim_blocked"],
  ["production_readiness_claimed", "production_readiness_claim_blocked"],
  ["real_tts_readiness_claimed", "real_tts_readiness_claim_blocked"],
  ["merge_readiness_claimed", "merge_readiness_claim_blocked"],
  ["touches_existing_preserve_pr", "existing_preserve_pr_touch_blocked"],
  ["touches_runtime", "runtime_touch_blocked"],
  ["touches_src", "src_touch_blocked"],
  ["touches_test", "test_touch_blocked"],
  ["touches_github_workflow", "workflow_touch_blocked"],
  ["touches_package", "package_touch_blocked"],
  ["calls_tts_engine", "tts_engine_call_blocked"],
  ["calls_moss_tts", "moss_tts_call_blocked"],
  ["calls_miso_tts", "miso_tts_call_blocked"],
  ["calls_irodori_tts", "irodori_tts_call_blocked"],
  ["calls_live2d_renderer", "live2d_renderer_call_blocked"],
  ["downloads_model", "model_download_blocked"],
  ["performs_api_call", "api_call_blocked"],
  ["adds_endpoint_config", "endpoint_config_blocked"],
  ["runs_benchmark", "benchmark_execution_blocked"],
  ["weakens_quality_gate", "quality_gate_weakening_blocked"],
  ["weakens_review_independence", "review_independence_weakening_blocked"],
  ["treats_writer_self_review_as_pass", "writer_self_review_pass_blocked"],
];

const DEFAULT_INPUT = {
  lane: "",
  changed_files: [],
  is_draft: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  merge_readiness_claimed: false,
  touches_existing_preserve_pr: false,
  touches_runtime: false,
  touches_src: false,
  touches_test: false,
  touches_scripts: false,
  touches_github_workflow: false,
  touches_package: false,
  touches_readme: false,
  calls_tts_engine: false,
  calls_moss_tts: false,
  calls_miso_tts: false,
  calls_irodori_tts: false,
  calls_live2d_renderer: false,
  downloads_model: false,
  performs_api_call: false,
  adds_endpoint_config: false,
  runs_benchmark: false,
  weakens_quality_gate: false,
  weakens_review_independence: false,
  treats_writer_self_review_as_pass: false,
  state_delta_detected: false,
  explicit_user_scope_change: false,
};

function normalizeInput(input = {}) {
  return {
    ...DEFAULT_INPUT,
    ...input,
    changed_files: Array.isArray(input.changed_files) ? input.changed_files : [],
  };
}

function isDocsProcessOnly(changedFiles) {
  return changedFiles.length > 0
    && changedFiles.every((file) => typeof file === "string" && file.startsWith("docs/process/"));
}

function buildResult({ lane, status, allowed, blocked, reasonCodes, safeNextAction }) {
  return {
    status,
    lane,
    allowed,
    blocked,
    reason_codes: [...new Set(reasonCodes)],
    safe_next_action: safeNextAction,
    safe_summary_only: true,
  };
}

function collectGlobalBlockedReasons(input) {
  return BLOCKED_FIELDS
    .filter(([field]) => input[field] === true)
    .map(([, reasonCode]) => reasonCode);
}

function classifyDocsOnlyLane(input, globalReasons) {
  const reasonCodes = [...globalReasons];

  if (!input.is_draft) {
    reasonCodes.push("draft_required");
  }

  if (!isDocsProcessOnly(input.changed_files)) {
    reasonCodes.push("docs_only_scope_required");
  }

  if (input.lane === "docs_only_planning" && !input.explicit_user_scope_change) {
    reasonCodes.push("explicit_scope_required");
  }

  if (input.touches_readme) {
    reasonCodes.push("docs_only_scope_required");
  }

  const blocked = reasonCodes.length > 0;
  return buildResult({
    lane: input.lane,
    status: blocked ? "blocked" : "allowed",
    allowed: !blocked,
    blocked,
    reasonCodes,
    safeNextAction: blocked
      ? "preserve existing PRs and keep the lane blocked until docs-only scope is explicit and clean"
      : "continue docs-only planning within the explicit scope only",
  });
}

export function classifyDevelopmentLane(rawInput = {}) {
  const input = normalizeInput(rawInput);
  const globalReasons = collectGlobalBlockedReasons(input);

  if (!LANES.has(input.lane)) {
    return buildResult({
      lane: input.lane || "unknown",
      status: "blocked",
      allowed: false,
      blocked: true,
      reasonCodes: ["lane_not_allowed", ...globalReasons],
      safeNextAction: "preserve existing PRs and use a recognized development lane",
    });
  }

  if (globalReasons.length > 0) {
    return buildResult({
      lane: input.lane,
      status: "blocked",
      allowed: false,
      blocked: true,
      reasonCodes: globalReasons,
      safeNextAction: "preserve existing PRs and remove blocked readiness, runtime, review, or side-effect signals",
    });
  }

  if (DOCS_ONLY_LANES.has(input.lane)) {
    return classifyDocsOnlyLane(input, globalReasons);
  }

  if (input.lane === "merge") {
    return buildResult({
      lane: input.lane,
      status: "blocked",
      allowed: false,
      blocked: true,
      reasonCodes: ["merge_lane_blocked"],
      safeNextAction: "keep merge lane blocked until review governance and quality-gate evidence are complete",
    });
  }

  if (input.lane === "runtime") {
    return buildResult({
      lane: input.lane,
      status: "blocked",
      allowed: false,
      blocked: true,
      reasonCodes: ["runtime_lane_blocked"],
      safeNextAction: "keep runtime lane blocked until adapter contract prerequisites are complete",
    });
  }

  if (input.lane === "existing_pr") {
    return buildResult({
      lane: input.lane,
      status: "preserve_only",
      allowed: false,
      blocked: false,
      reasonCodes: ["existing_pr_preserve_only"],
      safeNextAction: "preserve existing PRs without edits, reruns, rebases, comments, or merges",
    });
  }

  if (input.lane === "new_schema_validator") {
    return buildResult({
      lane: input.lane,
      status: "blocked_by_default",
      allowed: false,
      blocked: true,
      reasonCodes: ["lane_not_allowed"],
      safeNextAction: "do not create new schema or validator work unless explicitly scoped later",
    });
  }

  if (input.lane === "new_runtime_integration") {
    return buildResult({
      lane: input.lane,
      status: "blocked",
      allowed: false,
      blocked: true,
      reasonCodes: ["runtime_lane_blocked"],
      safeNextAction: "do not start runtime integration while runtime lane remains blocked",
    });
  }

  if (input.lane === "new_product_implementation") {
    return buildResult({
      lane: input.lane,
      status: "blocked_by_default",
      allowed: false,
      blocked: true,
      reasonCodes: ["lane_not_allowed"],
      safeNextAction: "do not create product implementation inventory by default",
    });
  }

  if (input.lane === "review_governance") {
    return buildResult({
      lane: input.lane,
      status: "read_only_monitoring",
      allowed: true,
      blocked: false,
      reasonCodes: [],
      safeNextAction: "monitor review governance metadata read-only without comments or review requests",
    });
  }

  if (input.lane === "state_change_monitoring") {
    if (!input.state_delta_detected) {
      return buildResult({
        lane: input.lane,
        status: "blocked_repeated_monitoring",
        allowed: false,
        blocked: true,
        reasonCodes: ["state_delta_required_for_monitoring"],
        safeNextAction: "do not rerun the same monitoring loop without a state delta",
      });
    }

    return buildResult({
      lane: input.lane,
      status: "allowed_monitoring",
      allowed: true,
      blocked: false,
      reasonCodes: [],
      safeNextAction: "perform read-only state-change monitoring only",
    });
  }

  return buildResult({
    lane: input.lane,
    status: "blocked",
    allowed: false,
    blocked: true,
    reasonCodes: ["lane_not_allowed"],
    safeNextAction: "preserve existing PRs and use a recognized development lane",
  });
}

export function buildDevelopmentLaneSafeSummary(records = []) {
  const results = records.map((record) => {
    if (record && typeof record === "object" && "status" in record && "safe_summary_only" in record) {
      return record;
    }
    return classifyDevelopmentLane(record);
  });

  return {
    record_count: results.length,
    allowed_count: results.filter((result) => result.allowed === true).length,
    blocked_count: results.filter((result) => result.blocked === true).length,
    docs_only_allowed_count: results.filter((result) => result.allowed === true && DOCS_ONLY_LANES.has(result.lane)).length,
    preserve_only_count: results.filter((result) => result.status === "preserve_only").length,
    runtime_blocked_count: results.filter((result) => result.reason_codes.includes("runtime_lane_blocked")).length,
    merge_blocked_count: results.filter((result) => result.reason_codes.includes("merge_lane_blocked")).length,
    state_delta_required_count: results.filter((result) => result.reason_codes.includes("state_delta_required_for_monitoring")).length,
    safe_summary_only: true,
  };
}
