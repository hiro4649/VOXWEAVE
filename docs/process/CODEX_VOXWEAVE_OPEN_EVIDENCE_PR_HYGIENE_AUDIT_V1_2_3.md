# VOXWEAVE Open Evidence PR Hygiene Audit v1.2.3

## Executive Summary

This docs-only audit inventories stale open draft evidence PRs after the v1.2.3
boundary fixes. The audited PRs are not recommended for merge. Each audited PR
is either superseded by merged main work or stale evidence from an older harness
version, so each receives a close recommendation for owner cleanup.

## Audit Metadata

title: VOXWEAVE Open Evidence PR Hygiene Audit v1.2.3
currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
activeSelfTestStatusKey: v123SelfTestStatus
currentMainHeadSha: 5ada6108e980513fcddcdbeb13cbb927632c49ef
postMergeBaselinePr: #283
postMergeBaselineSha: 5ada6108e980513fcddcdbeb13cbb927632c49ef
terminalAction: create_pr_only
mergeReadiness: no
auditMode: docs_only
productCodeChangeStatus: none
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
rawLogsRead: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no

## Classification Rules

superseded_by_merged_main: same objective or higher-order fix/audit has already
merged to main.

evidence_only_stale: docs-only acceptance audit or post-merge sentinel evidence
whose base is old and no longer adds active merge value under v1.2.3.

stale_harness_version: evidence from v1.2.1 or v1.2.2 that is no longer part of
the active v1.2.3 decision path.

mergeRecommendation: no for every audited PR.

closeRecommendation: yes when an open draft is unmerged, based on an older main
base, and either superseded by merged main or evidence-only/stale-version work.

## Inventory Summary

auditedPrCount: 9
mergeRecommendationAllNoStatus: pass
closeRecommendationStatus: yes_for_all_audited_prs
closeActionStatus: recommended_only

## PR #279

prNumber: 279
title: VOXWEAVE Adapter Route Boundary Fix v1.2.2
url: https://github.com/hiro4649/VOXWEAVE/pull/279
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: defdb37b8476372c00e9d5cd8523663a8fdac11e
headSha: e05ff3e99b78f85c5cf46c4de945cbb2a481ba77
harnessVersionObserved: v1.2.2
evidenceType: product_candidate
stalenessClass: superseded_by_merged_main
supersededBy: #281
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.2 adapter route candidate superseded by merged v1.2.3 PR #281
riskIfLeftOpen: stale duplicate evidence can be mistaken for active candidate
safeNextAction: close after owner cleanup confirmation

## PR #278

prNumber: 278
title: VOXWEAVE Quality Score Boundary Tests Post-Merge Sentinel v1.2.2
url: https://github.com/hiro4649/VOXWEAVE/pull/278
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: defdb37b8476372c00e9d5cd8523663a8fdac11e
headSha: c01a111ed2219e6088dc93886d75bfdb450ae38f
harnessVersionObserved: v1.2.2
evidenceType: post_merge_sentinel
stalenessClass: evidence_only_stale
supersededBy: #276 merged plus current v1.2.3 main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.2 post-merge sentinel draft no longer needed after main advanced to v1.2.3
riskIfLeftOpen: stale sentinel can be confused with current post-merge evidence
safeNextAction: close after owner cleanup confirmation

## PR #277

prNumber: 277
title: VOXWEAVE Quality Score Boundary Tests Acceptance Audit v1.2.2
url: https://github.com/hiro4649/VOXWEAVE/pull/277
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: d181c0861241aa6aec4e2906bc21479c4ee212b8
headSha: d496738a994d133b6f2568b6bf71e62f7dba016f
harnessVersionObserved: v1.2.2
evidenceType: acceptance_audit
stalenessClass: evidence_only_stale
supersededBy: #276 merged plus current v1.2.3 main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.2 acceptance audit draft no longer needed after candidate merged and main advanced
riskIfLeftOpen: stale acceptance audit can be mistaken for active review evidence
safeNextAction: close after owner cleanup confirmation

## PR #275

prNumber: 275
title: VOXWEAVE Artifact Metadata Boundary Tests Post-Merge Sentinel v1.2.2
url: https://github.com/hiro4649/VOXWEAVE/pull/275
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: d181c0861241aa6aec4e2906bc21479c4ee212b8
headSha: 1b2d90aae21ac556f64b39f4e99f588a86d620e6
harnessVersionObserved: v1.2.2
evidenceType: post_merge_sentinel
stalenessClass: evidence_only_stale
supersededBy: #273 merged plus current v1.2.3 main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.2 post-merge sentinel draft no longer needed after main advanced
riskIfLeftOpen: stale sentinel can be confused with current active evidence
safeNextAction: close after owner cleanup confirmation

## PR #274

prNumber: 274
title: VOXWEAVE Artifact Metadata Boundary Tests Acceptance Audit v1.2.2
url: https://github.com/hiro4649/VOXWEAVE/pull/274
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: e45cd05acceaaff0d7204beb5c64ef75d68df2f2
headSha: b36bf43d8221d6d7d2b7dcf207be98249294976a
harnessVersionObserved: v1.2.2
evidenceType: acceptance_audit
stalenessClass: evidence_only_stale
supersededBy: #273 merged plus current v1.2.3 main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.2 acceptance audit draft no longer needed after candidate merged and main advanced
riskIfLeftOpen: stale acceptance audit can be mistaken for active review evidence
safeNextAction: close after owner cleanup confirmation

## PR #271

prNumber: 271
title: VOXWEAVE Timing Boundary Tests Post-Merge Sentinel v1.2.1
url: https://github.com/hiro4649/VOXWEAVE/pull/271
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: bf5f3d011e8fe906a3b3f5d07af47bd4a4a98371
headSha: a99b1dfc3a6a51b268a747dc1bece2ac36717d66
harnessVersionObserved: v1.2.1
evidenceType: post_merge_sentinel
stalenessClass: stale_harness_version
supersededBy: #269 merged plus v1.2.3 current main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.1 sentinel evidence is stale under the current v1.2.3 active path
riskIfLeftOpen: old harness evidence can be mistaken for current decision evidence
safeNextAction: close after owner cleanup confirmation

## PR #270

prNumber: 270
title: VOXWEAVE Timing Boundary Tests Acceptance Audit v1.2.1
url: https://github.com/hiro4649/VOXWEAVE/pull/270
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: 8005cfba341f3e736690014d47b0abf3a27a2459
headSha: 217f833bc42527e1a63fce648dba3a137cf8eb76
harnessVersionObserved: v1.2.1
evidenceType: acceptance_audit
stalenessClass: stale_harness_version
supersededBy: #269 merged plus v1.2.3 current main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.1 acceptance evidence is stale under the current v1.2.3 active path
riskIfLeftOpen: old harness evidence can be mistaken for current decision evidence
safeNextAction: close after owner cleanup confirmation

## PR #268

prNumber: 268
title: VOXWEAVE Multi-Route Render Group Tests Post-Merge Sentinel v1.2.1
url: https://github.com/hiro4649/VOXWEAVE/pull/268
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: 8005cfba341f3e736690014d47b0abf3a27a2459
headSha: a37dfdd72630bd2a193f1116c3c16e0b61895614
harnessVersionObserved: v1.2.1
evidenceType: post_merge_sentinel
stalenessClass: stale_harness_version
supersededBy: #266 merged plus v1.2.3 current main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.1 sentinel evidence is stale under the current v1.2.3 active path
riskIfLeftOpen: old harness evidence can be mistaken for current decision evidence
safeNextAction: close after owner cleanup confirmation

## PR #267

prNumber: 267
title: VOXWEAVE Multi-Route Render Group Tests Acceptance Audit v1.2.1
url: https://github.com/hiro4649/VOXWEAVE/pull/267
state: OPEN
draftStatus: true
mergedStatus: false
baseSha: 9d422f0dcf7ca193edef479b86a68617e1aae009
headSha: b188e11072cb495441cccd7ab438fb9aa637c086
harnessVersionObserved: v1.2.1
evidenceType: acceptance_audit
stalenessClass: stale_harness_version
supersededBy: #266 merged plus v1.2.3 current main
mergeRecommendation: no
closeRecommendation: yes
closeReason: v1.2.1 acceptance evidence is stale under the current v1.2.3 active path
riskIfLeftOpen: old harness evidence can be mistaken for current decision evidence
safeNextAction: close after owner cleanup confirmation

## Validation Evidence

v123SelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
npmTestStatus: pass

## Safety

runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no
externalEndpointExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
rawLogsRead: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no

## Safe Next Action

Open a draft PR for this docs-only audit. Do not merge or close any audited
evidence PR until the owner explicitly scopes cleanup execution.
