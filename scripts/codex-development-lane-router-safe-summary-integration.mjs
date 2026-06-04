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

const BLOCKED_INTEGRATION_FLAGS = [
  ["active_quality_gate_integration", "active_quality_gate_integration_not_allowed"],
  ["pass_fail_semantics_changed", "pass_fail_semantics_change_not_allowed"],
  ["target_quality_score_changed", "target_quality_score_change_not_allowed"],
  ["workflow_changed", "workflow_change_not_allowed"],
  ["package_changed", "package_change_not_allowed"],
  ["runtime_changed", "runtime_change_not_allowed"],
  ["review_governance_behavior_changed", "review_governance_behavior_change_not_allowed"],
  ["merge_readiness", "merge_readiness_not_allowed"],
];

function normalizeSource(source) {
  if (source === undefined || source === null || source === "") {
    return { source: "local_rehearsal", reasonCodes: [] };
  }

  if (ALLOWED_SOURCES.has(source)) {
    return { source, reasonCodes: [] };
  }

  return { source: "unknown", reasonCodes: ["source_not_allowed"] };
}

function collectIntegrationReasonCodes(input) {
  return BLOCKED_INTEGRATION_FLAGS
    .filter(([field]) => input[field] === true)
    .map(([, reasonCode]) => reasonCode);
}

function buildBlockedSummary({ source, reasonCodes }) {
  return {
    status: "blocked",
    source,
    ...FIXED_INTEGRATION_FLAGS,
    reason_codes: [...new Set(reasonCodes)],
    lane_summary: buildDevelopmentLaneSafeSummary([]),
  };
}

export function buildDevelopmentLaneIntegrationSafeSummary(input = {}) {
  const records = Array.isArray(input.records) ? input.records : null;
  const { source, reasonCodes: sourceReasonCodes } = normalizeSource(input.source);
  const integrationReasonCodes = [
    ...sourceReasonCodes,
    ...collectIntegrationReasonCodes(input),
  ];

  if (!records) {
    return buildBlockedSummary({
      source,
      reasonCodes: [...integrationReasonCodes, "records_must_be_array"],
    });
  }

  if (integrationReasonCodes.length > 0) {
    return buildBlockedSummary({
      source,
      reasonCodes: integrationReasonCodes,
    });
  }

  const classifiedRecords = records.map((record) => classifyDevelopmentLane(record));

  return {
    status: "pass",
    source,
    ...FIXED_INTEGRATION_FLAGS,
    lane_summary: buildDevelopmentLaneSafeSummary(classifiedRecords),
  };
}
