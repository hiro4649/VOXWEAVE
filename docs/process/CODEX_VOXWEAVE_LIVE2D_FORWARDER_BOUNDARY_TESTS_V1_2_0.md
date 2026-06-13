# VOXWEAVE Live2D Forwarder Boundary Tests v1.2.0

## Executive Summary

This candidate adds unit-level boundary coverage for `src/live2dForwarder.js` under the active Codex Harness v1.2.0 source-of-truth. The tests use only fake `fetchImpl` calls and do not start a server, call HTTP endpoints, call an adapter endpoint, or execute a real Live2D renderer.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Active main before this candidate: `3df8ac8bb0f707d9dba4a6d9dcdfe092ecb325f3`
- Scope classification: test-only product boundary coverage plus an explicit npm test discovery update.
- Changed files: `package.json`, `test/live2d-forwarder.test.js`, and this evidence document.

## Current Active Harness Confirmation

- currentActiveHarness: v1.2.0
- AGENTS marker: `CODEX_QUALITY_HARNESS_FILE v1.2.0`
- manifest activeHarnessVersion: `1.2.0`
- local QG HARNESS_VERSION: `1.2.0`
- v1.2.0 spec exists: yes

## PR #247 Orchestrator Service Baseline Evidence

PR #247 is merged on main and established the orchestrator service contract test baseline. This candidate builds on that merged baseline by testing the Live2D forwarder helper directly, without changing `src/**`.

## Live2D Forwarder Test Scope

The test file imports `createLive2dForwarder` and verifies safe summaries, endpoint normalization outcomes, fake fetch invocation shape, failure mapping, and forbidden summary field absence.

## Dry-Run Boundary

No endpoint returns `dry_run`, `not_configured`, and no forward attempt.

## Endpoint Normalization Boundary

Root paths default to `/live2d-engine`, `/cue` is preserved, and custom paths append `/live2d-engine` according to current source behavior.

## Loopback Boundary

`localhost`, `127.0.0.1`, and other `127.*` hosts are accepted only through fake fetch and return loopback-scoped summaries.

## Private Network Boundary

Private IPv4 ranges supported by the source are accepted only through fake fetch and return private-scoped summaries.

## Blocked Endpoint Boundary

Invalid schemes, public hosts, credentials, query strings, and fragments are blocked before fake fetch and return configured-unusable safe summaries.

## API Key Header Boundary

The `x-api-key` header is present only when a fake API key is provided. The tests do not print or persist the header value.

## Fake Fetch Boundary

All forwarding assertions use injected fake fetch functions. No real network or renderer process is called.

## Accepted Renderer Summary Boundary

Fake fetch responses with `ok: true` map to `accepted` and `renderer_forward_ok: true`.

## Rejected Renderer Summary Boundary

Fake fetch responses with `ok: false` map to `renderer_rejected` and `renderer_forward_ok: false`.

## Timeout Boundary

Fake `AbortError` failures map to `renderer_timeout`.

## Unreachable Boundary

Generic fake fetch failures map to `renderer_unreachable`.

## Configured Unusable Boundary

Missing fetch implementation or blocked endpoint configuration returns `configured_unusable` without a forward attempt.

## Safe Summary Boundary

Summaries are recursively checked for forbidden endpoint, secret, token, raw payload, raw cue, command, and canonical envelope fields.

## No Raw Cue Boundary

Tests do not snapshot or print raw cue payloads. Cue data is a minimal local fixture only.

## No Endpoint / Secret / Token Boundary

No real endpoint, secret, or token is added. Endpoint strings are fake local/private fixtures used only to exercise current source normalization.

## No Runtime / Server / API Boundary

No runtime server is started, and no API or adapter endpoint is called.

## No Real Live2D Renderer Boundary

The candidate does not call or replace a real Live2D renderer. It only verifies the safe forwarder contract with fake fetch.

## No Product Verification Execution Boundary

This is not product verification execution.

## No Remote Diagnostic Execution Boundary

This is not remote diagnostic execution.

## Workflow / Package / Source Boundary

No workflow, source, script, dependency, lockfile, harness, or AGENTS changes are included. The package change is limited to `scripts.test`.

## Test Discovery Boundary

`npm test` remains an explicit file list and adds only `test/live2d-forwarder.test.js`.

## Test Coverage Evidence

- changed area: Live2D forwarder boundary unit tests and npm test discovery list
- test command: `node --test test/live2d-forwarder.test.js`
- what the test covers: dry-run, blocked endpoints, loopback/private endpoints, fake fetch success and failure mapping, API key header presence, timeout, unreachable, and safe summary fields
- edge cases / failure paths / reason if no test: real renderer, real HTTP, adapter endpoints, product verification, and remote diagnostics are intentionally out of scope

## Quality Gate Evidence

- previous related QG evidence: PR #247 merged with QG SUCCESS and post-merge sentinel QG SUCCESS
- expected QG behavior: natural QG should evaluate the candidate branch without manual rerun
- manual rerun status: no_manual_rerun
- merge readiness: no

## Decision Matrix

- currentActiveHarness: v1.2.0
- terminalAction: create_pr_only
- live2dForwarderBoundaryTestStatus: candidate_only
- testDiscoveryFixStatus: package_json_test_script_only
- runtimeExecutionAllowedInThisTask: no
- serverStartAllowedInThisTask: no
- apiCallAllowedInThisTask: no
- adapterEndpointCallAllowedInThisTask: no
- ttsEngineCallAllowedInThisTask: no
- asrEngineCallAllowedInThisTask: no
- live2dRendererCallAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- Risk: fake fetch assertions could drift if source endpoint normalization changes.
  Mitigation: tests document current source-of-truth behavior and do not change `src/**`.
- Risk: npm test discovery could broaden unintentionally.
  Mitigation: `scripts.test` remains an explicit test file list.

## Safe Next Action

Run the scoped local validation commands, push the candidate branch, and create a draft PR if all gates pass.
