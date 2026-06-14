# VOXWEAVE Adapter Route Boundary Fix v1.2.2

## Executive Summary

This candidate fixes the VOXWEAVE adapter route boundary so adapter routes are accepted by exact path match only.

currentActiveHarness: v1.2.2
activeSelfTestSuite: v122
terminalAction: create_pr_only
adapterRouteBoundaryFixStatus: candidate_only
mergeReadiness: no

## Source Evidence

Starting main SHA: defdb37b8476372c00e9d5cd8523663a8fdac11e
The server previously accepted adapter routes by prefix matching. That allowed unknown or deeper adapter subpaths to enter orchestration instead of returning the safe not_found route boundary.

## Bug Classification

taskMode: bugfix
affectedArea: server route dispatch
runtimePathAffected: adapter HTTP route classification
externalIntegrationAffected: none

## Reproduction Status

reproductionStatus: covered_by_new_negative_route_tests
rootCauseFinding: prefix-based adapter route checks allowed unknown adapter subpaths.

## Fix Scope

Changed files:
- src/server.js
- test/server-negative-routes.test.js
- docs/process/CODEX_VOXWEAVE_ADAPTER_ROUTE_BOUNDARY_FIX_V1_2_2.md

The fix replaces broad adapter path prefix checks with a fixed allowlist of exact POST routes.

## Allowed Routes

Allowed POST routes remain:
- /v1/orchestrate
- /orchestrate
- /v1/adapter
- /v1/adapter/tts
- /v1/adapter/subtitle
- /v1/adapter/live2d
- /adapter/tts
- /adapter/subtitle
- /adapter/live2d
- /tts
- /subtitle
- /live2d

## Rejected Routes

The following unknown adapter subpaths are fixed as safe not_found behavior:
- /v1/adapter/unknown
- /adapter/unknown
- /v1/adapter/tts/extra
- /adapter/live2d/extra

## Generic Adapter Boundary

/v1/adapter remains a generic adapter route. The candidate keeps adapter validation inside the service contract and adds route coverage for a safe generic subtitle packet.

## No Runtime Readiness Claim

runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrRuntimeReadinessClaimed: no
live2dRendererReadinessClaimed: no

## No Product Verification / Remote Diagnostic

productVerificationExecutionAllowedInThisTask: no
remoteDiagnosticExecutionAllowedInThisTask: no
productVerificationExecutionStatus: not_executed
remoteDiagnosticExecutionStatus: not_executed

## Package / Workflow Boundary

packageChangeStatus: unchanged
dependencyChangeStatus: unchanged
lockfileChangeStatus: unchanged
workflowChangeStatus: unchanged
harnessChangeStatus: unchanged

## Test Coverage Evidence

changed area: server route dispatch and server negative route tests
test command: node --test test/server-negative-routes.test.js; node --test test/quality-score-boundaries.test.js; npm test; node scripts/codex-v122-self-test.mjs
what the test covers: exact adapter route allowlist, unknown adapter subpath 404 behavior, generic /v1/adapter behavior, existing adapter route mismatch behavior
edge cases / failure paths / reason if no test: server starts only inside scoped local tests; no external endpoints, real engines, product verification, or remote diagnostics are used

## Quality Gate Evidence

previous related QG evidence: PR #276 merged quality score boundary tests under v1.2.2
expected QG behavior: natural remote QG should pass after local bounded validation
manual rerun status: no manual rerun
merge readiness: no until review and fresh gates

## Risk Register

remainingRisk: This fix changes only route dispatch boundaries and does not prove runtime or production readiness.
remainingRisk: Unknown adapter paths now return not_found before orchestration, which is the intended narrowed behavior.

## Safe Next Action

Run scoped local verification, create a draft PR, and let natural QG run without manual rerun.
