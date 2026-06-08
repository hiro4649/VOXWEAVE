import assert from 'node:assert/strict';
import {
  MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT,
  buildMainReflectionPackage,
  buildMainReflectionPackageSafeSummary,
  classifyMainReflectionPackageReadiness,
  classifyReflectionScopeGrant
} from './codex-main-reflection-package-builder.mjs';

let checked = 0;

function check(name, fn) {
  fn();
  checked += 1;
}

const base = {
  targetPr: 101,
  targetHeadSha: 'safe-head-sha',
  sourceEvidence: [{ pr: 101 }],
  acceptanceEvidence: [{ pr: 102 }],
  compatibilityEvidence: [{ pr: 105 }, { pr: 107 }, { pr: 111 }],
  scopeDecisionEvidence: [{ pr: 108 }],
  registryEvidence: [{ pr: 124 }],
  candidateFiles: [{ path: 'src/common/textNormalization.js', category: 'src' }],
  targetFiles: [{ path: 'src/common/textNormalization.js', category: 'src' }],
  changedFileCategories: ['src'],
  qgStatus: 'success',
  reviewEvidenceStatus: 'satisfied',
  runtimeBoundaryStatus: 'excluded',
  adapterBoundaryStatus: 'excluded',
  debugRouteBoundaryStatus: 'excluded',
  activeQGBoundaryStatus: 'excluded',
  workflowPackageBoundaryStatus: 'excluded',
  targetBranchEvidenceStatus: 'missing',
  mainEvidenceStatus: 'missing',
  rollbackStrategy: { mode: 'preserve_then_revert_if_needed' },
  explicitMainReflectionScope: false,
  canonicalOwnershipScope: true,
  runtimeScope: false,
  mergeScope: false
};

check('PR #101-like complete evidence but explicit scope missing blocks by missing scope', () => {
  assert.equal(classifyMainReflectionPackageReadiness(base), 'blocked_by_candidate_branch_only');
  const withTargetEvidence = { ...base, targetBranchEvidenceStatus: 'present' };
  assert.equal(classifyMainReflectionPackageReadiness(withTargetEvidence), 'blocked_by_missing_explicit_scope');
});

check('PR #101-like evidence with explicit scope false denies reflection', () => {
  const result = buildMainReflectionPackage({ ...base, targetBranchEvidenceStatus: 'present' });
  assert.equal(result.mainReflectionAllowed, false);
  assert.equal(result.mergeAllowed, false);
  assert.equal(result.runtimeAllowed, false);
});

check('explicit scope true but canonical ownership false is not granted', () => {
  assert.equal(classifyReflectionScopeGrant({ ...base, targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true, canonicalOwnershipScope: false }), 'canonicalOwnershipNotGranted');
});

check('PR #112-like QG failure blocks by QG', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, targetPr: 112, qgStatus: 'failure', explicitMainReflectionScope: true }), 'blocked_by_qg');
});

check('candidate branch evidence only is not main evidence', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, explicitMainReflectionScope: false }), 'blocked_by_candidate_branch_only');
});

check('docs-only evidence does not allow merge', () => {
  const result = buildMainReflectionPackage({ ...base, sourceEvidence: [], acceptanceEvidence: [{ docs: true }], targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true });
  assert.equal(result.mergeAllowed, false);
});

check('QG success alone is not reflection evidence', () => {
  const result = buildMainReflectionPackage({ qgStatus: 'success' });
  assert.notEqual(result.packageStatus, 'ready_for_explicit_scope_review');
  assert.equal(result.mainReflectionAllowed, false);
});

check('scope decision is not execution', () => {
  const result = buildMainReflectionPackage({ ...base, targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true });
  assert.equal(result.beforeAfterContract.package_readiness_is_not_execution, true);
  assert.equal(result.mergeAllowed, false);
});

check('package readiness is not execution', () => {
  const result = buildMainReflectionPackage({ ...base, targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true });
  assert.equal(result.runtimeAllowed, false);
});

for (const key of ['runtimeBoundaryStatus', 'adapterBoundaryStatus', 'debugRouteBoundaryStatus', 'activeQGBoundaryStatus']) {
  check(`${key} missing blocks by runtime boundary`, () => {
    assert.equal(classifyMainReflectionPackageReadiness({ ...base, [key]: 'connected' }), 'blocked_by_runtime_boundary');
  });
}

check('workflow/package boundary missing blocks by workflow package boundary', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, workflowPackageBoundaryStatus: 'present' }), 'blocked_by_workflow_package_boundary');
});

check('workflow category blocks without scope', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, changedFileCategories: ['workflow'] }), 'blocked_by_workflow_package_boundary');
});

check('package category blocks without scope', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, changedFileCategories: ['package'] }), 'blocked_by_workflow_package_boundary');
});

check('missing rollback strategy blocks', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, targetBranchEvidenceStatus: 'present', rollbackStrategy: null }), 'blocked_by_missing_rollback_strategy');
});

check('dependency block is recognized', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, targetBranchEvidenceStatus: 'present', dependencyStatus: 'blocked' }), 'blocked_by_dependency');
});

check('blockedBy list is dependency block', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, targetBranchEvidenceStatus: 'present', blockedBy: ['PR #53'] }), 'blocked_by_dependency');
});

check('ready for explicit scope review when all non-execution gates are satisfied', () => {
  assert.equal(classifyMainReflectionPackageReadiness({ ...base, targetBranchEvidenceStatus: 'present', mainEvidenceStatus: 'present', explicitMainReflectionScope: true }), 'ready_for_explicit_scope_review');
});

check('scope grant candidate requires all gates', () => {
  assert.equal(classifyReflectionScopeGrant({ ...base, targetBranchEvidenceStatus: 'present', mainEvidenceStatus: 'present', explicitMainReflectionScope: true }), 'scopeGrantCandidate');
});

check('runtime scope true is not granted', () => {
  assert.equal(classifyReflectionScopeGrant({ ...base, targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true, runtimeScope: true }), 'runtimeNotGranted');
});

check('merge scope true is not granted', () => {
  assert.equal(classifyReflectionScopeGrant({ ...base, targetBranchEvidenceStatus: 'present', explicitMainReflectionScope: true, mergeScope: true }), 'mergeNotGranted');
});

check('safe summary is count-only', () => {
  const result = buildMainReflectionPackage({ ...base, candidateFiles: ['a', 'b'], targetFiles: ['c'] });
  const summary = buildMainReflectionPackageSafeSummary(result);
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.evidence_counts.candidateFileCount, 2);
  assert.equal(summary.evidence_counts.targetFileCount, 1);
});

check('safe summary omits raw PR body and comments', () => {
  const result = buildMainReflectionPackage({ ...base, rawPrBody: 'do not emit', rawComments: ['do not emit'] });
  const text = JSON.stringify(buildMainReflectionPackageSafeSummary(result));
  assert.equal(text.includes('do not emit'), false);
});

check('safe summary omits reviewer names', () => {
  const text = JSON.stringify(buildMainReflectionPackageSafeSummary(buildMainReflectionPackage({ ...base, reviewerNames: ['person'] })));
  assert.equal(text.includes('person'), false);
});

check('safe summary omits endpoint token secret private path values', () => {
  const unsafeMarker = 'UNSAFE_MARKER_VALUE';
  const text = JSON.stringify(buildMainReflectionPackageSafeSummary(buildMainReflectionPackage({
    ...base,
    endpoint: unsafeMarker,
    token: unsafeMarker,
    privatePath: unsafeMarker
  })));
  assert.equal(text.includes(unsafeMarker), false);
});

check('contract has no runtime import behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.runtimeConnected, false);
});

check('contract has no active QG import behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.activeQGConnected, false);
});

check('contract has no GitHub mutation behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.performsGitHubMutation, false);
});

check('contract has no review request behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.performsReviewRequest, false);
});

check('contract has no rerun behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.performsRerun, false);
});

check('contract has no comment behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.performsComment, false);
});

check('contract has no merge behavior', () => {
  assert.equal(MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT.performsMerge, false);
});

for (let i = 0; i < 155; i += 1) {
  check(`matrix no-readiness invariant ${i}`, () => {
    const variant = {
      ...base,
      targetBranchEvidenceStatus: i % 2 === 0 ? 'present' : 'missing',
      explicitMainReflectionScope: i % 3 === 0,
      qgStatus: i % 11 === 0 ? 'failure' : 'success',
      reviewEvidenceStatus: i % 13 === 0 ? 'missing' : 'satisfied',
      rollbackStrategy: i % 17 === 0 ? null : base.rollbackStrategy
    };
    const result = buildMainReflectionPackage(variant);
    assert.equal(result.mergeAllowed, false);
    assert.equal(result.runtimeAllowed, false);
  });
}

const report = {
  status: 'pass',
  checked_cases: checked,
  main_reflection_package_builder: true,
  package_readiness_classifier: true,
  scope_grant_classifier: true,
  safe_summary_only: true,
  runtime_connected: false,
  active_qg_connected: false,
  workflow_changed: false,
  package_changed: false,
  review_request_performed: false,
  rerun_performed: false,
  comment_created: false,
  merge_performed: false,
  runtime_readiness_claimed: false,
  merge_readiness: false
};

console.log(JSON.stringify(report, null, 2));
