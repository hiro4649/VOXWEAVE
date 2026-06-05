# VOXWEAVE Common Utility Migration Evidence Registry and Governance/QG Separation Review v1.0.7

Status: docs-only / registry-review-only / governance-qg-separation-only / planning-only
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

This review creates a single evidence registry for PR #55 through PR #76 and separates governance/QG blockers from migration evidence classes.
This review does not perform migration.
This review does not modify existing PRs.
This review does not modify PR #53 utility files.
This review does not modify validators, schemas, runtime code, product code, scripts, tests, workflows, package files, or README.
This review does not connect active quality-gate.
This review does not connect runtime.
This review does not rerun, rebase, or merge existing PRs.

## Runtime Boundary

Runtime lane: blocked.
Runtime adoption: no.
Runtime readiness claimed: no.
TTS engine call: no.
ASR engine call: no.
MOSS-TTS call: no.
MisoTTS call: no.
Irodori-TTS call: no.
Live2D renderer call: no.
Model download: no.
API call: no.
Endpoint config: no.
Benchmark execution: no.

## Merge Boundary

Merge lane: blocked.
Merge readiness: no.
No PR in this registry is made merge-ready by this review.
No candidate branch evidence is converted into merge evidence.
No docs-only audit is converted into merge evidence.
No no-status-reported state is treated as green.

## Evidence Boundary

This review is not migration evidence.
This review is not validator behavior evidence.
This review is not active quality-gate behavior evidence.
This review is not runtime evidence.
This review is not benchmark evidence.
This review is not model quality evidence.
This review is not production evidence.
This review is not merge evidence.
PR #55-#58 evidence is synthetic fixture / self-check evidence only.
PR #61 / #65 / #68 / #71 / #74 evidence is candidate branch behavior evidence only.
PR #62 / #66 / #69 / #72 / #75 evidence is docs-only acceptance audit evidence only.
PR #76 evidence is docs-only completion audit evidence only.
Current evidence is docs-only registry / governance separation evidence only.

## Governance Boundary

Governance/QG blockers block merge and runtime.
They do not invalidate docs-only planning evidence.
They do not convert candidate branch evidence into merge evidence.
They must not be bypassed.
They must not be weakened.
Writer self-review must not be treated as independent review.

## Quality Gate Boundary

Active quality-gate behavior is not changed.
Pass/fail semantics are not changed.
targetQualityScore is not changed.
No active quality-gate integration is authorized.
No commit statuses reported must not be treated as green.

## Stacked PR Boundary

PR #61 / #65 / #68 / #71 / #74 depend on PR #53 utility branch unless PR #53 is main-reflected.
They are not standalone main-ready.
They must not be merged before PR #53 dependency is resolved.
They must not be treated as target branch evidence.
They must not be treated as runtime or merge evidence.

## Migration Boundary

No PR #17 / #19 / #20 / #21 / #52 branch is migrated.
No main reflection.
No active quality-gate integration.
No runtime adoption.
No benchmark execution.
No merge evidence.

## Safe Summary Boundary

Safe summaries remain count-only evidence where applicable.
Unsafe field detection remains reason-code and count based where applicable.
Raw values, raw field paths, branch names, PR bodies, and changed files are not part of safe summaries.

## Phase A Status

currentActiveHarness: v1.0.7
mainHarnessManifestVersion: 1.0.7
agentsHarnessVersion: v1.0.7
activeHarnessStatus: v1_0_7_active
runtimeLaneStatus: blocked
mergeLaneStatus: blocked
commonUtilityMigrationChainStatus: evidence_registry_review_ready
governanceQGSeparationReviewStatus: required

## Common Utility Migration Evidence Registry

| PR | target area | artifact type | evidence class | base dependency | stacked on | main reflected | target branch evidence | candidate branch evidence | runtime evidence | active quality-gate evidence | merge evidence | status | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR #53 | Phase A common utility | implementation candidate | standalone_non_runtime_utility / not_main_evidence / not_runtime_evidence / not_merge_evidence | none | none | no | no | utility branch only | no | no | no | hardened_complete | preserve until dependency and governance scope is explicit |
| PR #55 | Voice Lab | synthetic migration probe | synthetic_fixture_probe / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 concept | none | no | no | no | no | no | no | preserve-only | keep as synthetic planning evidence |
| PR #56 | ASR | synthetic migration probe | synthetic_fixture_probe / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 concept | none | no | no | no | no | no | no | preserve-only | keep as synthetic planning evidence |
| PR #57 | TTS Evaluation | synthetic migration probe | synthetic_fixture_probe / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 concept | none | no | no | no | no | no | no | preserve-only | keep as synthetic planning evidence |
| PR #58 | Sync Policy | synthetic migration probe | synthetic_fixture_probe / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 concept | none | no | no | no | no | no | no | preserve-only | keep as synthetic planning evidence |
| PR #59 | Cross-area probes | summary audit | docs_only_acceptance_audit / not_main_evidence / not_runtime_evidence / not_merge_evidence | PR #55-#58 | none | no | no | no | no | no | no | completed | keep as probe summary only |
| PR #60 | Voice Lab | migration plan | docs_only_plan / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | none | no | no | no | no | no | no | completed | preserve as planning evidence |
| PR #61 | Voice Lab | implementation candidate | candidate_branch_behavior / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | PR #53 branch | no | no | yes | no | no | no | hardened_complete | preserve as candidate branch evidence |
| PR #62 | Voice Lab | acceptance audit | docs_only_acceptance_audit / not_runtime_evidence / not_merge_evidence | PR #61 | main | no | no | no | no | no | no | completed | preserve as docs-only acceptance |
| PR #63 | ASR | migration plan | docs_only_plan / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | none | no | no | no | no | no | no | completed | preserve as planning evidence |
| PR #65 | ASR | implementation candidate | candidate_branch_behavior / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | PR #53 branch | no | no | yes | no | no | no | implemented_non_runtime_candidate | preserve as candidate branch evidence |
| PR #66 | ASR | acceptance audit | docs_only_acceptance_audit / not_runtime_evidence / not_merge_evidence | PR #65 | main | no | no | no | no | no | no | completed | preserve as docs-only acceptance |
| PR #67 | TTS Capability | migration plan | docs_only_plan / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | none | no | no | no | no | no | no | completed | preserve as planning evidence |
| PR #68 | TTS Capability | implementation candidate | candidate_branch_behavior / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | PR #53 branch | no | no | yes | no | no | no | implemented_non_runtime_candidate | preserve as candidate branch evidence |
| PR #69 | TTS Capability | acceptance audit | docs_only_acceptance_audit / not_runtime_evidence / not_merge_evidence | PR #68 | main | no | no | no | no | no | no | completed | preserve as docs-only acceptance |
| PR #70 | TTS Benchmark Manifest | migration plan | docs_only_plan / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | none | no | no | no | no | no | no | completed | preserve as planning evidence |
| PR #71 | TTS Benchmark Manifest | implementation candidate | candidate_branch_behavior / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | PR #53 branch | no | no | yes | no | no | no | implemented_non_runtime_candidate | preserve as candidate branch evidence |
| PR #72 | TTS Benchmark Manifest | acceptance audit | docs_only_acceptance_audit / not_runtime_evidence / not_merge_evidence | PR #71 | main | no | no | no | no | no | no | completed | preserve as docs-only acceptance |
| PR #73 | TTS Benchmark Result | migration plan | docs_only_plan / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | none | no | no | no | no | no | no | completed / updated | preserve as planning evidence |
| PR #74 | TTS Benchmark Result | implementation candidate | candidate_branch_behavior / not_target_branch_evidence / not_runtime_evidence / not_merge_evidence | PR #53 | PR #53 branch | no | no | yes | no | no | no | implemented_non_runtime_candidate | preserve as candidate branch evidence |
| PR #75 | TTS Benchmark Result | acceptance audit | docs_only_acceptance_audit / not_runtime_evidence / not_merge_evidence | PR #74 | main | no | no | no | no | no | no | completed | preserve as docs-only acceptance |
| PR #76 | TTS Evaluation chain | completion audit | docs_only_completion_audit / not_runtime_evidence / not_merge_evidence | PR #67-#75 | main | no | no | no | no | no | no | completed | preserve as docs-only completion |

Required judgments: PR #53 is standalone non-runtime utility evidence only. PR #55-#58 are synthetic fixture / self-check evidence only. PR #61 / #65 / #68 / #71 / #74 are candidate branch behavior evidence only. PR #62 / #66 / #69 / #72 / #75 are docs-only acceptance audit evidence only. PR #76 is docs-only completion audit evidence only.

## Stacked Dependency and Main-readiness Table

| PR | base | depends on | stack depth | standalone main-ready yes/no | main reflected yes/no | merge order dependency | why not standalone | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR #53 | utility branch | none | 0 | no | no | must resolve governance/QG before active adoption | non-runtime utility candidate, no merge evidence | preserve |
| PR #55 | main/probe | PR #53 concept | 0 | no | no | none | synthetic fixture only | preserve |
| PR #56 | main/probe | PR #53 concept | 0 | no | no | none | synthetic fixture only | preserve |
| PR #57 | main/probe | PR #53 concept | 0 | no | no | none | synthetic fixture only | preserve |
| PR #58 | main/probe | PR #53 concept | 0 | no | no | none | synthetic fixture only | preserve |
| PR #61 | PR #53 branch | PR #53 utility | 1 | no | no | PR #53 dependency first | candidate branch behavior only | preserve until dependency resolved |
| PR #65 | PR #53 branch | PR #53 utility | 1 | no | no | PR #53 dependency first | candidate branch behavior only | preserve until dependency resolved |
| PR #68 | PR #53 branch | PR #53 utility | 1 | no | no | PR #53 dependency first | candidate branch behavior only | preserve until dependency resolved |
| PR #71 | PR #53 branch | PR #53 utility | 1 | no | no | PR #53 dependency first | candidate branch behavior only | preserve until dependency resolved |
| PR #74 | PR #53 branch | PR #53 utility | 1 | no | no | PR #53 dependency first | candidate branch behavior only | preserve until dependency resolved |

## Governance / QG Separation Matrix

| blocker | applies to | current status | blocks merge yes/no | blocks runtime yes/no | blocks docs-only review yes/no | can Codex satisfy now yes/no | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR #3 independent reviewer metadata missing | PR #3, downstream merge chain | unresolved | yes | yes | no | no | explicit governance/QG review |
| PR #3 quality-gate green evidence missing | PR #3, downstream merge chain | unresolved | yes | yes | no | no | gather current same-head QG evidence only if scoped |
| PR #1 blocked by PR #3 | PR #1 | blocked | yes | yes | no | no | preserve until PR #3 resolved |
| PR #15 normalization overlap blocked by PR #1 reevaluation | PR #15 | blocked | yes | yes | no | no | preserve until PR #1 reevaluation |
| no commit statuses reported across new candidate PRs | PR #61 / #65 / #68 / #71 / #74 and docs PRs | unresolved | yes | yes | no | no | do not treat as green |
| stacked PR dependency unresolved | candidate implementation PRs | unresolved | yes | yes | no | no | stacked dependency resolution plan |
| main reflection not done | PR #53 and candidates | unresolved | yes | yes | no | no | no main reflection without scope |
| target branch migration not done | PR #17 / #19 / #20 / #21 / #52 | unresolved | yes | yes | no | no | explicit target branch migration scope only |
| active quality-gate integration not done | PR #53 / candidates | unresolved | yes | yes | no | no | no active QG integration now |
| runtime lane blocked | all runtime adoption | blocked | yes | yes | no | no | keep runtime closed |
| merge lane blocked | all merges | blocked | yes | yes | no | no | keep merge readiness no |

Governance/QG blockers block merge and runtime. They do not invalidate docs-only planning evidence. They do not convert candidate branch evidence into merge evidence. They must not be bypassed or weakened.

## PR Inventory Pressure / Stop-Creating Decision

prInventoryPressureStatus: high
newMigrationPrAllowedNow: no, unless explicit target and evidence gap exists
newDocsAuditAllowedNow: no, unless it reduces blocker ambiguity
newRuntimePrAllowedNow: no
newActiveQGIntegrationAllowedNow: no
nextPrNecessityStatus: governance_qg_or_registry_reduction_only
safeNextAction: preserve PR #55-#76 and stop creating migration PRs until governance/QG or dependency resolution scope is explicit

## Readiness Decision

commonUtilityMigrationChainReadyForMerge: no
commonUtilityMigrationChainReadyForRuntime: no
PR #53 ready for active quality-gate integration: no
PR #61 ready for merge: no
PR #65 ready for merge: no
PR #68 ready for merge: no
PR #71 ready for merge: no
PR #74 ready for merge: no
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

## Next Allowed Action Matrix

| candidate next action | allowed now yes/no | why | required scope | risk | safe next action |
| --- | --- | --- | --- | --- | --- |
| continue creating migration PRs | no | inventory pressure is high and blockers are governance/dependency, not target evidence | explicit target and evidence gap | PR sprawl | stop |
| create more docs-only acceptance audits | no | acceptance chain already exists for current candidates | ambiguity-reducing scope | false confidence | stop unless blocker ambiguity is reduced |
| create PR #53 active quality-gate integration | no | active QG integration not authorized | explicit no-pass/fail-change integration scope after governance/QG | QG behavior drift | do not connect |
| create PR #53 target branch migration | no | target branch migration not authorized | explicit migration scope and dependency resolution | target branch drift | do not migrate |
| create PR #17 / #19 / #20 / #21 / #52 branch migration | no | preserve-only target branches | explicit target branch scope | behavior drift | do not migrate |
| merge PR #53 | no | governance/QG and merge lane blockers remain | governance/QG resolution | premature merge | no merge |
| merge PR #61 / #65 / #68 / #71 / #74 | no | stacked on PR #53 and candidate-only evidence | PR #53 dependency resolved plus governance/QG | out-of-order merge | no merge |
| runtime adoption | no | runtime lane blocked | runtime scope after governance | runtime drift | keep closed |
| benchmark execution | no | benchmark execution prohibited | explicit benchmark execution scope after governance | false benchmark evidence | do not run |
| governance/QG separation review | yes | current blocker class needs separation | docs-only governance scope | overclaim | keep docs-only |
| PR inventory registry update | yes | reduces blocker ambiguity | docs-only registry scope | stale inventory | preserve registry |
| stacked dependency resolution plan | yes | dependency order is unresolved | docs-only dependency scope | merge order confusion | plan only |

## Risk Register

| risk | severity | status | source PRs | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| candidate branch evidence misread as target branch evidence | high | open | PR #61 / #65 / #68 / #71 / #74 | evidence boundary | repeat candidate-only classification |
| synthetic fixture evidence misread as validator behavior evidence | high | open | PR #55-#58 | evidence boundary | keep synthetic-only language |
| docs-only audit evidence misread as merge evidence | high | open | PR #59 / #62 / #66 / #69 / #72 / #75 / #76 | merge boundary | keep merge readiness no |
| PR #53 dependency misread | high | open | PR #61 / #65 / #68 / #71 / #74 | stacked dependency | require dependency resolution plan |
| stacked PR merged out of order | high | blocked | implementation candidates | PR #53 unresolved | do not merge |
| no commit statuses reported misread as green | high | open | new candidate/docs PRs | QG boundary | do not treat as green |
| PR #3 governance blocker bypassed | high | blocked | PR #3 / PR #1 / PR #15 | governance boundary | explicit governance review |
| writer self-review misread as independent review | high | blocked | governance chain | review independence | do not count writer self-review |
| active quality-gate integration attempted too early | high | blocked | PR #53 / candidates | active QG boundary | do not connect |
| runtime lane opened too early | high | blocked | all runtime areas | runtime lane blocked | keep closed |
| benchmark execution attempted too early | high | blocked | TTS Evaluation | benchmark boundary | do not execute |
| model download attempted too early | high | blocked | TTS Evaluation | runtime/benchmark boundary | do not download |
| API call attempted too early | high | blocked | TTS Evaluation | runtime/benchmark boundary | do not call API |
| PR inventory pressure hides true blocker | medium | open | PR #55-#76 | registry review | stop migration PR creation |
| acceptance audit chain creates false confidence | medium | open | acceptance audits | evidence boundary | keep docs-only limitation |
| common utility migration creates behavior drift | high | mitigated | implementation candidates | self-checks and audits | require same-head comparison |
| safe summary contract drift | high | mitigated | PR #53 and candidates | safe summary boundary | block on drift |
| unsafe detector overblocking | medium | open | PR #53 and candidates | future review | compare behavior before migration |
| unsafe detector underblocking | high | open | PR #53 and candidates | future review | require non-leakage checks |
| merge readiness misread | high | blocked | all registry PRs | merge boundary | merge readiness no |
| runtime readiness misread | high | blocked | all registry PRs | runtime boundary | runtime readiness no |
| production readiness misread | high | blocked | all registry PRs | readiness boundary | production readiness no |
| real TTS readiness misread | high | blocked | TTS Evaluation | readiness boundary | real TTS readiness no |
| ASR runtime readiness misread | high | blocked | ASR chain | readiness boundary | ASR runtime readiness no |

## Do-Now / Do-Later / Do-Not

do_now: docs-only evidence registry and governance/QG separation review only.
do_later: explicit governance/QG same-head review; PR inventory registry update; stacked dependency resolution plan; target branch migration only after explicit scope and dependency resolution; active quality-gate integration only after review/QG and no-pass/fail-change scope.
do_not: create more migration PRs now; merge PRs now; open runtime lane; connect active quality-gate; run benchmarks; download models; call APIs; edit existing PR branches; claim readiness; ask user for manual work.

## Non Goals

do not migrate utilities
do not edit existing validators
do not edit target PR branches
do not merge existing PRs
do not reflect specs to main in this PR
do not unblock PR #3
do not unblock PR #1
do not open runtime lane
do not connect active quality-gate
do not change pass/fail semantics
do not change targetQualityScore
do not call TTS engine
do not call ASR engine
do not call MOSS-TTS
do not call MisoTTS
do not call Irodori-TTS
do not call Live2D renderer
do not download model
do not perform API call
do not add endpoint config
do not run benchmark
do not change workflow
do not change package
do not claim runtime readiness
do not claim production readiness
do not claim real TTS readiness
do not claim ASR runtime readiness
do not claim benchmark execution
do not claim merge readiness

## Forbidden Claims

This review makes PR #53 merge-ready
This review makes PR #61 / #65 / #68 / #71 / #74 merge-ready
This review migrates target branches
This review reflects common utility migration to main
This review authorizes active quality-gate integration
This review authorizes runtime adoption
This review authorizes benchmark execution
This review authorizes model download
This review authorizes API call
This review resolves PR #3
This review resolves PR #1
This review proves production readiness
This review proves real TTS readiness
This review proves ASR runtime readiness
This review is merge evidence
This review is runtime evidence

## Safe Next Action

Preserve PR #55-#76 and stop creating migration PRs until governance/QG or dependency resolution scope is explicit. The next useful work is governance/QG same-head review, PR inventory registry update, or stacked dependency resolution planning only.
