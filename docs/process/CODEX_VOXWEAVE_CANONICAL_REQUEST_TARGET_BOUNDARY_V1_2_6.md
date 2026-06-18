# VOXWEAVE Canonical Request Target Boundary v1.2.6

## Executive Summary

This implementation moves route selection away from WHATWG URL pathname
normalization and adds an explicit raw request-target boundary. VOXWEAVE now
accepts only compact origin-form route paths before health or write-route
resolution. Absolute-form targets, network-path targets, query strings,
fragments, dot segments, encoded aliases, backslashes, repeated slashes, and
trailing slashes fail closed with a safe invalid_request_target response.

This is an operational request parsing hardening change. It is not runtime
readiness, production readiness, product verification execution, remote
diagnostic execution, real TTS execution, ASR execution, or Live2D renderer
execution.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineCredentialBoundaryPr: #391
- baselineCredentialBoundaryMergeCommitSha:
  b2dd235b58125527501aa492bc18980b1bd911ab
- changedFiles:
  - src/server.js
  - test/server-negative-routes.test.js
  - docs/process/CODEX_VOXWEAVE_CANONICAL_REQUEST_TARGET_BOUNDARY_V1_2_6.md

## Request Target Boundary

- previousRouteDecisionMode: WHATWG_URL_pathname_normalization
- currentRouteDecisionMode: raw_request_target_canonical_guard
- exportedParseCanonicalRequestTargetStatus: implemented
- exportedAssertCanonicalRequestTargetStatus: implemented
- absoluteFormRequestTargetStatus: rejected
- networkPathRequestTargetStatus: rejected
- queryParameterWriteRouteStatus: rejected
- fragmentRequestTargetStatus: rejected
- dotSegmentNormalizationStatus: rejected
- encodedDotSegmentNormalizationStatus: rejected
- backslashNormalizationStatus: rejected
- percentEncodedPathStatus: rejected
- doubleSlashPathStatus: rejected
- trailingSlashAliasStatus: rejected
- exactRawRouteAllowlistStatus: implemented_before_route_resolution
- safeErrorStatus: invalid_request_target_400

## Test Coverage Evidence

- testCommand: node --test test/server-negative-routes.test.js
- result: pass
- passCount: 44
- coveredBoundaries:
  - exact safe health and write route path parsing
  - empty target rejection
  - asterisk target rejection
  - non-origin-form target rejection
  - network-path target rejection
  - trailing slash alias rejection
  - repeated slash rejection
  - dot segment rejection
  - encoded path rejection
  - query-bearing route rejection
  - fragment-bearing route rejection
  - backslash alias rejection
  - absolute-form raw write request rejection through node:net
  - query-bearing raw write request rejection through node:net

## Compatibility Evidence

Existing safe route tests continue to pass because exact supported origin-form
paths are still accepted. Unknown canonical routes continue to return the safe
not_found response. Invalid request targets are rejected before route handling,
so normalized aliases cannot reach allowed route pathnames.

## No Runtime Boundary

- runtimeExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realProviderExecutionStatus: not_executed
- realTtsExecutionStatus: not_executed
- asrExecutionStatus: not_executed
- live2dRendererExecutionStatus: not_executed
- rawAudioProcessed: no

The raw request tests use local loopback node:net requests against the existing
test server helper only. They do not run npm start, call external endpoints, or
exercise real provider integrations.

## Safe Output Boundary

- rawRequestTargetOutputStatus: excluded
- rawRequestBodyOutputStatus: excluded
- rawResponseSnapshotStatus: excluded
- secretProjectionStatus: excluded
- endpointProjectionStatus: excluded
- privatePathProjectionStatus: excluded

Tests assert safe status codes, safe error kinds, and forbidden-field absence.
They do not print raw request lines, raw responses, endpoint values, secrets, or
raw artifacts.

## Workflow / Package / Harness Boundary

- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- harnessArtifactChangeStatus: none
- scriptChangeStatus: none
- sourceChangeStatus: src/server.js only
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_then_merge_if_gated |
| rawRequestTargetCanonicalizationStatus | implemented |
| normalizedAliasToAllowedRouteRiskStatus | mitigated |
| requestTargetFormStatus | origin_form_only |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- riskId: strict_target_compatibility
  - status: accepted
  - note: Requests using query strings or alias forms now fail closed instead
    of resolving to the normalized allowed pathname.
- riskId: root_path_behavior
  - status: accepted
  - note: Root path is not a product route and is treated as invalid target
    under the compact canonical route policy.
- riskId: platform_parser_pre_rejection
  - status: residual
  - note: Some malformed request lines may be rejected by Node before product
    code observes them; product code still rejects all reachable aliases.

## Safe Next Action

Proceed to request_lifecycle_policy_and_safe_shutdown after this candidate
receives same-head natural QG SUCCESS, merge, and post-merge validation.
