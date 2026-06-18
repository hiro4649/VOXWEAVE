# VOXWEAVE Server Bind Authentication and JSON Boundary v1.2.6

## Executive Summary

This Phase B implementation hardens the VOXWEAVE server bind/authentication and
JSON write boundary identified by the Phase A integration readiness gap audit.

The change keeps default loopback behavior, preserves existing routes, requires
explicit opt-in plus an API key for non-loopback or wildcard binds, and requires
JSON Content-Type for allowed POST write routes before body parsing.

No runtime readiness, production readiness, real TTS readiness, ASR readiness, or
Live2D renderer readiness is claimed.

## Source Evidence

- currentActiveHarness: v1.2.6.
- baselineGapAuditPr: #365.
- implementationScope: `server_bind_auth_json_boundary`.
- changedSource:
  - `src/server.js`.
- changedTests:
  - `test/server-negative-routes.test.js`.
- changedDocs:
  - `docs/process/CODEX_VOXWEAVE_SERVER_BIND_AUTH_JSON_BOUNDARY_V1_2_6.md`.

## Server Bind Boundary

- defaultLoopbackBindStatus: preserved.
- nonLoopbackExplicitOptInRequiredStatus: pass.
- nonLoopbackApiKeyRequiredStatus: pass.
- unsafeServerBindErrorStatus: pass.
- externalBindExecutionStatus: no.
- externalNetworkExecutionStatus: no.

The server now classifies bind hosts as `loopback`, `wildcard`, `non_loopback`,
or `invalid`. Loopback binds are allowed without an API key. Wildcard and
non-loopback binds require both a non-empty API key and an explicit opt-in flag.
Invalid bind hosts are blocked. Error text does not include host, API key, or
environment values.

## JSON Write Boundary

- jsonWriteContentTypeRequiredStatus: pass.
- browserSimpleWriteBoundaryStatus: hardened.
- authBeforeBodyParseStatus: preserved.
- contentTypeBeforeBodyParseStatus: pass.
- unknownRouteStatus: existing_404_preserved.

Allowed POST write routes now require `application/json` or
`application/json; ...` before body parsing. Missing or non-JSON Content-Type
returns a safe `unsupported_media_type` response. Unknown POST routes continue
to return safe 404 without exposing Content-Type detail.

## Response Header Boundary

- cacheControlNoStoreStatus: preserved.
- jsonResponseContentTypeStatus: preserved.
- xContentTypeOptionsNosniffStatus: added.

## Product Boundary

- existingRoutesChangedStatus: no.
- packageChangeStatus: none.
- workflowChangeStatus: none.
- lockfileChangeStatus: none.
- dependencyChangeStatus: none.
- realTtsExecutionStatus: no.
- asrExecutionStatus: no.
- live2dRendererExecutionStatus: no.
- productVerificationExecutionStatus: no.
- remoteDiagnosticExecutionStatus: no.
- runtimeReadinessClaimed: no.
- productionReadinessClaimed: no.

## Test Coverage Evidence

New and preserved tests cover:

- Loopback host classification.
- Wildcard host classification.
- Hostname spoof strings that begin with `127.` but are not literal IPv4
  addresses.
- Invalid host classification.
- Loopback bind without API key.
- Wildcard and non-loopback bind blocking without both API key and opt-in.
- Safe bind error redaction.
- `startServer` blocking unsafe bind before listen.
- Authenticated JSON POST success.
- Missing, `text/plain`, and form Content-Type rejection.
- JSON charset acceptance.
- Unknown POST route preserving safe 404.
- Invalid JSON preserving safe 400.
- Body limit preserving safe 413.
- Route mismatch preserving safe 400.
- Safe response headers including `no-store` and `nosniff`.

## Validation

Expected validation:

- `node --check src/server.js`.
- `node --test test/server-negative-routes.test.js`.
- `node --test test/server-routes.test.js`.
- v126-v122 self-tests.
- `node scripts/codex-local-quality-gate.mjs`.
- `npm test`.
- `git diff --check`.

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| baselineGapAuditPr | #365 |
| implementationScope | server_bind_auth_json_boundary |
| defaultLoopbackBindStatus | preserved |
| nonLoopbackExplicitOptInRequiredStatus | pass |
| nonLoopbackApiKeyRequiredStatus | pass |
| jsonWriteContentTypeRequiredStatus | pass |
| browserSimpleWriteBoundaryStatus | hardened |
| unsafeServerBindErrorStatus | pass |
| externalBindExecutionStatus | no |
| externalNetworkExecutionStatus | no |
| existingRoutesChangedStatus | no |
| packageChangeStatus | none |
| workflowChangeStatus | none |
| lockfileChangeStatus | none |
| dependencyChangeStatus | none |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |

## Safe Next Action

Proceed to Phase C only after same-head natural QG success, merge commit, and
post-merge validation.
