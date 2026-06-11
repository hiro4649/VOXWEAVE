# VOXWEAVE Runtime Smoke Product Verification Acceptance Contract v1.1.7

## Executive Summary

currentActiveHarness: v1.1.7
futureHarnessAssumption: v1.1.8 planning only
runtimeSmokeProductVerificationContractStatus: completed_docs_only
runtimeSmokeCandidateAcceptanceStatus: blocked_without_product_verification
runtimeSmokeAsProductVerificationStatus: lower_precedence_candidate_evidence_only
productVerificationExecutionAllowedInThisTask: no
runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no
apiCallAllowedInThisTask: no
ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
rawAudioAllowedInThisTask: no
endpointConfigAllowedInThisTask: no
runtimeReadinessClaimed: no
mergeReadiness: no
v118ImplementationStatus: not_started

PR #205 showed that a limited local runtime smoke can pass local self-checks and
still fail the remote quality gate when product verification evidence is not
accepted under current scope. The failure does not invalidate the runtime return
direction. It means the local smoke is lower-precedence candidate evidence and
does not itself satisfy product verification, manual confirmation, or owner
scope requirements.

## Source Evidence

| source | status | evidence class | limitation |
| --- | --- | --- | --- |
| main | v1.1.7 active | active harness evidence | not runtime evidence |
| PR #201 | QG SUCCESS | runtime return scope readiness evidence | docs-only |
| PR #202 | QG SUCCESS | owner-scope packet readiness evidence | docs-only |
| PR #203 | QG SUCCESS | runtime execution decision evidence | docs-only |
| PR #204 | QG SUCCESS | runtime execution preflight evidence | docs-only |
| PR #205 | QG FAILURE | failed candidate evidence | not repaired here |
| PR #206 | QG SUCCESS | terminal failure audit evidence | does not repair PR #205 |
| README.md / docs/BOUNDARY.md | adapter and safety boundary docs | source docs evidence | no execution |
| src contracts/server/orchestrator/live2d forwarder | safe metadata and route inventory | source inspection evidence | no runtime run |

## Current Active Harness Confirmation

| field | status |
| --- | --- |
| AGENTS marker | v1.1.7 |
| manifest harness version | v1.1.7 |
| local quality gate harness version | v1.1.7 |
| activeHarnessStatus | v1_1_7_active |
| workflow marker boundary | intentional_v115_workflow_runtime_with_v117_core |

## PR #201 Runtime Return Scope Evidence

PR #201 establishes runtime return scope readiness as docs-only evidence. It
does not prove that a runtime smoke candidate satisfies product verification.

## PR #202 Owner Scope Packet Evidence

PR #202 establishes an owner-scope packet readiness layer. It does not execute
runtime and does not convert local smoke evidence into product verification
evidence.

## PR #203 Runtime Execution Decision Evidence

PR #203 records runtime execution as a separate candidate path. It does not
authorize unbounded runtime execution or product verification execution.

## PR #204 Runtime Execution Preflight Evidence

PR #204 provides preflight evidence for a bounded runtime execution path. It is
not sufficient to make PR #205 accepted when product verification status fails.

## PR #205 Failed Runtime Smoke Candidate Evidence

PR #205 added a limited local loopback smoke candidate. Its local smoke and
self-check passed before PR creation, but the remote quality gate completed with
FAILURE. The expected failure surface for this contract is:

| field | status |
| --- | --- |
| report.status | fail |
| targetQualityScoreStatus | fail |
| productVerificationStatus | fail |
| exit code | 1 |

This contract does not repair PR #205, does not rerun PR #205, and does not use
PR #205 as product verification pass evidence.

## PR #206 Terminal Failure Audit Evidence

PR #206 records the PR #205 terminal failure as safe summary evidence and has
quality-gate SUCCESS. It confirms that the correct next step is not a broad
repair or runtime continuation.

## VOXWEAVE / IRIS Boundary

VOXWEAVE remains the external voice orchestration service after IRIS creates
adapter packets. IRIS retains final utterance, memory, relationship, game,
safety, and canonical decision ownership. This contract does not move that
boundary.

## Runtime Smoke Product Verification Boundary

Runtime smoke evidence can show that a bounded local route path behaves safely
under fixtures. It does not automatically satisfy product verification. Product
verification requires an accepted evidence class under the active quality gate,
or explicit owner-scoped acceptance for this smoke category.

## Product Verification Acceptance Contract

To be accepted as product verification evidence, a future runtime smoke route
must have explicit product verification acceptance scope or explicit runtime
owner-scope execution scope. It must preserve safe artifacts, decision capsule
authority, outcome contract, verifier capsule, artifact consistency, delta-only
finalizer, and safe failure reader boundaries.

## Local Smoke Evidence Boundary

Local smoke evidence is lower precedence than product verification evidence. It
can support a future decision, but cannot replace product verification pass
status, manual confirmation, owner scope, or same-head remote gate acceptance.

## Manual Confirmation Boundary

manual_confirmation_required is not satisfied by this contract. Manual
confirmation cannot be inferred from local smoke, PR body text, or terminal
failure audit text.

## Owner Scope Boundary

Owner scope remains required for future runtime execution paths. This contract
does not grant owner scope and does not open runtime.

## Safe Artifact Boundary

Future runtime smoke evidence must be emitted as safe artifacts or safe
summaries only. Raw logs, raw payloads, raw response bodies, endpoint values,
secret values, token values, private paths, model paths, benchmark results, and
raw audio are forbidden.

## Safe Summary Boundary

Safe summaries may contain only route names, status classes, redacted evidence
classes, allowed booleans, counts, and decision statuses. They must not contain
raw runtime payloads or concrete endpoint values.

## Raw Leakage Boundary

Any raw leakage risk blocks acceptance. This contract does not inspect raw logs
and does not authorize raw log replay.

## Decision Capsule Authority Boundary

Decision Capsule authority stays with v1.1.7 harness semantics. Local smoke
evidence cannot override the decision capsule, target quality score, product
verification status, or merge readiness.

## Outcome Contract Boundary

The outcome of this contract is documentation of the acceptance boundary only.
It does not produce runtime acceptance, product verification execution,
readiness, or merge authorization.

## Verifier Capsule Boundary

Future verifier capsules must be read-only or explicitly owner-scoped. This
contract does not create a verifier capsule and does not execute one.

## Artifact Consistency Boundary

Runtime smoke artifacts, policy, PR body, and final report must agree on the
same scope: local loopback candidate evidence only unless explicitly expanded.

## Delta-Only Finalizer Boundary

Final reporting must be delta-only: the new contract PR, QG result, and next
route decision. It must not replay raw PR logs or expanded raw gate output.

## Safe Failure Reader Boundary

PR #205 failure is read through safe status fields and PR #206 failure audit
evidence. It is not read through raw logs in this task.

## Target Quality Score Boundary

targetQualityScoreStatus failure blocks acceptance. This contract does not
change targetQualityScore semantics and does not convert a failing score into
pass.

## Runtime Return Gate Impact

The runtime return path remains a candidate path. PR #205 failure narrows the
next safe route to explicit product verification acceptance scope or runtime
owner-scope execution scope.

## Raw Audio Boundary

Raw audio is not allowed in this task. Future local smoke evidence must keep
raw audio absent.

## Endpoint / Secret / Model Path Boundary

Endpoint config, endpoint values, secrets, tokens, API keys, private paths, and
model paths are not allowed. This contract does not add or request them.

## TTS / ASR / Live2D Boundary

No real TTS, ASR, or Live2D renderer execution occurs in this task. PR #205
failure does not authorize those calls.

## Docs / PR Body Repair Limitation

Docs and PR body text can clarify evidence boundaries, but cannot repair product
verification failure, satisfy manual confirmation, or make a failed candidate
accepted.

## Future Runtime Smoke Route Decision

runtimeSmokeFutureImplementationRoute:
docs_only_contract_then_product_verification_acceptance_scope

Acceptable future paths are:

| path | allowed now | required next evidence |
| --- | --- | --- |
| preserve PR #205 and PR #206 | yes | none |
| explicit product verification acceptance scope | future only | owner-provided scope |
| runtime owner-scope execution candidate | future only | owner-provided scope |
| retry local smoke without new scope | no | not allowed |
| open real runtime, TTS, ASR, or Live2D | no | not allowed here |

## Runtime Boundary

Runtime execution is not allowed in this task. No server is started and no
runtime route is called.

## Server / API Call Boundary

No server start, HTTP request, curl endpoint call, adapter endpoint call, API
call, or endpoint config occurs in this task.

## Workflow / Package / Script Boundary

No workflow, package, lockfile, script, active quality-gate, pass/fail
semantics, targetQualityScore semantics, process exit behavior, mergeReady
semantics, failures, or warnings mutation occurs in this task.

## PR #173 Boundary

PR #173 remains untouched and failed. This contract does not repair, rerun,
rebase, merge, or close PR #173.

## PR #192 Boundary

PR #192 remains untouched and failed. This contract does not repair, rerun,
rebase, merge, or close PR #192.

## PR #127 Boundary

PR #127 remains untouched and failed. This contract does not repair, rerun,
rebase, merge, or close PR #127.

## PR #156 Boundary

PR #156 remains untouched and failed. This contract does not repair, rerun,
rebase, merge, or close PR #156.

## v1.1.8 Boundary

v1.1.8 remains planning only. This contract does not implement v1.1.8.

## Decision Matrix

| decision | status |
| --- | --- |
| currentActiveHarness | v1.1.7 |
| futureHarnessAssumption | v1.1.8 planning only |
| runtimeSmokeProductVerificationContractStatus | completed_docs_only |
| runtimeSmokeCandidateAcceptanceStatus | blocked_without_product_verification |
| runtimeSmokeAsProductVerificationStatus | lower_precedence_candidate_evidence_only |
| productVerificationExecutionAllowedInThisTask | no |
| runtimeExecutionAllowedInThisTask | no |
| serverStartAllowedInThisTask | no |
| adapterEndpointCallAllowedInThisTask | no |
| apiCallAllowedInThisTask | no |
| ttsEngineCallAllowedInThisTask | no |
| asrEngineCallAllowedInThisTask | no |
| live2dRendererCallAllowedInThisTask | no |
| rawAudioAllowedInThisTask | no |
| endpointConfigAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |
| v118ImplementationStatus | not_started |

## Risk Register

| risk | status | safe handling |
| --- | --- | --- |
| PR #205 failure misread as runtime direction invalid | open | classify failure as evidence class mismatch |
| Local smoke misread as product verification | open | lower precedence boundary |
| Product verification failure repaired by docs | blocked | docs cannot repair gate failure |
| Runtime retry loop | blocked | no retry without explicit scope |
| Raw log replay | blocked | safe summary only |
| Manual confirmation inferred | blocked | not satisfied |
| Merge readiness inferred | blocked | merge readiness no |

## Do-Now / Do-Later / Do-Not

do_now:
docs-only runtime smoke product verification acceptance contract.

do_later:
explicit product verification acceptance scope or runtime owner-scope execution
scope, if separately authorized.

do_not:
repair PR #205, rerun PR #205, start runtime, call endpoints, call TTS, call
ASR, call Live2D renderer, execute product verification, execute remote
diagnostics, change workflow, change package, change scripts, claim readiness,
or merge.

## Forbidden Claims

- This contract repairs PR #205.
- This contract makes PR #205 accepted.
- This contract satisfies product verification.
- This contract satisfies manual confirmation.
- This contract opens runtime.
- This contract authorizes server start.
- This contract authorizes API or endpoint calls.
- This contract authorizes real TTS, ASR, or Live2D renderer calls.
- This contract authorizes raw audio processing.
- This contract authorizes product verification execution.
- This contract authorizes remote diagnostic execution.
- This contract changes targetQualityScore semantics.
- This contract changes mergeReady semantics.
- This contract proves runtime readiness.
- This contract proves production readiness.
- This contract proves real TTS readiness.
- This contract proves ASR runtime readiness.
- This contract proves benchmark execution.
- This contract authorizes merge.

## Safe Next Action

If this contract PR quality-gate succeeds, create the docs-only Runtime Smoke
Product Verification Blocker Decision. If it fails, preserve the failure as safe
summary evidence and stop. Do not repair PR #205, rerun, merge, start runtime,
call endpoints, or execute product verification in this task.
