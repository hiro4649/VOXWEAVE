# VOXWEAVE Loopback Integration Evidence Runner v1.2.6

## Executive Summary

This record documents the local fake-only loopback integration evidence runner
for VOXWEAVE v1.2.6. The runner starts only ephemeral numeric loopback servers,
uses fake in-memory keys, emits one safe JSON summary, and keeps all evidence
explicitly non-readiness.

## Source State

- currentActiveHarness: v1.2.6
- baselinePlanPr: #372
- implementationScope: loopback_integration_evidence_runner
- runnerSchema: voxweave_loopback_integration_evidence_v1
- localLoopbackExecutionStatus: performed_fake_only
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realRendererExecutionStatus: no
- allSixContractPathStatus: pass
- safeSummaryOnlyStatus: pass
- cleanupStatus: pass
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Implementation Scope

The runner lives at `scripts/voxweave-loopback-integration-evidence.mjs` and
exports:

- `LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA`
- `runLoopbackIntegrationEvidence`
- `assertLoopbackEvidenceSafe`

The CLI path emits exactly one safe JSON summary. Importing the module does not
auto-run the evidence lane.

## Local Fake-Only Execution

- VOXWEAVE server bind: numeric 127.0.0.1 with ephemeral port
- fake renderer bind: numeric 127.0.0.1 with ephemeral port
- server key: fake in-memory fixture only
- renderer key: fake in-memory fixture only
- external network: not used
- DNS: not required
- real provider: not used
- real renderer: not used
- raw body retention: no

## Evidence Coverage

The runner covers:

- public health path
- authenticated TTS route
- authenticated subtitle route
- authenticated Live2D route
- unauthorized POST rejection
- non-JSON write rejection
- route kind mismatch rejection
- unknown route rejection
- unsafe contract rejection before metadata output
- all six AI character contracts accepted
- safe integration boundary snapshot present
- fake renderer receives one JSON cue handoff
- fake renderer receives fake auth material
- cleanup after execution

## Safe Summary Boundary

The output uses exact allowlisted keys only and excludes:

- endpoint
- URL
- port
- host value
- API key
- authorization header
- raw request
- raw response
- raw cue
- raw contract
- request ID
- private path
- error message
- stack

Known failures are reduced to safe reason codes. Unknown failures use
`loopback_evidence_exception`.

## Test Coverage Evidence

- `node --check scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node --test test/server-routes.test.js`: pass

The route test suite now verifies the safe pass summary, numeric loopback scope,
health/auth/JSON/route/TTS/subtitle/Live2D statuses, all-six contract count,
absence of raw contract values, absence of network target material, absence of
fake key material, cleanup status, exact allowlisted key set, and CLI-safe
summary guard.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | loopback_integration_evidence_runner |
| localLoopbackExecutionStatus | performed_fake_only |
| externalNetworkExecutionStatus | no |
| realProviderExecutionStatus | no |
| realRendererExecutionStatus | no |
| realTtsExecutionStatus | no |
| asrExecutionStatus | no |
| translationExecutionStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add bounded failure and rollback matrix coverage for fake renderer rejection,
timeout, local connection reset, redirect blocking, and cleanup-after-failure
without widening into external network, real renderer, product verification, or
runtime readiness claims.
