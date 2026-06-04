#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import {
  classifyV106ReleaseReadiness,
  buildV106ReleaseReadinessSafeSummary,
} from './codex-v106-release-readiness-classifier.mjs';

const DEFAULT_INPUT = Object.freeze({
  current_active_harness: 'v1.0.5',
  candidate_version: 'v1.0.6',
  stack_prs: ['#32', '#33', '#34', '#35', '#36', '#37', '#38', '#39', '#40'],
  pr32_design_complete: true,
  pr33_standalone_router_complete: true,
  pr34_integration_plan_complete: true,
  pr35_rehearsal_complete: true,
  pr36_safe_summary_module_complete: true,
  pr37_active_diagnostic_complete: true,
  pr38_bounded_strategy_complete: true,
  pr39_bounded_runner_complete: true,
  pr40_classifier_complete: true,
  pr37_full_target_mode_pass_confirmed: false,
  remote_same_head_quality_gate_green: false,
  independent_reviewer_metadata_resolved: false,
  quality_gate_blockers_resolved: false,
  explicit_rollout_scope_granted: false,
  stacked_dependency_resolved: false,
  active_quality_gate_behavior_change: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  merge_readiness_claimed: false,
});

const SNAPSHOT_SAFE_NEXT_ACTION =
  'preserve_v106_candidate_stack_until_full_target_mode_or_remote_same_head_evidence_and_review_governance_are_resolved';
const FINAL_GOVERNANCE_SAFE_NEXT_ACTION =
  'still_require_final_governance_review_before_merge';

function mergeWithDefaultInput(input = {}) {
  return {
    ...DEFAULT_INPUT,
    ...(input && typeof input === 'object' ? input : {}),
  };
}

function countStackPrs(stackPrs) {
  return Array.isArray(stackPrs) ? stackPrs.length : 0;
}

function buildStackSummary(input) {
  return {
    candidate_pr_count: countStackPrs(input.stack_prs),
    design_pr_count: input.pr32_design_complete === true ? 1 : 0,
    implementation_pr_count: input.pr33_standalone_router_complete === true ? 1 : 0,
    planning_pr_count:
      (input.pr34_integration_plan_complete === true ? 1 : 0) +
      (input.pr38_bounded_strategy_complete === true ? 1 : 0),
    validation_pr_count:
      (input.pr35_rehearsal_complete === true ? 1 : 0) +
      (input.pr36_safe_summary_module_complete === true ? 1 : 0) +
      (input.pr37_active_diagnostic_complete === true ? 1 : 0) +
      (input.pr39_bounded_runner_complete === true ? 1 : 0),
    readiness_pr_count: input.pr40_classifier_complete === true ? 1 : 0,
    stacked_pr_count:
      (input.pr35_rehearsal_complete === true ? 1 : 0) +
      (input.pr36_safe_summary_module_complete === true ? 1 : 0) +
      (input.pr37_active_diagnostic_complete === true ? 1 : 0) +
      (input.pr39_bounded_runner_complete === true ? 1 : 0) +
      (input.pr40_classifier_complete === true ? 1 : 0),
    active_harness_count: input.current_active_harness === 'v1.0.6' ? 1 : 0,
    main_reflected_count: 0,
    runtime_connected_count: input.runtime_changed === true ? 1 : 0,
    merge_ready_count: input.merge_readiness_claimed === true ? 1 : 0,
    safe_summary_only: true,
  };
}

function evidenceStatus(value) {
  return value === true ? 'present' : 'missing';
}

function reviewGovernanceStatus(input) {
  return input.independent_reviewer_metadata_resolved === true &&
    input.quality_gate_blockers_resolved === true &&
    input.explicit_rollout_scope_granted === true
    ? 'ready_for_final_governance_review'
    : 'unresolved';
}

export function buildV106ReleaseReadinessSnapshot(input = {}) {
  const normalizedInput = mergeWithDefaultInput(input);
  const classifier = classifyV106ReleaseReadiness(normalizedInput);
  const releaseReadinessSummary = buildV106ReleaseReadinessSafeSummary([classifier]);
  const stackSummary = buildStackSummary(normalizedInput);
  const rolloutReady = classifier.rollout_ready === true;
  const blocked = classifier.blocked === true;

  return {
    status: 'pass',
    snapshot_status: rolloutReady && !blocked ? 'ready_for_final_governance_review_only' : 'not_ready_preserve_only',
    current_active_harness: classifier.current_active_harness,
    candidate_version: classifier.candidate_version,
    rollout_ready: rolloutReady,
    main_reflection_ready: false,
    active_harness_ready: false,
    blocked,
    reason_codes: Array.isArray(classifier.reason_codes) ? classifier.reason_codes : [],
    classifier_safe_next_action: classifier.safe_next_action,
    stack_summary: stackSummary,
    release_readiness_summary: releaseReadinessSummary,
    full_target_mode_evidence_status: evidenceStatus(normalizedInput.pr37_full_target_mode_pass_confirmed),
    remote_quality_gate_evidence_status: evidenceStatus(normalizedInput.remote_same_head_quality_gate_green),
    review_governance_status: reviewGovernanceStatus(normalizedInput),
    merge_evidence_status: 'not_merge_evidence',
    safe_next_action: rolloutReady && !blocked ? FINAL_GOVERNANCE_SAFE_NEXT_ACTION : SNAPSHOT_SAFE_NEXT_ACTION,
    safe_summary_only: true,
  };
}

export function buildV106ReleaseReadinessSnapshotSafeSummary(snapshot) {
  const safeSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const reasonCodes = Array.isArray(safeSnapshot.reason_codes) ? safeSnapshot.reason_codes : [];

  return {
    snapshot_count: 1,
    rollout_ready_count: safeSnapshot.rollout_ready === true ? 1 : 0,
    blocked_count: safeSnapshot.blocked === true ? 1 : 0,
    missing_full_target_mode_count:
      safeSnapshot.full_target_mode_evidence_status === 'missing' ||
      reasonCodes.includes('full_target_mode_pass_missing')
        ? 1
        : 0,
    missing_remote_quality_gate_count:
      safeSnapshot.remote_quality_gate_evidence_status === 'missing' ||
      reasonCodes.includes('remote_same_head_quality_gate_missing')
        ? 1
        : 0,
    missing_review_governance_count:
      safeSnapshot.review_governance_status === 'unresolved' ||
      reasonCodes.includes('independent_reviewer_metadata_missing') ||
      reasonCodes.includes('quality_gate_blockers_unresolved')
        ? 1
        : 0,
    missing_explicit_scope_count: reasonCodes.includes('explicit_rollout_scope_missing') ? 1 : 0,
    stacked_dependency_blocked_count: reasonCodes.includes('stacked_dependency_unresolved') ? 1 : 0,
    merge_ready_count: 0,
    safe_summary_only: true,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(buildV106ReleaseReadinessSnapshot(), null, 2));
}
