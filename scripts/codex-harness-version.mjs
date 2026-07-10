#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.3.0

export const currentVersion = '1.3.0';
export const previousVersion = '1.2.9';
export const activeSelfTestStatusKey = 'v130SelfTestStatus';
export const activeSelfTestSuite = 'v130';
export const candidateVersion = '1.3.2';
export const candidateSelfTestStatusKey = 'v132SelfTestStatus';
export const candidateSelfTestSuite = 'v132';
export const candidateLifecycleState = 'provisional_local_install';
export const installedSourceCandidateSha = '891ff534901ffc3cae40be0a5ca9d09b88f87097';
export const legacyAdvisorySuites = ['v129', 'v128', 'v127', 'v126', 'v125', 'v124', 'v123', 'v122', 'v121', 'v120', 'v119', 'v118', 'v117', 'v116', 'v115', 'v114', 'v113'];
export const versionLineagePolicy = { sourceOnlyRelease: false, targetRollout: 'completed', rolloutClass: 'full_quality_gate_target', materialization: 'v130_core_full_quality_target_bridge', previousRollbackAvailable: true, v129RollbackAvailable: true, v128CompatibilityAvailable: true, v127ReadableCompatibilityAvailable: true, sourceFullBundleCopied: false, workflowChanged: false, productCodeChanged: false, packageOrLockfileChanged: false, routineColdArtifactRead: 0, routineSelectedSkillMax: 0, routineReviewerFanout: 0, runtimeReadinessClaimed: false, productionReadinessClaimed: false, performanceTrackState: 'deferred', FableComparatorState: 'unavailable', superiorityClaimState: 'not_proven', authorityCreated: false, productRuntimeMutationCount: 0, safeSummaryOnly: true };
export function buildHarnessVersionRegistry() { return { currentVersion, previousVersion, activeSelfTestStatusKey, activeSelfTestSuite, candidateVersion, candidateSelfTestStatusKey, candidateSelfTestSuite, candidateLifecycleState, installedSourceCandidateSha, legacyAdvisorySuites, versionLineagePolicy, activationAllowed: false, remoteValidationState: 'not_observed', mergeAllowed: false, safeSummaryOnly: true }; }
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(buildHarnessVersionRegistry(), null, 2));
