# VOXWEAVE Server Negative Route Tests v1.2.0

## Executive Summary

This candidate adds server negative route tests for VOXWEAVE under active harness v1.2.0. The change expands explicit npm test discovery by one test file and does not change source, scripts, workflows, lockfiles, dependencies, or harness files.

## Source Evidence

- Repository: hiro4649/VOXWEAVE.
- Current active branch target: main.
- Source-of-truth main before candidate work: e6f14817251e7f40e37290707f65a5c2759e14af.
- Changed files: package.json, test/server-negative-routes.test.js, docs/process/CODEX_VOXWEAVE_SERVER_NEGATIVE_ROUTE_TESTS_V1_2_0.md.

## Current Active Harness Confirmation

- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.0.
- Harness manifest activeHarnessVersion: 1.2.0.
- Local quality gate HARNESS_VERSION: 1.2.0.
- CODEX_V118_SPEC.md, CODEX_V119_SPEC.md, and CODEX_V120_SPEC.md are present.

## PR #240 Route Contract Baseline Evidence

PR #240 is merged and provides the route-level positive and safe error baseline for existing server endpoints. This candidate builds on that local loopback route contract without changing production source.

## PR #253 Stateful Helper Baseline Evidence

PR #253 is merged at e6f14817251e7f40e37290707f65a5c2759e14af and keeps the current explicit npm test baseline through stateful helper boundary tests. This candidate only appends the new negative route test file to that explicit test list.

## Server Negative Route Test Scope

The new tests instantiate createVoxWeaveServer in-process, bind to 127.0.0.1 on an ephemeral port, make local loopback fetch calls only, and close the server in finally. They do not call external hosts or product verification lanes.

## Auth Boundary

The tests verify that write routes require authentication when VOXWEAVE_API_KEY is configured, accept a fake bearer key, accept a fake x-api-key value, and reject a wrong fake key with a safe auth_required response. The environment variable is restored after each test.

## Public Health Boundary

The tests verify that GET /health and GET /v1/health remain public when write authentication is configured.

## Method Boundary

The tests verify unsupported GET and PUT methods on /v1/orchestrate return safe not_found responses.

## Unknown Route Boundary

The tests verify POST /unknown returns a safe not_found response.

## Invalid JSON Boundary

The tests verify malformed JSON returns a safe invalid_json response.

## Empty Body Boundary

The current source behavior treats an empty request body as an empty object and produces safe orchestration metadata with adapter_kind set to orchestrate. The test records that source-actual behavior without changing server code.

## Body Limit Boundary

The tests verify bodies larger than the source limit return a safe request_body_too_large response.

## Adapter Route Mismatch Boundary

The tests verify adapter route mismatches are rejected with safe adapter_kind_mismatch responses for tts and subtitle route examples.

## Forbidden Payload Boundary

The tests verify forbidden input fields command, raw_audio, and endpoint are rejected with safe unsafe_payload responses.

## Safe Error Boundary

The tests recursively check safe error responses for absence of forbidden raw, authority, credential, endpoint, and payload fields. Direct not_found responses currently expose error without error_kind, while VoxWeaveError paths expose both; the tests record that source-actual split without changing server code.

## Response Header Boundary

The tests verify both success and safe error responses use an application/json content type and no-store cache control.

## No Raw Payload Boundary

The tests do not print raw request bodies, raw response bodies, or snapshots. Assertions inspect status, safe error code, safe summary fields, and headers only.

## No Runtime Readiness Boundary

This candidate does not claim runtime readiness, production readiness, real TTS readiness, ASR readiness, Live2D renderer readiness, or benchmark readiness.

## No Product Verification Execution Boundary

This candidate does not execute product verification. Local loopback server tests are route contract tests only.

## No Remote Diagnostic Execution Boundary

This candidate does not execute remote diagnostics and does not inspect remote diagnostic artifacts.

## Workflow / Package / Source Boundary

No workflow, source, script, lockfile, dependency, harness, or manifest files are changed. The package.json change is limited to scripts.test.

## Test Discovery Boundary

The npm test script remains an explicit file list and now includes test/server-negative-routes.test.js. It is not reverted to broad node --test discovery.

## Test Coverage Evidence

- changed area: server negative route tests and explicit npm test discovery.
- test command: node --test test/server-negative-routes.test.js and npm test.
- what the test covers: auth-required write routes, public health routes, unsupported methods, unknown route, invalid JSON, empty body source behavior, request body limit, adapter route mismatch, forbidden payload fields, safe error shape, and response headers.
- edge cases / failure paths / reason if no test: external endpoint calls, real engines, product verification, and remote diagnostics are intentionally out of scope.

## Quality Gate Evidence

- previous related QG evidence: PR #240, PR #244, PR #247, PR #250, and PR #253 are merged with their corresponding evidence PRs left as draft evidence.
- expected QG behavior: natural quality gate should evaluate the candidate branch after push.
- manual rerun status: no_manual_rerun.
- merge readiness: no.

## Decision Matrix

- currentActiveHarness: v1.2.0
- terminalAction: create_pr_only
- serverNegativeRouteTestStatus: candidate_only
- testDiscoveryFixStatus: package_json_test_script_only
- runtimeExecutionAllowedInThisTask: limited_local_test_server_only
- serverStartAllowedInThisTask: limited_local_test_server_only
- apiCallAllowedInThisTask: local_loopback_test_only
- adapterEndpointCallAllowedInThisTask: local_loopback_test_only
- ttsEngineCallAllowedInThisTask: no
- asrEngineCallAllowedInThisTask: no
- live2dRendererCallAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- Empty body behavior is source-actual and may become stricter in a future explicitly scoped source change.
- Local loopback tests prove route contract behavior only and do not prove runtime readiness.
- Evidence PRs remain unmerged unless separately scoped by the owner.

## Safe Next Action

Run local validation, push the candidate branch, create a draft PR, and wait for natural quality gate completion without manual reruns, comments, or review requests.
