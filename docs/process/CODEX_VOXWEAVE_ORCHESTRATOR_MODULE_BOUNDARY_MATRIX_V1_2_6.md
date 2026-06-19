# VOXWEAVE Orchestrator Module Boundary Matrix v1.2.6

## Executive Summary

This document records the v1.2.6 orchestrator module boundary matrix candidate.
It is a test-only follow-up after the orchestrator composition root slimming
work. The change adds static import graph coverage for extracted orchestrator
modules and preserves existing behavior tests.

## Source Evidence

- currentActiveHarness: v1.2.6
- base main includes PR #424 merge commit: 0e0eb54d0a6b55a43dd8281c4043648c04552a0f
- changed source files: none
- changed package files: none
- changed workflow files: none

## Module Boundary Scope

The matrix covers extracted orchestrator modules only:

- `src/aiCharacterMetadata.js`
- `src/reactionPlanBuilder.js`
- `src/orchestrationResponse.js`
- `src/serviceHealth.js`

## Static Import Graph Boundary

`test/orchestrator-extraction-integration.test.js` now verifies that each
extracted module imports only its assigned support modules and does not import
the orchestrator, server, HTTP runtime, environment access, or fetch.

## Behavior Parity Boundary

Existing extraction integration tests remain the behavior parity lane for:

- safe health metadata
- AI character metadata aggregate-only summaries
- reaction plan construction
- request-bound response materialization
- orchestrator response safety
- no forbidden response fields

## No Runtime Boundary

This candidate does not execute real TTS, ASR, Live2D renderer, product
verification, remote diagnostics, external provider calls, raw audio processing,
or deployment checks.

## Workflow / Package / Source Boundary

- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- sourceChangeStatus: none
- scriptChangeStatus: none

## Test Coverage Evidence

- changed area: orchestrator extraction integration tests and evidence doc
- test command: `node --check test/orchestrator-extraction-integration.test.js`
- test command: `node --test test/orchestrator-extraction-integration.test.js`
- what the test covers: extracted module static import graph and existing
  behavior parity matrix
- edge cases / failure paths / reason if no test: forbidden imports, runtime
  access strings, and fetch usage are rejected by static matrix checks

## Quality Gate Evidence

- previous related QG evidence: PR #424 natural QG SUCCESS and post-merge local
  QG score 95
- expected QG behavior: v1.2.6 quality gate should pass on the candidate head
- manual rerun status: no manual rerun
- merge readiness: no until natural QG success and fresh pre-merge gates pass

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_if_gates_pass |
| moduleBoundaryMatrixStatus | candidate_only |
| runtimeExecutionAllowed | no |
| serverStartAllowed | no |
| apiCallAllowed | no |
| adapterEndpointCallAllowed | no |
| ttsEngineCallAllowed | no |
| asrEngineCallAllowed | no |
| live2dRendererCallAllowed | no |
| rawAudioAllowed | no |
| productVerificationExecutionAllowed | no |
| remoteDiagnosticExecutionAllowed | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Static matrix drifts from real imports | Test reads source files directly. |
| Boundary checks become too broad | Matrix is limited to extracted modules. |
| Behavior parity weakens | Existing extraction integration tests remain active. |

## Safe Next Action

Run the v1.2.6 local validation set, create a draft PR, wait for natural QG,
and merge only if the final fresh gates pass.
