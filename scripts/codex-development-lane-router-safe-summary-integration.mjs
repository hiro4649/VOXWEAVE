import {
  buildDevelopmentLaneSafeSummary,
  classifyDevelopmentLane,
} from "./codex-development-lane-router.mjs";

const ALLOWED_SOURCES = new Set([
  "local_rehearsal",
  "future_quality_gate_safe_summary",
]);

const FIXED_INTEGRATION_FLAGS = {
  active_quality_gate_integration: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  safe_summary_only: true,
};

function normalizeSource(source) {
  return ALLOWED_SOURCES.has(source) ? source : "local_rehearsal";
}

export function buildDevelopmentLaneIntegrationSafeSummary(input = {}) {
  const records = Array.isArray(input.records) ? input.records : null;
  const source = normalizeSource(input.source);

  if (!records) {
    return {
      status: "blocked",
      source,
      ...FIXED_INTEGRATION_FLAGS,
      reason_codes: ["records_must_be_array"],
      lane_summary: buildDevelopmentLaneSafeSummary([]),
    };
  }

  const classifiedRecords = records.map((record) => classifyDevelopmentLane(record));

  return {
    status: "pass",
    source,
    ...FIXED_INTEGRATION_FLAGS,
    lane_summary: buildDevelopmentLaneSafeSummary(classifiedRecords),
  };
}
