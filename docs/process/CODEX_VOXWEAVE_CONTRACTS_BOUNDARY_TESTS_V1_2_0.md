# VOXWEAVE Contracts Boundary Tests v1.2.0

## Executive Summary

This candidate adds unit coverage for `src/contracts.js` safety boundaries under
the current v1.2.0 harness source-of-truth. It does not change product source,
workflow, scripts, lockfiles, dependencies, runtime behavior, or endpoint
configuration.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Candidate branch: `codex/voxweave-v1-2-0-contracts-boundary-tests-001`
- Current main source-of-truth before implementation: `d89c0d8e3e21cbc58eca2e6de82904b47dc0017f`
- Source files inspected: `src/contracts.js`, `src/errors.js`, `README.md`,
  `docs/BOUNDARY.md`, route tests, and existing product tests.

## Current Active Harness Confirmation

- `AGENTS.md` marker: `CODEX_QUALITY_HARNESS_FILE v1.2.0`
- Manifest active harness: `1.2.0`
- Local quality gate harness version: `1.2.0`
- `CODEX_V118_SPEC.md`, `CODEX_V119_SPEC.md`, and `CODEX_V120_SPEC.md` exist.

## PR #240 Route Contract Baseline Evidence

PR #240 merged route-level contract tests and the test discovery fix. Its
artifacts are present on current main, including
`test/server-routes.test.js`, the explicit `npm test` file list, and the
route-level evidence document.

## Contracts Boundary Test Scope

The new test file imports only exported contract and error helpers. It does not
start a server, call HTTP, call adapter endpoints, run the orchestrator, or add
dependencies.

## Input Payload Boundary

The tests assert that non-object payloads fail with the safe invalid payload
error and that minimal safe IRIS adapter packets are accepted for `tts`,
`subtitle`, and `live2d`.

## Adapter Kind Boundary

The tests lock the current `normalizeAdapterKind` behavior for valid adapter
kinds and for unknown or empty values, which normalize to the current safe
default.

## Adapter Validation Boundary

The tests assert that `iris_adapter_packet_v1` payloads require
`adapter_validation_required: true`.

## Route Kind Mismatch Boundary

The tests assert that route kind mismatch fails with the current safe adapter
kind mismatch error.

## Canonical Envelope Boundary

The tests cover the current canonical envelope whitelist behavior: allowed safe
fields are accepted, while unsafe canonical envelope fields are rejected.

## Forbidden Input Field Boundary

The tests cover representative forbidden input fields including command,
raw-audio, and endpoint fields.

## Unsafe Value Boundary

The tests assert rejection of unsafe URL-shaped values and unsafe model-path
shaped values without using real secrets or production values.

## Safe Response Boundary

The tests assert that `assertSafeResponse` rejects unsafe response values and
forbidden response fields.

## Artifact URL Exception Boundary

The tests assert that the current `artifact://voxweave/` exception is accepted
for safe response artifact URL values.

## Forbidden Response Field Boundary

The tests cover top-level and nested forbidden response fields, including
canonical envelope, command, renderer endpoint, token, and nested raw-audio
fields.

## Safe Text / Safe ID Boundary

The tests lock current `safeId`, `safeText`, and `clamp` behavior for unsafe
character stripping, whitespace normalization, length bounding, and range
bounding.

## No Runtime Boundary

This candidate does not execute runtime readiness, production readiness, real
TTS, ASR, benchmark, or renderer flows.

## No Server / API Boundary

The candidate test file does not import `src/server.js`, start a server, call
HTTP, or call adapter endpoints.

## No Product Verification Execution Boundary

No product verification execution is part of this candidate.

## No Remote Diagnostic Execution Boundary

No remote diagnostic execution is part of this candidate.

## Workflow / Package / Source Boundary

Changed files are limited to `package.json`,
`test/contracts-boundary.test.js`, and this evidence document. The package
change is limited to `scripts.test`.

## Test Discovery Boundary

`npm test` remains an explicit test file list and now includes
`test/contracts-boundary.test.js`. It does not broaden discovery to historical
script self-tests.

## Test Coverage Evidence

changed area: `package.json` test discovery, `test/contracts-boundary.test.js`,
and this v1.2.0 evidence document.

test command: `node --check test/contracts-boundary.test.js`;
`node --test test/contracts-boundary.test.js`;
`node --test test/server-routes.test.js`;
`node --test test/voxweave.test.js`; `npm test`; diff and safety scans.

what the test covers: adapter kind normalization, input payload rejection and
acceptance boundaries, adapter validation, route mismatch, canonical envelope
whitelist, forbidden input fields, unsafe values, safe response rejection,
artifact URL exception, forbidden response fields, safe text, safe id, and clamp.

edge cases / failure paths / reason if no test: runtime, server, HTTP, adapter
endpoint, product verification, and remote diagnostic paths are intentionally
not executed because this candidate is contracts-boundary unit coverage only.

## Quality Gate Evidence

previous related QG evidence: PR #240 merged route-level contract tests; PR
#239 and PR #241 remain evidence-only draft PRs; PR #236 and PR #237 provide
planning evidence.

expected QG behavior: natural quality gate should evaluate this candidate
without product verification execution, remote diagnostics, real TTS, ASR, or
Live2D renderer calls.

manual rerun status: no_manual_rerun.

merge readiness: no.

## Decision Matrix

| decision | value |
| --- | --- |
| currentActiveHarness | v1.2.0 |
| terminalAction | create_pr_only |
| contractsBoundaryTestStatus | candidate_only |
| testDiscoveryFixStatus | package_json_test_script_only |
| runtimeExecutionAllowedInThisTask | no |
| serverStartAllowedInThisTask | no |
| apiCallAllowedInThisTask | no |
| adapterEndpointCallAllowedInThisTask | no |
| ttsEngineCallAllowedInThisTask | no |
| asrEngineCallAllowedInThisTask | no |
| live2dRendererCallAllowedInThisTask | no |
| rawAudioAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- Current main has advanced from the inherited v1.1.8 handoff to v1.2.0; this
  candidate uses v1.2.0 filenames and source-of-truth.
- The tests intentionally follow current exported behavior and do not request
  source changes.
- These tests do not prove runtime, production, real TTS, ASR, Live2D renderer,
  benchmark, product verification, or remote diagnostic readiness.

## Safe Next Action

Run local validation and safety scans, then create a draft candidate PR if all
gates pass.
