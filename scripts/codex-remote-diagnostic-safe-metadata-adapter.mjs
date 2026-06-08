export const SAFE_REASON_CODES = Object.freeze([
  'product_verification_failure',
  'remote_product_evidence_failure',
  'remote_npm_diagnostic_failure',
  'formal_evidence_precedence_failure',
  'target_quality_score_failure',
  'normalization_self_check_failure',
  'node_syntax_failure',
  'changed_file_boundary_failure',
  'runtime_boundary_failure',
  'workflow_package_boundary_failure',
  'active_qg_boundary_failure',
  'safe_summary_leakage_failure',
  'insufficient_safe_metadata',
  'unknown_failure'
]);

export const ACTIONABILITY_STATUSES = Object.freeze([
  'actionable_in_changed_files',
  'actionable_docs_only',
  'actionable_self_check_only',
  'requires_runtime_scope',
  'requires_workflow_package_scope',
  'requires_active_qg_scope',
  'requires_external_service_scope',
  'requires_rerun_scope',
  'blocked_by_insufficient_safe_metadata',
  'unknown_or_ambiguous'
]);

export const BOUNDED_CODE_FIX_DECISION_STATUSES = Object.freeze([
  'safe_code_fix_allowed',
  'docs_addendum_only',
  'harness_policy_fix_candidate',
  'remote_diagnostic_metadata_policy_needed',
  'blocked_by_runtime_scope',
  'blocked_by_workflow_package_scope',
  'blocked_by_active_qg_scope',
  'blocked_by_external_service_scope',
  'blocked_by_insufficient_safe_metadata',
  'requires_rerun_scope',
  'unknown_or_ambiguous'
]);

const LOCAL_FIX_REASONS = new Set([
  'node_syntax_failure',
  'normalization_self_check_failure',
  'changed_file_boundary_failure'
]);

const PRODUCT_POLICY_REASONS = new Set([
  'product_verification_failure',
  'remote_product_evidence_failure',
  'formal_evidence_precedence_failure',
  'target_quality_score_failure'
]);

const REMOTE_DIAGNOSTIC_REASONS = new Set([
  'remote_npm_diagnostic_failure'
]);

const RAW_FIELD_KEYS = new Set([
  'rawLogs',
  'rawLog',
  'rawStackTrace',
  'stackTrace',
  'tokens',
  'token',
  'secrets',
  'secret',
  'endpoints',
  'endpoint',
  'privatePaths',
  'privatePath',
  'rawPayloads',
  'rawPayload',
  'rawReviewerNames',
  'rawReviewerName',
  'rawPrBody',
  'rawPRBody',
  'rawComments',
  'rawComment'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function bool(value) {
  return value === true;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeReasonCode(value) {
  const reason = firstString(value);
  if (!reason) return 'insufficient_safe_metadata';
  if (SAFE_REASON_CODES.includes(reason)) return reason;
  return 'unknown_failure';
}

function normalizeChangedFileScope(value) {
  if (value === true || value === 'changed_files' || value === 'changed_file_scoped') return 'changed_files';
  if (value === false || value === 'outside_changed_files') return 'outside_changed_files';
  if (value === 'docs_only') return 'docs_only';
  if (value === 'self_check_only') return 'self_check_only';
  return 'unknown';
}

function hasRawField(input) {
  if (!isObject(input)) return false;
  return Object.keys(input).some((key) => RAW_FIELD_KEYS.has(key));
}

export function classifyProductVerificationSafeReason(input = {}) {
  const source = isObject(input) ? input : {};
  return normalizeReasonCode(
    source.stableReasonCode,
    source.safeReasonCode,
    source.reasonCode,
    source.failureCategory
  );
}

export function classifyRemoteDiagnosticActionability(input = {}) {
  const source = isObject(input) ? input : {};
  const reason = classifyProductVerificationSafeReason(source);
  const changedFileScope = normalizeChangedFileScope(source.changedFileScope);

  if (bool(source.requiresRuntime) || reason === 'runtime_boundary_failure') return 'requires_runtime_scope';
  if (bool(source.requiresWorkflowPackage) || reason === 'workflow_package_boundary_failure') return 'requires_workflow_package_scope';
  if (bool(source.requiresActiveQG) || reason === 'active_qg_boundary_failure') return 'requires_active_qg_scope';
  if (bool(source.requiresExternalService)) return 'requires_external_service_scope';
  if (bool(source.requiresRerun)) return 'requires_rerun_scope';
  if (reason === 'insufficient_safe_metadata') return 'blocked_by_insufficient_safe_metadata';
  if (changedFileScope === 'changed_files' && LOCAL_FIX_REASONS.has(reason)) return 'actionable_in_changed_files';
  if (changedFileScope === 'self_check_only' && reason === 'normalization_self_check_failure') return 'actionable_self_check_only';
  if (changedFileScope === 'docs_only') return 'actionable_docs_only';
  if (PRODUCT_POLICY_REASONS.has(reason) || REMOTE_DIAGNOSTIC_REASONS.has(reason)) return 'blocked_by_insufficient_safe_metadata';
  return 'unknown_or_ambiguous';
}

export function classifyBoundedCodeFixDecision(input = {}) {
  const source = isObject(input) ? input : {};
  const reason = classifyProductVerificationSafeReason(source);
  const actionability = classifyRemoteDiagnosticActionability(source);
  const changedFileScope = normalizeChangedFileScope(source.changedFileScope);
  const insufficient = bool(source.safeMetadataInsufficient) || reason === 'insufficient_safe_metadata';

  if (actionability === 'requires_runtime_scope') return 'blocked_by_runtime_scope';
  if (actionability === 'requires_workflow_package_scope') return 'blocked_by_workflow_package_scope';
  if (actionability === 'requires_active_qg_scope') return 'blocked_by_active_qg_scope';
  if (actionability === 'requires_external_service_scope') return 'blocked_by_external_service_scope';
  if (actionability === 'requires_rerun_scope') return 'requires_rerun_scope';
  if (LOCAL_FIX_REASONS.has(reason) && changedFileScope === 'changed_files' && !insufficient) return 'safe_code_fix_allowed';
  if (LOCAL_FIX_REASONS.has(reason) && changedFileScope === 'self_check_only' && !insufficient) return 'safe_code_fix_allowed';
  if (reason === 'remote_npm_diagnostic_failure' && insufficient) return 'remote_diagnostic_metadata_policy_needed';
  if (PRODUCT_POLICY_REASONS.has(reason) && insufficient) return 'harness_policy_fix_candidate';
  if (insufficient) return 'blocked_by_insufficient_safe_metadata';
  if (changedFileScope === 'docs_only') return 'docs_addendum_only';
  return 'unknown_or_ambiguous';
}

export function buildRemoteDiagnosticSafeSummary(result = {}) {
  const source = isObject(result) ? result : {};
  const reason = classifyProductVerificationSafeReason(source);
  const actionability = firstString(source.actionabilityStatus) || classifyRemoteDiagnosticActionability(source);
  const decision = firstString(source.boundedCodeFixDecision) || classifyBoundedCodeFixDecision(source);
  const rawFieldCount = hasRawField(source) ? Object.keys(source).filter((key) => RAW_FIELD_KEYS.has(key)).length : 0;

  return {
    safe_summary_only: true,
    stableReasonCode: reason,
    reason_counts: { [reason]: 1 },
    actionability_counts: { [actionability]: 1 },
    bounded_decision_counts: { [decision]: 1 },
    raw_field_counts: rawFieldCount,
    redactionStatus: rawFieldCount > 0 ? 'raw_fields_omitted' : 'no_raw_fields_observed'
  };
}

export function normalizeRemoteDiagnosticSafeMetadata(input = {}) {
  const source = isObject(input) ? input : {};
  const stableReasonCode = classifyProductVerificationSafeReason(source);
  const changedFileScope = normalizeChangedFileScope(source.changedFileScope);
  const actionabilityStatus = classifyRemoteDiagnosticActionability({
    ...source,
    stableReasonCode,
    changedFileScope
  });
  const boundedCodeFixDecision = classifyBoundedCodeFixDecision({
    ...source,
    stableReasonCode,
    changedFileScope
  });
  const rawFieldObserved = hasRawField(source);
  const failureCategory = firstString(source.failureCategory) || stableReasonCode;
  const sameHeadStatus = firstString(source.sameHeadStatus) || 'unknown';
  const blockingStatus = firstString(source.blockingStatus) || (stableReasonCode === 'insufficient_safe_metadata' ? 'blocking' : 'unknown');

  const result = {
    stableReasonCode,
    failureCategory: SAFE_REASON_CODES.includes(failureCategory) ? failureCategory : stableReasonCode,
    sameHeadStatus,
    blockingStatus,
    actionabilityStatus,
    changedFileScope,
    boundedCodeFixDecision,
    requiresRuntime: bool(source.requiresRuntime),
    requiresWorkflowPackage: bool(source.requiresWorkflowPackage),
    requiresActiveQG: bool(source.requiresActiveQG),
    requiresExternalService: bool(source.requiresExternalService),
    requiresRerun: bool(source.requiresRerun),
    requiresUserAction: bool(source.requiresUserAction),
    redactionStatus: rawFieldObserved ? 'raw_fields_omitted' : 'no_raw_fields_observed',
    safe_summary_only: true
  };

  result.safeSummary = buildRemoteDiagnosticSafeSummary(result);
  return result;
}
