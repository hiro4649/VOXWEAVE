# VOXWEAVE Artifact Metadata Boundary Tests v1.2.2

## Executive Summary

This candidate adds service-level artifact metadata boundary tests for VOXWEAVE.
It validates existing safe artifact metadata behavior only.

currentActiveHarness: v1.2.2
activeSelfTestSuite: v122
terminalAction: create_pr_only
artifactMetadataBoundaryTestStatus: candidate_only
runtimeReadinessClaimed: no
productionReadinessClaimed: no
mergeReadiness: no

## Source Evidence

The active source-of-truth is main at harness v1.2.2. The implementation under
test is the existing `createVoxWeaveService` behavior in `src/orchestrator.js`.

## Current Active Harness Confirmation

AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.2
manifest activeHarnessVersion: 1.2.2
manifest activeSelfTestSuite: v122
active spec path: docs/process/CODEX_V122_SPEC.md
local QG HARNESS_VERSION: 1.2.2

## PR #269 Timing Boundary Baseline Evidence

PR #269 is merged and provides the timing, subtitle, mouth cue, readability,
quality deduction, and unsupported locale boundary baseline. This candidate
builds on that merged behavior without modifying source files.

## Artifact Metadata Boundary Test Scope

The tests cover TTS, subtitle, Live2D, and default orchestration artifact
metadata. They assert selected safe fields and recursively reject unsafe
response keys.

## TTS Artifact Metadata Boundary

TTS output is expected to expose safe mock artifact metadata only, including a
VOXWEAVE artifact URL, a safe artifact kind, mock TTS metadata, and non-real TTS
provider status.

## Subtitle Artifact Metadata Boundary

Subtitle output is expected to expose safe subtitle artifact metadata and
subtitle timing fields without raw subtitle body material, endpoints, secrets,
tokens, or model paths.

## Live2D Artifact Metadata Boundary

Live2D output is expected to expose safe cue artifact metadata and delivery
metadata without renderer endpoint material, cue body material, secrets, tokens,
or model paths. The test uses a non-forwarding fake forwarder.

## Orchestrate Artifact Metadata Boundary

The default orchestration path is expected to return the same safe artifact
summary structure for the selected adapter behavior.

## Artifact URL Scheme Boundary

Artifact URLs must use the `artifact://voxweave/` scheme. The tests reject
transport schemes and host material in artifact URL values.

## Artifact Kind Boundary

The current source-of-truth safe artifact kinds are `mock_audio`,
`dry_run_audio`, `subtitle_vtt`, and `live2d_cue_json`.

## No Raw Artifact Boundary

The tests recursively reject raw artifact, raw payload, raw response, payload
body, cue body, and raw audio field names.

## No Endpoint / Secret / Token Boundary

The tests recursively reject endpoint, renderer endpoint, authorization,
credential, API key, secret, and token field names.

## No Canonical Envelope / Command Boundary

The tests recursively reject canonical envelope and command-like field names in
service output.

## Runtime Readiness Claim Boundary

The tests assert runtime readiness is false or absent and reject runtime,
production, real TTS, ASR, and Live2D renderer readiness field names.

## Safe Response Boundary

The test checks only selected safe metadata fields and does not persist complete
response objects.

## Forbidden Field Boundary

Forbidden field rejection is recursive and covers nested artifact metadata,
response summaries, mock TTS metadata, Live2D delivery metadata, and render
group metadata.

## No Runtime / Server / API Boundary

runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
apiCallAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no

The tests instantiate the service directly and do not start a server, call
HTTP, or call adapter endpoints.

## No Product Verification Execution Boundary

productVerificationExecutionAllowedInThisTask: no
productVerificationExecutionStatus: not_executed

## No Remote Diagnostic Execution Boundary

remoteDiagnosticExecutionAllowedInThisTask: no
remoteDiagnosticExecutionStatus: not_executed

## No Real TTS / ASR / Live2D Boundary

ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
realTtsConnectionStatus: not_connected
asrExecutionStatus: not_executed
live2dRendererExecutionStatus: not_executed

## No Raw Audio Boundary

rawAudioAllowedInThisTask: no
rawAudioProcessingStatus: not_executed

## Workflow / Package / Source Boundary

workflowChangeStatus: none
packageChangeStatus: scripts_test_only
lockfileChangeStatus: none
sourceChangeStatus: none
scriptChangeStatus: none

## Test Discovery Boundary

testDiscoveryFixStatus: package_json_test_script_only
testDiscoveryBoundaryStatus: explicit_and_bounded

The package test script remains an explicit list and appends
`test/artifact-metadata-boundaries.test.js`.

## v1.2.2 Read Budget Boundary

readBudgetStatus: pass
readBudgetProfile: routine
requiredFirstReadsObserved: AGENTS.md, docs/process/CODEX_HARNESS_MANIFEST.json, docs/process/CODEX_V122_SPEC.md
deferredReads: README.md, docs/BOUNDARY.md

## Test Coverage Evidence

changed area: package.json scripts.test, test/artifact-metadata-boundaries.test.js, docs/process/CODEX_VOXWEAVE_ARTIFACT_METADATA_BOUNDARY_TESTS_V1_2_2.md
test command: node --test test/artifact-metadata-boundaries.test.js; npm test
what the test covers: TTS, subtitle, Live2D, default orchestrate artifact metadata, artifact URL scheme, artifact kind, no raw artifact, no endpoint/secret/token, no canonical envelope/command, no readiness claim
edge cases / failure paths / reason if no test: unsupported locale dry-run artifact metadata and recursive forbidden key rejection are covered; source and runtime paths are unchanged

## Quality Gate Evidence

previous related QG evidence: PR #269 timing boundary baseline QG SUCCESS
expected QG behavior: natural remote QG should pass with bounded explicit test discovery
manual rerun status: no manual rerun
merge readiness: no

## Decision Matrix

currentActiveHarness: v1.2.2
activeSelfTestSuite: v122
terminalAction: create_pr_only
artifactMetadataBoundaryTestStatus: candidate_only
runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
apiCallAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no
ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
rawAudioAllowedInThisTask: no
productVerificationExecutionAllowedInThisTask: no
remoteDiagnosticExecutionAllowedInThisTask: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
mergeReadiness: no

## Risk Register

- These tests validate artifact metadata boundaries and do not prove runtime or
  production readiness.
- The tests use direct service calls only and do not exercise server routes.
- Existing source behavior is preserved; any future artifact kind change should
  update tests only with owner-scoped source-of-truth evidence.

## Safe Next Action

Run local validation and create a draft candidate PR if all gates pass.
