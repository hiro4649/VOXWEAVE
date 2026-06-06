# VOXWEAVE Review Evidence Classifier Active QG Diagnostic Integration Plan v1.0.8

Status: docs-only / diagnostic-integration-planning-only / active-qg-boundary-only / governance-boundary-only
Active harness: v1.0.8
specPersistenceConstitutionStatus: required_and_applied
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no
Development mode: 5.5-low
User manual work avoided: yes

## Specification Constitution

All VOXWEAVE specifications must be persisted in docs/process.
Conversation-only specification is invalid.
PR-body-only specification is invalid.
Self-check-only specification is invalid.
Code-comment-only specification is invalid.
GitHub-comment-only specification is invalid.
Unpersisted specification must not drive implementation.
Unpersisted specification must not authorize active QG integration, runtime, merge, rebase, rerun, review request, benchmark, model download, API call, workflow change, package change, or readiness claim.

## Scope

This document defines a future diagnostic-only integration plan for the PR #89 Review Evidence Classifier / Terminal No-Action Gate. It does not connect active quality-gate, does not modify active quality-gate scripts, does not modify PR #89, does not modify PR #90, does not change pass/fail semantics, does not change targetQualityScore, does not change workflow or package files, and does not authorize runtime or merge.

## Source Evidence

| source | status | boundary |
| --- | --- | --- |
| PR #89 standalone classifier utility | exists / QG SUCCESS / preserve-only | standalone utility only |
| PR #89 self-check | passed, 160 checked cases | not active QG evidence |
| PR #90 same-head acceptance | passed / QG SUCCESS / preserve-only | readiness planning only |
| PR #90 active QG integration readiness plan | exists | does not connect active QG |
| this plan | docs-only | does not modify PR #89 or active QG scripts |

## Runtime Boundary

No runtime path is connected. No runtime adapter, orchestrator, product source, TTS engine, ASR engine, Live2D renderer, endpoint, benchmark, model download, API, workflow, or package path is modified.

## Merge Boundary

This plan does not grant merge readiness. It does not merge PR #89, PR #90, PR #53, PR #3, PR #1, PR #15, or any existing PR. Diagnostic fields must not be treated as merge evidence.

## Active QG Boundary

Active quality-gate is not connected in this task. `scripts/codex-local-quality-gate.mjs`, `scripts/codex-pr-profile-gate.mjs`, `scripts/codex-code-review-monitor.mjs`, and `scripts/codex-stale-pr-audit-gate.mjs` are not modified. Future integration, if explicitly scoped later, must be diagnostic-only first.

## Diagnostic-only Boundary

Future integration may expose count-only diagnostic fields derived from Review Evidence Classifier. Future integration must not affect pass/fail semantics, targetQualityScore, merge readiness, runtime readiness, review requests, reruns, comments, or raw evidence output.

## Review Governance Boundary

Review governance must not be weakened. Writer self-review remains invalid. Bot review remains invalid. Review request remains insufficient. Team review request remains insufficient. QG success remains QG-only evidence. `terminal_no_action` must not create PRs or request manual work.

## Quality Gate Boundary

The diagnostic output may assist classification but must not decide pass/fail status unless a future explicit scope separately authorizes and proves that behavior. This plan authorizes no such behavior.

## Pass/Fail Semantics Boundary

pass_fail_semantics_changed: false

Future diagnostic-only integration must preserve active quality-gate pass/fail behavior exactly. Before/after JSON output comparison is required before any integration candidate can be considered.

## Target Quality Score Boundary

target_quality_score_changed: false

Future diagnostic-only integration must not change targetQualityScore, score weighting, reason ladder semantics, blocker semantics, or merge readiness.

## Workflow / Package Boundary

workflow_changed: false
package_changed: false

No workflow or package changes are allowed in this plan. Future diagnostic-only integration must avoid workflow/package changes unless a later explicit scope says otherwise.

## Safe Summary Boundary

Allowed output is count-only safe summary only. No raw reviewer names, raw comments, raw PR body, raw changed files, raw branch names, raw emails, tokens, secrets, or endpoints may be emitted. `safe_summary_only` must remain true.

## Evidence Boundary

This plan is docs-only planning evidence. It is not active quality-gate integration evidence, runtime evidence, merge evidence, PR #53 unblock evidence, PR #3 unblock evidence, PR #1 unblock evidence, or PR #15 rereview evidence.

## Integration Boundary

Future integration, if ever scoped, must be diagnostic-only first. It must not auto-request reviews, auto-rerun checks, comment on PRs, auto-merge, claim merge readiness, claim runtime readiness, or output raw review evidence.

## Future Review Boundary

Future active QG diagnostic integration requires a separate implementation candidate, same-head review, before/after output comparison, non-leakage proof, and governance review. This plan alone does not authorize implementation.

## Diagnostic Integration Goal

Future integration, if explicitly scoped later, may expose count-only diagnostic fields derived from Review Evidence Classifier:

- reviewEvidenceDiagnosticStatus
- qualityGateEvidenceDiagnosticStatus
- governanceUnblockDiagnosticStatus
- terminalNoActionDiagnosticStatus
- reviewEvidenceSafeSummary
- terminalNoActionSafeSummary

## Required Fixed False Flags

| flag | required value |
| --- | --- |
| pass_fail_semantics_changed | false |
| target_quality_score_changed | false |
| workflow_changed | false |
| package_changed | false |
| runtime_changed | false |
| merge_readiness_changed | false |
| review_request_performed | false |
| rerun_performed | false |
| comment_created | false |

Required fixed false flag persistence:
- runtime_changed: false
- merge_readiness_changed: false
- review_request_performed: false
- rerun_performed: false
- comment_created: false

## Safe Summary Rules

- count-only output only
- no raw reviewer names
- no raw comments
- no raw PR body
- no raw changed files
- no raw branch names
- no raw emails
- no tokens
- no secrets
- no endpoints
- safe_summary_only: true

## Forbidden Integration Effects

- no pass/fail change
- no targetQualityScore change
- no workflow change
- no package change
- no runtime connection
- no review request
- no rerun
- no comment
- no auto-merge
- no merge-ready claim
- no readiness claim
- no raw evidence output

## Future Integration Prerequisites

- explicit diagnostic-only integration scope
- PR #89 head still current or rechecked
- PR #89 self-check still passing
- PR #89 policy JSON still valid
- PR #90 readiness plan still current
- static import boundary review
- before/after active QG JSON output comparison
- no pass/fail behavior change proof
- no targetQualityScore change proof
- safe summary non-leakage proof
- terminal_no_action no-new-PR behavior proof
- review governance non-weakening proof
- same-head QG for future integration PR
- independent review metadata if required by governance policy

## Integration Candidate Files for Future Only

Future implementation candidates may consider:

- scripts/codex-local-quality-gate.mjs
- possibly dedicated diagnostic adapter module
- self-check file for active QG diagnostic attachment

This PR changes none of those files. They are listed as future candidates only.

## Decision Matrix

| candidate next action | allowed now | why | required evidence or scope | risk | safe next action |
| --- | --- | --- | --- | --- | --- |
| active QG diagnostic-only integration implementation | no | this is planning-only | explicit future diagnostic-only scope | early integration | preserve |
| active QG pass/fail integration | no | semantics must not change | separate explicit scope and proof | gate weakening | prohibit |
| targetQualityScore integration | no | score must not change | separate explicit scope | score drift | prohibit |
| runtime integration | no | runtime boundary | runtime scope | readiness misread | prohibit |
| review request automation | no | governance boundary | explicit future scope | unwanted requests | prohibit |
| rerun automation | no | no rerun boundary | explicit future scope | unwanted reruns | prohibit |
| comment automation | no | no comment boundary | explicit future scope | noisy/unsafe comments | prohibit |
| merge automation | no | merge boundary | explicit future scope | unsafe merge | prohibit |
| PR #53 unblock | no | independent review still external | governance evidence | false unblock | preserve |
| PR #3 unblock | no | not related to PR #3 blocker | governance evidence | false unblock | preserve |

## Risk Register

| risk | status | safe next action |
| --- | --- | --- |
| diagnostic field misread as merge evidence | open | label diagnostic-only |
| classifier output misread as independent review | open | keep evidence class explicit |
| QG success misread as merge readiness | open | keep QG-only boundary |
| terminal_no_action ignored | open | future integration self-check |
| active QG integration attempted too early | open | require explicit scope |
| pass/fail semantics accidentally changed | open | before/after JSON comparison |
| targetQualityScore accidentally changed | open | targetQualityScore proof |
| review request accidentally triggered | open | fixed false flag |
| rerun accidentally triggered | open | fixed false flag |
| comment accidentally created | open | fixed false flag |
| raw reviewer data leaked | open | safe summary non-leakage proof |
| raw PR body leaked | open | safe summary non-leakage proof |
| raw branch name leaked | open | safe summary non-leakage proof |
| runtime readiness misread | open | runtime boundary |
| merge readiness misread | open | merge boundary |

## Do-Now / Do-Later / Do-Not

Do-Now:

- docs-only active QG diagnostic integration readiness plan only

Do-Later:

- explicit diagnostic-only active QG integration implementation candidate
- same-head self-check for future integration
- before/after JSON output comparison
- safe summary non-leakage self-check
- no pass/fail change self-check
- no targetQualityScore change self-check

Do-Not:

- connect active QG now
- modify active QG now
- merge PR #89 now
- modify PR #89 now
- request review
- rerun checks
- comment on PRs
- open runtime lane
- claim readiness

## Non Goals

- do not connect active quality-gate
- do not modify active quality-gate
- do not change pass/fail semantics
- do not change targetQualityScore
- do not change workflow
- do not change package
- do not connect runtime
- do not modify PR #89
- do not modify PR #90
- do not modify existing PRs
- do not request review
- do not rerun
- do not rebase
- do not merge
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness
- do not claim benchmark execution
- do not claim merge readiness

## Forbidden Claims

- This plan connects active quality-gate.
- This plan modifies active quality-gate.
- This plan changes pass/fail semantics.
- This plan changes targetQualityScore.
- This plan changes workflow.
- This plan changes package files.
- This plan connects runtime.
- This plan requests review.
- This plan reruns checks.
- This plan comments on PRs.
- This plan merges PRs.
- This plan unblocks PR #53.
- This plan unblocks PR #3.
- This plan unblocks PR #1.
- This plan makes PR #15 ready for rereview.
- This plan proves runtime readiness.
- This plan proves production readiness.
- This plan proves real TTS readiness.
- This plan proves ASR runtime readiness.
- This plan proves benchmark execution.
- This plan proves merge readiness.

## Safe Next Action

Preserve PR #89 and PR #90 as preserve-only. Preserve this plan as docs-only diagnostic integration planning evidence. Do not connect active quality-gate, modify active quality-gate scripts, modify PR #89, request review, rerun, rebase, merge, connect runtime, or claim readiness without explicit future scope and a persisted docs/process specification.
