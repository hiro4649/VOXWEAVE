#!/usr/bin/env node

import {
  buildV106ReleaseReadinessSafeSummary,
  classifyV106ReleaseReadiness,
} from './codex-v106-release-readiness-classifier.mjs';
import fs from 'node:fs';

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const completeStack = ['#32', '#33', '#34', '#35', '#36', '#37', '#38', '#39', '#40'];
const schema = JSON.parse(fs.readFileSync('docs/process/CODEX_VOXWEAVE_V1_0_6_RELEASE_READINESS_STATUS_SCHEMA.json', 'utf8'));

function baseInput(overrides = {}) {
  return {
    current_active_harness: 'v1.0.5',
    candidate_version: 'v1.0.6',
    stack_prs: completeStack,
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
    ...overrides,
  };
}

function assertBlockedWith(input, reasonCode) {
  const result = classifyV106ReleaseReadiness(input);
  checkedCases += 1;
  assertCondition(result.blocked === true, `${reasonCode}: expected blocked`);
  assertCondition(result.rollout_ready === false, `${reasonCode}: rollout must be false`);
  assertCondition(result.main_reflection_ready === false, `${reasonCode}: main reflection must be false`);
  assertCondition(result.active_harness_ready === false, `${reasonCode}: active harness must be false`);
  assertCondition(result.reason_codes.includes(reasonCode), `${reasonCode}: missing reason code`);
  assertCondition(result.safe_summary_only === true, `${reasonCode}: safe summary only required`);
  return result;
}

let checkedCases = 0;

const currentResult = classifyV106ReleaseReadiness(baseInput());
checkedCases += 1;
assertCondition(currentResult.rollout_ready === false, 'current rollout must be false');
assertCondition(currentResult.main_reflection_ready === false, 'current main reflection must be false');
assertCondition(currentResult.active_harness_ready === false, 'current active harness must be false');
assertCondition(currentResult.blocked === true, 'current result must be blocked');
for (const reasonCode of [
  'full_target_mode_pass_missing',
  'remote_same_head_quality_gate_missing',
  'independent_reviewer_metadata_missing',
  'quality_gate_blockers_unresolved',
  'explicit_rollout_scope_missing',
  'stacked_dependency_unresolved',
  'stacked_pr_not_main_independent',
]) {
  checkedCases += 1;
  assertCondition(currentResult.reason_codes.includes(reasonCode), `current missing reason: ${reasonCode}`);
}

assertBlockedWith(baseInput({ candidate_version: 'v1.0.5' }), 'candidate_version_not_v106');
assertBlockedWith(baseInput({ current_active_harness: 'v1.0.6' }), 'active_harness_not_v105');
assertBlockedWith(baseInput({ stack_prs: completeStack.filter((pr) => pr !== '#40') }), 'stack_prs_incomplete');
assertBlockedWith(baseInput({ pr32_design_complete: false }), 'pr32_design_not_complete');
assertBlockedWith(baseInput({ pr33_standalone_router_complete: false }), 'pr33_router_not_complete');
assertBlockedWith(baseInput({ pr34_integration_plan_complete: false }), 'pr34_integration_plan_not_complete');
assertBlockedWith(baseInput({ pr35_rehearsal_complete: false }), 'pr35_rehearsal_not_complete');
assertBlockedWith(baseInput({ pr36_safe_summary_module_complete: false }), 'pr36_safe_summary_module_not_complete');
assertBlockedWith(baseInput({ pr37_active_diagnostic_complete: false }), 'pr37_active_diagnostic_not_complete');
assertBlockedWith(baseInput({ pr38_bounded_strategy_complete: false }), 'pr38_bounded_strategy_not_complete');
assertBlockedWith(baseInput({ pr39_bounded_runner_complete: false }), 'pr39_bounded_runner_not_complete');
assertBlockedWith(baseInput({ pr40_classifier_complete: false }), 'pr40_classifier_not_complete');
assertBlockedWith(baseInput({ active_quality_gate_behavior_change: true }), 'active_quality_gate_behavior_change_blocked');
assertBlockedWith(baseInput({ pass_fail_semantics_changed: true }), 'pass_fail_semantics_change_blocked');
assertBlockedWith(baseInput({ target_quality_score_changed: true }), 'target_quality_score_change_blocked');
assertBlockedWith(baseInput({ workflow_changed: true }), 'workflow_change_blocked');
assertBlockedWith(baseInput({ package_changed: true }), 'package_change_blocked');
assertBlockedWith(baseInput({ runtime_changed: true }), 'runtime_change_blocked');
assertBlockedWith(baseInput({ review_governance_behavior_changed: true }), 'review_governance_behavior_change_blocked');
assertBlockedWith(baseInput({ runtime_readiness_claimed: true }), 'runtime_readiness_claim_blocked');
assertBlockedWith(baseInput({ production_readiness_claimed: true }), 'production_readiness_claim_blocked');
assertBlockedWith(baseInput({ real_tts_readiness_claimed: true }), 'real_tts_readiness_claim_blocked');
assertBlockedWith(baseInput({ merge_readiness_claimed: true }), 'merge_readiness_claim_blocked');

const positiveLookingResult = classifyV106ReleaseReadiness(baseInput({
  pr37_full_target_mode_pass_confirmed: true,
  remote_same_head_quality_gate_green: true,
  independent_reviewer_metadata_resolved: true,
  quality_gate_blockers_resolved: true,
  explicit_rollout_scope_granted: true,
  stacked_dependency_resolved: true,
}));
checkedCases += 1;
assertCondition(positiveLookingResult.rollout_ready === true, 'positive-looking rollout should be true');
assertCondition(positiveLookingResult.main_reflection_ready === false, 'positive-looking main reflection must still be false');
assertCondition(positiveLookingResult.active_harness_ready === false, 'positive-looking active harness must still be false');
assertCondition(positiveLookingResult.merge_readiness !== true, 'positive-looking result must not claim merge readiness');
assertCondition(positiveLookingResult.safe_next_action === 'still_require_final_governance_review_before_merge', 'positive-looking result must still require governance review');
assertCondition(positiveLookingResult.safe_summary_only === true, 'positive-looking result must be safe summary only');

const safeSummary = buildV106ReleaseReadinessSafeSummary([
  currentResult,
  positiveLookingResult,
  {
    rollout_ready: false,
    blocked: true,
    reason_codes: ['full_target_mode_pass_missing'],
    pr_body: 'PR body',
    raw_artifact: 'raw artifact',
    branch_name: 'branch name',
    endpoint: 'endpoint',
    api_key: 'api_key',
    token: 'token',
    secret: 'secret',
    authorization: 'authorization',
    bearer: 'Bearer',
    model_path: 'C:/private/model',
    dataset_path: 'C:/private/dataset',
    private_path: 'private_path',
    raw_payload: 'raw_payload',
    raw_logs: 'raw logs',
    private_url: 'https://bad.invalid',
    github_token: 'github token',
    npm_token: 'npm token',
    full_command: 'full command',
    head_sha: '479ac41e874e4dc8f1ad014283923ba14850ea47',
    base_branch: 'codex/voxweave-v1-0-6-bounded-validation-runner-001',
  },
]);
checkedCases += 1;
assertCondition(safeSummary.safe_summary_only === true, 'safe summary must be safe-summary-only');
assertCondition(safeSummary.record_count === 3, 'safe summary record count mismatch');
assertCondition(safeSummary.rollout_ready_count === 1, 'safe summary rollout count mismatch');

const serializedSummary = JSON.stringify(safeSummary);
for (const forbiddenLeak of [
  'PR body',
  'raw artifact',
  'branch name',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'authorization',
  'Bearer',
  'model_path',
  'dataset_path',
  'private_path',
  'raw_payload',
  'raw logs',
  'https://bad.invalid',
  'C:/private/model',
  'C:/private/dataset',
  'github token',
  'npm token',
  'full command',
  '479ac41e874e4dc8f1ad014283923ba14850ea47',
  'codex/voxweave-v1-0-6-bounded-validation-runner-001',
]) {
  checkedCases += 1;
  assertCondition(!serializedSummary.includes(forbiddenLeak), `safe summary leaked: ${forbiddenLeak}`);
}

const schemaReasonCodes = new Set(schema.properties.reason_codes.items.enum);
const emittedReasonCodes = new Set([
  ...currentResult.reason_codes,
  'candidate_version_not_v106',
  'active_harness_not_v105',
  'stack_prs_incomplete',
  'pr32_design_not_complete',
  'pr33_router_not_complete',
  'pr34_integration_plan_not_complete',
  'pr35_rehearsal_not_complete',
  'pr36_safe_summary_module_not_complete',
  'pr37_active_diagnostic_not_complete',
  'pr38_bounded_strategy_not_complete',
  'pr39_bounded_runner_not_complete',
  'pr40_classifier_not_complete',
  'active_quality_gate_behavior_change_blocked',
  'pass_fail_semantics_change_blocked',
  'target_quality_score_change_blocked',
  'workflow_change_blocked',
  'package_change_blocked',
  'runtime_change_blocked',
  'review_governance_behavior_change_blocked',
  'runtime_readiness_claim_blocked',
  'production_readiness_claim_blocked',
  'real_tts_readiness_claim_blocked',
  'merge_readiness_claim_blocked',
]);
for (const reasonCode of emittedReasonCodes) {
  checkedCases += 1;
  assertCondition(schemaReasonCodes.has(reasonCode), `schema missing reason code: ${reasonCode}`);
}
checkedCases += 1;
assertCondition(schema.additionalProperties === false, 'schema must reject additional properties');
checkedCases += 1;
assertCondition(schema.properties.safe_summary_only.const === true, 'schema safe_summary_only must be const true');

console.log(JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  rollout_ready: false,
  active_harness_ready: false,
  merge_readiness: false,
  safe_summary_only: true,
}, null, 2));
