# VOXWEAVE Fixed-Length Digest Credential Comparison Boundary v1.2.6

## Executive Summary

This implementation replaces the write-route credential equality boundary with
a fixed-length SHA-256 digest comparison using Node.js timingSafeEqual. It also
adds explicit extraction rules for write credentials so duplicate credential
headers, malformed Bearer values, and multiple credential sources collapse to
the same safe auth_required response.

This is an operational authentication hardening change. It does not claim full
timing attack elimination, runtime readiness, production readiness, product
verification execution, remote diagnostic execution, real TTS readiness, ASR
readiness, or Live2D renderer readiness.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineOperationalAuditPr: #390
- baselineOperationalAuditMergeCommitSha:
  91873042a573094501705eadcd7e8d84be4394ea
- changedFiles:
  - src/server.js
  - test/server-negative-routes.test.js
  - docs/process/CODEX_VOXWEAVE_CONSTANT_TIME_CREDENTIAL_BOUNDARY_V1_2_6.md

## Credential Comparison Boundary

- previousCredentialComparisonMode: ordinary_string_equality
- currentCredentialComparisonMode: fixed_length_digest_timing_safe_equal
- digestAlgorithm: sha256
- digestLengthBytes: 32
- directSecretStringComparisonStatus: removed_from_authorization_decision
- timingAttackEliminationClaimed: no

The comparison helper hashes both candidate and expected credential values into
fixed-length digests before comparing them with timingSafeEqual. Empty candidate
or expected values fail closed.

## Credential Extraction Boundary

- exportedCredentialDigestStatus: implemented
- exportedConstantTimeCredentialMatchStatus: implemented
- exportedExtractWriteCredentialStatus: implemented
- bearerTokenParsingStatus: strict_single_token_bearer
- apiKeyHeaderStatus: supported_single_source
- multipleCredentialSourcePolicyStatus: rejected
- duplicateCredentialHeaderPolicyStatus: rejected
- malformedBearerPolicyStatus: rejected
- safeAuthFailureStatus: auth_required_401

The extraction boundary accepts exactly one supported credential source:
a Bearer authorization header or x-api-key. Duplicate credential headers are
detected from rawHeaders and rejected before credential projection. Multiple credential
sources are also rejected. All these failures return the existing safe
auth_required response without projecting credential source, value, length, or
reason to clients.

## Test Coverage Evidence

- testCommand: node --test test/server-negative-routes.test.js
- result: pass
- passCount: 40
- coveredBoundaries:
  - fixed-length digest helper shape
  - constant-time helper true/false/empty cases
  - single Bearer credential extraction
  - single x-api-key credential extraction
  - multiple credential source rejection
  - malformed Bearer rejection
  - duplicate Authorization header rejection through node:net raw request
  - duplicate x-api-key header rejection through node:net raw request
  - existing authenticated write-route success paths
  - existing wrong/missing auth safe error paths

## No Runtime Boundary

- runtimeExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realProviderExecutionStatus: not_executed
- realTtsExecutionStatus: not_executed
- asrExecutionStatus: not_executed
- live2dRendererExecutionStatus: not_executed
- rawAudioProcessed: no

The tests use local loopback test servers already present in the route test
suite and a node:net raw request only to exercise duplicate header parsing.
They do not start product runtime through npm start, call external endpoints,
or use real provider integrations.

## Safe Output Boundary

- rawCredentialOutputStatus: excluded
- rawRequestBodyOutputStatus: excluded
- rawResponseSnapshotStatus: excluded
- secretProjectionStatus: excluded
- endpointProjectionStatus: excluded
- privatePathProjectionStatus: excluded

The tests inspect only safe status codes, safe error kinds, safe response
headers, and recursively forbidden response keys. They do not print raw
payloads, raw responses, credential values, endpoint values, or raw artifacts.

## Workflow / Package / Harness Boundary

- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- harnessArtifactChangeStatus: none
- scriptChangeStatus: none
- sourceChangeStatus: src/server.js only
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_then_merge_if_gated |
| credentialComparisonHardeningStatus | implemented |
| duplicateCredentialHeaderPolicyStatus | rejected |
| multipleCredentialSourcePolicyStatus | rejected |
| bearerTokenParsingStatus | strict_single_token_bearer |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- riskId: network_level_timing_variance
  - status: residual
  - note: Fixed-length digest comparison reduces direct comparison leakage but
    does not prove end-to-end timing attack elimination.
- riskId: credential_policy_compatibility
  - status: accepted
  - note: Requests presenting both supported credential sources now fail closed.
- riskId: duplicate_header_visibility
  - status: mitigated
  - note: rawHeaders are used to detect duplicate supported credential headers.

## Safe Next Action

Proceed to canonical_request_target_boundary after this candidate receives
same-head natural QG SUCCESS, merge, and post-merge validation.
