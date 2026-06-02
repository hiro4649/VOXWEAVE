#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.3

import assert from 'node:assert/strict';
import { classifyGovernanceFailures } from './codex-governance-failure-classifier.mjs';

function checkReviewIndependenceBlocked() {
  const result = classifyGovernanceFailures({
    reviewIndependenceReasonCodes: ['writer_only_review_detected'],
    independentReviewMissing: true,
    targetQualityFailed: true,
  });

  assert.equal(result.reviewIndependenceOwnerStatus, 'external_blocked_or_writer_only_review');
  assert.equal(result.externalBlockedStatus, 'independent_reviewer_unavailable_or_missing');
  assert.equal(result.mergeReadiness, 'no');
  assert.notEqual(result.reviewIndependenceOwnerStatus, 'pass');
}

function checkDependencyBlocked() {
  const result = classifyGovernanceFailures({ dependencyBlocked: true, targetQualityFailed: true });

  assert.equal(result.prDependencyBlockedStatus, 'blocked');
  assert.equal(result.mergeReadiness, 'no');
}

function checkContractEvidenceBodyDefect() {
  const result = classifyGovernanceFailures({
    contractFailed: true,
    contractReasonCodes: ['task_contract_verification_surface_missing'],
  });

  assert.equal(result.contractGovernanceOwnerStatus, 'evidence_body_defect');
  assert.equal(result.evidenceBodyDefectStatus, 'present');
}

function checkComplexityOversizedImplementation() {
  const result = classifyGovernanceFailures({
    complexityFailed: true,
    oversizedImplementation: true,
  });

  assert.equal(result.complexityGovernanceOwnerStatus, 'implementation_scope_too_large');
}

function checkTestEvidenceMissing() {
  const result = classifyGovernanceFailures({
    testCoverageFailed: true,
    testCoverageReasonCodes: ['test_coverage_evidence_missing'],
  });

  assert.equal(result.testCoverageEvidenceOwnerStatus, 'test_evidence_missing');
}

function checkTargetQualityAggregate() {
  const result = classifyGovernanceFailures({
    targetQualityFailed: true,
    dependencyBlocked: true,
    reviewIndependenceReasonCodes: ['review_independence_missing'],
  });

  assert.equal(result.targetQualityScoreOwnerStatus, 'aggregate_failure');
  assert.equal(result.targetQualityScoreInputs.includes('reviewIndependenceStatus'), true);
  assert.equal(result.targetQualityScoreInputs.includes('prDependencyBlockedStatus'), true);
  assert.equal(result.implementationDefectStatus, 'not_detected');
}

function checkRawInputNotDisclosed() {
  const result = classifyGovernanceFailures({
    contractFailed: true,
    contractReasonCodes: ['task_contract_missing'],
    rawPrBody: 'raw PR body',
    rawLog: 'raw log',
    endpoint: 'https://example.invalid/secret',
    apiKey: 'api_key_value',
    token: 'token_value',
    secret: 'secret_value',
    rawAudio: 'raw audio',
    modelPath: '/private/model/path',
    datasetPath: '/private/dataset/path',
    rawPhonemeDebug: 'raw phoneme debug',
  });
  const serialized = JSON.stringify(result);
  const forbidden = [
    'raw PR body',
    'raw log',
    'https://example.invalid/secret',
    'api_key_value',
    'token_value',
    'secret_value',
    'raw audio',
    '/private/model/path',
    '/private/dataset/path',
    'raw phoneme debug',
  ];

  for (const value of forbidden) assert.equal(serialized.includes(value), false);
  assert.equal(result.safeSummaryOnly, true);
}

checkReviewIndependenceBlocked();
checkDependencyBlocked();
checkContractEvidenceBodyDefect();
checkComplexityOversizedImplementation();
checkTestEvidenceMissing();
checkTargetQualityAggregate();
checkRawInputNotDisclosed();

process.stdout.write('governance failure classifier self-check: pass\n');
