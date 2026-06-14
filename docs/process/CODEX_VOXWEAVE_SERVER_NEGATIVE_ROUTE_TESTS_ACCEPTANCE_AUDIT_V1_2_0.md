# VOXWEAVE Server Negative Route Tests Acceptance Audit v1.2.0

## Executive Summary

This docs-only acceptance audit records the candidate evidence for VOXWEAVE Server Negative Route Tests v1.2.0. It does not change product source, tests, package metadata, workflows, scripts, lockfiles, harness files, or runtime behavior.

## Candidate Reference

- Candidate PR: #256.
- Candidate title: VOXWEAVE Server Negative Route Tests v1.2.0.
- Candidate branch: codex/voxweave-v1-2-0-server-negative-route-tests-001.
- Candidate head: c0fdb6f3178a92c64beadfe493df1e7b6649d997.
- Candidate changed files: package.json, test/server-negative-routes.test.js, docs/process/CODEX_VOXWEAVE_SERVER_NEGATIVE_ROUTE_TESTS_V1_2_0.md.
- Candidate natural quality gate: SUCCESS.

## Same-Head Candidate Verification

The candidate PR head observed for this audit is c0fdb6f3178a92c64beadfe493df1e7b6649d997. The quality gate success is associated with that head.

## Local Test Evidence

- node --check test/server-negative-routes.test.js: pass.
- node --test test/server-negative-routes.test.js: 20 pass.
- node --test test/stateful-helpers.test.js: 22 pass.
- node --test test/live2d-forwarder.test.js: 19 pass.
- node --test test/orchestrator-service.test.js: 16 pass.
- node --test test/contracts-boundary.test.js: 26 pass.
- node --test test/server-routes.test.js: 8 pass.
- node --test test/voxweave.test.js: 42 pass / 1 skipped.
- npm test: 153 pass / 1 skipped.

## Test Discovery Boundary

The candidate keeps npm test as an explicit file list and appends only test/server-negative-routes.test.js. It does not revert to broad node --test discovery.

## Auth Boundary

The candidate verifies public health routes remain public with VOXWEAVE_API_KEY configured, write routes reject missing or wrong fake keys, and write routes accept fake bearer and x-api-key values. The environment variable is restored by the test helper.

## Public Health Boundary

The candidate verifies GET /health and GET /v1/health remain safe public health checks.

## Method Boundary

The candidate verifies GET and PUT on /v1/orchestrate return safe not_found responses.

## Unknown Route Boundary

The candidate verifies POST /unknown returns a safe not_found response.

## Invalid JSON Boundary

The candidate verifies malformed JSON returns a safe invalid_json response.

## Empty Body Boundary

The candidate records current source behavior: empty POST body is parsed as an empty object and returns safe orchestration metadata with adapter_kind set to orchestrate.

## Body Limit Boundary

The candidate verifies oversized request body handling returns request_body_too_large with safe response shape.

## Adapter Mismatch Boundary

The candidate verifies adapter route mismatches are rejected with safe adapter_kind_mismatch responses.

## Forbidden Payload Boundary

The candidate verifies command, raw_audio, endpoint, and unsafe transport string payloads are rejected with safe unsafe_payload responses.

## Safe Error Boundary

The candidate verifies safe errors avoid forbidden raw, payload, authority, endpoint, and credential fields recursively.

## Response Header Boundary

The candidate verifies JSON content type and no-store cache control on success and safe error responses.

## No Runtime / Product Verification / Remote Diagnostic Boundary

The candidate uses only scoped local loopback test servers. It does not execute product verification, remote diagnostics, real TTS, ASR, Live2D renderer execution, raw audio processing, external API calls, or external HTTP endpoints.

## Package / Workflow / Source Boundary

The candidate changes package.json scripts.test only. It does not change src/**, scripts/**, .github/**, lockfiles, dependencies, harness manifests, or harness specs.

## Leak / Readiness Boundary

The candidate does not print raw request bodies, raw response bodies, raw artifacts, secrets, tokens, endpoint values, or production data. It does not claim runtime readiness, production readiness, real TTS readiness, ASR readiness, Live2D renderer readiness, benchmark readiness, or merge readiness.

## Acceptance Decision

- currentActiveHarness: v1.2.0.
- candidateQGStatus: SUCCESS.
- acceptanceAuditStatus: docs_only_candidate_accepted_for_final_pre_merge_gates.
- manualRerunStatus: no_manual_rerun.
- runtimeExecutionAllowedInThisTask: limited_local_test_server_only.
- productVerificationExecutionAllowedInThisTask: no.
- remoteDiagnosticExecutionAllowedInThisTask: no.
- mergeReadiness: no.

## Safe Next Action

Let this docs-only acceptance audit PR run its natural quality gate. If it succeeds, perform fresh final pre-merge gates against candidate PR #256 before any merge action.
