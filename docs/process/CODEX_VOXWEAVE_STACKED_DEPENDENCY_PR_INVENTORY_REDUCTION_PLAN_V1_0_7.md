# VOXWEAVE Stacked Dependency and PR Inventory Reduction Plan v1.0.7

Status: docs-only / inventory-reduction-planning-only / stacked-dependency-planning-only / governance-qg-separation-only
Main reflected: no
Active harness: v1.0.7
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no
Development mode: 5.5-low
User manual work avoided: yes

## Scope

This plan reduces ambiguity in the PR inventory.
This plan does not close PRs.
This plan does not merge PRs.
This plan does not rebase PRs.
This plan does not rerun checks.
This plan does not modify existing PRs.
This plan does not migrate validators.
This plan does not connect active quality-gate.
This plan does not connect runtime.
This plan does not create new migration candidates.
This plan does not claim merge readiness.
This plan does not claim runtime readiness.

## Runtime Boundary

Runtime lane: blocked.
Runtime adoption: no.
Runtime readiness: no.
TTS engine call: no.
ASR engine call: no.
Model download: no.
API call: no.
Endpoint config: no.
Benchmark execution: no.

## Merge Boundary

Merge lane: blocked.
Merge readiness: no.
No PR is made merge-ready by this plan.
No PR is merged, rebased, rerun, or edited by this plan.

## Evidence Boundary

This plan is not migration evidence.
This plan is not validator behavior evidence.
This plan is not active quality-gate behavior evidence.
This plan is not runtime evidence.
This plan is not benchmark evidence.
This plan is not model quality evidence.
This plan is not production evidence.
This plan is not merge evidence.
This plan is docs-only inventory reduction and dependency planning evidence only.

## Governance Boundary

PR #3 independent reviewer metadata remains missing.
PR #3 quality-gate green evidence remains missing.
PR #1 remains blocked by PR #3.
PR #15 remains blocked by PR #1 reevaluation.
Writer self-review is not independent review.
No-status-reported is not green.

## Quality Gate Boundary

Active quality-gate behavior is not changed.
Pass/fail semantics are not changed.
targetQualityScore is not changed.
No active quality-gate connection is made.
No commit status absence is treated as success.

## Stacked PR Boundary

PR #53 is the dependency root for common utility migration candidates.
PR #61 / #65 / #68 / #71 / #74 are stacked on PR #53 unless PR #53 is main-reflected.
They are not standalone main-ready.
They must not be merged before PR #53 dependency is resolved.
They are candidate branch behavior evidence only.
They are not target branch evidence.
They are not main evidence.
They are not runtime evidence.
They are not merge evidence.

## Inventory Reduction Boundary

PR inventory pressure is high.
This plan recommends stopping new migration PR creation until governance/QG or dependency resolution scope is explicit.
This plan does not close or consolidate existing PRs.

## Current Fixed State

| area | current state | evidence | blocked by | safe next action |
| --- | --- | --- | --- | --- |
| v1.0.7 active harness | active | AGENTS.md, manifest, local gate metadata on main | none | preserve |
| PR #3 governance blocker | open, no independent reviews, writer comments only | PR metadata, reviews empty, comments | independent reviewer and QG evidence missing | same-head governance/QG review if scoped |
| PR #1 runtime adapter dependency | open draft, blocked by PR #3 | PR body and metadata | PR #3 unresolved | preserve |
| PR #15 normalization overlap | open draft helper-only lane | PR body and metadata | PR #1 reevaluation | preserve |
| PR #53 common utility dependency | open draft utility candidate | PR metadata | dependency and governance/QG unresolved | dependency resolution plan only |
| PR #55-#58 synthetic probes | preserve-only synthetic evidence | registry evidence | not target branch evidence | preserve |
| PR #61 / #65 / #68 / #71 / #74 candidate branch implementations | open draft candidates stacked on PR #53 | PR metadata | PR #53 dependency unresolved | preserve |
| PR #62 / #66 / #69 / #72 / #75 acceptance audits | completed docs-only audits | PR bodies | docs-only limitation | preserve |
| PR #76 completion audit | completed docs-only chain summary | PR body | docs-only limitation | preserve |
| PR #77 evidence registry review | completed docs-only registry review | PR body | docs-only limitation | preserve |
| runtime lane | blocked | harness boundary | governance and runtime scope | keep closed |
| merge lane | blocked | registry review and PR bodies | governance/QG and dependency blockers | keep merge readiness no |

## Stacked Dependency Graph

| PR | role | base branch | depends on | stack depth | target area | target branch modified yes/no | main reflected yes/no | standalone main-ready yes/no | merge order requirement | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR #53 | common utility root | main | none | 0 | common utility | no | no | no | dependency root must resolve first | preserve / dependency plan |
| PR #55 | synthetic probe | main/probe | PR #53 concept | 0 | Voice Lab | no | no | no | none | preserve |
| PR #56 | synthetic probe | main/probe | PR #53 concept | 0 | ASR | no | no | no | none | preserve |
| PR #57 | synthetic probe | main/probe | PR #53 concept | 0 | TTS Evaluation | no | no | no | none | preserve |
| PR #58 | synthetic probe | main/probe | PR #53 concept | 0 | Sync Policy | no | no | no | none | preserve |
| PR #61 | implementation candidate | PR #53 branch | PR #53 | 1 | Voice Lab | no | no | no | after PR #53 dependency resolution | preserve |
| PR #65 | implementation candidate | PR #53 branch | PR #53 | 1 | ASR | no | no | no | after PR #53 dependency resolution | preserve |
| PR #68 | implementation candidate | PR #53 branch | PR #53 | 1 | TTS Capability | no | no | no | after PR #53 dependency resolution | preserve |
| PR #71 | implementation candidate | PR #53 branch | PR #53 | 1 | TTS Benchmark Manifest | no | no | no | after PR #53 dependency resolution | preserve |
| PR #74 | implementation candidate | PR #53 branch | PR #53 | 1 | TTS Benchmark Result | no | no | no | after PR #53 dependency resolution | preserve |

## Evidence Class Registry

| PR | evidence class | what it proves | what it does not prove | merge evidence yes/no | runtime evidence yes/no | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| PR #53 | standalone non-runtime utility candidate | utility candidate behavior | main readiness, runtime, active QG, merge | no | no | preserve |
| PR #55 | synthetic fixture probe | fixture compatibility only | validator behavior, target branch migration | no | no | preserve |
| PR #56 | synthetic fixture probe | fixture compatibility only | ASR runtime or validator behavior | no | no | preserve |
| PR #57 | synthetic fixture probe | fixture compatibility only | TTS runtime or validator behavior | no | no | preserve |
| PR #58 | synthetic fixture probe | fixture compatibility only | sync policy migration | no | no | preserve |
| PR #59 | docs-only summary audit | probe summary only | migration, runtime, merge | no | no | preserve |
| PR #60 | docs-only plan | Voice Lab planning only | implementation or branch migration | no | no | preserve |
| PR #61 | candidate branch implementation | candidate branch behavior only | PR #17 branch migration, main readiness | no | no | preserve |
| PR #62 | docs-only acceptance audit | acceptance record only | merge readiness | no | no | preserve |
| PR #63 | docs-only plan | ASR planning only | implementation or branch migration | no | no | preserve |
| PR #65 | candidate branch implementation | candidate branch behavior only | PR #52 branch migration, ASR runtime | no | no | preserve |
| PR #66 | docs-only acceptance audit | acceptance record only | merge readiness | no | no | preserve |
| PR #67 | docs-only plan | TTS capability planning only | PR #19 migration | no | no | preserve |
| PR #68 | candidate branch implementation | candidate branch behavior only | PR #19 branch migration | no | no | preserve |
| PR #69 | docs-only acceptance audit | acceptance record only | merge readiness | no | no | preserve |
| PR #70 | docs-only plan | benchmark manifest planning only | PR #20 migration or benchmark execution | no | no | preserve |
| PR #71 | candidate branch implementation | candidate branch behavior only | PR #20 branch migration | no | no | preserve |
| PR #72 | docs-only acceptance audit | acceptance record only | merge readiness | no | no | preserve |
| PR #73 | docs-only plan | benchmark result planning only | PR #21 migration or benchmark result evidence | no | no | preserve |
| PR #74 | candidate branch implementation | candidate branch behavior only | PR #21 branch migration | no | no | preserve |
| PR #75 | docs-only acceptance audit | acceptance record only | merge readiness | no | no | preserve |
| PR #76 | docs-only completion audit | chain summary only | merge readiness or runtime readiness | no | no | preserve |
| PR #77 | docs-only registry review | evidence class and governance separation | dependency resolution, merge readiness | no | no | preserve |

Docs-only plan proves planning only. Synthetic probe proves fixture compatibility only. Candidate branch implementation proves candidate branch behavior only. Acceptance audit proves docs-only acceptance only. Completion audit proves chain summary only. None proves target branch migration, main readiness, runtime readiness, or merge readiness.

## PR Inventory Reduction Recommendation

| PR group | inventory pressure | recommended classification | do not create more of this type yes/no | condition to reopen | safe next action |
| --- | --- | --- | --- | --- | --- |
| PR #55-#58 synthetic probes | high | sufficient synthetic fixture inventory | yes | new target and explicit evidence gap | preserve |
| PR #60 / #63 / #67 / #70 / #73 migration plans | high | sufficient planning inventory | yes | explicit new target and missing plan | preserve |
| PR #61 / #65 / #68 / #71 / #74 implementation candidates | high | sufficient candidate inventory | yes | dependency resolution scope exists | preserve |
| PR #62 / #66 / #69 / #72 / #75 acceptance audits | high | sufficient acceptance audit inventory | yes unless new implementation candidate exists | new candidate requiring audit | preserve |
| PR #76 completion audit | high | sufficient chain summary | yes | major state change | preserve |
| PR #77 evidence registry review | high | sufficient evidence registry | yes unless inventory drifts | state change or registry drift | preserve |

Safe next action: governance/QG or dependency resolution only.

## Governance/QG Separation

| blocker | current status | blocks merge | blocks runtime | blocks docs-only planning | can Codex satisfy now | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| PR #3 independent reviewer metadata missing | unresolved | yes | yes | no | no | same-head review when reviewer metadata exists |
| PR #3 quality-gate green evidence missing | unresolved | yes | yes | no | no | same-head QG review if scoped |
| PR #1 blocked by PR #3 | unresolved | yes | yes | no | no | preserve |
| PR #15 blocked by PR #1 reevaluation | unresolved | yes | yes | no | no | preserve |
| no commit statuses reported | unresolved across checked heads | yes | yes | no | no | do not treat as green |
| stacked dependency unresolved | unresolved | yes | yes | no | no | dependency resolution planning |
| main reflection incomplete | unresolved | yes | yes | no | no | no main reflection now |
| target branch migration incomplete | unresolved | yes | yes | no | no | no migration now |
| runtime lane blocked | blocked | yes | yes | no | no | keep runtime closed |
| merge lane blocked | blocked | yes | yes | no | no | keep merge readiness no |

These blockers block merge and runtime. They do not invalidate docs-only planning evidence. They do not turn candidate branch evidence into merge evidence. They must not be bypassed or weakened. No-status-reported is not green. Writer self-review is not independent review.

## Stop Conditions

Stop creating migration PRs until one of these happens:
PR #3 independent reviewer metadata appears.
PR #3 same-head quality-gate green evidence appears.
PR #53 dependency resolution scope is explicitly granted.
PR #53 main reflection / merge path is explicitly scoped and reviewed.
Target branch migration scope is explicitly granted.
Stacked dependency resolution scope is explicitly granted.
Active quality-gate integration scope is explicitly granted with no pass/fail behavior change.
Runtime lane opening scope is explicitly granted after prerequisites.

## Next Allowed Action Matrix

| candidate next action | allowed now | why | required evidence or scope | risk | safe next action |
| --- | --- | --- | --- | --- | --- |
| create more migration probes | no | probe inventory sufficient | explicit new gap | PR sprawl | stop |
| create more migration plans | no | planning inventory sufficient | explicit new target and gap | PR sprawl | stop |
| create more acceptance audits | no | current candidates already audited | new candidate exists | false confidence | stop |
| create more implementation candidates | no | dependency blocker unresolved | dependency resolution scope | stacked inventory growth | stop |
| merge PR #53 | no | governance/QG and dependency readiness unresolved | same-head QG and review evidence | premature merge | no merge |
| merge PR #61 / #65 / #68 / #71 / #74 | no | stacked on PR #53 | PR #53 resolved plus governance/QG | out-of-order merge | no merge |
| active quality-gate integration | no | not scoped and QG blockers unresolved | explicit no-behavior-change scope | QG drift | do not connect |
| runtime adoption | no | runtime lane blocked | runtime scope after prerequisites | runtime drift | keep closed |
| benchmark execution | no | benchmark execution prohibited | explicit benchmark scope | false benchmark evidence | do not execute |
| PR #3 governance/QG same-head review | yes, docs-only/read-only | blocker source needs current review | read-only scope | overclaim | review only |
| PR inventory registry update | yes, docs-only | inventory may drift | docs-only scope | stale registry | update only if state changes |
| stacked dependency resolution planning | yes, docs-only | dependency order unresolved | docs-only scope | merge confusion | plan only |
| PR #53 dependency resolution planning | yes, docs-only | utility root unresolved | docs-only scope | premature integration | plan only |
| target branch migration planning | no | inventory pressure high and dependencies unresolved | explicit target scope | migration sprawl | defer |

Only PR #3 governance/QG same-head review, inventory registry update, stacked dependency resolution planning, or PR #53 dependency resolution planning may be considered. Everything else remains no.

## Readiness Decision

commonUtilityMigrationChainReadyForMerge: no
commonUtilityMigrationChainReadyForRuntime: no
commonUtilityMigrationChainReadyForActiveQG: no
PR #53 merge readiness: no
PR #61 merge readiness: no
PR #65 merge readiness: no
PR #68 merge readiness: no
PR #71 merge readiness: no
PR #74 merge readiness: no
PR #17 migrated: no
PR #19 migrated: no
PR #20 migrated: no
PR #21 migrated: no
PR #52 migrated: no
runtime readiness: no
production readiness: no
real TTS readiness: no
ASR runtime readiness: no
benchmark execution evidence: no
merge readiness: no

## Risk Register

| risk | severity | status | safe next action |
| --- | --- | --- | --- |
| PR inventory pressure causes confusion | high | open | stop creating migration PRs |
| candidate branch evidence misread as target branch evidence | high | open | preserve evidence boundary |
| docs-only audit evidence misread as merge evidence | high | open | keep merge readiness no |
| synthetic fixture evidence misread as validator behavior evidence | high | open | keep synthetic-only classification |
| PR #53 dependency misread | high | open | dependency resolution plan |
| stacked PR merged out of order | high | blocked | no merge |
| no commit statuses reported misread as green | high | open | do not treat as green |
| PR #3 governance blocker bypassed | high | blocked | independent review metadata required |
| writer self-review misread as independent review | high | blocked | do not accept self-review |
| active quality-gate integration attempted too early | high | blocked | do not connect |
| runtime lane opened too early | high | blocked | keep closed |
| benchmark execution attempted too early | high | blocked | do not run benchmark |
| model download attempted too early | high | blocked | do not download model |
| API call attempted too early | high | blocked | do not call API |
| migration chain creates false confidence | medium | open | keep docs-only limitation |
| safe summary contract drift | high | mitigated | require same-head comparison |
| unsafe detector overblocking | medium | open | compare before/after behavior |
| unsafe detector underblocking | high | open | require non-leakage checks |
| merge readiness misread | high | blocked | merge readiness no |
| runtime readiness misread | high | blocked | runtime readiness no |
| production readiness misread | high | blocked | production readiness no |
| real TTS readiness misread | high | blocked | real TTS readiness no |
| ASR runtime readiness misread | high | blocked | ASR runtime readiness no |

## Do-Now / Do-Later / Do-Not

do_now: docs-only stacked dependency and inventory reduction plan only.
do_later: PR #3 governance/QG same-head review; PR #53 dependency resolution plan; stacked dependency resolution plan; target branch migration only after explicit scope; active QG integration only after review/QG and no behavior-change scope.
do_not: create more migration PRs now; merge PRs now; open runtime lane; connect active quality-gate; run benchmarks; download models; call APIs; edit existing PR branches; claim readiness; ask user for manual work.

## Non Goals

do not close PRs
do not merge PRs
do not rebase PRs
do not rerun checks
do not modify existing PRs
do not migrate utilities
do not edit validators
do not edit target branches
do not connect active quality-gate
do not open runtime lane
do not call engines
do not download models
do not call APIs
do not run benchmarks
do not change workflow
do not change package
do not claim readiness

## Forbidden Claims

This plan makes PR inventory resolved
This plan makes PR #53 merge-ready
This plan makes candidate branches target-branch evidence
This plan makes common utility migration main-ready
This plan authorizes active quality-gate integration
This plan authorizes runtime adoption
This plan authorizes benchmark execution
This plan resolves PR #3
This plan resolves PR #1
This plan proves production readiness
This plan proves real TTS readiness
This plan proves ASR runtime readiness
This plan is merge evidence
This plan is runtime evidence

## Safe Next Action

Preserve existing PRs and stop creating migration PRs. The safe next action is a read-only PR #3 governance/QG same-head review, PR #53 dependency resolution planning, or stacked dependency resolution planning only when explicitly scoped.
