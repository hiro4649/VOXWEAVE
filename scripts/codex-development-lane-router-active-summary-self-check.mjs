#!/usr/bin/env node

import fs from 'node:fs';

import { buildDevelopmentLaneIntegrationSafeSummary } from './codex-development-lane-router-safe-summary-integration.mjs';

const LOCAL_GATE_PATH = 'scripts/codex-local-quality-gate.mjs';
const localGateText = fs.readFileSync(LOCAL_GATE_PATH, 'utf8');

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countOccurrences(text, pattern) {
  return (text.match(new RegExp(pattern, 'g')) || []).length;
}

function assertFixedFalseFlags(summary) {
  assertCondition(summary.active_quality_gate_integration === false, 'active integration flag changed');
  assertCondition(summary.pass_fail_semantics_changed === false, 'pass/fail semantics flag changed');
  assertCondition(summary.target_quality_score_changed === false, 'target quality score flag changed');
  assertCondition(summary.workflow_changed === false, 'workflow flag changed');
  assertCondition(summary.package_changed === false, 'package flag changed');
  assertCondition(summary.runtime_changed === false, 'runtime flag changed');
  assertCondition(summary.review_governance_behavior_changed === false, 'review governance flag changed');
  assertCondition(summary.merge_readiness === false, 'merge readiness flag changed');
  assertCondition(summary.safe_summary_only === true, 'safe summary flag changed');
}

function diagnosticOnlyBlocks(text) {
  const blockRegex = /CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_START([\s\S]*?)CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_END/g;
  return [...text.matchAll(blockRegex)].map((match) => match[1]);
}

function assertDiagnosticBlockIsObservationOnly(text) {
  const blocks = diagnosticOnlyBlocks(text);
  assertCondition(blocks.length > 0, 'diagnostic-only block missing');

  const forbiddenUsages = [
    'report.status',
    'report.mergeReady',
    'report.localGate',
    'failures',
    'warnings',
    'process.exit',
    'throw',
    'qualityScore',
    'targetQualityScore',
    'mergeReadiness',
    'reviewIndependence',
    'productionGo',
    'runtimeReadiness',
    'failure',
    'failed',
    'blocking',
    'blockers',
  ];

  for (const block of blocks) {
    for (const forbiddenUsage of forbiddenUsages) {
      assertCondition(!block.includes(forbiddenUsage), `diagnostic block uses forbidden term: ${forbiddenUsage}`);
    }
  }
}

function assertDiagnosticMarkersPresent(text) {
  const markers = [
    'CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_NO_PASS_FAIL_SEMANTICS',
    'CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_NO_TARGET_QUALITY_SCORE_CHANGE',
    'CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_NO_REVIEW_GOVERNANCE_CHANGE',
    'CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_NO_MERGE_READINESS_CHANGE',
    'CODEX_DEVELOPMENT_LANE_ROUTER_DIAGNOSTIC_ONLY_NO_RUNTIME_READINESS_CHANGE',
  ];

  for (const marker of markers) {
    assertCondition(text.includes(marker), `diagnostic marker missing: ${marker}`);
  }
}

function assertDiagnosticFieldUsageIsAssignmentOnly(text) {
  const lines = text.split(/\r?\n/);
  const fieldNames = [
    'developmentLaneRouterIntegrationStatus',
    'developmentLaneRouterIntegrationSummary',
  ];
  const forbiddenNearFieldUsages = [
    'if',
    'else if',
    'switch',
    'throw',
    'process.exit',
    'failures.push',
    'warnings.push',
    'qualityScore',
    'targetQualityScore',
    'mergeReady',
    'reviewIndependence',
    'runtimeReadiness',
    'productionGo',
    'blockers',
    'blocking',
  ];

  for (const fieldName of fieldNames) {
    const occurrenceIndexes = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes(fieldName));
    assertCondition(occurrenceIndexes.length === 1, `${fieldName} must appear once in local gate`);

    const { line, index } = occurrenceIndexes[0];
    assertCondition(
      line.trim() === `report.${fieldName} = ${fieldName === 'developmentLaneRouterIntegrationStatus' ? "'diagnostic_only'" : 'buildDevelopmentLaneRouterDiagnosticSummary()'};`,
      `${fieldName} must be diagnostic assignment only`,
    );

    const nearbyText = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 4)).join('\n');
    for (const forbiddenUsage of forbiddenNearFieldUsages) {
      if (forbiddenUsage === 'mergeReady') {
        assertCondition(!nearbyText.includes('report.mergeReady'), `${fieldName} is near mergeReady use`);
      } else {
        assertCondition(!nearbyText.includes(forbiddenUsage), `${fieldName} is near forbidden use: ${forbiddenUsage}`);
      }
    }
  }
}

function assertDiagnosticAttachmentShape(text) {
  assertCondition(text.includes('function buildDevelopmentLaneRouterDiagnosticSummary()'), 'diagnostic summary function missing');
  assertCondition(text.includes('function attachDevelopmentLaneRouterDiagnostic(report)'), 'diagnostic attachment function missing');
  assertCondition(
    text.includes("report.developmentLaneRouterIntegrationStatus = 'diagnostic_only';"),
    'diagnostic status assignment missing',
  );
  assertCondition(
    text.includes('report.developmentLaneRouterIntegrationSummary = buildDevelopmentLaneRouterDiagnosticSummary();'),
    'diagnostic summary assignment missing',
  );

  const blocks = diagnosticOnlyBlocks(text);
  const combinedBlockText = blocks.join('\n');
  assertCondition(
    countOccurrences(combinedBlockText, 'report\\.developmentLaneRouterIntegration') === 2,
    'diagnostic attachment must add exactly two report fields',
  );
}

function assertDiagnosticCoverage(text) {
  const attachCount = countOccurrences(text, 'attachDevelopmentLaneRouterDiagnostic\\(report\\)');
  assertCondition(attachCount >= 4, 'diagnostic attachment coverage must cover multiple report paths');
}

assertCondition(
  localGateText.includes("from './codex-development-lane-router-safe-summary-integration.mjs'"),
  'local quality gate does not import lane router safe summary integration',
);
assertCondition(
  localGateText.includes('developmentLaneRouterIntegrationStatus')
    && localGateText.includes('developmentLaneRouterIntegrationSummary'),
  'local quality gate does not expose lane router diagnostic fields',
);
assertDiagnosticMarkersPresent(localGateText);
assertDiagnosticBlockIsObservationOnly(localGateText);
assertDiagnosticFieldUsageIsAssignmentOnly(localGateText);
assertDiagnosticAttachmentShape(localGateText);
assertDiagnosticCoverage(localGateText);

const summary = buildDevelopmentLaneIntegrationSafeSummary({
  source: 'future_quality_gate_safe_summary',
  active_quality_gate_integration: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  records: [
    {
      lane: 'docs_only_planning',
      changed_files: ['docs/process/CODEX_EXAMPLE.md'],
      is_draft: true,
      explicit_user_scope_change: true,
      branch_name: 'branch name',
      pr_body: 'PR body',
      endpoint: 'endpoint',
      api_key: 'api_key',
      token: 'token',
      secret: 'secret',
      model_path: 'C:/private/model',
      dataset_path: 'C:/private/dataset',
      raw_payload: 'raw_payload',
      raw_logs: 'raw logs',
      url: 'https://bad.invalid',
      developmentLaneRouterIntegrationStatus: 'developmentLaneRouterIntegrationStatus_private_suffix',
      developmentLaneRouterIntegrationSummary: 'developmentLaneRouterIntegrationSummary_private_suffix',
      qualityScore: 'qualityScore_private_suffix',
      mergeReady: 'mergeReady_private_suffix',
      reviewIndependence: 'reviewIndependence_private_suffix',
      runtimeReadiness: 'runtimeReadiness_private_suffix',
      productionGo: 'productionGo_private_suffix',
    },
    {
      lane: 'docs_only_planning',
      changed_files: ['src/example.js'],
      is_draft: true,
      explicit_user_scope_change: true,
    },
    {
      lane: 'docs_only_planning',
      changed_files: ['scripts/example.mjs'],
      is_draft: true,
      explicit_user_scope_change: true,
    },
    {
      lane: 'docs_only_planning',
      changed_files: ['README.md'],
      is_draft: true,
      explicit_user_scope_change: true,
    },
    {
      lane: 'docs_only_planning',
      changed_files: ['.github/workflows/quality-gate.yml'],
      is_draft: true,
      explicit_user_scope_change: true,
    },
    {
      lane: 'docs_only_planning',
      changed_files: ['package.json'],
      is_draft: true,
      explicit_user_scope_change: true,
    },
    { lane: 'merge' },
    { lane: 'runtime' },
    { lane: 'state_change_monitoring', state_delta_detected: false },
  ],
});

assertCondition(summary.status === 'pass', 'integration summary did not pass');
assertFixedFalseFlags(summary);
assertCondition(summary.lane_summary?.safe_summary_only === true, 'lane summary is not safe-summary-only');

const serializedSummary = JSON.stringify(summary);
const forbiddenLeaks = [
  'docs/process/CODEX_EXAMPLE.md',
  'src/example.js',
  'scripts/example.mjs',
  'README.md',
  '.github/workflows/quality-gate.yml',
  'package.json',
  'branch name',
  'PR body',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'model_path',
  'dataset_path',
  'raw_payload',
  'raw logs',
  'https://bad.invalid',
  'C:/private/model',
  'C:/private/dataset',
  'developmentLaneRouterIntegrationStatus_private_suffix',
  'developmentLaneRouterIntegrationSummary_private_suffix',
  'qualityScore_private_suffix',
  'mergeReady_private_suffix',
  'reviewIndependence_private_suffix',
  'runtimeReadiness_private_suffix',
  'productionGo_private_suffix',
];

for (const forbiddenLeak of forbiddenLeaks) {
  assertCondition(!serializedSummary.includes(forbiddenLeak), `safe summary leaked: ${forbiddenLeak}`);
}

console.log(JSON.stringify({
  status: 'pass',
  development_lane_diagnostic_usage_status: 'pass',
  development_lane_diagnostic_attachment_status: 'pass',
  development_lane_diagnostic_coverage_status: 'pass',
  diagnostic_only_no_pass_fail_semantics: true,
  diagnostic_only_no_target_quality_score_change: true,
  diagnostic_only_no_review_governance_change: true,
  diagnostic_only_no_merge_readiness_change: true,
  diagnostic_only_no_runtime_readiness_change: true,
  active_quality_gate_integration: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  safe_summary_only: true,
}, null, 2));
