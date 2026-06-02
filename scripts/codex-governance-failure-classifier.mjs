#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.3

import { fileURLToPath } from 'node:url';

function list(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

function has(values, code) {
  return list(values).includes(code);
}

function hasAny(values, codes) {
  return codes.some((code) => has(values, code));
}

function unique(values) {
  return [...new Set(list(values).filter(Boolean))];
}

function oneLine(value) {
  return String(value || '').replace(/\s+/gu, ' ').trim();
}

function classifyContract(input) {
  const reasons = list(input.contractReasonCodes);
  if (input.dependencyBlocked) return 'dependency_blocked';
  if (input.externalBlocked) return 'external_blocked';
  if (input.implementationScopeViolation || has(reasons, 'implementation_scope_violation')) return 'implementation_defect';
  if (hasAny(reasons, [
    'task_contract_missing',
    'task_contract_verification_surface_missing',
    'load_bearing_evidence_missing',
    'load_bearing_evidence_invalid',
  ])) return 'evidence_body_defect';
  return input.contractFailed ? 'unknown_governance_failure' : 'not_applicable';
}

function classifyComplexity(input) {
  const reasons = list(input.complexityReasonCodes);
  if (input.dependencyBlocked) return 'dependency_blocked';
  if (input.externalBlocked) return 'external_blocked';
  if (input.oversizedImplementation || has(reasons, 'implementation_scope_too_large')) return 'implementation_scope_too_large';
  if (hasAny(reasons, [
    'solvability_constraints_missing',
    'high_complexity_contract_missing',
    'task_contract_verification_surface_missing',
    'reasoning_evidence_effort_mismatch',
    'oracle_required_for_auth_surface',
    'oracle_required_for_release_gate',
  ])) return 'evidence_body_defect';
  return input.complexityFailed ? 'unknown_complexity_failure' : 'not_applicable';
}

function classifyTestCoverage(input) {
  const reasons = list(input.testCoverageReasonCodes);
  if (input.externalBlocked) return 'external_blocked';
  if (input.productTestNotRequiredForHarnessSlice) return 'product_test_not_required_for_harness_slice';
  if (has(reasons, 'test_evidence_missing') || has(reasons, 'test_coverage_evidence_missing')) return 'test_evidence_missing';
  if (hasAny(reasons, ['test_coverage_section_missing', 'verification_surface_missing'])) return 'evidence_body_defect';
  return input.testCoverageFailed ? 'unknown_test_evidence_failure' : 'not_applicable';
}

export function classifyGovernanceFailures(input = {}) {
  const reviewReasons = list(input.reviewIndependenceReasonCodes);
  const dependencyBlocked = Boolean(input.dependencyBlocked);
  const reviewMissing = hasAny(reviewReasons, ['writer_only_review_detected', 'review_independence_missing'])
    || Boolean(input.independentReviewMissing || input.writerOnlyReviewDetected);
  const externalBlocked = reviewMissing || Boolean(input.externalBlocked);
  const contractGovernanceOwnerStatus = classifyContract({ ...input, dependencyBlocked, externalBlocked });
  const complexityGovernanceOwnerStatus = classifyComplexity({ ...input, dependencyBlocked, externalBlocked });
  const testCoverageEvidenceOwnerStatus = classifyTestCoverage({ ...input, externalBlocked });
  const lowerFailures = unique([
    input.contractFailed ? 'contractGovernanceStatus' : '',
    input.complexityFailed ? 'complexityGovernanceStatus' : '',
    input.testCoverageFailed ? 'testCoverageEvidenceStatus' : '',
    input.targetQualityFailed ? 'targetQualityScoreStatus' : '',
    reviewMissing ? 'reviewIndependenceStatus' : '',
    dependencyBlocked ? 'prDependencyBlockedStatus' : '',
    externalBlocked ? 'externalBlockedStatus' : '',
  ]);
  const implementationDefectStatus = input.implementationDefect
    || contractGovernanceOwnerStatus === 'implementation_defect'
    || complexityGovernanceOwnerStatus === 'implementation_scope_too_large'
    ? 'present'
    : 'not_detected';
  const evidenceBodyDefectStatus = [
    contractGovernanceOwnerStatus,
    complexityGovernanceOwnerStatus,
    testCoverageEvidenceOwnerStatus,
  ].includes('evidence_body_defect') ? 'present' : 'not_detected';
  const safeNextAction = oneLine(input.safeNextAction)
    || (reviewMissing
      ? 'Preserve merge block until independent review metadata exists.'
      : 'Classify governance failures without changing merge rules.');

  return {
    schema: 'codex_governance_failure_classifier_v1',
    contractGovernanceOwnerStatus,
    complexityGovernanceOwnerStatus,
    testCoverageEvidenceOwnerStatus,
    targetQualityScoreOwnerStatus: input.targetQualityFailed ? 'aggregate_failure' : 'not_applicable',
    targetQualityScoreInputs: lowerFailures,
    reviewIndependenceOwnerStatus: reviewMissing ? 'external_blocked_or_writer_only_review' : 'not_applicable',
    prDependencyBlockedStatus: dependencyBlocked ? 'blocked' : 'not_blocked',
    implementationDefectStatus,
    evidenceBodyDefectStatus,
    externalBlockedStatus: reviewMissing
      ? 'independent_reviewer_unavailable_or_missing'
      : externalBlocked ? 'external_blocked' : 'not_detected',
    codexActionAllowed: reviewMissing ? 'classify_only' : 'classify_governance_failures_with_safe_summary_only',
    userManualWorkAvoided: true,
    safeNextAction,
    developmentMode: '5.5-low',
    mergeReadiness: 'no',
    safeSummaryOnly: true,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = classifyGovernanceFailures({
    contractFailed: process.env.CODEX_CONTRACT_FAILED === '1',
    complexityFailed: process.env.CODEX_COMPLEXITY_FAILED === '1',
    testCoverageFailed: process.env.CODEX_TEST_COVERAGE_FAILED === '1',
    targetQualityFailed: process.env.CODEX_TARGET_QUALITY_FAILED === '1',
    dependencyBlocked: process.env.CODEX_PR_DEPENDENCY_BLOCKED === '1',
    independentReviewMissing: process.env.CODEX_INDEPENDENT_REVIEW_MISSING === '1',
    writerOnlyReviewDetected: process.env.CODEX_WRITER_ONLY_REVIEW_DETECTED === '1',
    contractReasonCodes: String(process.env.CODEX_CONTRACT_REASON_CODES || '').split(',').filter(Boolean),
    complexityReasonCodes: String(process.env.CODEX_COMPLEXITY_REASON_CODES || '').split(',').filter(Boolean),
    testCoverageReasonCodes: String(process.env.CODEX_TEST_COVERAGE_REASON_CODES || '').split(',').filter(Boolean),
    reviewIndependenceReasonCodes: String(process.env.CODEX_REVIEW_REASON_CODES || '').split(',').filter(Boolean),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
