#!/usr/bin/env node

// CODEX_QUALITY_HARNESS_FILE v1.0.3

const SCHEMA = 'codex_governance_failure_classifier_v1';
const DEVELOPMENT_MODE = '5.5-low';
const SAFE_NEXT_ACTION = 'Classify remaining governance failures without changing pass/fail semantics.';

const UNSAFE_OUTPUT_PATTERNS = [
  /raw pr body/i,
  /raw artifact/i,
  /raw log/i,
  /endpoint/i,
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /raw audio/i,
  /model[_-]?path/i,
  /dataset[_-]?path/i,
  /raw phoneme debug/i,
];

function list(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value == null) return [];
  return [String(value)];
}

function hasAny(values, candidates) {
  const set = new Set(list(values));
  return candidates.some((candidate) => set.has(candidate));
}

function unique(values) {
  return [...new Set(list(values).filter(Boolean))];
}

function statusFailed(value) {
  if (typeof value === 'boolean') return value;
  if (!value || typeof value !== 'object') return false;
  return value.status === 'fail';
}

function reasonsFrom(input, keys) {
  const reasons = [];
  for (const key of keys) reasons.push(...list(input[key]));
  return unique(reasons);
}

function classifyPrProfile({ failed, reasons }) {
  if (!failed) return 'not_failed';
  if (hasAny(reasons, ['pr_profile_missing', 'pr_body_missing', 'task_contract_missing', 'evidence_missing'])) {
    return 'evidence_body_defect';
  }
  return 'unknown_pr_profile_failure';
}

function classifyContract({ failed, reasons, dependencyBlocked, externalBlocked }) {
  if (!failed) return 'not_failed';
  if (dependencyBlocked) return 'dependency_blocked';
  if (externalBlocked) return 'external_blocked';
  if (hasAny(reasons, ['contract_evidence_missing', 'task_contract_missing', 'load_bearing_evidence_missing', 'pr_body_missing'])) {
    return 'evidence_body_defect';
  }
  if (hasAny(reasons, ['contract_implementation_defect', 'unsafe_contract_output'])) {
    return 'implementation_defect';
  }
  return 'unknown_governance_failure';
}

function classifyComplexity({ failed, reasons, dependencyBlocked, externalBlocked }) {
  if (!failed) return 'not_failed';
  if (dependencyBlocked) return 'dependency_blocked';
  if (externalBlocked) return 'external_blocked';
  if (hasAny(reasons, ['implementation_scope_too_large', 'mixed_surface_detected', 'broad_refactor_detected'])) {
    return 'implementation_scope_too_large';
  }
  if (hasAny(reasons, ['complexity_evidence_missing', 'task_contract_missing', 'pr_body_missing'])) {
    return 'evidence_body_defect';
  }
  return 'unknown_complexity_failure';
}

function classifyTestCoverage({ failed, reasons, externalBlocked }) {
  if (!failed) return 'not_failed';
  if (externalBlocked) return 'external_blocked';
  if (hasAny(reasons, ['self_check_missing', 'harness_self_check_missing'])) {
    return 'missing_self_check';
  }
  if (hasAny(reasons, ['test_evidence_missing', 'coverage_evidence_missing'])) {
    return 'test_evidence_missing';
  }
  if (hasAny(reasons, ['product_test_evidence_missing', 'product_focused_test_missing'])) {
    return 'missing_product_focused_test_evidence';
  }
  if (hasAny(reasons, ['pr_body_missing'])) {
    return 'evidence_body_defect';
  }
  return 'unknown_test_evidence_failure';
}

function buildSummary(input) {
  return {
    failedInputs: unique(input.failedInputs),
    aggregateFailure: Boolean(input.targetQualityFailed),
    safeSummaryOnly: true,
  };
}

function includesUnsafeOutput(value) {
  const serialized = JSON.stringify(value);
  return UNSAFE_OUTPUT_PATTERNS.some((pattern) => pattern.test(serialized));
}

export function classifyGovernanceFailures(input = {}) {
  const reviewReasons = reasonsFrom(input, ['reviewIndependenceReasonCodes', 'reviewReasonCodes', 'reasonCodes']);
  const dependencyReasons = reasonsFrom(input, ['dependencyReasonCodes', 'prDependencyReasonCodes']);
  const prProfileReasons = reasonsFrom(input, ['prProfileReasonCodes']);
  const contractReasons = reasonsFrom(input, ['contractReasonCodes', 'contractGovernanceReasonCodes']);
  const complexityReasons = reasonsFrom(input, ['complexityReasonCodes', 'complexityGovernanceReasonCodes']);
  const testCoverageReasons = reasonsFrom(input, ['testCoverageReasonCodes', 'testCoverageEvidenceReasonCodes']);

  const reviewBlocked = Boolean(input.independentReviewMissing)
    || statusFailed(input.reviewIndependenceStatus)
    || hasAny(reviewReasons, ['writer_only_review_detected', 'review_independence_missing']);
  const dependencyBlocked = Boolean(input.dependencyBlocked)
    || hasAny(dependencyReasons, ['dependency_unresolved', 'blocked_by_pr_dependency', 'blocked']);
  const prProfileFailed = Boolean(input.prProfileFailed) || statusFailed(input.prProfileStatus);
  const contractFailed = Boolean(input.contractFailed) || statusFailed(input.contractGovernanceStatus);
  const complexityFailed = Boolean(input.complexityFailed) || statusFailed(input.complexityGovernanceStatus);
  const testCoverageFailed = Boolean(input.testCoverageFailed) || statusFailed(input.testCoverageEvidenceStatus);
  const targetQualityFailed = Boolean(input.targetQualityFailed) || statusFailed(input.targetQualityScoreStatus);

  const externalBlockedStatus = reviewBlocked
    ? 'independent_reviewer_unavailable_or_missing'
    : (Boolean(input.externalBlocked) ? 'present' : 'not_detected');

  const prProfileOwnerStatus = classifyPrProfile({
    failed: prProfileFailed,
    reasons: prProfileReasons,
  });
  const contractGovernanceOwnerStatus = classifyContract({
    failed: contractFailed,
    reasons: contractReasons,
    dependencyBlocked,
    externalBlocked: reviewBlocked,
  });
  const complexityGovernanceOwnerStatus = classifyComplexity({
    failed: complexityFailed,
    reasons: complexityReasons,
    dependencyBlocked,
    externalBlocked: reviewBlocked,
  });
  const testCoverageEvidenceOwnerStatus = classifyTestCoverage({
    failed: testCoverageFailed,
    reasons: testCoverageReasons,
    externalBlocked: reviewBlocked,
  });

  const evidenceBodyDefectStatus = [
    prProfileOwnerStatus,
    contractGovernanceOwnerStatus,
    complexityGovernanceOwnerStatus,
    testCoverageEvidenceOwnerStatus,
  ].includes('evidence_body_defect') ? 'present' : 'not_detected';

  const implementationDefectStatus = [
    contractGovernanceOwnerStatus,
  ].includes('implementation_defect') ? 'present' : 'not_detected';

  const lowerFailures = [];
  if (prProfileFailed) lowerFailures.push('prProfileStatus.failed');
  if (contractFailed) lowerFailures.push('contractGovernanceStatus.failed');
  if (complexityFailed) lowerFailures.push('complexityGovernanceStatus.failed');
  if (testCoverageFailed) lowerFailures.push('testCoverageEvidenceStatus.failed');
  if (reviewBlocked) lowerFailures.push('reviewIndependenceStatus.failed');
  if (dependencyBlocked) lowerFailures.push('prDependencyBlockedStatus.blocked');

  const classification = {
    schema: SCHEMA,
    governanceFailureClassificationSummary: buildSummary({
      failedInputs: lowerFailures,
      targetQualityFailed,
    }),
    prProfileOwnerStatus,
    contractGovernanceOwnerStatus,
    complexityGovernanceOwnerStatus,
    testCoverageEvidenceOwnerStatus,
    targetQualityScoreOwnerStatus: targetQualityFailed ? 'aggregate_failure' : 'not_failed',
    reviewIndependenceOwnerStatus: reviewBlocked ? 'external_blocked_or_writer_only_review' : 'not_failed',
    prDependencyBlockedStatus: dependencyBlocked ? 'blocked' : 'not_detected',
    implementationDefectStatus,
    evidenceBodyDefectStatus,
    externalBlockedStatus,
    codexActionAllowed: reviewBlocked ? 'classify_only' : 'safe_summary_only',
    userManualWorkAvoided: true,
    safeNextAction: SAFE_NEXT_ACTION,
    developmentMode: DEVELOPMENT_MODE,
    mergeReadiness: 'no',
    safeSummaryOnly: true,
  };

  classification.governanceFailureClassificationStatus = includesUnsafeOutput(classification) ? 'unsafe_output_blocked' : 'diagnostic_only';
  return classification;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const result = classifyGovernanceFailures({
    reviewIndependenceReasonCodes: ['writer_only_review_detected', 'review_independence_missing'],
    targetQualityFailed: true,
  });
  console.log(JSON.stringify(result, null, 2));
}
