#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.3

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { writeJsonReport, exitFor } from './codex-v080-lib.mjs';
import {
  buildRemoteProductEvidenceExecutionInput,
  buildSafeArtifactIndexInputForQualityGate,
} from './codex-local-quality-gate.mjs';
import {
  buildRemoteNpmFailureArtifactContractSummary,
  buildRemoteNpmFailureSafeArtifact,
} from './codex-remote-product-evidence-runner.mjs';
import { buildSafeArtifactIndex as buildWorkflowSafeArtifactIndex } from './codex-safe-artifact-index.mjs';
import { buildRemoteProductEvidenceExecutionReport } from './codex-v098-gate-lib.mjs';
import {
  BOUNDARY_PROFILES,
  V113_STATUS_KEYS,
  buildArtifactReadOrderIndex,
  buildConversationCostLedger,
  buildDefaultV113Statuses,
  buildDecisionObject,
  buildMinimalBlockersArtifact,
  buildNonRuntimeSharedUtilityProfile,
  buildProgressiveGatePlan,
  buildRepairLoopReport,
  buildRepresentativeFixtureSuite,
  buildRolloutDryRun,
  buildSafeArtifactIndex,
  buildTargetRolloutSelectorManifest,
  buildV113Report,
  classifyLegacySelfTestLane,
  classifyReasonCode,
  detectDeadSpec,
  detectDecisionContradictions,
  detectOverEngineering,
  lintProSummary,
  splitRemoteEvidenceState,
  validatePrBody,
  validateTargetHarnessScopeFirewall,
} from './codex-v113-minimal-surface.mjs';

function test(name, fn) {
  try {
    return { name, status: fn() ? 'pass' : 'fail', safeSummaryOnly: true };
  } catch {
    return { name, status: 'fail', reasonCodes: ['self_test_exception'], safeSummaryOnly: true };
  }
}

const statuses = buildDefaultV113Statuses();
const report = buildV113Report();
const blockers = buildMinimalBlockersArtifact({
  mergeBlocking: true,
  primaryBlockers: ['same_head_required_check_failed', 'safe_artifact_missing', 'owner_merge_instruction_absent', 'extra'],
  derivedFailures: ['typescript_failed', 'stale_metadata', 'required_check_failed', 'quality_gate_missing', 'artifact_missing', 'extra'],
  safeNextAction: 'read_minimal_blockers_artifact',
});
const readOrder = buildArtifactReadOrderIndex();
const reason = classifyReasonCode('typescript_same_head_required_check_failed');
const prBodyOk = validatePrBody();
const prBodyBad = validatePrBody({ shapeOk: false });
const legacyAdvisory = classifyLegacySelfTestLane({ lane: 'target_harness_only_rollout', reasonCode: 'legacy_self_test_unrelated_to_target_harness_only' });
const legacyTrueBlocker = classifyLegacySelfTestLane({ lane: 'target_harness_only_rollout', reasonCode: 'secret_leak_detected' });
const firewall = validateTargetHarnessScopeFirewall();
const progressive = buildProgressiveGatePlan();
const selector = buildTargetRolloutSelectorManifest();
const dryRun = buildRolloutDryRun();
const fixtures = buildRepresentativeFixtureSuite();
const decisionAllowed = buildDecisionObject();
const decisionBlocked = buildDecisionObject({ requiredCheckFailed: true });
const artifactIndex = buildSafeArtifactIndex();
const costLedger = buildConversationCostLedger();
const pr114ExecutionInput = buildRemoteProductEvidenceExecutionInput(
  { changeClassificationStatus: { productRelevantChanged: true } },
  { CODEX_HARNESS_MODE: 'target', CODEX_EVENT_NAME: 'pull_request', CODEX_PR_HEAD_SHA: 'same-head' },
  {
    evidence: { status: 'fail', headSha: 'same-head', productRelevant: true, npmExecuted: true, npmExitCode: 1 },
    baseline: { status: 'fail' },
    diagnostic: { npmExitCode: 1 },
  },
);
const pr114ExecutionReport = buildRemoteProductEvidenceExecutionReport(pr114ExecutionInput);
const missingEvidenceReport = buildRemoteProductEvidenceExecutionReport(buildRemoteProductEvidenceExecutionInput(
  { changeClassificationStatus: { productRelevantChanged: true } },
  { CODEX_HARNESS_MODE: 'target', CODEX_EVENT_NAME: 'pull_request', CODEX_PR_HEAD_SHA: 'same-head' },
));
const headMismatchReport = buildRemoteProductEvidenceExecutionReport(buildRemoteProductEvidenceExecutionInput(
  { changeClassificationStatus: { productRelevantChanged: true } },
  { CODEX_HARNESS_MODE: 'target', CODEX_EVENT_NAME: 'pull_request', CODEX_PR_HEAD_SHA: 'same-head' },
  {
    evidence: { status: 'pass', headSha: 'other-head', productRelevant: true, npmExecuted: true, npmExitCode: 0 },
    baseline: { status: 'pass' },
    diagnostic: { npmExitCode: 0 },
  },
));
const npmNotExecutedReport = buildRemoteProductEvidenceExecutionReport(buildRemoteProductEvidenceExecutionInput(
  { changeClassificationStatus: { productRelevantChanged: true } },
  { CODEX_HARNESS_MODE: 'target', CODEX_EVENT_NAME: 'pull_request', CODEX_PR_HEAD_SHA: 'same-head' },
  {
    evidence: { status: 'pass', headSha: 'same-head', productRelevant: true, npmExecuted: false, npmExitCode: 0 },
    baseline: { status: 'pass' },
    diagnostic: { npmExitCode: 0 },
  },
));
const remoteExecutionStatus = (report) => report.remoteProductEvidenceExecutionStatus || report;
const npmFailureArtifactWithSafeDetails = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  headSha: 'same-head',
  npmOutput: [
    'TAP version 13',
    'not ok 3 - safe normalization rejects unsafe replacement',
    '  at test/safe-normalization.test.js:12:1',
    '# fail 1',
  ].join('\n'),
});
const npmFailureArtifactUnknown = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  headSha: 'same-head',
  npmOutput: 'npm failed without a structured test marker',
});
const npmFailureArtifactNoOutput = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  headSha: 'same-head',
});
const npmFailureArtifactUnsafe = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  headSha: 'same-head',
  npmOutput: [
    'not ok 1 - leaked https://example.invalid/secret?token=abc',
    '  at test/safe-normalization.test.js:10:1',
  ].join('\n'),
});
const npmTimeoutUnknownArtifact = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  timedOut: true,
  timeoutMs: 180000,
  elapsedMs: 180000,
  headSha: 'same-head',
});
const npmTimeoutWithSafeDetailArtifact = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  timedOut: true,
  timeoutMs: 180000,
  elapsedMs: 180000,
  headSha: 'same-head',
  npmOutput: [
    'TAP version 13',
    'not ok 7 - safe normalization keeps subtitles bounded',
    '  at test/safe-normalization.test.js:42:1',
  ].join('\n'),
});
const npmTimeoutBeforeDiscoveryArtifact = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  timedOut: true,
  testDiscoveryStarted: false,
  timeoutMs: 180000,
  elapsedMs: 180000,
  headSha: 'same-head',
});
const npmTimeoutFixtureArtifact = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  timedOut: true,
  timeoutClass: 'fixture_interference_possible',
  timeoutMs: 180000,
  elapsedMs: 180000,
  headSha: 'same-head',
  npmOutput: 'fixture timeout before stable completion',
});
const npmTimeoutUnsafeArtifact = buildRemoteNpmFailureSafeArtifact({
  productRelevant: true,
  npmExecuted: true,
  npmExitCode: 1,
  timedOut: true,
  timeoutMs: 180000,
  elapsedMs: 180000,
  headSha: 'same-head',
  npmOutput: 'timeout after https://example.invalid/secret?token=abc',
});
const remoteNpmFailureIndex = {
  artifacts: [
    { key: 'remoteNpmFailure', artifactName: 'codex-remote-npm-failure.safe.json', status: 'present', safeSummaryOnly: true },
  ],
  safeSummaryOnly: true,
};
const uploadedNotIndexedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-v113-safe-npm-'));
fs.mkdirSync(path.join(uploadedNotIndexedRoot, '_temp'), { recursive: true });
fs.writeFileSync(
  path.join(uploadedNotIndexedRoot, '_temp', 'codex-remote-npm-failure.safe.json'),
  JSON.stringify(npmFailureArtifactUnknown, null, 2),
);
const remoteNpmUploadedNotIndexedDiscoveredIndex = buildWorkflowSafeArtifactIndex([], 'target', {
  bundleRoots: [uploadedNotIndexedRoot],
});
const remoteNpmUploadedNotIndexedDiscoveredEntry = remoteNpmUploadedNotIndexedDiscoveredIndex.artifacts.find(
  (item) => item.key === 'remoteNpmFailure' || item.artifactName === 'codex-remote-npm-failure.safe.json',
);
const npmFailureUploadedNotIndexedContract = buildRemoteNpmFailureArtifactContractSummary({
  artifact: npmFailureArtifactUnknown,
  index: remoteNpmUploadedNotIndexedDiscoveredIndex,
});
const npmFailureContractAvailable = buildRemoteNpmFailureArtifactContractSummary({
  artifact: npmFailureArtifactWithSafeDetails,
  index: remoteNpmFailureIndex,
});
const npmTimeoutContractAvailable = buildRemoteNpmFailureArtifactContractSummary({
  artifact: npmTimeoutUnknownArtifact,
  index: remoteNpmFailureIndex,
});
const npmFailureContractMissingDetail = buildRemoteNpmFailureArtifactContractSummary({
  artifact: npmFailureArtifactUnknown,
  index: remoteNpmFailureIndex,
});
const npmFailureContractAbsent = buildRemoteNpmFailureArtifactContractSummary({
  artifact: null,
  index: remoteNpmFailureIndex,
});
const remoteNpmFailureIndexMissing = {
  artifacts: [
    { key: 'remoteNpmFailure', artifactName: 'codex-remote-npm-failure.safe.json', status: 'missing', safeSummaryOnly: true },
  ],
  safeSummaryOnly: true,
};
const remoteNpmFailureBuiltMissingIndex = buildWorkflowSafeArtifactIndex(remoteNpmFailureIndexMissing.artifacts, 'target');
const remoteNpmFailureBuiltMissingEntry = remoteNpmFailureBuiltMissingIndex.artifacts.find(
  (item) => item.key === 'remoteNpmFailure' || item.artifactName === 'codex-remote-npm-failure.safe.json',
);
const npmFailureContractMissingIndex = buildRemoteNpmFailureArtifactContractSummary({
  artifact: npmFailureArtifactWithSafeDetails,
  index: remoteNpmFailureIndexMissing,
});
const remoteNpmOptionalNotExecutedInput = buildSafeArtifactIndexInputForQualityGate({
  CODEX_REMOTE_NPM_EXECUTED: '0',
  CODEX_NPM_EXIT_CODE: '0',
  CODEX_REMOTE_NPM_FAILURE_PATH: 'codex-remote-npm-failure.safe.json',
});
const remoteNpmOptionalZeroExitInput = buildSafeArtifactIndexInputForQualityGate({
  CODEX_REMOTE_NPM_EXECUTED: '1',
  CODEX_NPM_EXIT_CODE: '0',
  CODEX_REMOTE_NPM_FAILURE_PATH: 'codex-remote-npm-failure.safe.json',
});
const remoteNpmRequiredAbsentInput = buildSafeArtifactIndexInputForQualityGate({
  CODEX_REMOTE_NPM_EXECUTED: '1',
  CODEX_NPM_EXIT_CODE: '1',
  CODEX_REMOTE_NPM_FAILURE_PATH: 'codex-remote-npm-failure.safe.json',
});
const remoteNpmOptionalNotExecutedIndex = buildWorkflowSafeArtifactIndex(remoteNpmOptionalNotExecutedInput, 'target');
const remoteNpmOptionalZeroExitIndex = buildWorkflowSafeArtifactIndex(remoteNpmOptionalZeroExitInput, 'target');
const remoteNpmRequiredAbsentIndex = buildWorkflowSafeArtifactIndex(remoteNpmRequiredAbsentInput, 'target');
const remoteNpmTimeoutMissingIndex = buildWorkflowSafeArtifactIndex([], 'target', { remoteNpmFailureRequired: true });

const cases = [
  test('all_v113_status_keys_default_pass', () => V113_STATUS_KEYS.every((key) => statuses[key]?.status === 'pass')),
  test('v113_report_passes', () => report.status === 'pass'),
  test('v113_self_status_present', () => report.v113SelfTestStatus.status === 'pass'),
  test('minimal_blockers_artifact_compact', () => blockers.primaryBlockers.length === 3 && blockers.derivedFailures.length === 5 && blockers.rawLogsAllowed === false),
  test('minimal_blockers_artifact_first_read', () => readOrder.first === 'codex-minimal-blockers.safe.json'),
  test('reason_code_scope_classification', () => reason.scope === 'external_blocked' && reason.minimalFix === 'wait_for_state_delta'),
  test('repairability_classifier_blocks_current_pr', () => reason.unsafeToFixInCurrentPr === true),
  test('pr_body_demoted_from_machine_source', () => prBodyOk.prBodyDemotionStatus.prBodyMachinePrimary === false),
  test('pr_body_markdown_shape_passes_when_valid', () => prBodyOk.prBodyMarkdownShapeStatus.status === 'pass'),
  test('pr_body_markdown_shape_blocks_when_invalid', () => prBodyBad.prBodyMarkdownShapeStatus.status === 'fail'),
  test('pr_body_as_rendered_output_is_derived', () => prBodyOk.prBodyAsRenderedOutputV2Status.derivedOnly === true),
  test('legacy_self_test_lane_advisory_for_unrelated_target_rollout', () => legacyAdvisory.classification === 'advisory_compatibility'),
  test('legacy_true_blocker_remains_blocking', () => legacyTrueBlocker.classification === 'blocking' && legacyTrueBlocker.trueBlockerPreserved === true),
  test('target_harness_scope_firewall_passes_safe_defaults', () => firewall.status === 'pass'),
  test('target_harness_scope_firewall_blocks_external_cwd', () => validateTargetHarnessScopeFirewall({ childCwd: '..' }).status === 'fail'),
  test('progressive_gate_runner_starts_fast', () => progressive.fastGateFirst === true && progressive.order[0] === 'fast_gate'),
  test('progressive_gate_runner_has_runtime_budget', () => progressive.budgets.fastGateSeconds <= 20),
  test('boundary_macro_profiles_registered', () => Object.keys(BOUNDARY_PROFILES).length >= 11),
  test('boundary_macro_standard_profile_present', () => Boolean(BOUNDARY_PROFILES.STANDARD_HARNESS_ONLY_NO_RUNTIME_NO_PRODUCT_V113)),
  test('rollout_selector_file_budget_small', () => selector.changedCount <= 40 && selector.budget === 'pass'),
  test('rollout_dry_run_first_and_parity', () => dryRun.plannedChangedFilesHash === dryRun.actualChangedFilesHash && dryRun.parity === true),
  test('five_target_synthetic_fixtures_present', () => ['VOXWEAVE', 'IRIS-live2d-renderer', 'FUNKY', 'IRIS', 'CRIPTO-TIP'].every((key) => fixtures[key]?.status === 'pass')),
  test('cripto_fixture_preserves_blocked_typescript_state', () => fixtures['CRIPTO-TIP'].typescript === 'fail' && fixtures['CRIPTO-TIP'].merge === 'blocked'),
  test('single_decision_object_allowed', () => decisionAllowed.decision === 'allowed' && decisionAllowed.safeSummaryOnly === true),
  test('single_decision_object_blocks_required_check', () => decisionBlocked.decision === 'blocked_by_required_check' && decisionBlocked.merge === 'blocked'),
  test('decision_contradiction_passes_consistent_state', () => detectDecisionContradictions({ merge: 'blocked', requiredChecksPass: false, qualityScore: 95, hardBlockerCount: 0 }).status === 'pass'),
  test('decision_contradiction_blocks_allowed_failed_required_check', () => detectDecisionContradictions({ merge: 'allowed', requiredChecksPass: false }).status === 'fail'),
  test('safe_artifact_index_entry_points', () => artifactIndex.decision === 'codex-decision-object.safe.json' && artifactIndex.minimalBlockers === 'codex-minimal-blockers.safe.json'),
  test('conversation_cost_ledger_no_full_json_console', () => costLedger.fullJsonConsoleLines === 0 && costLedger.visibleStatusCount <= 7),
  test('pro_summary_lint_blocks_long_report', () => lintProSummary({ finalReportLines: 31 }).status === 'fail'),
  test('dead_spec_detector_passes_traced_requirements', () => detectDeadSpec().status === 'pass'),
  test('dead_spec_detector_blocks_untraced_requirement', () => detectDeadSpec({ requirements: ['a', 'b'], traced: ['a'] }).status === 'fail'),
  test('over_engineering_detector_passes_budget', () => detectOverEngineering({ newDocs: 3, newScripts: 2, operatorVisibleStatuses: 7 }).status === 'pass'),
  test('over_engineering_detector_blocks_wrapper_without_value', () => detectOverEngineering({ wrapperWithoutDecisionValue: true }).status === 'fail'),
  test('repair_loop_prevention_warns_before_block', () => buildRepairLoopReport({ repairPrCount: 2 }).fixtureRequired === true),
  test('repair_loop_prevention_blocks_third_repair', () => buildRepairLoopReport({ repairPrCount: 3 }).status === 'fail'),
  test('remote_evidence_state_split_not_required', () => splitRemoteEvidenceState({ required: false }) === 'not_required'),
  test('remote_evidence_state_split_failed_execution', () => splitRemoteEvidenceState({ required: true, executed: true, artifactPresent: true, pass: false }) === 'executed_fail'),
  test('pr114_remote_product_evidence_is_consumed_when_authoritative_file_exists', () => remoteExecutionStatus(pr114ExecutionReport).status === 'pass' && pr114ExecutionInput.remoteEvidencePhase === 'evidence_consumed'),
  test('pr114_remote_product_evidence_does_not_report_execution_missing', () => !(remoteExecutionStatus(pr114ExecutionReport).reasonCodes || []).includes('remote_product_evidence_execution_missing')),
  test('remote_npm_failure_safe_artifact_extracts_test_detail', () => npmFailureArtifactWithSafeDetails.primaryClass === 'product_test_failure_safe_summary_available' && ['assertion', 'timeout'].includes(npmFailureArtifactWithSafeDetails.failureClass) && npmFailureArtifactWithSafeDetails.failingTestFiles.includes('test/safe-normalization.test.js') && npmFailureArtifactWithSafeDetails.failingTestNames.includes('safe normalization rejects unsafe replacement')),
  test('remote_npm_failure_safe_artifact_omits_raw_output', () => npmFailureArtifactWithSafeDetails.rawOutputPrinted === false && npmFailureArtifactWithSafeDetails.rawOutputStored === false && npmFailureArtifactWithSafeDetails.rawStackOmitted === true && npmFailureArtifactWithSafeDetails.rawLogsRead === false),
  test('remote_npm_failure_safe_artifact_separates_raw_output_semantics', () => npmFailureArtifactWithSafeDetails.operatorRawLogsRead === false && npmFailureArtifactWithSafeDetails.githubJobLogsRead === false && npmFailureArtifactWithSafeDetails.rawOutputIngestedForSafeSummary === true && npmFailureArtifactWithSafeDetails.safeSummaryOnly === true),
  test('remote_npm_failure_unknown_output_stays_safe', () => npmFailureArtifactUnknown.failureClass === 'unknown' && npmFailureArtifactUnknown.safeDetailUnavailable === true && npmFailureArtifactUnknown.rawOutputIngestedForSafeSummary === true && npmFailureArtifactUnknown.rawOutputPrinted === false && npmFailureArtifactUnknown.rawStackOmitted === true && npmFailureArtifactUnknown.safeNextAction === 'owner_authorized_product_check_triage_or_harness_failure_summarizer_repair'),
  test('remote_npm_failure_no_output_marks_not_ingested', () => npmFailureArtifactNoOutput.failureClass === 'unknown' && npmFailureArtifactNoOutput.safeDetailUnavailable === true && npmFailureArtifactNoOutput.rawOutputIngestedForSafeSummary === false && npmFailureArtifactNoOutput.rawOutputPrinted === false),
  test('remote_npm_failure_unsafe_output_not_echoed', () => npmFailureArtifactUnsafe.safeSummaryOnly === true && npmFailureArtifactUnsafe.failingTestNames.length === 0 && !JSON.stringify(npmFailureArtifactUnsafe).includes('https://example.invalid')),
  test('remote_npm_timeout_unknown_detail_artifact', () => npmTimeoutUnknownArtifact.timedOut === true && npmTimeoutUnknownArtifact.timeoutClass === 'unknown_timeout' && npmTimeoutUnknownArtifact.safeDetailUnavailable === true && npmTimeoutUnknownArtifact.rawOutputPrinted === false && npmTimeoutUnknownArtifact.rawStackOmitted === true && npmTimeoutUnknownArtifact.primaryClass === 'npm_timeout'),
  test('remote_npm_timeout_with_safe_detail_artifact', () => npmTimeoutWithSafeDetailArtifact.timedOut === true && npmTimeoutWithSafeDetailArtifact.failingTestFiles.includes('test/safe-normalization.test.js') && npmTimeoutWithSafeDetailArtifact.timeoutClass === 'product_test_timeout_possible' && npmTimeoutWithSafeDetailArtifact.primaryClass === 'product_test_timeout_possible'),
  test('remote_npm_timeout_before_discovery_artifact', () => npmTimeoutBeforeDiscoveryArtifact.timedOut === true && npmTimeoutBeforeDiscoveryArtifact.timeoutClass === 'suite_timeout' && npmTimeoutBeforeDiscoveryArtifact.primaryClass === 'test_suite_timeout'),
  test('remote_npm_timeout_fixture_interference_artifact', () => npmTimeoutFixtureArtifact.timedOut === true && npmTimeoutFixtureArtifact.timeoutClass === 'fixture_interference_possible' && npmTimeoutFixtureArtifact.primaryClass === 'fixture_interference_possible'),
  test('remote_npm_timeout_unsafe_output_not_echoed', () => npmTimeoutUnsafeArtifact.safeSummaryOnly === true && npmTimeoutUnsafeArtifact.rawOutputPrinted === false && !JSON.stringify(npmTimeoutUnsafeArtifact).includes('https://example.invalid')),
  test('remote_npm_failure_artifact_index_contract_available', () => npmFailureContractAvailable.generated === true && npmFailureContractAvailable.indexed === true && npmFailureContractAvailable.consumed === true && npmFailureContractAvailable.primaryClass === 'product_test_failure_safe_summary_available'),
  test('remote_npm_timeout_artifact_index_contract_available', () => npmTimeoutContractAvailable.generated === true && npmTimeoutContractAvailable.indexed === true && npmTimeoutContractAvailable.consumed === true && npmTimeoutContractAvailable.primaryClass === 'npm_timeout'),
  test('remote_npm_failure_artifact_index_contract_missing_detail', () => npmFailureContractMissingDetail.generated === true && npmFailureContractMissingDetail.indexed === true && npmFailureContractMissingDetail.primaryClass === 'product_test_failure_safe_summary_missing'),
  test('remote_npm_failure_uploaded_not_indexed_is_discovered', () => remoteNpmUploadedNotIndexedDiscoveredEntry?.status === 'present' && remoteNpmUploadedNotIndexedDiscoveredEntry.indexed === true && remoteNpmUploadedNotIndexedDiscoveredEntry.consumed === true),
  test('remote_npm_failure_present_safe_detail_unavailable_consumed', () => npmFailureUploadedNotIndexedContract.generated === true && npmFailureUploadedNotIndexedContract.indexed === true && npmFailureUploadedNotIndexedContract.consumed === true && npmFailureUploadedNotIndexedContract.primaryClass === 'product_test_failure_safe_summary_missing' && npmFailureUploadedNotIndexedContract.primaryClass !== 'unknown_npm_failure'),
  test('remote_npm_failure_present_with_details_consumed', () => npmFailureContractAvailable.generated === true && npmFailureContractAvailable.indexed === true && npmFailureContractAvailable.consumed === true && npmFailureContractAvailable.primaryClass === 'product_test_failure_safe_summary_available'),
  test('remote_npm_failure_artifact_absent_remains_blocking', () => npmFailureContractAbsent.generated === false && npmFailureContractAbsent.primaryClass === 'product_test_failure_safe_summary_missing' && npmFailureContractAbsent.safeNextAction === 'harness_artifact_index_repair'),
  test('remote_npm_failure_optional_when_not_executed', () => remoteNpmOptionalNotExecutedInput.some((item) => item.key === 'remoteNpmFailure' && item.status === 'not_applicable') && remoteNpmOptionalNotExecutedIndex.status === 'pass'),
  test('remote_npm_failure_optional_when_exit_zero', () => remoteNpmOptionalZeroExitInput.some((item) => item.key === 'remoteNpmFailure' && item.status === 'not_applicable') && remoteNpmOptionalZeroExitIndex.status === 'pass'),
  test('remote_npm_failure_required_missing_blocks', () => remoteNpmRequiredAbsentInput.some((item) => item.key === 'remoteNpmFailure' && item.status === 'missing_required' && item.reasonCodes.includes('safe_npm_failure_artifact_required_missing')) && remoteNpmRequiredAbsentIndex.status === 'fail'),
  test('remote_npm_timeout_missing_artifact_remains_hard_failure', () => remoteNpmTimeoutMissingIndex.status === 'fail' && (remoteNpmTimeoutMissingIndex.reasonCodes || []).includes('safe_npm_failure_artifact_required_missing')),
  test('remote_npm_failure_missing_index_not_consumed', () => npmFailureContractMissingIndex.indexed === false && npmFailureContractMissingIndex.consumed === false && remoteNpmFailureBuiltMissingEntry?.indexed === false && remoteNpmFailureBuiltMissingEntry?.consumed === false),
  test('remote_product_evidence_missing_still_fails', () => remoteExecutionStatus(missingEvidenceReport).status === 'fail' && (remoteExecutionStatus(missingEvidenceReport).reasonCodes || []).includes('remote_product_evidence_execution_missing')),
  test('remote_product_evidence_head_mismatch_still_fails', () => remoteExecutionStatus(headMismatchReport).status === 'fail' && (remoteExecutionStatus(headMismatchReport).reasonCodes || []).includes('same_head_artifact_missing')),
  test('remote_product_evidence_npm_not_executed_still_fails', () => remoteExecutionStatus(npmNotExecutedReport).status === 'fail' && (remoteExecutionStatus(npmNotExecutedReport).reasonCodes || []).includes('remote_npm_not_executed_for_product_pr')),
  test('non_runtime_shared_utility_profile_passes_safe_common_path', () => buildNonRuntimeSharedUtilityProfile({ files: ['src/common/safe-helper.ts'] }).status === 'pass'),
  test('non_runtime_shared_utility_profile_blocks_runtime_import', () => buildNonRuntimeSharedUtilityProfile({ runtimeImport: true }).status === 'fail'),
  test('artifact_payloads_are_safe_summary_only', () => report.artifacts.safeArtifactIndex.safeSummaryOnly === true && report.artifacts.minimalBlockers.safeSummaryOnly === true && report.artifacts.decisionObject.safeSummaryOnly === true),
  test('source_only_non_goals_preserved', () => report.targetRollout === 'not_started' && report.targetReposTouched === false && report.productCodeChanged === false),
  test('readiness_non_claims_preserved', () => report.runtimeReadinessClaimed === false && report.productionReadinessClaimed === false),
  test('no_raw_logs_no_8_session_no_wallet_rpc', () => report.rawLogsRead === false && report.eightSessionUsed === false && report.walletRpcDeployAccess === false),
];

const failures = cases.filter((item) => item.status !== 'pass');
const selfTestReport = {
  v113SelfTestStatus: { status: failures.length ? 'fail' : 'pass', caseCount: cases.length, failureCount: failures.length, safeSummaryOnly: true },
  cases,
  status: failures.length ? 'fail' : 'pass',
  safeSummaryOnly: true,
};

writeJsonReport(selfTestReport, 'CODEX_V113_SELF_TEST_REPORT');
if (!process.env.CODEX_V113_SELF_TEST_REPORT) console.log(`v113SelfTestStatus: ${selfTestReport.v113SelfTestStatus.status}`);
exitFor(selfTestReport);
