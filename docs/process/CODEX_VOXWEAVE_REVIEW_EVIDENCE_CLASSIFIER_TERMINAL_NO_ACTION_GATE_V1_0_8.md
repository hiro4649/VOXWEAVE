# VOXWEAVE Review Evidence Classifier / Terminal No-Action Gate v1.0.8

Status: standalone harness-only / non-runtime / review-evidence-classifier-only / terminal-no-action-gate-only / no active QG integration
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
Unpersisted specification must not authorize runtime, active QG integration, merge, rebase, rerun, review request, benchmark, model download, API call, workflow change, package change, or readiness claim.

## Scope

This candidate adds a standalone review evidence classifier and terminal no-action gate utility. It is a harness-only helper. It is not connected to active quality-gate. It does not modify existing PRs, request review, comment, rerun, rebase, merge, connect runtime, or claim readiness.

## Runtime Boundary

No runtime path is connected. The classifier does not import runtime, product source, orchestrator, adapter path, TTS engine, ASR engine, Live2D renderer, workflow, or package code.

## Merge Boundary

No classifier result grants merge readiness. `unblock_candidate` is not merge permission. `recheck_candidate` is not merge-ready. Same-head QG success is not merge readiness.

## Active QG Boundary

The utility is standalone and not imported by active quality-gate. This candidate does not modify `scripts/codex-local-quality-gate.mjs`, `scripts/codex-pr-profile-gate.mjs`, `scripts/codex-code-review-monitor.mjs`, or `scripts/codex-stale-pr-audit-gate.mjs`.

## Review Governance Boundary

Writer self-review does not satisfy independent review. Bot review does not satisfy independent review. Review request alone does not satisfy independent review. Team review request alone does not satisfy independent review. A same-head independent approval can become a merge-support candidate only, not merge permission.

## Quality Gate Boundary

No commit statuses reported is not green. Same-head QG success satisfies only the QG side. Same-head QG success does not satisfy independent review, does not grant merge readiness, does not grant main reflection, and does not grant runtime readiness. Stale success is stale. Same-head failure is a blocker.

## Terminal No-Action Boundary

The terminal no-action gate exists to stop repeated monitoring loops when there is no trigger. If triggerStatus is none, same-head QG is green, and independent review metadata is missing, the status is `terminal_no_action`. That status sets new PR, existing PR change, rerun, rebase, merge, runtime, manual user action, and merge readiness flags to false.

## Evidence Boundary

This candidate is local standalone utility evidence only. It is not active quality-gate evidence, not runtime evidence, not PR #53 merge evidence, not PR #3 unblock evidence, not PR #1 unblock evidence, and not PR #15 rereview evidence.

## Safe Summary Boundary

`buildReviewEvidenceSafeSummary` returns count-only safe summaries. It must not include raw reviewer names, raw comments, raw PR body, raw changed files, raw branch names, raw emails, tokens, secrets, or endpoints. `safe_summary_only` is fixed to true.

## Review Evidence Classifier

Supported statuses:

- none
- writer_only
- bot_only
- requested_only
- team_requested_only
- independent_comment_present
- independent_review_submitted
- independent_approval_same_head
- independent_approval_stale
- changes_requested
- dismissed
- ambiguous

Required decisions:

- writer-only comment is not independent review
- bot comment is not independent review
- review request alone is not independent review
- team review request alone is not independent review
- same-head approval can be merge-support candidate only
- stale approval is not same-head independent review
- changes_requested is not unblock
- dismissed review is not unblock
- ambiguous review is not unblock

## Quality Gate Evidence Classifier

Supported statuses:

- none
- pending
- success_same_head
- success_stale
- failure_same_head
- failure_stale
- cancelled
- timed_out
- ambiguous

Required decisions:

- no commit statuses reported is not green
- success_same_head satisfies only the QG side
- success_same_head does not satisfy independent review
- success_same_head does not directly satisfy merge readiness
- success on a different head is stale
- failure_same_head is a blocker
- pending is not terminal

## Governance Unblock State Classifier

Supported statuses:

- blocked
- recheck_candidate
- unblock_candidate
- not_ready
- ambiguous

Required decisions:

- PR #53 remote same-head QG green plus independent review missing is `recheck_candidate`
- PR #53 remote same-head QG green plus independent approval same-head is `unblock_candidate`
- PR #3 QG failure is `blocked`
- PR #1 blocked_by_PR_3 is `blocked`
- PR #15 blocked_by_PR_1_reevaluation is `blocked`
- writer self-review must not unblock anything
- bot review must not unblock anything

## Terminal No-Action Gate

Supported statuses:

- terminal_no_action
- trigger_found
- pending_terminal_status
- blocked_by_failure
- ambiguous

Trigger conditions:

- independent review metadata appears
- same-head independent approval appears
- PR #53 head SHA changes
- PR #53 QG changes from green
- PR #3 governance/QG state changes
- explicit governance scope appears

## PR #53 Example Classification

QG green: yes
independent review: missing
status: recheck_candidate
merge readiness: no
main reflection: no
active QG integration: no
runtime: no
dependent candidate merge: no

## PR #3 / PR #1 / PR #15 Example Classification

PR #3 QG failure remains blocked.
PR #1 blocked_by_PR_3 remains blocked.
PR #15 blocked_by_PR_1_reevaluation remains blocked.
None of these states is changed by PR #53 QG green.

## Terminal No-Action Example

triggerStatus: none
newPrNeeded: no
existingPrChangeNeeded: no
rerunNeeded: no
rebaseNeeded: no
mergeNeeded: no
runtimeNeeded: no
manualUserActionNeeded: no
safeNextAction: preserve_only_read_only_trigger_watch_complete

## Do-Now / Do-Later / Do-Not

Do-Now:

- standalone review evidence classifier and terminal no-action utility only

Do-Later:

- consider explicit active QG integration only in a separate scoped task
- consider PR #53 governance recheck only if independent review metadata or explicit governance scope appears

Do-Not:

- do not connect active quality-gate
- do not connect runtime
- do not request review
- do not comment
- do not rerun
- do not rebase
- do not merge
- do not claim readiness
- do not use this utility as human review replacement

## Risk Register

| risk | status | safe next action |
| --- | --- | --- |
| writer review misread as independent | mitigated by classifier | keep writer_only blocked |
| bot review misread as independent | mitigated by classifier | keep bot_only blocked |
| review request misread as review evidence | mitigated by classifier | keep requested_only blocked |
| QG success misread as merge readiness | mitigated by QG boundary | keep merge readiness false |
| terminal_no_action misread as permission to create PR | mitigated by action flags | keep newPrNeeded false |
| unblock_candidate misread as merge permission | open | require governance review |
| active QG integration attempted too early | open | separate scope required |
| runtime readiness misread | open | keep runtime boundary |

## Decision Matrix

| condition | classifier output | allowed action |
| --- | --- | --- |
| writer-only comment | writer_only | no unblock |
| bot-only comment | bot_only | no unblock |
| review request only | requested_only | no unblock |
| independent approval same-head plus QG green | unblock_candidate | recheck candidate only, no merge |
| QG green plus independent review missing | recheck_candidate | preserve |
| trigger none plus QG green plus independent review missing | terminal_no_action | no action |
| QG pending | pending_terminal_status | wait |
| QG failure | blocked_by_failure | preserve and report blocker |

## Non Goals

- do not modify existing PRs
- do not modify active quality-gate scripts
- do not connect active quality-gate
- do not connect runtime
- do not change src
- do not change test
- do not change workflow
- do not change package
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

- This candidate connects active quality-gate.
- This candidate changes active quality-gate behavior.
- This candidate satisfies independent review metadata.
- This candidate makes PR #53 merge-ready.
- This candidate unblocks PR #3.
- This candidate unblocks PR #1.
- This candidate makes PR #15 ready for rereview.
- This candidate authorizes main reflection.
- This candidate authorizes runtime adoption.
- This candidate authorizes benchmark execution.
- This candidate authorizes model download.
- This candidate authorizes API call.
- This candidate proves runtime readiness.
- This candidate proves production readiness.
- This candidate proves real TTS readiness.
- This candidate proves ASR runtime readiness.
- This candidate is merge evidence.

## Safe Next Action

Preserve this candidate as standalone non-runtime harness utility evidence. Do not connect it to active quality-gate, runtime, merge, review request, rerun, rebase, benchmark, model download, API call, workflow, package, or readiness flows without explicit future scope and a persisted docs/process specification.
