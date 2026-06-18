# VOXWEAVE Operational Authentication and Request Lifecycle Gap Audit v1.2.6

## Executive Summary

This docs-only audit records the current operational authentication and request
lifecycle gaps observed after the v1.2.6 acceptance provenance closure
inventory. The baseline is main at
397cb562ea0e4c06d4f59bf1569cbb6fd70ec601, with PR #389 merged and no actual
external team receipt present.

This audit does not change source, tests, package files, workflows, runtime
configuration, endpoint configuration, or harness artifacts. It does not execute
runtime verification, product verification, remote diagnostics, real TTS, ASR,
Live2D rendering, raw audio processing, external providers, or external
endpoints.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineAcceptanceProvenanceClosurePr: #389
- baselineAcceptanceProvenanceClosureMergeCommitSha:
  397cb562ea0e4c06d4f59bf1569cbb6fd70ec601
- observedFiles:
  - AGENTS.md
  - docs/process/CODEX_HARNESS_MANIFEST.json
  - docs/process/CODEX_V126_SPEC.md
  - docs/process/CODEX_VOXWEAVE_ACCEPTANCE_PROVENANCE_CLOSURE_INVENTORY_V1_2_6.md
  - src/server.js
  - src/errors.js
  - test/server-routes.test.js
  - test/server-negative-routes.test.js
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started

## Current Active Harness Confirmation

AGENTS.md and docs/process/CODEX_HARNESS_MANIFEST.json identify the active
target harness as v1.2.6 / v126. docs/process/CODEX_V126_SPEC.md is present.
This audit is recorded under v1.2.6 and does not reinterpret older v1.1.8,
v1.2.0, v1.2.4, or v1.2.5 task semantics as the active source of truth.

## Baseline Closure Evidence

The acceptance provenance closure inventory was merged through PR #389 at
397cb562ea0e4c06d4f59bf1569cbb6fd70ec601. This audit starts after that
closure state and treats the absence of an actual external team receipt as a
non-blocking observation for operational hardening work.

## Credential Comparison Boundary

- credentialComparisonMode: ordinary_string_equality
- credentialLengthSideChannelStatus: present_risk
- credentialComparisonHardeningRequiredStatus: yes
- duplicateCredentialHeaderPolicyStatus: not_explicitly_rejected
- multipleCredentialSourcePolicyStatus: ambiguous_accepts_either_source
- bearerTokenParsingStatus: permissive_single_match
- apiKeyValueProjectionStatus: direct_header_string_projection
- severity: medium

The write-route authorization path currently compares the configured write API
key against a parsed Bearer value or x-api-key value with ordinary string
equality. That is simple and functional, but it does not provide a fixed-length
constant-time comparison boundary and does not explicitly reject duplicate or
conflicting credential sources before comparison.

Recommended next implementation scope:
constant_time_credential_boundary.

## Request Target Boundary

- requestTargetFormStatus: not_explicitly_restricted_to_origin_form
- absoluteFormRequestTargetStatus: may_normalize_to_pathname
- networkPathRequestTargetStatus: may_normalize_to_pathname
- queryParameterWriteRouteStatus: query_bearing_target_can_reach_pathname
- dotSegmentNormalizationStatus: may_normalize_before_allowlist
- encodedDotSegmentNormalizationStatus: insufficient_raw_target_policy
- backslashNormalizationStatus: insufficient_raw_target_policy
- percentEncodedPathStatus: insufficient_raw_target_policy
- exactRawRouteAllowlistStatus: missing
- rawRequestTargetCanonicalizationStatus: insufficient
- normalizedAliasToAllowedRouteRiskStatus: present
- severity: high

The route decision currently derives a WHATWG URL object from request.url and
uses the normalized pathname for routing. This creates a gap between the raw
request target and the allowlist decision. The product should reject non-origin
forms, query-bearing write targets, dot segment aliases, encoded aliases,
backslashes, ambiguous percent-encoded paths, and other non-canonical request
targets before route resolution.

Recommended next implementation scope:
canonical_request_target_boundary.

## Body Size Boundary

- streamBodyLimitStatus: implemented
- contentLengthEarlyGuardStatus: missing
- requestAbortClassificationStatus: not_explicitly_classified
- severity: medium

The body reader enforces MAX_BODY_BYTES while streaming request chunks. It does
not currently reject an excessive Content-Length before entering body iteration,
and abort/error classification is not separately documented as a safe request
lifecycle boundary.

Recommended next implementation scope:
request_lifecycle_policy_and_safe_shutdown.

## Server Lifecycle Boundary

- requestTimeoutPolicyStatus: missing
- headersTimeoutPolicyStatus: missing
- keepAliveTimeoutPolicyStatus: missing
- maxRequestsPerSocketStatus: missing
- maxHeadersCountStatus: missing
- explicitRequestLifecyclePolicyStatus: missing
- severity: medium

The server creation path does not explicitly configure bounded request timeout,
headers timeout, keep-alive timeout, max requests per socket, or max header
count values in product code. Default platform behavior may be acceptable for
basic local operation, but it is not an explicit operational contract.

Recommended next implementation scope:
request_lifecycle_policy_and_safe_shutdown.

## Startup And Shutdown Boundary

- safeStartupLoggingStatus: missing
- transportValueLogExclusionStatus: fail
- safeShutdownHelperStatus: missing
- severity: low_to_medium

The startup path currently emits a listening message containing the bind host
and port. A safe startup summary should avoid transport values and preserve a
bounded, schema-shaped operational signal. A bounded shutdown helper and safe
shutdown summary are also absent from the product code.

Recommended next implementation scope:
request_lifecycle_policy_and_safe_shutdown.

## Decision Matrix

| Area | Observed status | Severity | Recommended action |
| --- | --- | --- | --- |
| Credential comparison | ordinary string equality | medium | fixed-length digest comparison |
| Duplicate credentials | not explicit | medium | reject duplicate/conflicting sources safely |
| Request target parsing | normalized pathname routing | high | raw canonical request target guard |
| Content-Length guard | missing early rejection | medium | reject excessive declared body size |
| Server lifecycle policy | missing explicit values | medium | apply bounded lifecycle defaults |
| Startup logging | transport values logged | low_to_medium | emit safe startup summary |
| Shutdown helper | missing | medium | add bounded safe shutdown helper |

## Risk Register

- riskId: operational_auth_length_signal
  - status: open
  - ownerNextAction: constant_time_credential_boundary
- riskId: normalized_request_target_alias
  - status: open
  - ownerNextAction: canonical_request_target_boundary
- riskId: declared_body_size_late_rejection
  - status: open
  - ownerNextAction: request_lifecycle_policy_and_safe_shutdown
- riskId: implicit_server_lifecycle_defaults
  - status: open
  - ownerNextAction: request_lifecycle_policy_and_safe_shutdown
- riskId: transport_value_startup_log
  - status: open
  - ownerNextAction: request_lifecycle_policy_and_safe_shutdown

## Boundary Statements

- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- productVerificationExecutionStatus: not_executed
- remoteDiagnosticExecutionStatus: not_executed
- rawLogsRead: no
- rawPayloadsRead: no
- rawResponsesRead: no
- secretsRead: no
- endpointValuesRead: no
- privatePathsRead: no
- rawAudioProcessed: no
- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- sourceChangeStatus: none
- scriptChangeStatus: none
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Recommended Implementation Order

1. constant_time_credential_boundary
2. canonical_request_target_boundary
3. request_lifecycle_policy_and_safe_shutdown
4. operational_boundary_snapshot_extension
5. operational_request_lifecycle_matrix

## Safe Next Action

- recommendedNextImplementationScope: constant_time_credential_boundary
- safeNextBranch:
  codex/voxweave-v1-2-6-constant-time-credential-boundary-001
- mergeReadiness: no
