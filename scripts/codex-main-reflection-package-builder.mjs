const READINESS_STATUSES = new Set([
  'ready_for_explicit_scope_review',
  'blocked_by_missing_explicit_scope',
  'blocked_by_qg',
  'blocked_by_review',
  'blocked_by_runtime_boundary',
  'blocked_by_workflow_package_boundary',
  'blocked_by_dependency',
  'blocked_by_candidate_branch_only',
  'blocked_by_missing_rollback_strategy',
  'ambiguous'
]);

const SCOPE_GRANT_STATUSES = new Set([
  'scopeGrantCandidate',
  'not_granted',
  'canonicalOwnershipNotGranted',
  'runtimeNotGranted',
  'mergeNotGranted'
]);

const FALSE_VALUES = new Set([false, 'false', 'no', 'missing', 'not_excluded', 'connected', 'present']);
const TRUE_VALUES = new Set([true, 'true', 'yes', 'pass', 'success', 'satisfied', 'excluded', 'none', 'not_connected']);

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function isTruthyStatus(value) {
  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;
  return Boolean(value);
}

function qgSatisfied(input = {}) {
  const status = String(input.qgStatus ?? '').toLowerCase();
  return status === 'success' || status === 'green' || status === 'completed_success';
}

function reviewSatisfied(input = {}) {
  const status = String(input.reviewEvidenceStatus ?? '').toLowerCase();
  return status === 'satisfied' || status === 'pass' || status === 'present' || status === 'project_governance_evidence';
}

function evidencePresent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function boundaryExcluded(input = {}, keys = []) {
  return keys.every((key) => isTruthyStatus(input[key]));
}

function hasWorkflowPackageRisk(input = {}) {
  if (!boundaryExcluded(input, ['workflowPackageBoundaryStatus'])) return true;
  return asArray(input.changedFileCategories).some((category) => {
    const safe = String(category).toLowerCase();
    return safe === 'workflow' || safe === 'package' || safe === 'package_lock';
  });
}

function hasRuntimeBoundaryRisk(input = {}) {
  return !boundaryExcluded(input, [
    'runtimeBoundaryStatus',
    'adapterBoundaryStatus',
    'debugRouteBoundaryStatus',
    'activeQGBoundaryStatus'
  ]);
}

function hasCandidateOnlyBlock(input = {}) {
  const candidateOnly = String(input.targetBranchEvidenceStatus ?? '').toLowerCase() !== 'present'
    && String(input.mainEvidenceStatus ?? '').toLowerCase() !== 'present';
  return candidateOnly && evidencePresent(input.sourceEvidence) && !input.explicitMainReflectionScope;
}

export function classifyMainReflectionPackageReadiness(input = {}) {
  if (!qgSatisfied(input)) return 'blocked_by_qg';
  if (!reviewSatisfied(input)) return 'blocked_by_review';
  if (hasRuntimeBoundaryRisk(input)) return 'blocked_by_runtime_boundary';
  if (hasWorkflowPackageRisk(input)) return 'blocked_by_workflow_package_boundary';
  if (input.dependencyStatus === 'blocked' || asArray(input.blockedBy).length > 0) return 'blocked_by_dependency';
  if (hasCandidateOnlyBlock(input)) return 'blocked_by_candidate_branch_only';
  if (!evidencePresent(input.rollbackStrategy)) return 'blocked_by_missing_rollback_strategy';
  if (!input.explicitMainReflectionScope) return 'blocked_by_missing_explicit_scope';
  if (!evidencePresent(input.acceptanceEvidence) || !evidencePresent(input.compatibilityEvidence) || !evidencePresent(input.registryEvidence)) return 'ambiguous';
  return 'ready_for_explicit_scope_review';
}

export function classifyReflectionScopeGrant(input = {}) {
  if (!input.explicitMainReflectionScope) return 'not_granted';
  if (!input.canonicalOwnershipScope) return 'canonicalOwnershipNotGranted';
  if (input.runtimeScope !== false) return 'runtimeNotGranted';
  if (input.mergeScope !== false) return 'mergeNotGranted';
  const readiness = classifyMainReflectionPackageReadiness(input);
  return readiness === 'ready_for_explicit_scope_review' ? 'scopeGrantCandidate' : 'not_granted';
}

function buildInventory(files = []) {
  return asArray(files).map((file) => ({
    path_safe_label: typeof file === 'string' ? file : String(file?.path ?? file?.safeLabel ?? 'unknown'),
    category: typeof file === 'object' ? String(file.category ?? file.changeType ?? 'unknown') : 'unknown'
  }));
}

export function buildMainReflectionPackage(input = {}) {
  const readiness = classifyMainReflectionPackageReadiness(input);
  const scopeGrant = classifyReflectionScopeGrant(input);
  const runtimeExcluded = !hasRuntimeBoundaryRisk(input);
  const workflowPackageExcluded = !hasWorkflowPackageRisk(input);
  const reviewEvidenceSatisfied = reviewSatisfied(input);
  const qgEvidenceSatisfied = qgSatisfied(input);
  const explicitMainReflectionScopeSatisfied = Boolean(input.explicitMainReflectionScope);
  const canonicalOwnershipScopeSatisfied = Boolean(input.canonicalOwnershipScope);
  const mainReflectionAllowed = scopeGrant === 'scopeGrantCandidate';
  const mergeAllowed = false;
  const runtimeAllowed = false;
  const blockedReason = mainReflectionAllowed ? 'none' : readiness;

  return {
    packageStatus: readiness,
    targetPr: input.targetPr ?? null,
    targetHeadSha: input.targetHeadSha ?? null,
    evidenceChainStatus: {
      sourceEvidence: evidencePresent(input.sourceEvidence),
      acceptanceEvidence: evidencePresent(input.acceptanceEvidence),
      compatibilityEvidence: evidencePresent(input.compatibilityEvidence),
      scopeDecisionEvidence: evidencePresent(input.scopeDecisionEvidence),
      registryEvidence: evidencePresent(input.registryEvidence)
    },
    candidateFileInventory: buildInventory(input.candidateFiles),
    targetFileInventory: buildInventory(input.targetFiles),
    beforeAfterContract: {
      candidate_branch_evidence_is_not_main_evidence: true,
      docs_only_evidence_is_not_merge_evidence: true,
      qg_success_alone_is_not_reflection_permission: true,
      package_readiness_is_not_execution: true
    },
    rollbackStrategyStatus: evidencePresent(input.rollbackStrategy) ? 'present' : 'missing',
    runtimeExcluded,
    adapterExcluded: isTruthyStatus(input.adapterBoundaryStatus),
    debugRouteExcluded: isTruthyStatus(input.debugRouteBoundaryStatus),
    activeQGExcluded: isTruthyStatus(input.activeQGBoundaryStatus),
    workflowPackageExcluded,
    reviewEvidenceSatisfied,
    qgEvidenceSatisfied,
    explicitMainReflectionScopeSatisfied,
    canonicalOwnershipScopeSatisfied,
    mainReflectionAllowed,
    mergeAllowed,
    runtimeAllowed,
    scopeGrantStatus: scopeGrant,
    blockedReason,
    safeNextAction: mainReflectionAllowed
      ? 'separate explicit main reflection execution review required'
      : 'preserve until missing evidence and explicit scope are satisfied'
  };
}

function countObjectKeys(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return value ? 1 : 0;
}

export function buildMainReflectionPackageSafeSummary(result = {}) {
  const blockedReason = String(result.blockedReason ?? result.packageStatus ?? 'unknown');
  return {
    safe_summary_only: true,
    packageStatus: READINESS_STATUSES.has(String(result.packageStatus)) ? result.packageStatus : 'ambiguous',
    scopeGrantStatus: SCOPE_GRANT_STATUSES.has(String(result.scopeGrantStatus)) ? result.scopeGrantStatus : 'not_granted',
    evidence_counts: {
      candidateFileCount: countObjectKeys(result.candidateFileInventory),
      targetFileCount: countObjectKeys(result.targetFileInventory),
      evidenceChainSatisfiedCount: Object.values(result.evidenceChainStatus ?? {}).filter(Boolean).length
    },
    boundaries: {
      runtimeExcluded: Boolean(result.runtimeExcluded),
      activeQGExcluded: Boolean(result.activeQGExcluded),
      workflowPackageExcluded: Boolean(result.workflowPackageExcluded),
      mergeAllowed: false,
      runtimeAllowed: false
    },
    blockedReason,
    safeNextAction: String(result.safeNextAction ?? 'preserve')
  };
}

export const MAIN_REFLECTION_PACKAGE_BUILDER_CONTRACT = Object.freeze({
  readinessStatuses: [...READINESS_STATUSES],
  scopeGrantStatuses: [...SCOPE_GRANT_STATUSES],
  runtimeConnected: false,
  activeQGConnected: false,
  performsGitHubMutation: false,
  performsReviewRequest: false,
  performsRerun: false,
  performsComment: false,
  performsMerge: false
});

