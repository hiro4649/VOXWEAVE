# VOXWEAVE Product Verification / Remote Diagnostic Manual Confirmation Contract Resolver v1.1.6

Status: docs-only / contract-resolver-only / planning-only
Current active harness: v1.1.6
Future harness assumption: v1.1.7 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Model download claimed: no
API call claimed: no
Dataset use claimed: no
Merge readiness: no

## Executive Summary

This document records the v1.1.6 contract boundary for the repeated PR #127 and
PR #156 failures around product verification, remote diagnostic evidence,
manual confirmation, formal evidence precedence, and targetQualityScore
blocking.

This is not a repair for PR #127 or PR #156. It does not change runtime code,
workflow behavior, package metadata, quality-gate scripts, product verification
execution, remote diagnostic execution, pass/fail semantics,
targetQualityScore semantics, process exit behavior, or mergeReady semantics.

The resolver decision is that PR #127 and PR #156 cannot be converted to pass by
docs-only wording, candidate self-check evidence, or PR body evidence when the
active quality gate requires product or remote diagnostic evidence that is still
manual_confirmation_required, missing, failed, or not authorized for execution.

## Source Evidence

| Source | Observed state | Evidence class | Limitation |
| --- | --- | --- | --- |
| origin/main | efdf76e5a65e933ac2e7dcad46fe73f579d98e5c | v1.1.6 main state after PR #158 | Does not repair PR #127 or PR #156 |
| AGENTS.md | CODEX_QUALITY_HARNESS_FILE v1.1.6 | active harness marker | Doctrine only |
| docs/process/CODEX_HARNESS_MANIFEST.json | harnessVersion v1.1.6 | manifest evidence | No runtime permission |
| scripts/codex-local-quality-gate.mjs | HARNESS_VERSION = 1.1.6 | local QG source evidence | Not modified by this task |
| .github/workflows/quality-gate.yml | CODEX_QUALITY_HARNESS_FILE v1.1.5 | workflow runtime marker | Classified as intentional_v115_workflow_runtime_with_v116_core |
| docs/process/CODEX_V116_SPEC.md | Decision Capsule / Evidence Precedence / Token Hard Budget | source policy evidence | Planning and interpretation only |

## Current Active Harness Confirmation

currentActiveHarness: v1.1.6
futureHarnessAssumption: v1.1.7 planning only
mainHeadSha: efdf76e5a65e933ac2e7dcad46fe73f579d98e5c
mainContainsPR158MergeCommit: yes
workflowMarkerBoundaryStatus: intentional_v115_workflow_runtime_with_v116_core

The v1.1.6 operator-visible status surface is confirmed:

- decisionCapsuleStatus
- sameHeadStatus
- safeArtifactStatus
- scopeBoundaryStatus
- tokenBudgetStatus
- validationTierStatus
- continuationStatus

## PR #151 Diagnostic-Only Replacement Evidence

| Field | State |
| --- | --- |
| PR state | merged |
| Merge commit | 6946e23f05f961da9a95e62ffaf044bd1af8e97d |
| QG conclusion | SUCCESS |
| Evidence class | diagnostic-only active QG replacement evidence |
| Contract effect | safe classification visibility improved |
| Boundary | did not authorize remote execution, PR #127 repair, or runtime readiness |

PR #151 improved safe remote diagnostic metadata handling and classification
visibility. It did not authorize remote product verification execution, remote
npm diagnostic execution, PR #127 repair, PR #156 repair, runtime adoption, or
merge readiness.

## PR #153 Post-Merge Sentinel Evidence

| Field | State |
| --- | --- |
| Head SHA | 8c72ea7755dd91fc7643811b9e190b6e5285fb05 |
| QG conclusion | SUCCESS |
| Evidence class | post-merge sentinel evidence |
| Boundary | confirms sentinel-only preservation |

PR #153 can be carried forward only as post-merge sentinel evidence for PR #151.
It is not product verification evidence for PR #127 or PR #156.

## PR #155 PR #127 Post-Diagnostic Re-evaluation Evidence

| Field | State |
| --- | --- |
| Head SHA | 250c5974a106a78b45b50fef8a156acbd87ebc9d |
| QG conclusion | SUCCESS |
| Evidence class | docs-only re-evaluation evidence |
| Boundary | did not repair PR #127 |

PR #155 documents the PR #127 post-diagnostic re-evaluation. It does not convert
PR #127 into a pass, does not authorize remote execution, and does not satisfy a
manual confirmation requirement for product or remote diagnostic evidence.

## PR #156 Failed Replacement Candidate Evidence

| Field | State |
| --- | --- |
| Head SHA | 37ebd2716c85b9f4c33c75f27e4adabf6d3cdb29 |
| QG conclusion | FAILURE |
| Changed surface | docs + scripts + src |
| Evidence class | failed replacement candidate evidence |
| Boundary | not merge evidence |

PR #156 included Product Verification Evidence, Remote Diagnostic Evidence, and
Evidence Precedence wording in the PR body, but the quality gate still failed.
This proves the boundary is not a simple evidence-completeness gap in PR body
wording. Docs or PR body evidence cannot override product verification failure,
manual_confirmation_required remote baseline state, missing formal evidence, or
targetQualityScore blocking.

## PR #157 Terminal Failure Boundary Evidence

| Field | State |
| --- | --- |
| Head SHA | 5894d3322cc72e2ba82b40d9ed46e9fc64c0a038 |
| QG conclusion | SUCCESS |
| Evidence class | terminal failure boundary audit |
| Boundary | records PR #156 failure, does not repair it |

PR #157 records the PR #156 terminal failure boundary. It does not authorize a
new repair, remote execution, manual rerun, merge, rebase, runtime adoption, or
PR close.

## PR #159 v1.1.6 Carry-forward Gate Evidence

| Field | State |
| --- | --- |
| Head SHA | 0f6a6f1ab3094ef86822ad3259463a86473b1d11 |
| QG conclusion | SUCCESS |
| Evidence class | v1.1.6 carry-forward gate evidence |
| Boundary | carry-forward requires explicit v1.1.6 reclassification |

PR #159 confirms that v1.1.5 evidence is not automatically v1.1.6 repair,
merge, or runtime evidence. The same rule applies here: v1.1.5 evidence may be
carried forward as bounded evidence, but it does not satisfy missing product
verification, remote diagnostic, manual confirmation, or targetQualityScore
requirements.

## Decision Capsule Boundary

Under v1.1.6, Decision Capsule is the first machine decision source. PR body is
human-rendered summary only and cannot satisfy machine evidence, remote checks,
run IDs, artifact IDs, product verification, or merge readiness.

decisionCapsuleBoundaryStatus: documented

## Evidence Precedence Kernel Boundary

Evidence precedence is:

1. current-head path detail artifact
2. current-head safe artifact index
3. decision capsule
4. remote evidence state
5. diagnostic consolidated safe summary
6. env JSON summary
7. PR body

Formal evidence precedence means candidate self-check evidence must not override
product verification failure. Product verification, remote baseline, target
summary, reason summary, and remote npm diagnostic evidence remain blocking when
they are missing or failed for a product-relevant change.

evidencePrecedenceKernelBoundaryStatus: documented

## Token Hard Budget Boundary

Token Hard Budget keeps operator-facing output compact. It does not weaken
product verification, remote diagnostic, manual confirmation, same-head,
safe-artifact, or merge readiness requirements.

tokenHardBudgetBoundaryStatus: documented

## Manual Confirmation Contract

manualConfirmationContractStatus: documented

manual_confirmation_required is not satisfied by candidate self-check evidence
alone.

manual_confirmation_required is not satisfied by PR body wording alone unless
the active QG contract explicitly permits that evidence class for the specific
gate.

manual_confirmation_required remains unresolved when the needed evidence is an
external confirmation, remote execution authorization, product verification
result, or independent current-head artifact that is not present in the machine
evidence chain.

manualConfirmationTriggerConditions:

- product-relevant change lacks required safe product verification evidence
- remote product baseline is required but missing, stale, failed, or manual
- remote npm diagnostic is required but missing, stale, failed, or manual
- formal evidence precedence cannot find authoritative current-head evidence
- targetQualityScore fails or remains blocked by load-bearing evidence gaps
- human confirmation is declared required but safe confirmation evidence is absent

## Product Verification Evidence Contract

productVerificationEvidenceContractStatus: documented

Product verification evidence must be safe-summary evidence. Product, package,
runtime, or performance claims require safe command evidence. Harness-only
changes may skip product checks only when no runtime readiness is claimed and no
product-relevant evidence requirement is active.

Product verification failure cannot be converted to pass by docs-only evidence
if remote product baseline remains manual_confirmation_required.

Required fields for acceptable future evidence should include:

- same-head SHA
- command or artifact reference, safe summary only
- product relevance classification
- product verification status
- remote product baseline status when required
- no raw logs, payloads, endpoint values, private paths, tokens, or secrets

## Remote Diagnostic Evidence Contract

remoteDiagnosticEvidenceContractStatus: documented

Remote diagnostic manual confirmation cannot be converted to pass by docs-only
evidence if remote diagnostic execution is not authorized.

Remote diagnostic evidence must remain safe metadata only unless a separate
explicit scope authorizes execution and artifact production. Diagnostic-only
metadata adapters do not run remote diagnostics, do not read raw artifacts, and
do not change pass/fail semantics.

Required fields for acceptable future evidence should include:

- same-head SHA
- remote diagnostic execution authorization status
- remote npm diagnostic status
- normalized safe summary status
- no raw logs, endpoint values, private paths, tokens, or secrets

## Formal Evidence Precedence Contract

formalEvidencePrecedenceContractStatus: documented

Formal same-head remote product evidence has precedence over pending placeholder
diagnostics and standby lifeboat artifacts. Placeholder-only evidence,
lifeboat-only evidence, missing product evidence, missing remote baseline,
missing remote npm diagnostic, npm failure, or same-head mismatch remains
blocking.

Self-check evidence is useful for candidate behavior, but it must not override
formal product verification failure.

## Target Quality Score Blocking Contract

targetQualityScoreBlockingContractStatus: documented

targetQualityScore failure remains a blocking condition. A passing self-check,
docs-only audit, PR body section, or diagnostic-only metadata artifact cannot
raise targetQualityScore to pass when formal product or remote diagnostic
requirements remain failed, missing, stale, or manual.

## Report Status / Process Exit Contract

report.status becomes fail when blocking failures exist, and process exit
behavior follows the quality-gate report contract. This document does not change
report.status, process exit code behavior, localGate status, targetMergeReady,
or mergeReady semantics.

## Docs / PR Body Evidence Limitation

docsOrPrBodyEvidenceLimitationsStatus: documented

Docs-only evidence and PR body wording are human summaries. They can record
scope, boundaries, and decisions, but they cannot satisfy machine evidence for:

- current-head remote product verification
- remote npm diagnostic execution
- formal artifact IDs or run IDs
- same-head remote evidence
- targetQualityScore pass
- merge readiness
- runtime readiness

## External Verification Scope Boundary

externalVerificationScopeBoundaryStatus: documented

External verification requires separate explicit authorization. This resolver
does not authorize external verification, product verification execution,
remote npm diagnostic execution, endpoint access, API calls, model downloads,
dataset use, benchmark execution, or runtime adoption.

## Remote Execution Authorization Boundary

remoteExecutionAuthorizationBoundaryStatus: documented

Remote execution remains not authorized in this task. Remote diagnostic
authorization must be scoped separately before any future repair can rely on
remote diagnostic execution evidence.

## No-Substitution Boundary

The following substitutions are forbidden:

- candidate self-check evidence for product verification evidence
- docs-only audit evidence for remote diagnostic execution
- PR body wording for Decision Capsule machine evidence
- diagnostic-only metadata for product verification execution
- v1.1.5 carry-forward evidence for v1.1.6 repair permission
- QG success on docs-only PRs for merge readiness of product PRs

## Bounded Repair Decision Matrix

| Candidate next action | Allowed now | Why | Safe next action |
| --- | --- | --- | --- |
| Repair PR #127 | no | Failed product candidate remains blocked | preserve |
| Repair PR #156 | no | Failed after repair; terminal boundary recorded | preserve |
| Re-run PR #156 manually | no | Manual rerun not authorized | preserve |
| Change QG semantics | no | Out of scope and forbidden | preserve |
| Add docs-only contract resolver | yes | Current task only | completed by this PR |
| Plan external verification authorization | future only | Needs explicit scope | separate owner task |
| Plan runtime/product verification readiness | future only | Needs explicit scope | separate owner task |

## Runtime Boundary

runtimeBoundaryStatus: no_runtime_change

No runtime route, server route, adapter route, endpoint config, TTS engine, ASR
engine, Live2D renderer, benchmark, model download, dataset use, or external API
is introduced or authorized.

## Workflow / Package / Script Boundary

workflowChangeStatus: no_change
packageChangeStatus: no_change
scriptChangeStatus: no_change

This resolver does not modify workflow files, package files, lockfiles,
scripts, manifests, AGENTS.md, or specs.

## Product Verification Execution Boundary

productVerificationExecutionChangeStatus: no_change

No product verification execution logic is changed. No product verification
command is run by this task.

## Remote Diagnostic Execution Boundary

remoteDiagnosticExecutionChangeStatus: no_change

No remote diagnostic execution logic is changed. No remote npm diagnostic is run
by this task.

## Pass / Fail Semantics Boundary

passFailSemanticsChangeStatus: no_change

This resolver documents existing blocking behavior only.

## Target Quality Score Semantics Boundary

targetQualityScoreSemanticsChangeStatus: no_change

This resolver does not change targetQualityScore scoring or blocking behavior.

## Process Exit Code Boundary

processExitCodeChangeStatus: no_change

This resolver does not change process exit code behavior.

## Merge Ready Semantics Boundary

mergeReadySemanticsChangeStatus: no_change

mergeReady remains false when failures or warnings are present, or when required
human confirmation is not satisfied.

## PR #127 Boundary

pr127RepairAllowedInThisTask: no

PR #127 remains an open draft failed candidate. This resolver does not modify,
repair, rebase, rerun, close, merge, or replace PR #127.

## PR #156 Boundary

pr156RepairAllowedInThisTask: no

PR #156 remains a failed replacement candidate after repair. This resolver does
not modify, repair, rebase, rerun, close, merge, or replace PR #156.

## PR #144 Boundary

PR #144 remains preserve-only and superseded by PR #151. This resolver does not
repair, rebase, merge, or close PR #144.

## v1.1.7 Boundary

v117ImplementationStatus: not_started

v1.1.7 remains planning only. This resolver does not implement v1.1.7.

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| manualConfirmationContractStatus | documented |
| productVerificationEvidenceContractStatus | documented |
| remoteDiagnosticEvidenceContractStatus | documented |
| formalEvidencePrecedenceContractStatus | documented |
| targetQualityScoreBlockingContractStatus | documented |
| decisionCapsuleBoundaryStatus | documented |
| evidencePrecedenceKernelBoundaryStatus | documented |
| tokenHardBudgetBoundaryStatus | documented |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

| Risk | Status | Safe handling |
| --- | --- | --- |
| PR body evidence misread as machine evidence | active | Preserve PR body limitation |
| Candidate self-check misread as product verification | active | Enforce formal evidence precedence |
| PR #156 failure misread as simple docs gap | active | Treat as contract boundary |
| Remote diagnostic metadata misread as remote execution | active | Preserve diagnostic-only boundary |
| QG success on docs-only PR misread as product pass | active | Preserve evidence class |
| targetQualityScore blocker bypassed | active | No scoring semantic change |
| Manual confirmation bypassed | active | Require explicit acceptable evidence |
| Runtime readiness claimed too early | active | No readiness claims |
| v1.1.7 implementation started early | active | Planning only |

## Do-Now / Do-Later / Do-Not

Do now:

- Preserve this docs-only contract resolver as bounded evidence.

Do later:

- Plan external verification authorization if explicitly scoped.
- Plan runtime/product verification readiness if explicitly scoped.
- Re-evaluate PR #127 or PR #156 only under a separate authorized repair scope.

Do not:

- repair PR #127
- repair PR #156
- manually rerun quality gates
- change scripts, workflow, package, src, or tests
- change pass/fail semantics
- change targetQualityScore semantics
- change process exit behavior
- change mergeReady semantics
- run product verification
- run remote npm diagnostic
- claim readiness
- merge or close PRs

## Forbidden Claims

The following claims are forbidden:

- This resolver repairs PR #127.
- This resolver repairs PR #156.
- This resolver authorizes PR #156 retry.
- This resolver changes product verification execution.
- This resolver changes remote diagnostic execution.
- This resolver changes pass/fail semantics.
- This resolver changes targetQualityScore semantics.
- This resolver changes process exit behavior.
- This resolver changes mergeReady semantics.
- This resolver authorizes runtime adoption.
- This resolver authorizes active QG semantic expansion.
- This resolver authorizes v1.1.7 implementation.
- This resolver proves runtime readiness.
- This resolver proves production readiness.
- This resolver proves merge readiness.

## Safe Next Action

The next possible scope is either external verification authorization planning
or runtime/product verification readiness planning, not code repair.

Do not proceed to PR #127 repair, PR #156 repair, remote execution, active QG
semantic expansion, v1.1.7 implementation, runtime adoption, or merge from this
document alone.
