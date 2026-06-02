#!/usr/bin/env node

// CODEX_QUALITY_HARNESS_FILE v1.0.3

import assert from 'node:assert/strict';
import { classifyGovernanceFailures } from './codex-governance-failure-classifier.mjs';

function serialized(value) {
  return JSON.stringify(value);
}

function assertNoUnsafeOutput(value) {
  const output = serialized(value);
  for (const forbidden of [
    'raw PR body',
    'raw log',
    'endpoint',
    'API key',
    'token',
    'secret',
    'raw audio',
    'model_path',
    'dataset_path',
    'raw_phoneme_debug',
  ]) {
    assert.equal(output.includes(forbidden), false, `unsafe output leaked: ${forbidden}`);
  }
}

const writerOnly = classifyGovernanceFailures({
  reviewIndependenceReasonCodes: ['writer_only_review_detected', 'review_independence_missing'],
});
assert.equal(writerOnly.reviewIndependenceOwnerStatus, 'external_blocked_or_writer_only_review');
assert.equal(writerOnly.externalBlockedStatus, 'independent_reviewer_unavailable_or_missing');
assert.equal(writerOnly.mergeReadiness, 'no');

const dependencyBlocked = classifyGovernanceFailures({
  dependencyBlocked: true,
  dependencyReasonCodes: ['blocked_by_pr_dependency'],
});
assert.equal(dependencyBlocked.prDependencyBlockedStatus, 'blocked');
assert.equal(dependencyBlocked.mergeReadiness, 'no');

const evidenceMissing = classifyGovernanceFailures({
  contractFailed: true,
  contractReasonCodes: ['task_contract_missing'],
});
assert.equal(evidenceMissing.contractGovernanceOwnerStatus, 'evidence_body_defect');
assert.equal(evidenceMissing.evidenceBodyDefectStatus, 'present');

const complexity = classifyGovernanceFailures({
  complexityFailed: true,
  complexityReasonCodes: ['implementation_scope_too_large'],
});
assert.equal(complexity.complexityGovernanceOwnerStatus, 'implementation_scope_too_large');

const testCoverage = classifyGovernanceFailures({
  testCoverageFailed: true,
  testCoverageReasonCodes: ['test_evidence_missing'],
});
assert.equal(testCoverage.testCoverageEvidenceOwnerStatus, 'test_evidence_missing');

const aggregate = classifyGovernanceFailures({
  targetQualityFailed: true,
  reviewIndependenceReasonCodes: ['writer_only_review_detected'],
  dependencyBlocked: true,
});
assert.equal(aggregate.targetQualityScoreOwnerStatus, 'aggregate_failure');
assert.equal(aggregate.implementationDefectStatus, 'not_detected');
assert.equal(aggregate.governanceFailureClassificationSummary.aggregateFailure, true);

const rawInput = classifyGovernanceFailures({
  rawPrBody: 'raw PR body with endpoint and API key',
  rawFailureLog: 'raw log with token and model_path',
  reviewIndependenceReasonCodes: ['writer_only_review_detected'],
});
assertNoUnsafeOutput(rawInput);

console.log(JSON.stringify({
  status: 'pass',
  checked: 7,
  safeSummaryOnly: true,
}, null, 2));
