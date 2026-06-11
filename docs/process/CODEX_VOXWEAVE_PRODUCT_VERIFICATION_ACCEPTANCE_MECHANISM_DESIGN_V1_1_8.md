# VOXWEAVE Product Verification Acceptance Mechanism Design v1.1.8

## Executive Summary

This document designs a docs-only product verification acceptance mechanism for
VOXWEAVE under active Harness v1.1.8. It responds to the PR #205 and PR #212
failure pattern where runtime smoke evidence was not accepted across the
product verification boundary.

currentActiveHarness: v1.1.8
terminalAction: create_pr_only
designStatus: completed_docs_only
mergeReadiness: no

This is not product verification execution, runtime execution, remote diagnostic
execution, failed PR repair, active QG script mutation, or additional v1.1.8
harness implementation.

## Source Evidence

mainHeadSha: 7abafb701a24c560af255cfa2887632b43a68676
AGENTS.md active marker: v1.1.8
docs/process/CODEX_HARNESS_MANIFEST.json active harness: v1.1.8
scripts/codex-local-quality-gate.mjs HARNESS_VERSION: v1.1.8
docs/process/CODEX_V118_SPEC.md: present

PR #205 QG: COMPLETED / FAILURE
PR #212 QG: COMPLETED / FAILURE
PR #220 QG: COMPLETED / SUCCESS
PR #221 QG: COMPLETED / SUCCESS

The design uses safe metadata, source-of-truth status, and docs/process
evidence only. It does not inspect raw logs, raw artifacts, endpoint values,
token values, secrets, private paths, product verification output, runtime
output, or remote diagnostic output.

## Product Verification Gate Inputs

Product verification gate inputs should be explicit, mode-aware, and safe:

- finalDecisionStatus
- decisionCapsuleStatus
- evidenceCapsuleStatus
- artifactConsistencyStatus
- convergenceGateStatus
- safeFailureReaderStatus
- tokenBudgetStatus
- scopeBoundaryStatus
- terminalAction
- productVerificationEvidenceStatus
- runtimeSmokeEvidenceStatus
- ownerScopeEvidenceStatus
- targetQualityScoreStatus
- same-head evidence freshness
- no-execution boundary confirmation

These inputs are design inputs only. This document does not change scripts,
workflows, packages, source files, or active QG behavior.

## Failed Route Common Pattern

failedRouteCommonPattern: runtime_smoke_evidence_not_accepted_across_product_verification_boundary

PR #205 produced failed runtime smoke candidate evidence. PR #212 produced
failed owner-scoped runtime return candidate evidence. PR #220 classified both
routes as investigate_only, and PR #221 closed the current scope as
preserve_only. The common pattern is not missing runtime smoke intent; it is
missing product verification acceptance authority for runtime continuation.

## Current Mechanism Gap

currentMechanismGap: product_verification_acceptance_contract_missing

The current route has runtime smoke evidence and owner-scope attempt evidence,
but lacks a compact mechanism that can classify when product verification
accepts, rejects, or defers runtime smoke evidence under v1.1.8. Without that
mechanism, runtime smoke candidates can fail repeatedly while preserving the
same product verification boundary.

## New Acceptance Mechanism Candidate

newAcceptanceMechanismCandidate: product_verification_acceptance_capsule

The proposed mechanism is a docs-first design for a future safe artifact:
`codex-product-verification-acceptance.safe.json`.

The candidate capsule should be mode-aware and should not execute product
verification by itself. It should consume only safe evidence produced by a
separately authorized product verification scope.

Required fields:

- `schemaVersion`
- `headSha`
- `terminalAction`
- `productVerificationEvidenceStatus`
- `runtimeSmokeEvidenceStatus`
- `ownerScopeEvidenceStatus`
- `targetQualityScoreStatus`
- `acceptanceDecision`
- `acceptanceReason`
- `blockingBoundary`
- `safeArtifactPointers`
- `rawLogAccessed`
- `runtimeExecuted`
- `productVerificationExecuted`
- `remoteDiagnosticExecuted`
- `mergeReadiness`

Allowed `acceptanceDecision` values:

- `accepted_for_mode`
- `rejected_by_product_verification_boundary`
- `deferred_pending_product_verification_scope`
- `stale_or_missing_evidence`
- `unsafe_or_raw_evidence_blocked`

## Final Decision Kernel Boundary

The Final Decision Kernel remains the first final execution decision source.
The proposed acceptance capsule is supporting evidence only. It cannot override
the final decision, cannot grant merge readiness, and cannot authorize runtime
or product verification execution by itself.

## Mode-Aware Evidence Contract Boundary

Runtime smoke evidence, owner-scope evidence, product verification evidence,
and preserve closure evidence must keep their modes. Runtime smoke evidence must
not be silently promoted into product verification evidence.

## Terminal Action Boundary

terminalAction: create_pr_only

This terminal action authorizes this docs-only design PR only. It does not
authorize code changes, runtime execution, product verification execution,
remote diagnostics, failed PR repair, rerun, rebase, merge, or close.

## Acceptance Decision Matrix

| condition | acceptanceDecision | next terminalAction |
| --- | --- | --- |
| same-head product verification safe evidence accepts runtime smoke mode | accepted_for_mode | create_pr_only under separate explicit scope |
| product verification boundary remains blocking | rejected_by_product_verification_boundary | preserve_only |
| no product verification scope exists | deferred_pending_product_verification_scope | preserve_only |
| evidence is stale, missing, or cross-head | stale_or_missing_evidence | investigate_only |
| raw or unsafe evidence is required | unsafe_or_raw_evidence_blocked | preserve_only |

## Runtime Boundary

runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
apiCallAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no

This design does not start runtime, server, HTTP, adapter endpoints, or any
runtime route.

## Product Verification Boundary

productVerificationExecutionAllowedInThisTask: no

This design does not execute product verification. It designs how a future
separately scoped product verification acceptance artifact should be classified.

## Remote Diagnostic Boundary

remoteDiagnosticExecutionAllowedInThisTask: no

This design does not execute remote diagnostics, call external APIs, call npm
registry, or create remote diagnostic evidence.

## Endpoint / Secret / Token Boundary

endpointConfigAllowedInThisTask: no
tokenSecretChangeAllowedInThisTask: no

No endpoint values, tokens, secrets, raw logs, or private paths are recorded.

## Raw Audio Boundary

rawAudioAllowedInThisTask: no

No raw audio is read, written, generated, processed, or inspected.

## TTS / ASR / Live2D Boundary

ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no

## No-Repair Boundary

failedPrRepairAllowedInThisTask: no

This design does not repair, rerun, rebase, merge, close, comment, request
review, or mutate PR #205, PR #212, PR #173, PR #192, PR #127, or PR #156.

## Decision Matrix

| item | decision |
| --- | --- |
| currentActiveHarness | v1.1.8 |
| terminalAction | create_pr_only |
| designStatus | completed_docs_only |
| productVerificationGateInputs | defined |
| failedRouteCommonPattern | runtime_smoke_evidence_not_accepted_across_product_verification_boundary |
| currentMechanismGap | product_verification_acceptance_contract_missing |
| newAcceptanceMechanismCandidate | product_verification_acceptance_capsule |
| runtimeExecutionAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| failedPrRepairAllowedInThisTask | no |
| mergeReadiness | no |

## Risk Register

| risk | mitigation |
| --- | --- |
| runtime smoke evidence promoted into product verification evidence | mode-aware evidence contract |
| design misread as product verification execution | product verification boundary |
| create_pr_only misread as code authorization | docs-only terminal action boundary |
| QG success misread as merge readiness | mergeReadiness: no |
| failed PR repair attempted from design | no-repair boundary |

## Do-Now / Do-Later / Do-Not

do_now: create this docs-only acceptance mechanism design.

do_later: if explicitly authorized, create a separate docs-only or code-scope
proposal for the product verification acceptance capsule. Any execution of
product verification requires separate explicit Pro scope.

do_not: repair failed PRs, rerun GitHub Actions, rebase, merge, close, comment,
request review, start runtime, start server, call HTTP, call adapter endpoints,
call TTS, call ASR, call Live2D, process raw audio, execute product
verification, execute remote diagnostics, call external APIs, call npm
registry, add endpoint config, add tokens, add secrets, change workflow, change
package, change lockfile, change scripts, change source, or claim readiness.

## Forbidden Claims

This design must not claim runtime readiness, production readiness, real TTS
readiness, ASR runtime readiness, benchmark readiness, product verification
success evidence, remote diagnostic success evidence, failed PR repair, merge
readiness, active QG rollout, or v1.1.8 implementation beyond docs-only design.

## Safe Next Action

Preserve PR #205 and PR #212. Use this design only as a future input for a
separate explicit Pro scope.

## Test Coverage Evidence

changed area: docs-only product verification acceptance mechanism design.

test command: git diff --check; git diff --cached --check; hidden/bidirectional
Unicode scan; negative readiness claim scan; raw log, secret, endpoint, and
token scan.

what the test covers: markdown cleanliness, docs-only file boundary, no
hidden/bidirectional Unicode, no affirmative readiness claims, no raw logs, no
secret-like values, no endpoint values, and no token-like values.

edge cases / failure paths / reason if no test: runtime, product verification,
remote diagnostics, endpoints, npm registry, TTS, ASR, Live2D, raw audio, model
download, workflow, package, scripts, source, failed PR repair, rerun, rebase,
merge, close, comment, and review request are not executed because this task is
docs-only design work.

## Quality Gate Evidence

previous related QG evidence: PR #220 and PR #221 quality gates completed
success as investigate_only and preserve closure evidence. PR #205 and PR #212
quality gates completed failure and remain failed candidate evidence.

expected QG behavior: natural quality gate should evaluate this docs-only design
without runtime, product verification, remote diagnostic, workflow, package,
script, or source changes.

manual rerun status: not requested.

merge readiness: no.
