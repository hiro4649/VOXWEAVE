# VOXWEAVE Adapter Route Boundary Fix v1.2.3

## Executive Summary

This candidate tightens VOXWEAVE adapter route dispatch to exact POST route matching under active Harness v1.2.3.

currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
activeSelfTestStatusKey: v123SelfTestStatus
startingMainHeadSha: a9a4f9480ab4254cb2744cb02615084f90e687a4
candidateBranch: codex/voxweave-v1-2-3-adapter-route-boundary-fix-001
candidateHeadSha: recorded_in_pr_body_after_push
terminalAction: create_pr_only
adapterRouteBoundaryFixStatus: candidate_only
mergeReadiness: no

## Bug Classification

taskMode: bugfix
taskProfile: routine
productCodeChange: yes
workflowChange: no
packageDependencyChange: no
lockfileChange: no
externalEndpointExecution: no

## Reproduction Status

reproductionStatus: covered_by_new_negative_route_tests
rootCauseFinding: Prefix-based adapter route checks allowed unknown or deeper adapter subpaths to flow into orchestration instead of returning safe not_found behavior.

## Fix Scope

Changed files:
- src/server.js
- test/server-negative-routes.test.js
- docs/process/CODEX_VOXWEAVE_ADAPTER_ROUTE_BOUNDARY_FIX_V1_2_3.md

The server route allowlist is represented as exact route values. Prefix matching for adapter routes is removed.

## Allowed Route List

Allowed POST routes:
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

## Rejected Route List

Rejected POST routes covered by tests:
- /v1/adapter/unknown
- /adapter/unknown
- /v1/adapter/tts/extra
- /adapter/live2d/extra

Expected safe behavior:
- status 404
- ok false
- error not_found
- JSON content type
- no-store cache control
- no forbidden response fields

## Generic Adapter Boundary

/v1/adapter remains a generic adapter endpoint. A safe subtitle adapter packet with adapter_validation_required true is accepted through the generic route, preserving service-level adapter validation.

## No Runtime Readiness Claim

runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no

## Package / Lockfile / Workflow Boundary

packageBoundaryStatus: unchanged
packageDependencyChange: no
lockfileBoundaryStatus: unchanged
workflowBoundaryStatus: unchanged
harnessBoundaryStatus: unchanged

## External Execution Boundary

externalEndpointExecution: no
realTtsExecution: no
asrExecution: no
realLive2dRendererExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
rawLogsRead: no

## Test Coverage Evidence

changed area: src/server.js adapter route dispatch, test/server-negative-routes.test.js, docs/process/CODEX_VOXWEAVE_ADAPTER_ROUTE_BOUNDARY_FIX_V1_2_3.md
test command: node --test test/server-negative-routes.test.js; node --test test/quality-score-boundaries.test.js; active self-test; compatibility self-test; npm test
what the test covers: exact adapter route allowlist, unknown adapter subpath 404 behavior, generic /v1/adapter validation boundary, existing adapter kind mismatch paths
edge cases / failure paths / reason if no test: server use is limited to existing local route tests; no external endpoints, real TTS, ASR, real Live2D renderer, product verification, or remote diagnostics

## Quality Gate Evidence

currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
previous related QG evidence: PR #280 installed v1.2.3 and recorded active self-test pass, compatibility self-test pass, and local target quality gate pass.
expected QG behavior: natural remote QG should pass for bounded source/test/docs fix
manual rerun status: no manual rerun
merge readiness: no until fresh same-head gates and review

## v1.2.3 Observed Read Evidence

observedRequiredReads:
- AGENTS.md
- docs/process/CODEX_HARNESS_MANIFEST.json
- docs/process/CODEX_V123_SPEC.md
- docs/process/CODEX_ACTIVE_POLICY_INDEX.json

observedTaskReads:
- src/server.js
- test/server-negative-routes.test.js
- package.json

deferredReads:
- README.md
- legacy specs
- raw logs

readBudgetStatus: pass

## Final Decision Closure Reason

finalDecisionClosureReason: candidate_created_not_merge_ready
ownerAuthorityCreated: no
selfApproval: no
githubApprovalReviewSubmitted: no

## Risk Register

remainingRisk: This is a route boundary fix only and does not establish runtime readiness.
remainingRisk: Unknown adapter subpaths now fail at route dispatch with safe not_found behavior before orchestration.

## Safe Next Action

Create a draft PR and let natural QG run without manual rerun.
