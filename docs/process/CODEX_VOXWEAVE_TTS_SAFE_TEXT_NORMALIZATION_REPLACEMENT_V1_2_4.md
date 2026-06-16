# VOXWEAVE TTS Safe Text Normalization Replacement v1.2.4

## Executive Summary

This document records a v1.2.4 replacement implementation for the useful parts
of PR #114. The replacement was built from current main after PR #314, without
merging, rebasing, cherry-picking, or mutating the original PR #114 branch.

## Source Evidence

- currentActiveHarness: v1.2.4
- baselineActiveCandidateAuditPr: #314
- baselineActiveCandidateAuditMergeCommitSha: e5b1b3d903283eb2707d2cec8b8aab626d668146
- baselinePrePushProductEvidenceRepairPr: #315
- baselinePrePushProductEvidenceRepairMergeCommitSha: cdef28843230063a257bed81c930974ad48aa66c
- targetCandidatePr: #114
- targetCandidateBranchMutation: no
- targetCandidateMergeAction: no
- targetCandidateCherryPickAction: no
- replacementImplementationMode: current_main_replacement

## Replacement Scope

Changed files are limited to the owner-approved replacement footprint:

- src/pronunciationDictionary.js
- src/ttsSafeTextNormalization.js
- scripts/codex-tts-safe-text-normalization-self-check.mjs
- test/voxweave.test.js
- docs/process/CODEX_VOXWEAVE_TTS_SAFE_TEXT_NORMALIZATION_REPLACEMENT_V1_2_4.md

## Pronunciation Dictionary Boundary

The dictionary adds safe reading metadata for owner-relevant names and the
reading-repair phrase. This remains metadata-only and does not connect to a
voice provider.

## TTS Safe Text Normalization Boundary

The helper normalizes text before mock/safe TTS metadata use. It replaces URL
forms with a safe placeholder, removes unsafe key-value configuration markers,
defends against unsafe replacement text, and preserves natural prose when marker
words are not used as configuration keys.

## Self Check Boundary

The self-check uses local Node.js imports only. It prints a compact safe summary
with status and count fields, not raw input bodies or provider output.

## No Runtime Boundary

runtimeExecutionStatus: no
serverStartStatus: no
adapterEndpointCallStatus: no
externalEndpointCallStatus: no
ttsEngineCallStatus: no
asrEngineCallStatus: no
live2dRendererCallStatus: no
rawAudioProcessingStatus: no

## Verification Evidence

- node --check src/ttsSafeTextNormalization.js: pass
- node --check scripts/codex-tts-safe-text-normalization-self-check.mjs: pass
- node --check src/pronunciationDictionary.js: pass
- node --check test/voxweave.test.js: pass
- node scripts/codex-tts-safe-text-normalization-self-check.mjs: pass
- node --test test/voxweave.test.js: pass
- node scripts/codex-v124-self-test.mjs: pass
- node scripts/codex-v123-self-test.mjs: pass
- node scripts/codex-v122-self-test.mjs: pass
- node scripts/codex-local-quality-gate.mjs: pass
- npm test: pass

## Local Quality Gate Resolution

The local quality gate blocker recorded before PR #315 is resolved by the
v1.2.4 pre-push product evidence classification repair. Local pre-push evidence
now allows draft PR creation after bounded local validation while keeping remote
formal evidence required after push and keeping merge readiness blocked until
same-head remote QG evidence exists.

## Target Quality Score Repair Evidence

targetQualityScoreRepairStatus: repaired_by_prepush_product_evidence_classification
targetQualityScoreBeforeRepair: 70
targetQualityScoreBlocker: targetQualityScoreStatus
targetQualityScoreRepairAction: merged_PR_315_prepush_product_evidence_classification_repair
addedNpmListedTestFile: test/voxweave.test.js
newStandaloneTestFileStatus: not_used_for_npm_script
packageJsonChangeStatus: none
formalEvidenceArtifactBypassStatus: not_used
selfCheckCaseCount: 20
dedicatedTestCaseCount: 2 npm-listed blocks
formalTestCoverageStatus: pass
runtimeConnectionStatus: not_connected
orchestratorConnectionStatus: not_connected
adapterConnectionStatus: not_connected
realTtsExecutionStatus: no
benchmarkExecutionStatus: no
modelDownloadStatus: no
apiCallStatus: no
externalEndpointExecutionStatus: no
safeSummaryRawLeakStatus: pass
falsePositivePreservationStatus: pass
authorizationKeyValueSanitizationStatus: pass
urlReplacementInjectionGuardStatus: pass
prePushProductEvidenceClassificationStatus: pass
remoteFormalEvidenceRequiredAfterPushStatus: yes
remoteSameHeadQGRequiredStatus: yes
targetQualityScoreStatus: pass
formalEvidencePrecedenceStatus: pass_or_required_after_push_non_blocking
remoteNpmDiagnosticNormalizationStatus: pass_or_required_after_push_non_blocking
localQualityGateStatus: pass
mergeReadiness: no_until_remote_same_head_qg

## Remaining Pre-Push Boundary

The standalone dedicated test was removed from the replacement footprint because
package.json changes are forbidden. Equivalent coverage is now placed in
test/voxweave.test.js, which is already included in the package test script.
Local quality gate status has been rechecked after the PR #315 repair and now
passes without adding package, workflow, lockfile, dependency, or formal
evidence artifact bypass changes.

## Additional Scope Reinforcement

After the first npm-listed test block, the local quality gate still reported
targetQualityScoreStatus: fail with score 70. A second npm-listed test block and
self-check cases were added for null, undefined, number, multiline key-value
sanitization, representative dictionary readings, and disconnected helper output
shape. This keeps the replacement inside the allowed source, script, test, and
documentation footprint.

## Final Local Quality Gate Result

After npm-listed test coverage was added to test/voxweave.test.js and reinforced,
npm test passes with the new coverage included. After PR #315, the local quality
gate also passes with targetQualityScoreStatus: pass and targetQualityScore: 95.
Remote same-head evidence remains required after the replacement PR is pushed.

## Quality Gate Boundary

manualRerunStatus: no_manual_rerun
githubReviewSubmissionStatus: no_review_submission
selfEndorsementStatus: no_self_endorsement
productVerificationExecutionStatus: no
remoteDiagnosticExecutionStatus: no
runtimeDiagnosticExecutionStatus: no
benchmarkExecutionStatus: no
modelDownloadStatus: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no

## Decision Matrix

- candidateValueStatus: useful
- replacementNeededStatus: yes
- replacementCreatedFromCurrentMain: yes
- originalCandidateMerged: no
- originalCandidateBranchMutated: no
- replacementMergeReadiness: no_until_remote_same_head_qg

## Risk Register

- The helper is not wired into runtime orchestration in this task.
- The self-check is local metadata evidence only.
- This does not prove real voice provider behavior.

## Safe Next Action

Run bounded local verification, create a draft replacement PR if checks pass,
let natural QG run, and merge only after fresh owner-scoped gates pass.
