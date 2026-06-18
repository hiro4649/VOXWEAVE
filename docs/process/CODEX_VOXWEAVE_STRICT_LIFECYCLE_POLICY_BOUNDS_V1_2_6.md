# VOXWEAVE Strict Lifecycle Policy Bounds and Connection Cap v1.2.6

## Executive Summary

This implementation changes VOXWEAVE server lifecycle policy handling from
positive-integer fallback semantics to explicit bounded validation. It also adds
an explicit `server.maxConnections` cap and safe startup summary fields for the
bounded lifecycle policy.

This change does not alter route allowlists, credential behavior, canonical
request target handling, body size limits, package files, workflows, lockfiles,
dependencies, real TTS, ASR, Live2D renderer execution, product verification
execution, or remote diagnostic execution.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- chainId:
  VOXWEAVE_V126_REQUEST_CONCURRENCY_BACKPRESSURE_CHAIN_2026_06_18
- baselineConcurrencyAuditPr: #397
- baselineConcurrencyAuditMergeCommitSha:
  19835f3261c262e2e67c43939b7cbc2503eda4bf
- implementationScope: strict_lifecycle_policy_bounds
- changedSourceFile: src/server.js
- changedTestFiles:
  - test/server-negative-routes.test.js
  - test/server-routes.test.js
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none

## Implemented Boundary

- explicitPolicyTypeValidationStatus: pass
- lifecycleLowerBoundsStatus: pass
- lifecycleUpperBoundsStatus: pass
- lifecycleCrossFieldValidationStatus: pass
- maxConnectionsStatus: implemented
- shutdownTimeoutPolicyFieldStatus: implemented
- unknownPolicyFieldStatus: rejected
- policyFreezeStatus: pass
- strictInvalidValueRejectStatus: pass
- startupSummaryMaxConnectionsStatus: implemented
- startupSummaryShutdownTimeoutStatus: implemented
- transportValueProjectionStatus: forbidden

## Policy Limits

| Field | Minimum | Maximum |
| --- | ---: | ---: |
| requestTimeoutMs | 1000 | 120000 |
| headersTimeoutMs | 1000 | 60000 |
| keepAliveTimeoutMs | 500 | 30000 |
| maxRequestsPerSocket | 1 | 1000 |
| maxHeadersCount | 1 | 256 |
| maxConnections | 1 | 1024 |
| shutdownTimeoutMs | 100 | 10000 |

## Cross-Field Rules

- headersTimeoutMs must be less than or equal to requestTimeoutMs.
- keepAliveTimeoutMs must be less than requestTimeoutMs.
- shutdownTimeoutMs must be less than or equal to requestTimeoutMs.

## Safe Error Boundary

Invalid lifecycle policy values throw a safe `VoxWeaveError` with:

- code: invalid_server_lifecycle_policy
- statusCode: 500

The safe error does not include invalid values, host material, port material,
API key material, endpoint material, private paths, stack traces, or raw
transport details.

## Compatibility Boundary

- existing valid defaults preserved: yes
- existing route behavior preserved: yes
- existing credential behavior preserved: yes
- existing canonical request target behavior preserved: yes
- existing body limit behavior preserved: yes
- existing loopback evidence runner behavior preserved: yes
- startup summary remains safe metadata only: yes
- shutdown summary remains safe metadata only: yes

## Validation Evidence

- node --check src/server.js: pass
- node --check test/server-negative-routes.test.js: pass
- node --test test/server-negative-routes.test.js: pass, 57 tests
- node --test test/server-routes.test.js: pass, 19 tests

## No Runtime Boundary

- externalNetworkExecutionStatus: no
- realTtsExecutionStatus: no
- asrExecutionStatus: no
- live2dRendererExecutionStatus: no
- rawAudioProcessingStatus: no
- productVerificationExecutionStatus: not_executed
- remoteDiagnosticExecutionStatus: not_executed
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- productionCapacityClaimed: no

## Decision Matrix

- currentActiveHarness: v1.2.6
- terminalAction: create_pr_only_then_merge_after_same_head_success
- explicitPolicyTypeValidationStatus: pass
- lifecycleLowerBoundsStatus: pass
- lifecycleUpperBoundsStatus: pass
- lifecycleCrossFieldValidationStatus: pass
- maxConnectionsStatus: implemented
- unknownPolicyFieldStatus: rejected
- policyFreezeStatus: pass
- transportValueProjectionStatus: forbidden
- mergeReadiness: no_until_natural_qg_and_final_gates

## Risk Register

- writeAdmissionRisk: global in-flight write admission is still a later phase.
- abortBoundaryRisk: request abort and client error handling are still later phases.
- forcedShutdownRisk: forced connection cleanup remains a later phase.
- productionCapacityRisk: `maxConnections` is a local safety bound, not a
  benchmark or production capacity claim.

## Safe Next Action

After same-head natural QG success and merge, continue to the write request
admission and overload rejection phase.
