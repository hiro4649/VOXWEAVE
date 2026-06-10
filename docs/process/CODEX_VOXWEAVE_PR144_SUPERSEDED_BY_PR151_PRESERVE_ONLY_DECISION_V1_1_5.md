# VOXWEAVE PR #144 Superseded by PR #151 Preserve-Only Decision v1.1.5

Status: docs-only / superseded-decision-only / preserve-only
currentActiveHarness: v1.1.5
futureHarnessAssumption: v1.1.6 planning only
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrRuntimeReadinessClaimed: no
benchmarkExecutionClaimed: no
mergeReadiness: no

## Executive Summary

PR #144 remains open, draft, unmerged, and preserve-only. PR #151 was merged as the v1.1.5 main-based diagnostic-only active QG replacement, so PR #144 is classified as superseded by PR #151 and must not be repaired, rebased, merged, closed, or treated as the current active replacement path in this task.

Required decision fields:

- pr144DecisionStatus: superseded_by_PR151_replacement_preserve_only
- pr144MutationAllowedInThisTask: no
- pr144CloseAllowedInThisTask: no
- pr144MergeAllowedInThisTask: no
- pr144RepairAllowedInThisTask: no
- pr144RebaseAllowedInThisTask: no
- pr151ReplacementStatus: merged_diagnostic_only_replacement
- pr153SentinelStatus: completed_post_merge_sentinel_evidence
- pr127RepairAllowed: no
- runtimeReadinessClaimed: no
- mergeReadiness: no
- v116ImplementationStatus: not_started

## Source Evidence

| source | observed status | evidence class | limitation |
| --- | --- | --- | --- |
| PR #144 | OPEN / draft / unmerged | original v1.1.4 candidate evidence | superseded by PR #151 replacement path |
| PR #150 | completed compatibility boundary evidence | v1.1.5 incompatibility boundary evidence | does not repair PR #144 |
| PR #151 | MERGED by merge commit 6946e23f05f961da9a95e62ffaf044bd1af8e97d | v1.1.5 diagnostic-only replacement merge evidence | not runtime readiness |
| PR #153 | QG COMPLETED / SUCCESS after persistence | post-merge sentinel evidence | does not authorize PR #144 mutation |
| main | v1.1.5 active harness | current active harness evidence | not v1.1.6 implementation |

## Current Active Harness Confirmation

| field | status |
| --- | --- |
| AGENTS.md marker | v1.1.5 |
| docs/process/CODEX_HARNESS_MANIFEST.json | v1.1.5 |
| .github/workflows/quality-gate.yml marker | v1.1.5 |
| scripts/codex-local-quality-gate.mjs HARNESS_VERSION | v1.1.5 |
| currentActiveHarness | v1.1.5 |
| futureHarnessAssumption | v1.1.6 planning only |

## PR #144 Original Candidate Evidence

| field | status |
| --- | --- |
| pr144State | OPEN |
| pr144DraftStatus | draft |
| pr144MergeStatus | unmerged |
| pr144HeadSha | 40d986fdd1196b598863048f2dacae1d555ecfa7 |
| pr144EvidenceClass | original v1.1.4 diagnostic-only active QG integration candidate |
| pr144CurrentDecision | superseded_by_PR151_replacement_preserve_only |

## PR #150 v1.1.5 Incompatibility Boundary Evidence

PR #150 is treated as compatibility and incompatibility boundary evidence for the PR #144 path. It does not authorize mutation, rebase, repair, close, or merge of PR #144 in this task.

## PR #151 Replacement Merge Evidence

| field | status |
| --- | --- |
| pr151State | MERGED |
| pr151HeadSha | f170ab9a7eb1ff6c6b0f758acc698257b2c96451 |
| pr151MergeCommitSha | 6946e23f05f961da9a95e62ffaf044bd1af8e97d |
| pr151ReplacementStatus | merged_diagnostic_only_replacement |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |

## PR #153 Post-Merge Sentinel Evidence

| field | status |
| --- | --- |
| pr153HeadSha | 8c72ea7755dd91fc7643811b9e190b6e5285fb05 |
| pr153NaturalQualityGateTerminalStatus | completed |
| pr153NaturalQualityGateConclusion | COMPLETED / SUCCESS |
| manualRerunStatus | no_manual_rerun |
| pr153SentinelStatus | completed_post_merge_sentinel_evidence |

## Superseded / Preserve-Only Decision

pr144DecisionStatus: superseded_by_PR151_replacement_preserve_only

PR #144 is not the active path after PR #151 merge. This decision preserves PR #144 as historical candidate evidence only and does not mutate, close, rebase, repair, or merge it.

## PR #144 Mutation Boundary

pr144MutationAllowedInThisTask: no

No PR #144 branch files, PR body, comments, labels, review requests, commits, or metadata are changed by this decision.

## PR #144 Close Boundary

pr144CloseAllowedInThisTask: no

This decision does not close PR #144. Closing, if ever authorized, requires separate explicit owner scope.

## PR #144 Merge Boundary

pr144MergeAllowedInThisTask: no

This decision does not merge PR #144 and does not make PR #144 merge-ready.

## PR #127 Boundary

pr127RepairAllowed: no

This decision does not repair PR #127 and does not authorize PR #127 runtime work.

## Runtime Boundary

runtimeAllowed: no
runtimeReadinessClaimed: no

No runtime implementation, runtime adapter connection, product verification execution, benchmark execution, model download, API call, endpoint configuration, dataset use, or audio generation is authorized.

## Active QG Rollout Boundary

activeQGRolloutAllowed: no

This decision does not expand active QG semantics and does not roll out additional active QG behavior.

## Pass / Fail Semantics Boundary

passFailSemanticsChangeStatus: no_change

## Target Quality Score Boundary

targetQualityScoreSemanticsChangeStatus: no_change

## Process Exit Code Boundary

processExitCodeChangeStatus: no_change

## Merge Ready Boundary

mergeReadySemanticsChangeStatus: no_change
mergeReadiness: no

## Product Verification Execution Boundary

productVerificationExecutionChangeStatus: no_change

## Remote Diagnostic Execution Boundary

remoteDiagnosticExecutionChangeStatus: no_change

## v1.1.6 Boundary

v116ImplementationStatus: not_started

This decision may mention v1.1.6 only as planning context. It does not implement v1.1.6.

## Decision Matrix

| decision | status | reason |
| --- | --- | --- |
| PR #144 mutation | no | superseded preserve-only evidence |
| PR #144 close | no | separate explicit scope required |
| PR #144 merge | no | PR #151 is the merged replacement path |
| PR #144 repair | no | not authorized |
| PR #144 rebase | no | not authorized |
| PR #127 repair | no | not authorized |
| runtime adoption | no | outside scope |
| active QG rollout | no | outside scope |
| v1.1.6 implementation | no | not started |

## Risk Register

| risk | status | safe next action |
| --- | --- | --- |
| PR #144 preserve-only decision misread as PR close permission | active | require separate explicit close scope |
| PR #151 merge misread as runtime readiness | active | preserve runtime boundary |
| PR #153 sentinel success misread as PR #127 repair approval | active | require separate explicit PR #127 scope |
| PR #144 repair attempted through rebase | active | do not rebase or mutate PR #144 |
| active QG rollout expanded without scope | active | preserve diagnostic-only boundary |
| v1.1.6 implementation started early | active | keep v1.1.6 planning-only |

## Do-Now / Do-Later / Do-Not

do_now:

- Record PR #144 as superseded_by_PR151_replacement_preserve_only.

do_later:

- Revisit PR #144 only with separate explicit close, archival, or historical evidence scope.
- Revisit PR #127 only with separate explicit repair scope.
- Revisit v1.1.6 only with separate explicit implementation scope.

do_not:

- Do not repair PR #144.
- Do not rebase PR #144.
- Do not merge PR #144.
- Do not close PR #144.
- Do not repair PR #127.
- Do not roll out active QG.
- Do not modify workflow, package, scripts, source, tests, or runtime.
- Do not claim readiness.

## Forbidden Claims

This decision does not make PR #144 merge-ready.
This decision does not authorize PR #144 repair.
This decision does not authorize PR #144 rebase.
This decision does not authorize PR #144 close.
This decision does not authorize PR #127 repair.
This decision does not authorize active QG rollout.
This decision does not authorize runtime adoption.
This decision does not authorize v1.1.6 implementation.
This decision does not change pass/fail semantics.
This decision does not change targetQualityScore semantics.
This decision does not change process exit code behavior.
This decision does not change mergeReady semantics.
This decision does not prove runtime readiness.
This decision does not prove merge readiness.

## Safe Next Action

Preserve PR #144 as superseded by PR #151 replacement evidence. Do not repair, rebase, merge, or close PR #144, do not repair PR #127, do not roll out active QG, and do not start v1.1.6 implementation without separate explicit scope.
