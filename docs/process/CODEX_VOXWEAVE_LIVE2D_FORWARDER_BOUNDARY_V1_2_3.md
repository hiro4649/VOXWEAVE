# VOXWEAVE Live2D Loopback Forwarder Boundary v1.2.3

## Executive Summary

This candidate fixes the VOXWEAVE Live2D forwarder boundary under Harness
v1.2.3 by restricting configured renderer forwarding to loopback endpoints only.
Private IPv4 renderer endpoints are now treated like other blocked endpoints and
do not reach the injected fake fetch implementation in tests.

## Metadata

title: VOXWEAVE Live2D Loopback Forwarder Boundary v1.2.3
currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
activeSelfTestStatusKey: v123SelfTestStatus
currentMainHeadSha: abec176a34cce7f1a717df8fbcf524bb5cf3a740
postMergeBaselinePr: #282
postMergeBaselineSha: abec176a34cce7f1a717df8fbcf524bb5cf3a740
candidateBranch: codex/voxweave-v1-2-3-live2d-loopback-forwarder-boundary-001
candidateHeadSha: recorded_in_pr_body_after_push
terminalAction: create_pr_only
live2dForwarderBoundaryStatus: candidate_only
mergeReadiness: no
scopeExpansionReason: npm test includes test/voxweave.test.js, and that aggregate test retained the old private IPv4 expectation.

## Bug Classification

taskMode: bugfix
affectedArea: src/live2dForwarder.js
productCodeChange: yes
runtimeReadinessClaimed: no
realLive2dRendererExecution: no

The bug is a boundary mismatch between README guidance and implementation. The
README describes forwarding generated Live2D cues to a local loopback renderer,
while the implementation also accepted private IPv4 renderer hosts.

## Reproduction Status

reproductionStatus: reproduced_by_source_and_test_inspection

The pre-fix focused test named private IPv4 endpoints as accepted by fake fetch.
That showed 10.x, 172.16-31.x, and 192.168.x renderer endpoints could be
normalized into an accepted private scope and passed to fake fetch.

The first full npm test recovery attempt also found an aggregate test in
test/voxweave.test.js that retained the old private IPv4 expectation. That test
is included in this candidate scope so the aggregate suite matches the new
loopback-only boundary.

## Root Cause Finding

rootCauseFinding: isLoopbackHost delegated to isPrivateIpv4

The forwarder used isPrivateIpv4 inside isLoopbackHost. That made private IPv4
hosts eligible for target normalization and forwarding. endpointScope then
reported a private scope for those hosts, which allowed an attempted renderer
forward instead of the configured_unusable blocked summary.

## README Boundary

README boundary: loopback renderer forwarding only

README.md describes Live2D dry-run mode when no endpoint is configured, and
describes configured forwarding only for loopback /live2d-engine or /cue URLs.
This candidate aligns implementation and tests to that boundary.

## Old Implementation Boundary

oldImplementationBoundary: private_ipv4_accepted

Before this candidate, localhost, 127.x, ::1, and private IPv4 hosts were all
accepted by the host allow function. That was broader than the documented local
renderer boundary.

## New Implementation Boundary

newImplementationBoundary: loopback_only

Allowed loopback hosts:

- localhost
- 127.0.0.1
- 127.x
- ::1
- [::1]

Blocked private IPv4 hosts:

- 10.x
- 172.16.x through 172.31.x
- 192.168.x

Blocked public endpoint behavior: public hosts remain blocked before fake fetch.
Blocked credential/query/hash behavior: URLs with credentials, query strings,
or fragments remain blocked before fake fetch.

## No External Endpoint Execution

externalEndpointExecution: no
fakeFetchOnly: yes
realLive2dRendererExecution: no

Tests use injected fake fetch only. They do not call external endpoints and do
not execute a real Live2D renderer.

## Response Summary Field Boundary

The public forward summary remains limited to:

- renderer_forward_configured
- renderer_forward_scope
- renderer_forward_attempted
- renderer_forward_ok
- renderer_forward_status

The summary does not expose endpoint material, URL material, API key material,
sensitive credential material, local path material, raw request material, or cue
body material.

## Test Coverage Evidence

changed area: src/live2dForwarder.js, test/live2d-forwarder.test.js, test/voxweave.test.js, docs/process/CODEX_VOXWEAVE_LIVE2D_FORWARDER_BOUNDARY_V1_2_3.md
changedFiles: src/live2dForwarder.js; test/live2d-forwarder.test.js; test/voxweave.test.js; docs/process/CODEX_VOXWEAVE_LIVE2D_FORWARDER_BOUNDARY_V1_2_3.md
test command: node --test test/live2d-forwarder.test.js; node --test test/voxweave.test.js; node --test test/server-negative-routes.test.js; node scripts/codex-v123-self-test.mjs; node scripts/codex-v122-self-test.mjs; npm test
what the test covers: loopback endpoint acceptance, private IPv4 blocking before fake fetch, aggregate private IPv4 expectation sync, public/credential/query/hash endpoint blocking, dry-run behavior, missing fetch behavior, safe summary field boundary
edge cases / failure paths / reason if no test: tests use fake fetch only; no external endpoint, real Live2D renderer, real TTS, ASR, product verification, remote diagnostic, or runtime readiness path is executed

live2dForwarderFocusedTestStatus: pass
voxweaveAggregateTestStatus: pass
serverNegativeFocusedTestStatus: pass
privateIpv4BlockedStatus: pass
loopbackAllowedStatus: pass
summaryForbiddenFieldScanStatus: pass
v123SelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
npmTestStatus: pass
npmTestRecoveryStatus: recovered

## Scope Expansion Evidence

scope expansion: test/voxweave.test.js added
reason: npm test includes test/voxweave.test.js and it retained the old private IPv4 scope expectation
old expectation: private IPv4 returned private scope
new expectation: private IPv4 is blocked and fake fetch is not called
aggregateTestExpectationSync: test/voxweave.test.js private network scope expectation changed from private accepted to blocked not attempted

## Quality Gate Evidence

currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
postMergeBaselinePr: #282
postMergeBaselineSha: abec176a34cce7f1a717df8fbcf524bb5cf3a740
expectedQGBehavior: natural remote QG should pass for bounded source/test/docs fix
manualRerunStatus: no_manual_rerun
mergeReadiness: no

## v1.2.3 Observed Read Evidence

observedReadEvidence:

- AGENTS.md
- docs/process/CODEX_HARNESS_MANIFEST.json
- docs/process/CODEX_V123_SPEC.md
- docs/process/CODEX_ACTIVE_POLICY_INDEX.json
- README.md
- src/live2dForwarder.js
- test/live2d-forwarder.test.js
- package.json

## Final Decision Closure Reason

finalDecisionClosureReason: create_pr_only_candidate

This candidate is intentionally create_pr_only. It does not claim merge
readiness, runtime readiness, production readiness, or renderer readiness.

## Safety Boundaries

runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no
externalEndpointExecution: no
realLive2dRendererExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
rawLogsRead: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none

## Risk Register

remainingRisk:

- This change narrows configured renderer forwarding to loopback only. Any future
  need for private network renderer forwarding should be separately scoped with
  an explicit owner decision and additional safety evidence.
- The tests intentionally use fake fetch only. They are boundary tests, not real
  renderer execution.
- The public summary shape is preserved, but downstream consumers should still
  treat it as safe metadata rather than renderer health proof.

## Safe Next Action

Open a draft PR for this bounded source/test/docs candidate and let the natural
remote quality gate run without manual rerun or approval review.
