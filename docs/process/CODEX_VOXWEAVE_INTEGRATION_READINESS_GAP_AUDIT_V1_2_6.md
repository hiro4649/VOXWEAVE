# VOXWEAVE Integration Readiness Gap Audit v1.2.6

## Executive Summary

This Phase A audit records integration-readiness and security boundary gaps
observed after the v1.2.6 continuous development inventory.

This is a docs-only audit. It does not execute runtime integration, product
verification, remote diagnostics, real TTS, ASR, Live2D renderer execution, or
external provider/network execution. It does not claim runtime or production
readiness.

## Source Evidence

- currentActiveHarness: v1.2.6.
- activeSelfTestSuite: v126.
- baselineContinuousInventoryPr: #364.
- baselineContinuousInventoryMergeCommitSha:
  `72e7108f7c0017d55d34b9088e81f572dfd63362`.
- sourceFilesReviewed:
  - `src/server.js`.
  - `src/live2dForwarder.js`.
  - `src/orchestrator.js`.
  - `src/contracts.js`.
- testFilesReviewed:
  - `test/server-routes.test.js`.
  - `test/server-negative-routes.test.js`.
  - `test/live2d-forwarder.test.js`.

## Integration Boundary Snapshot

| Boundary | Status |
| --- | --- |
| serverBindDefaultScope | loopback_default |
| serverHostOverrideStatus | env_override_available |
| nonLoopbackBindAuthGuardStatus | missing_when_api_key_empty |
| writeRouteAuthenticationStatus | optional_env_key_only |
| writeRouteContentTypeGuardStatus | missing |
| browserOriginWriteRiskStatus | observed_simple_request_boundary |
| healthRoutePublicMetadataStatus | public_safe_metadata |
| exactRouteAllowlistStatus | preserved |
| requestBodyLimitStatus | present |
| safeErrorBoundaryStatus | present |
| mockTtsOnlyStatus | preserved |
| realTtsProviderStatus | not_connected |
| asrProviderStatus | not_connected |
| subtitleMetadataStatus | metadata_only |
| live2dCueGenerationStatus | cue_only_bounded_forwarder |
| live2dLoopbackForwarderStatus | configured_loopback_only_policy |
| live2dHostnameSpoofGuardStatus | incomplete |
| live2dRedirectBoundaryStatus | missing |
| live2dExternalTargetBlockStatus | incomplete_redirect_case |
| translationProviderStatus | not_connected |
| contractRegistryStatus | present |
| safeMetadataProjectionStatus | present |
| productVerificationStatus | not_executed |
| runtimeDiagnosticStatus | not_executed |
| externalIntegrationEvidenceStatus | not_executed |

## Finding A: Non-Loopback Bind With Optional Write Auth

primaryIntegrationGap: `non_loopback_bind_auth_boundary`.

primaryGapSeverity: `high`.

`src/server.js` defaults to loopback, but `startServer` also accepts
`VOXWEAVE_HOST`. Write-route authentication is enabled only when
`VOXWEAVE_API_KEY` is non-empty. Therefore, if a non-loopback host is configured
while the API key is empty, write routes can be reachable without the optional
write-auth check.

This is an integration boundary gap, not proof of deployed exposure.

## Finding B: JSON Content-Type Write Boundary

tertiaryIntegrationGap: `json_content_type_write_boundary`.

tertiaryGapSeverity: `medium`.

`src/server.js` parses POST bodies as JSON but does not require a JSON
Content-Type before parsing. A browser-origin simple request can still send a
write request to a loopback target even when response reading is constrained by
browser policy. This leaves the write boundary dependent on body parsing and
optional auth rather than an explicit JSON Content-Type gate.

## Finding C: Live2D Hostname Loopback Classification

secondaryIntegrationGap: `live2d_loopback_target_boundary`.

secondaryGapSeverity: `high`.

`src/live2dForwarder.js` treats any hostname starting with `127.` as loopback.
That can classify hostnames such as `127.example.invalid` or
`127.0.0.1.example.invalid` as loopback-like even though they are hostnames, not
literal IPv4 loopback addresses. The existing tests cover literal loopback and
external/private examples, but they do not cover hostname spoof strings.

## Finding D: Live2D Redirect Boundary

secondaryRedirectGap: `live2d_redirect_boundary`.

secondaryRedirectGapSeverity: `high`.

The Live2D forwarder calls `fetch` without an explicit redirect policy. If a
configured loopback endpoint redirects to an external target, the fetch
implementation can follow that redirect by default. The current allowlist is
applied before the first request, but not to the redirected target.

## Runtime And Provider Boundary

- runtimeIntegrationStatus: not_started.
- adapterExecutionStatus: existing_behavior_not_expanded.
- serverRouteIntegrationStatus: exact_allowlist_preserved.
- realTtsExecutionStatus: no.
- asrExecutionStatus: no.
- live2dRendererExecutionStatus: no.
- productVerificationExecutionStatus: no.
- remoteDiagnosticExecutionStatus: no.
- runtimeDiagnosticExecutionStatus: no.
- externalNetworkExecutionStatus: no.
- releaseExecutionStatus: no.
- deployExecutionStatus: no.
- publishExecutionStatus: no.

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| integrationBoundarySnapshotStatus | present |
| dryRunIntegrationMatrixStatus | incomplete |
| primaryIntegrationGap | non_loopback_bind_auth_boundary |
| primaryGapSeverity | high |
| secondaryIntegrationGap | live2d_loopback_target_boundary |
| secondaryGapSeverity | high |
| secondaryRedirectGap | live2d_redirect_boundary |
| secondaryRedirectGapSeverity | high |
| tertiaryIntegrationGap | json_content_type_write_boundary |
| tertiaryGapSeverity | medium |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| rawLogsRead | no |
| manualRerun | no |
| githubApprovalReviewStatus | no |

## Recommended Next Implementation Scope

recommendedNextImplementationScope:
`server_bind_auth_and_json_write_boundary`.

safeNextBranch:
`codex/voxweave-v1-2-6-server-bind-auth-json-boundary-001`.

The next implementation should keep source changes tightly scoped to
server-side bind/auth and JSON write-boundary enforcement, with local loopback
tests only and no external provider/runtime execution.

## Safe Next Action

Proceed to Phase B after same-head natural QG success, merge commit, and
post-merge validation.
