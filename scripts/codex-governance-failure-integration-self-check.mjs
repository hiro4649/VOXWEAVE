#!/usr/bin/env node

// CODEX_QUALITY_HARNESS_FILE v1.0.3

import assert from 'node:assert/strict';
import { buildGovernanceFailureClassificationStatus } from './codex-local-quality-gate.mjs';
import { evaluateWorkflowReport } from './codex-workflow-quality-runner.mjs';

function assertNoUnsafeOutput(value) {
  const output = JSON.stringify(value);
  for (const forbidden of [
    'raw PR body',
    'raw logs',
    'raw artifact',
    'endpoint',
    'API key',
    'token',
    'secret',
    'raw audio',
    'model path',
    'dataset path',
    'raw phoneme debug',
  ]) {
    assert.equal(output.includes(forbidden), false, `unsafe output leaked: ${forbidden}`);
  }
}

const report = {
  stalePrAuditStatus: {
    status: 'fail',
    reasonCodes: ['stale_evidence'],
    safeSummaryOnly: true,
  },
  reviewIndependenceStatus: {
    status: 'fail',
    reasonCodes: ['writer_only_review_detected', 'review_independence_missing'],
    safeSummaryOnly: true,
  },
  prProfileStatus: {
    status: 'fail',
    reasonCodes: ['pr_body_missing'],
    safeSummaryOnly: true,
  },
  contractGovernanceStatus: {
    status: 'fail',
    reasonCodes: ['task_contract_missing'],
    safeSummaryOnly: true,
  },
  complexityGovernanceStatus: {
    status: 'fail',
    reasonCodes: ['implementation_scope_too_large'],
    safeSummaryOnly: true,
  },
  testCoverageEvidenceStatus: {
    status: 'fail',
    reasonCodes: ['test_evidence_missing'],
    safeSummaryOnly: true,
  },
  targetQualityScoreStatus: {
    status: 'fail',
    reasonCodes: ['target_quality_score_failed'],
    safeSummaryOnly: true,
  },
};

const before = JSON.parse(JSON.stringify(report));
const classification = buildGovernanceFailureClassificationStatus(report);
const workflowResult = evaluateWorkflowReport({
  ...report,
  governanceFailureClassificationStatus: classification,
  status: 'fail',
  mergeReady: false,
});
const workflowClassification = workflowResult.safeSummary.governanceFailureClassificationStatus;

assert.equal(classification.status, 'pass');
assert.equal(classification.governanceFailureClassificationStatus, 'diagnostic_only');
assert.equal(workflowClassification.governanceFailureClassificationStatus, 'diagnostic_only');
assert.equal(classification.reviewIndependenceOwnerStatus, 'external_blocked_or_writer_only_review');
assert.equal(classification.externalBlockedStatus, 'independent_reviewer_unavailable_or_missing');
assert.equal(classification.targetQualityScoreOwnerStatus, 'aggregate_failure');
assert.equal(classification.mergeReadiness, 'no');
assert.equal(classification.userManualWorkAvoided, true);
assert.equal(classification.developmentMode, '5.5-low');
assert.equal(classification.safeSummaryOnly, true);

assert.deepEqual(report.stalePrAuditStatus, before.stalePrAuditStatus);
assert.deepEqual(report.reviewIndependenceStatus, before.reviewIndependenceStatus);
assert.deepEqual(report.targetQualityScoreStatus, before.targetQualityScoreStatus);
assertNoUnsafeOutput(classification);

console.log(JSON.stringify({
  status: 'pass',
  checked: 8,
  safeSummaryOnly: true,
}, null, 2));
