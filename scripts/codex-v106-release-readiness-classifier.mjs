#!/usr/bin/env node

import { fileURLToPath } from 'node:url';

const REQUIRED_STACK_PRS = ['#32', '#33', '#34', '#35', '#36', '#37', '#38', '#39', '#40'];

const SAFE_NEXT_ACTION_BLOCKED = 'preserve_v106_candidate_stack_until_full_target_mode_or_remote_same_head_evidence_and_review_governance_are_resolved';
const SAFE_NEXT_ACTION_READY = 'still_require_final_governance_review_before_merge';

const BLOCKING_FIELDS = [
  ['active_quality_gate_behavior_change', 'active_quality_gate_behavior_change_blocked'],
  ['pass_fail_semantics_changed', 'pass_fail_semantics_change_blocked'],
  ['target_quality_score_changed', 'target_quality_score_change_blocked'],
  ['workflow_changed', 'workflow_change_blocked'],
  ['package_changed', 'package_change_blocked'],
  ['runtime_changed', 'runtime_change_blocked'],
  ['review_governance_behavior_changed', 'review_governance_behavior_change_blocked'],
  ['runtime_readiness_claimed', 'runtime_readiness_claim_blocked'],
  ['production_readiness_claimed', 'production_readiness_claim_blocked'],
  ['real_tts_readiness_claimed', 'real_tts_readiness_claim_blocked'],
  ['merge_readiness_claimed', 'merge_readiness_claim_blocked'],
];

function normalizeStackPrs(stackPrs) {
  return Array.isArray(stackPrs) ? stackPrs.map((pr) => String(pr)) : [];
}

function hasCompleteStack(stackPrs) {
  const present = new Set(normalizeStackPrs(stackPrs));
  return REQUIRED_STACK_PRS.every((pr) => present.has(pr));
}

export function classifyV106ReleaseReadiness(input = {}) {
  const reasonCodes = [];
  const currentActiveHarness = input.current_active_harness || 'unknown';
  const candidateVersion = input.candidate_version || 'unknown';

  if (currentActiveHarness !== 'v1.0.5') reasonCodes.push('active_harness_not_v105');
  if (candidateVersion !== 'v1.0.6') reasonCodes.push('candidate_version_not_v106');
  if (!hasCompleteStack(input.stack_prs)) reasonCodes.push('stack_prs_incomplete');
  if (input.pr32_design_complete !== true) reasonCodes.push('pr32_design_not_complete');
  if (input.pr33_standalone_router_complete !== true) reasonCodes.push('pr33_router_not_complete');
  if (input.pr34_integration_plan_complete !== true) reasonCodes.push('pr34_integration_plan_not_complete');
  if (input.pr35_rehearsal_complete !== true) reasonCodes.push('pr35_rehearsal_not_complete');
  if (input.pr36_safe_summary_module_complete !== true) reasonCodes.push('pr36_safe_summary_module_not_complete');
  if (input.pr37_active_diagnostic_complete !== true) reasonCodes.push('pr37_active_diagnostic_not_complete');
  if (input.pr38_bounded_strategy_complete !== true) reasonCodes.push('pr38_bounded_strategy_not_complete');
  if (input.pr39_bounded_runner_complete !== true) reasonCodes.push('pr39_bounded_runner_not_complete');
  if (input.pr40_classifier_complete !== true) reasonCodes.push('pr40_classifier_not_complete');
  if (input.pr37_full_target_mode_pass_confirmed !== true) reasonCodes.push('full_target_mode_pass_missing');
  if (input.remote_same_head_quality_gate_green !== true) reasonCodes.push('remote_same_head_quality_gate_missing');
  if (input.independent_reviewer_metadata_resolved !== true) reasonCodes.push('independent_reviewer_metadata_missing');
  if (input.quality_gate_blockers_resolved !== true) reasonCodes.push('quality_gate_blockers_unresolved');
  if (input.explicit_rollout_scope_granted !== true) reasonCodes.push('explicit_rollout_scope_missing');
  if (input.stacked_dependency_resolved !== true) {
    reasonCodes.push('stacked_dependency_unresolved');
    reasonCodes.push('stacked_pr_not_main_independent');
  }

  for (const [field, reasonCode] of BLOCKING_FIELDS) {
    if (input[field] === true) reasonCodes.push(reasonCode);
  }

  const uniqueReasonCodes = [...new Set(reasonCodes)];
  const blocked = uniqueReasonCodes.length > 0;
  const rolloutReady = !blocked;

  return {
    status: blocked ? 'blocked' : 'ready_for_final_governance_review',
    candidate_version: candidateVersion,
    current_active_harness: currentActiveHarness,
    rollout_ready: rolloutReady,
    main_reflection_ready: false,
    active_harness_ready: false,
    blocked,
    reason_codes: uniqueReasonCodes,
    safe_next_action: rolloutReady ? SAFE_NEXT_ACTION_READY : SAFE_NEXT_ACTION_BLOCKED,
    safe_summary_only: true,
  };
}

export function buildV106ReleaseReadinessSafeSummary(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  const recordCount = safeRecords.length;
  const rolloutReadyCount = safeRecords.filter((record) => record.rollout_ready === true).length;
  const blockedCount = safeRecords.filter((record) => record.blocked === true).length;
  const hasReason = (record, reasonCode) => Array.isArray(record.reason_codes) && record.reason_codes.includes(reasonCode);

  return {
    record_count: recordCount,
    rollout_ready_count: rolloutReadyCount,
    blocked_count: blockedCount,
    missing_full_target_mode_count: safeRecords.filter((record) => hasReason(record, 'full_target_mode_pass_missing')).length,
    missing_remote_quality_gate_count: safeRecords.filter((record) => hasReason(record, 'remote_same_head_quality_gate_missing')).length,
    missing_review_metadata_count: safeRecords.filter((record) => hasReason(record, 'independent_reviewer_metadata_missing')).length,
    missing_explicit_scope_count: safeRecords.filter((record) => hasReason(record, 'explicit_rollout_scope_missing')).length,
    stacked_dependency_blocked_count: safeRecords.filter((record) => hasReason(record, 'stacked_dependency_unresolved')).length,
    safe_summary_only: true,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = classifyV106ReleaseReadiness({
    current_active_harness: 'v1.0.5',
    candidate_version: 'v1.0.6',
    stack_prs: REQUIRED_STACK_PRS,
    pr33_standalone_router_complete: true,
    pr36_safe_summary_module_complete: true,
    pr37_active_diagnostic_complete: true,
    pr39_bounded_runner_complete: true,
    pr37_full_target_mode_pass_confirmed: false,
    remote_same_head_quality_gate_green: false,
    independent_reviewer_metadata_resolved: false,
    quality_gate_blockers_resolved: false,
    explicit_rollout_scope_granted: false,
    stacked_dependency_resolved: false,
  });
  console.log(JSON.stringify(result, null, 2));
}
