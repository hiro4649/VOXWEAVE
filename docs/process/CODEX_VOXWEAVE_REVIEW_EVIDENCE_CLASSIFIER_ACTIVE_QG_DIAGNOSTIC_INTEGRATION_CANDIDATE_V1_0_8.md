# VOXWEAVE Review Evidence Classifier Active QG Diagnostic Integration Candidate v1.0.8

Status: active-QG-diagnostic-integration-candidate / diagnostic-only / non-runtime / stacked-on-PR-89
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
Unpersisted specification must not authorize active QG integration beyond diagnostic-only, runtime, merge, rebase, rerun, review request, benchmark, model download, API call, workflow change, package change, or readiness claim.

## Scope

This candidate attaches PR #89 classifier output to active quality-gate output as diagnostic-only safe summary. It does not change pass/fail semantics, targetQualityScore, workflow, package, runtime, review governance behavior, review requests, reruns, comments, merge automation, or readiness claims.

## Scope Decision

This candidate attaches PR #89 classifier output to active quality-gate output as diagnostic-only safe summary.
This candidate does not change pass/fail semantics.
This candidate does not change targetQualityScore.
This candidate does not change workflow/package.
This candidate does not connect runtime.
This candidate does not request reviews.
This candidate does not rerun checks.
This candidate does not create comments.
This candidate does not merge.
This candidate does not unblock PR #53 / PR #3 / PR #1 / PR #15.
This candidate is stacked on PR #89 and is not standalone main-ready.

## Source Evidence

| source | role | evidence class | limitation | safe next action |
| --- | --- | --- | --- | --- |
| PR #89 | Review Evidence Classifier / Terminal No-Action Gate utility | standalone non-runtime utility evidence | not active QG integration evidence | preserve until dependency path is resolved |
| PR #90 | same-head acceptance / active QG integration readiness | docs-only readiness planning evidence | not implementation evidence | preserve |
| PR #91 | active QG diagnostic integration plan | docs-only diagnostic integration planning evidence | not integration evidence | this candidate may implement diagnostic-only output |
| this candidate | active QG diagnostic attachment | candidate branch behavior evidence only | not merge evidence | same-head focused acceptance audit later |

## Implementation Boundary

Only `scripts/codex-local-quality-gate.mjs`, `scripts/codex-review-evidence-classifier-active-qg-diagnostic-self-check.mjs`, and this specification may change. The candidate imports the PR #89 classifier utility and adds two diagnostic-only fields to active quality-gate output:

- `reviewEvidenceClassifierDiagnosticStatus`
- `reviewEvidenceClassifierDiagnosticSummary`

The diagnostic block is attached after pass/fail status, merge readiness, target score, failures, warnings, and local gate status are already computed. It must not feed any downstream decision branch in this candidate.

## Runtime Boundary

runtime_changed: false

No runtime path is connected. No product code, `src/`, adapter, orchestrator, TTS engine, ASR engine, Live2D renderer, benchmark runner, endpoint, model download, dataset use, API call, or generated audio path is used.

## Merge Boundary

merge_readiness_changed: false

This candidate is not merge evidence. It does not grant merge readiness for itself, PR #89, PR #90, PR #91, PR #53, PR #3, PR #1, PR #15, or dependent candidates. It remains draft and stacked on PR #89.

## Active QG Boundary

activeQGIntegrationStatus: diagnostic_only

This is an active quality-gate diagnostic output candidate only. It imports the classifier utility and appends safe summary fields to the quality-gate report. It does not change active quality-gate pass/fail semantics, targetQualityScore, exit behavior, workflow, package, review governance decisions, or merge readiness.

## Diagnostic-only Boundary

diagnostic_only: true

The diagnostic fields are informational. They are not blockers, not unblockers, not merge evidence, not independent review evidence, not PR #3 governance evidence, not PR #53 merge evidence, not runtime evidence, and not readiness evidence.

## Review Governance Boundary

review_request_performed: false

Writer self-review remains not independent review.
Writer-only comments remain not independent review.
Bot comments remain not independent review.
Review request alone remains not independent review.
QG success alone remains not independent review and does not grant merge readiness.

## Quality Gate Boundary

The active QG may include diagnostic fields, but those fields must not alter:

- `report.status`
- `report.mergeReady`
- `report.localGate`
- `report.targetQualityScore`
- `report.score`
- `report.failures`
- `report.warnings`
- `process.exitCode` or `process.exit(...)`
- pass/fail decision
- targetQualityScore decision

## Pass/Fail Semantics Boundary

pass_fail_semantics_changed: false

The candidate must preserve the existing pass/fail decision. The diagnostic block is attached after the existing decision is computed and must not be referenced by failure, warning, or exit-code logic.

## Target Quality Score Boundary

target_quality_score_changed: false

The candidate must not change targetQualityScore, score, qualityScoreStatus, targetQualityScoreStatus, score weighting, score decomposition, reason ladder semantics, blocker semantics, or merge readiness.

## Workflow / Package Boundary

workflow_changed: false
package_changed: false

No workflow, package, lockfile, install, dependency, or CI trigger configuration changes are allowed in this candidate.

## Safe Summary Boundary

safe_summary_only: true

Diagnostic output must be count-only and safe-summary-only. It must not include raw reviewer names, raw comments, raw PR body, raw changed files, raw branch names, raw emails, tokens, secrets, endpoints, private paths, model identifiers, datasets, prompt audio, reference audio, watermark keys, or production data.

## Evidence Boundary

This candidate is candidate branch behavior evidence only. It is not PR #89 main evidence, not standalone main evidence, not merge evidence, not runtime evidence, not benchmark evidence, not production evidence, not active QG readiness evidence, and not a substitute for independent review metadata.

## Integration Boundary

This candidate integrates diagnostic fields only. It does not implement review request automation, rerun automation, comment automation, merge automation, runtime adoption, benchmark execution, model download, API call, endpoint configuration, workflow changes, or package changes.

## Stacked Dependency Boundary

This candidate is stacked on PR #89 because it imports PR #89 utility files. It is not standalone main-ready until PR #89 is main-reflected or otherwise dependency-resolved. PR #89, PR #90, and PR #91 remain preserve-only evidence.

## Future Review Boundary

Future review must prove same-head behavior, before/after JSON equality for pass/fail and targetQualityScore, safe-summary non-leakage, no workflow/package changes, no runtime connection, no review request, no rerun, no comment automation, and no merge automation.

## Diagnostic Field Contract

Only diagnostic fields may be added.
Diagnostic fields must be safe-summary-only.
Diagnostic fields must be count-only.
Diagnostic fields must not contain raw review data.
Diagnostic fields must not influence pass/fail.
Diagnostic fields must not influence targetQualityScore.
Diagnostic fields must not influence merge readiness.

Allowed fields:

- `reviewEvidenceClassifierDiagnosticStatus`
- `reviewEvidenceClassifierDiagnosticSummary`

Fixed False Flags:

- pass_fail_semantics_changed: false
- target_quality_score_changed: false
- workflow_changed: false
- package_changed: false
- runtime_changed: false
- merge_readiness_changed: false
- review_request_performed: false
- rerun_performed: false
- comment_created: false

## Safe Summary Contract

The diagnostic summary must use the PR #89 safe summary builder. It may include count-only status counts and boolean counts. It must not include raw values or raw paths. The self-check must include synthetic raw reviewer, comment, PR body, branch, changed file, email, token, secret, and endpoint values and prove none are emitted.

## Pass/Fail Non-Change Contract

Pass/fail behavior must be computed before the diagnostic block and must not read diagnostic fields. Any future candidate that references diagnostic fields in failures, warnings, localGate, mergeReady, or exit code is out of scope and must be blocked.

## Target Quality Score Non-Change Contract

targetQualityScore and all score-related output must remain independent of the classifier diagnostic fields. The diagnostic fields must not contribute to score, score decomposition, status ladder, or targetQualityScore reason codes.

## Review Governance Non-Weakening Contract

The classifier diagnostic may classify review evidence but cannot satisfy independent review. It cannot turn writer-only comments, bot comments, or review requests into independent review metadata. It cannot unblock PR #53, PR #3, PR #1, or PR #15.

## Self-check Contract

The self-check must verify:

- PR #89 utility import exists in `codex-local-quality-gate.mjs`
- diagnostic attachment adds only allowed diagnostic fields
- diagnostic field is not used in pass/fail decision
- diagnostic field is not used in targetQualityScore
- diagnostic field is not used in mergeReady
- diagnostic field is not used in localGate status
- diagnostic block does not touch failures
- diagnostic block does not touch warnings
- diagnostic block does not touch process exit behavior
- diagnostic block does not request review
- diagnostic block does not rerun checks
- diagnostic block does not create comments
- diagnostic block does not call GitHub mutation APIs
- diagnostic block does not import runtime, orchestrator, adapter, TTS engine, ASR engine, or Live2D renderer
- diagnostic output is safe-summary-only and count-only
- raw values are not leaked
- fixed false flags remain false

## Risk Register

| risk | status | mitigation |
| --- | --- | --- |
| diagnostic field misread as merge evidence | open | evidence boundary and PR body boundary |
| classifier output misread as independent review | open | governance non-weakening contract |
| QG success misread as merge readiness | open | merge boundary |
| writer-only comment misclassified | guarded | self-check synthetic case |
| bot comment misclassified | guarded | self-check synthetic case |
| review request misclassified | guarded | self-check synthetic case |
| terminal_no_action ignored | guarded | self-check terminal no-action case |
| pass/fail semantics accidentally changed | guarded | fixed false flag and source inspection |
| targetQualityScore accidentally changed | guarded | fixed false flag and source inspection |
| raw reviewer data leaked | guarded | safe summary non-leakage check |
| raw PR body leaked | guarded | safe summary non-leakage check |
| review request accidentally triggered | guarded | forbidden mutation scan |
| rerun accidentally triggered | guarded | forbidden mutation scan |
| comment accidentally created | guarded | forbidden mutation scan |
| runtime readiness misread | open | runtime boundary |
| merge readiness misread | open | merge boundary |

## Decision Matrix

| decision | status | reason | safe next action |
| --- | --- | --- | --- |
| create diagnostic-only candidate | allowed | PR #91 planned this boundary | run same-head acceptance later |
| change pass/fail semantics | no | prohibited | preserve existing logic |
| change targetQualityScore | no | prohibited | preserve score logic |
| request review | no | prohibited | keep manual work avoided |
| rerun checks | no | prohibited | no automation |
| create comments | no | prohibited | no mutation |
| connect runtime | no | prohibited | preserve runtime boundary |
| merge | no | prohibited | draft only |

## Do-Now / Do-Later / Do-Not

Do-Now:

- diagnostic-only active QG integration candidate only

Do-Later:

- same-head focused acceptance audit for this integration candidate
- before/after JSON comparison
- no pass/fail change proof
- no targetQualityScore change proof
- safe summary non-leakage proof
- PR #89 dependency resolution planning if needed

Do-Not:

- change pass/fail
- change targetQualityScore
- change workflow
- change package
- connect runtime
- request review
- rerun checks
- comment on PRs
- merge
- claim readiness

## Non Goals

Do not change pass/fail semantics.
Do not change targetQualityScore.
Do not change workflow.
Do not change package.
Do not connect runtime.
Do not request review.
Do not rerun checks.
Do not create comments.
Do not merge.
Do not claim runtime readiness.
Do not claim production readiness.
Do not claim real TTS readiness.
Do not claim ASR runtime readiness.
Do not claim benchmark execution.
Do not claim merge readiness.

## Forbidden Claims

This candidate makes PR #89 standalone main-ready.
This candidate makes PR #53 merge-ready.
This candidate unblocks PR #3.
This candidate unblocks PR #1.
This candidate unblocks PR #15.
This candidate proves independent review metadata.
This candidate changes active QG pass/fail behavior.
This candidate changes targetQualityScore.
This candidate authorizes runtime adoption.
This candidate authorizes benchmark execution.
This candidate authorizes model download.
This candidate authorizes API calls.
This candidate authorizes merge.
This candidate proves production readiness.
This candidate proves real TTS readiness.
This candidate proves ASR runtime readiness.
This candidate is merge evidence.
This candidate is runtime evidence.

## Safe Next Action

Preserve this candidate as draft stacked-on-PR-89 diagnostic-only evidence. The next safe action is same-head focused acceptance audit with before/after JSON comparison and no pass/fail or targetQualityScore change proof.
