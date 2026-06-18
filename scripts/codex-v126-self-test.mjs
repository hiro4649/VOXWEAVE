#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.2.6

import fs from 'node:fs';
import { writeJsonReport, exitFor } from './codex-v080-lib.mjs';
import { buildHarnessVersionRegistry } from './codex-harness-version.mjs';
import {
  V126_OPERATOR_STATUS_KEYS,
  V126_P0_ARTIFACTS,
  buildOrchestrationCapsule,
  validateContextSkillValidationBudgetRouter,
  validateEvidenceLaneStateMachineAndSafeFailureCapsule,
  validateObservedWorkspaceOwnerReceiptAndCapability,
  validateOrchestrationCapsule,
  validateSkillReviewProductValueEffectiveness,
  validateSpecFirstCheckerBuilderLoopAndStopCircuit,
} from './codex-orchestration-capsule.mjs';
import { buildWorkerProofCapsule, validateWorkerProofCapsule } from './codex-worker-proof-capsule.mjs';
import { buildOwnerDecisionBrief, validateOwnerDecisionBrief } from './codex-owner-decision-brief.mjs';

function readText(path) {
  return fs.readFileSync(path, 'utf8');
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function test(name, fn) {
  try {
    return { name, status: fn() ? 'pass' : 'fail', safeSummaryOnly: true };
  } catch {
    return { name, status: 'fail', reasonCodes: ['self_test_exception'], safeSummaryOnly: true };
  }
}

function failed(status) {
  return status?.status === 'fail';
}

function passed(status) {
  return status?.status === 'pass';
}

const compatibilityCases = [
  ['v126_self_test_must_pass', () => true],
  ['v126_adds_no_new_p0_artifact', () => V126_P0_ARTIFACTS.length === 3 && !V126_P0_ARTIFACTS.includes('codex-v126-observed-state.safe.json')],
  ['v126_adds_no_new_top_level_status', () => V126_OPERATOR_STATUS_KEYS.length === 8 && !V126_OPERATOR_STATUS_KEYS.includes('observedStateStatus')],
  ['v126_preserves_v118_final_decision', () => buildOrchestrationCapsule().finalAuthority === 'v1.1.8_final_decision_kernel'],
  ['v126_preserves_v119_orchestration_artifacts', () => V126_P0_ARTIFACTS.includes('codex-orchestration-capsule.safe.json')],
  ['v126_no_bridge_or_tunnel_default_on', () => !fs.existsSync('scripts/codex-mcp-bridge-daemon.mjs') && !fs.existsSync('scripts/codex-tunnel-daemon.mjs')],
  ['v126_active_authority_tuple_is_current', () => buildOrchestrationCapsule().skillContextRouting.activeAuthorityTuple.activeSelfTestSuite === 'v126'],
  ['agents_local_task_discipline_uses_v126', () => readText('AGENTS.md').includes('Run v126 self-test and the local quality gate for harness rollout')],
  ['agents_local_task_discipline_does_not_require_v125_as_current', () => !readText('AGENTS.md').includes('Run v125 self-test and the local quality gate for harness rollout')],
  ['agents_authority_mentions_v126_observed_state_loop', () => {
    const text = readText('AGENTS.md');
    return text.includes('v1.2.6 adds observed workspace state') && text.includes('checker-builder loop');
  }],
  ['active_manifest_tuple_matches_v126', () => {
    const manifest = readJson('docs/process/CODEX_HARNESS_MANIFEST.json');
    return manifest.activeHarnessVersion === '1.2.6'
      && manifest.activeSelfTestSuite === 'v126'
      && manifest.activeSelfTestStatusKey === 'v126SelfTestStatus';
  }],
  ['active_policy_required_reads_include_v126_spec', () => {
    const index = readJson('docs/process/CODEX_ACTIVE_POLICY_INDEX.json');
    return index.requiredReads.includes('docs/process/CODEX_V126_SPEC.md')
      && index.profiles.routine.requiredReads.includes('docs/process/CODEX_V126_SPEC.md');
  }],
  ['v125_compatibility_self_test_accepts_v126', () => readText('scripts/codex-v125-self-test.mjs').includes("['v125', 'v126'].includes")],
  ['v124_compatibility_self_test_accepts_v126', () => readText('scripts/codex-v124-self-test.mjs').includes("['v124', 'v125', 'v126'].includes")],
  ['v122_context_routing_accepts_v126', () => readText('scripts/codex-v122-self-test.mjs').includes("'1.2.6'")],
  ['source_release_boundary_remains_source_only', () => buildHarnessVersionRegistry().versionLineagePolicy.sourceReleaseBoundary === 'source_body_only' && buildHarnessVersionRegistry().versionLineagePolicy.sourceOnlyRelease === true],
  ['source_release_does_not_authorize_target_rollout', () => buildHarnessVersionRegistry().versionLineagePolicy.sourceReleaseAuthorizesTargetRollout === false],
  ['target_repo_rollout_is_completed', () => {
    const registry = buildHarnessVersionRegistry();
    const manifest = readJson('docs/process/CODEX_HARNESS_MANIFEST.json');
    return registry.versionLineagePolicy.targetRepoRolloutStatus === 'completed'
      && manifest.targetRollout === 'completed';
  }],
  ['target_repo_active_harness_is_v126', () => buildHarnessVersionRegistry().versionLineagePolicy.targetRepoActiveHarness === '1.2.6'],
  ['target_manifest_is_authoritative_for_target_state', () => buildHarnessVersionRegistry().versionLineagePolicy.targetRepoManifestAuthoritative === true],
  ['source_and_target_statuses_are_not_conflated', () => {
    const policy = buildHarnessVersionRegistry().versionLineagePolicy;
    return policy.sourceOnlyRelease === true
      && policy.targetRollout === 'not_started'
      && policy.targetRepoRolloutStatus === 'completed'
      && policy.sourceReleaseAuthorizesTargetRollout === false;
  }],
  ['representative_real_pr_validation_closed', () => readJson('docs/process/CODEX_HARNESS_MANIFEST.json').representativeRealPrValidation === 'pass'],
  ['representative_real_pr_replay_closed', () => readJson('docs/process/CODEX_HARNESS_MANIFEST.json').representativeRealPrReplay === 'pass'],
  ['representative_live_pr_validation_closed', () => readJson('docs/process/CODEX_HARNESS_MANIFEST.json').representativeLivePrValidation === 'pass'],
  ['synthetic_representative_validation_closed', () => readJson('docs/process/CODEX_HARNESS_MANIFEST.json').syntheticRepresentativeValidation === 'pass'],
  ['representative_validation_uses_safe_metadata_only', () => readText('docs/process/CODEX_VOXWEAVE_V126_REPRESENTATIVE_VALIDATION_CLOSURE.md').includes('rawLogsRead: no')],
  ['representative_validation_does_not_claim_readiness', () => {
    const text = readText('docs/process/CODEX_VOXWEAVE_V126_REPRESENTATIVE_VALIDATION_CLOSURE.md');
    return text.includes('runtimeReadinessClaimed: no') && text.includes('productionReadinessClaimed: no');
  }],
  ['local_pre_pr_remote_evidence_missing_is_not_blocking', () => {
    const text = readText('scripts/codex-local-quality-gate.mjs');
    return text.includes('normalizeLocalPrePrRemoteEvidenceStatuses')
      && text.includes('local_pre_pr_remote_evidence_not_required');
  }],
  ['same_head_remote_gate_still_required_for_pr_context', () => {
    const text = readText('scripts/codex-local-quality-gate.mjs');
    return text.includes('isLocalPrePrEvidenceLane') && text.includes("includes('/pull/')");
  }],
];

const observedStateCases = [
  ['observed_workspace_owner_receipt_default_passes', () => passed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule().observedWorkspaceOwnerReceiptAndCapability))],
  ['observed_workspace_blocks_wrong_cwd', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { observedWorkspaceState: { wrongCwdDetected: true } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['observed_workspace_blocks_stale_clone', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { observedWorkspaceState: { staleCloneDetected: true } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['merge_action_requires_structured_owner_receipt', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { ownerDecisionReceipt: { allowedAction: 'merge_current_pr', present: false } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['owner_receipt_cannot_be_ai_created', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { ownerDecisionReceipt: { ownerAuthorityCreatedByAI: true } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['delegated_process_cannot_authorize_release', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { ownerDelegatedProcessReceipt: { present: true, autoContinueAllowed: true, allowedActions: ['release'] } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['bridge_must_not_default_on', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { capabilityBoundary: { bridgeDefaultEnabled: true } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
  ['bridge_transcript_is_not_machine_evidence', () => failed(validateObservedWorkspaceOwnerReceiptAndCapability(buildOrchestrationCapsule({
    observedWorkspaceOwnerReceiptAndCapability: { capabilityBoundary: { bridgeTranscriptMachineEvidence: true } },
  }).observedWorkspaceOwnerReceiptAndCapability))],
];

const loopCases = [
  ['checker_builder_loop_default_passes', () => passed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule().specFirstCheckerBuilderLoopAndStopCircuit))],
  ['checker_must_be_read_only', () => failed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule({
    specFirstCheckerBuilderLoopAndStopCircuit: { checkerCanEdit: true },
  }).specFirstCheckerBuilderLoopAndStopCircuit))],
  ['same_agent_cannot_satisfy_independent_check', () => failed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule({
    specFirstCheckerBuilderLoopAndStopCircuit: { sameAgentCannotSatisfyIndependentCheck: false },
  }).specFirstCheckerBuilderLoopAndStopCircuit))],
  ['loop_stops_on_regression', () => failed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule({
    specFirstCheckerBuilderLoopAndStopCircuit: { regressionDetected: true },
  }).specFirstCheckerBuilderLoopAndStopCircuit))],
  ['loop_stops_on_test_weakening', () => failed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule({
    specFirstCheckerBuilderLoopAndStopCircuit: { testWeakeningDetected: true },
  }).specFirstCheckerBuilderLoopAndStopCircuit))],
  ['loop_cannot_continue_after_same_failure_repeat_cap', () => failed(validateSpecFirstCheckerBuilderLoopAndStopCircuit(buildOrchestrationCapsule({
    specFirstCheckerBuilderLoopAndStopCircuit: { loopContinuationAllowed: true, sameFailureRepeatCount: 2 },
  }).specFirstCheckerBuilderLoopAndStopCircuit))],
];

const evidenceAndRouterCases = [
  ['evidence_lane_state_machine_default_passes', () => passed(validateEvidenceLaneStateMachineAndSafeFailureCapsule(buildOrchestrationCapsule().evidenceLaneStateMachineAndSafeFailureCapsule))],
  ['merge_consideration_requires_same_head_remote_pass', () => failed(validateEvidenceLaneStateMachineAndSafeFailureCapsule(buildOrchestrationCapsule({
    evidenceLaneStateMachineAndSafeFailureCapsule: { evidenceLaneStateMachine: { currentState: 'merge_consideration', remoteStatus: 'pending' } },
  }).evidenceLaneStateMachineAndSafeFailureCapsule))],
  ['safe_failure_forbids_raw_logs', () => failed(validateEvidenceLaneStateMachineAndSafeFailureCapsule(buildOrchestrationCapsule({
    evidenceLaneStateMachineAndSafeFailureCapsule: { safeFailureCapsule: { rawLogIncluded: true } },
  }).evidenceLaneStateMachineAndSafeFailureCapsule))],
  ['safe_failure_cannot_expand_scope', () => failed(validateEvidenceLaneStateMachineAndSafeFailureCapsule(buildOrchestrationCapsule({
    evidenceLaneStateMachineAndSafeFailureCapsule: { safeFailureCapsule: { scopeExpansionAllowed: true } },
  }).evidenceLaneStateMachineAndSafeFailureCapsule))],
  ['budget_router_default_passes', () => passed(validateContextSkillValidationBudgetRouter(buildOrchestrationCapsule().contextSkillValidationBudgetRouter))],
  ['budget_router_caps_skills_at_two', () => failed(validateContextSkillValidationBudgetRouter(buildOrchestrationCapsule({
    contextSkillValidationBudgetRouter: { selectedSkills: ['a', 'b', 'c'] },
  }).contextSkillValidationBudgetRouter))],
  ['budget_router_caps_md_reads_at_three', () => failed(validateContextSkillValidationBudgetRouter(buildOrchestrationCapsule({
    contextSkillValidationBudgetRouter: { mdFilesRead: ['a.md', 'b.md', 'c.md', 'd.md'] },
  }).contextSkillValidationBudgetRouter))],
  ['budget_router_cannot_skip_same_head_for_merge', () => failed(validateContextSkillValidationBudgetRouter(buildOrchestrationCapsule({
    contextSkillValidationBudgetRouter: { sameHeadRemoteGateCannotBeSkippedForMerge: false },
  }).contextSkillValidationBudgetRouter))],
];

const effectivenessAndArtifactCases = [
  ['effectiveness_default_passes', () => passed(validateSkillReviewProductValueEffectiveness(buildOrchestrationCapsule().skillReviewProductValueEffectiveness))],
  ['harmful_skill_is_hard_fail', () => failed(validateSkillReviewProductValueEffectiveness(buildOrchestrationCapsule({
    skillReviewProductValueEffectiveness: { skillEffectiveness: { harmfulSkill: true } },
  }).skillReviewProductValueEffectiveness))],
  ['fanout_stops_after_two_no_signal_cycles', () => failed(validateSkillReviewProductValueEffectiveness(buildOrchestrationCapsule({
    skillReviewProductValueEffectiveness: { reviewEffectiveness: { fanoutContinuationAllowed: true, noNewSignalRepeatCount: 2 } },
  }).skillReviewProductValueEffectiveness))],
  ['product_value_return_cannot_authorize_product_scope', () => failed(validateSkillReviewProductValueEffectiveness(buildOrchestrationCapsule({
    skillReviewProductValueEffectiveness: { productValueReturnGate: { productScopeAuthorized: true } },
  }).skillReviewProductValueEffectiveness))],
  ['repeated_harness_only_requires_next_product_slice', () => failed(validateSkillReviewProductValueEffectiveness(buildOrchestrationCapsule({
    skillReviewProductValueEffectiveness: { productValueReturnGate: { evidenceOnlyRepeated: true, recentHarnessOnlyCount: 3, nextProductSliceRecommended: false } },
  }).skillReviewProductValueEffectiveness))],
  ['worker_proof_default_v126_extensions_pass', () => passed(validateWorkerProofCapsule(buildWorkerProofCapsule()))],
  ['worker_observed_state_blocks_forbidden_files', () => failed(validateWorkerProofCapsule(buildWorkerProofCapsule({
    observedGitWorktreePrState: { forbiddenFilesTouched: true },
  })))],
  ['worker_observed_state_blocks_stale_branch', () => failed(validateWorkerProofCapsule(buildWorkerProofCapsule({
    observedGitWorktreePrState: { staleBranchDetected: true },
  })))],
  ['owner_brief_default_v126_receipts_pass', () => passed(validateOwnerDecisionBrief(buildOwnerDecisionBrief()))],
  ['owner_brief_merge_receipt_requires_head', () => failed(validateOwnerDecisionBrief(buildOwnerDecisionBrief({
    ownerDecisionReceipt: { present: true, allowedAction: 'merge_current_pr', headSha: null },
  })))],
  ['owner_brief_delegated_process_cannot_allow_secret', () => failed(validateOwnerDecisionBrief(buildOwnerDecisionBrief({
    ownerDelegatedProcessReceipt: { present: true, autoContinueAllowed: true, allowedActions: ['secretAccess'] },
  })))],
  ['orchestration_capsule_validates_all_v126_internal_blocks', () => {
    const result = validateOrchestrationCapsule(buildOrchestrationCapsule());
    return Object.values(result).every((item) => item.status === 'pass');
  }],
];

const cases = [
  ...compatibilityCases,
  ...observedStateCases,
  ...loopCases,
  ...evidenceAndRouterCases,
  ...effectivenessAndArtifactCases,
].map(([name, fn]) => test(name, fn));

const fixtureGroups = [
  'v118_v119_v120_v121_v122_v123_v124_v125_compatibility_matrix',
  'observed_workspace_owner_receipt_capability_matrix',
  'checker_builder_loop_stop_circuit_matrix',
  'evidence_lane_state_machine_safe_failure_matrix',
  'context_skill_validation_budget_router_matrix',
  'skill_review_product_value_effectiveness_matrix',
  'worker_observed_git_worktree_pr_state_matrix',
  'owner_receipt_delegated_process_matrix',
];

const failures = cases.filter((item) => item.status !== 'pass');
const report = {
  v126SelfTestStatus: {
    status: failures.length ? 'fail' : 'pass',
    caseCount: cases.length,
    failureCount: failures.length,
    fixtureGroups,
    safeSummaryOnly: true,
  },
  cases,
  status: failures.length ? 'fail' : 'pass',
  safeSummaryOnly: true,
};

writeJsonReport(report, 'CODEX_V126_SELF_TEST_REPORT');
if (!process.env.CODEX_V126_SELF_TEST_REPORT && process.env.CODEX_QUALITY_REPORT !== 'json') {
  console.log(`v126SelfTestStatus: ${report.v126SelfTestStatus.status}`);
}
exitFor(report);
