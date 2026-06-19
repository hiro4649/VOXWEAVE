# VOXWEAVE Safe Error Projection Integration v1.2.7

## Executive Summary

This record documents Phase J of the VOXWEAVE v1.2.7 continuous failure
taxonomy development chain. The change projects registry-backed,
low-cardinality failure taxonomy metadata into safe HTTP error responses.

The projection is additive and fail-closed. It does not change existing HTTP
status choices, existing error kind choices, package discovery, dependencies,
workflow behavior, runtime execution boundaries, or readiness status.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainSha: 55d1514939876bf2499a7302941c37ddd1550e71
- sourceMainMeaning: post_phase_i_safe_failure_taxonomy_registry
- implementationPhase: Phase_J_safe_error_projection_integration
- registrySchema: voxweave_safe_failure_taxonomy_v1
- registryVersion: 1

## Scope

- changedProductSourceStatus: yes
- changedProductSourceFiles: src/errors.js, src/server.js
- changedRegistryStatus: no_entry_semantics_changed
- changedTestStatus: yes
- changedPackageStatus: no
- changedWorkflowStatus: no
- changedLockfileStatus: no
- dependencyChanged: no
- changedRuntimeBehaviorStatus: no
- changedHttpStatusStatus: no
- changedErrorKindStatus: no

## Safe Error Projection Boundary

- projectedFields: taxonomy_schema, failure_category, owner_scope, retryability, safe_message_class, raw_projection_policy
- preservedFields: ok, error, error_kind, boundary_policy, adapter_validation_required
- rawMessageProjectionAllowed: no
- rawStackProjectionAllowed: no
- rawPayloadProjectionAllowed: no
- endpointProjectionAllowed: no
- pathProjectionAllowed: no
- credentialProjectionAllowed: no
- highCardinalityProjectionAllowed: no
- projectionSource: HTTP_ERROR_KIND_REGISTRY
- projectionPolicy: safe_enum_only

## Fail-Closed Boundary

- unknownErrorKindProjectionStatus: internal_error_500
- statusMismatchProjectionStatus: internal_error_500
- plainErrorProjectionStatus: internal_error_500
- unknownCodeEchoAllowed: no
- mismatchedCodeEchoAllowed: no
- unsafeMessageEchoAllowed: no
- unsafeReasonEchoAllowed: no

## HTTP Status Non-Change Boundary

- not_foundStatus: 404
- auth_requiredStatus: 401
- server_busyStatus: 503
- operation_timeoutStatus: 504
- unsafe_responseStatus: 500
- payload_too_largeStatus: 400
- request_abortedStatus: 400
- operation_cancelledStatus: 408
- statusBehaviorChanged: no

## Direct Not Found Repair

- directNotFoundBodyStatusBefore: direct_minimal_body
- directNotFoundBodyStatusAfter: registry_backed_safe_error_path
- notFoundStatusPreserved: yes
- errorKindAddedWhereMissing: yes
- taxonomyFieldsAddedWhereMissing: yes
- rawRouteMaterialProjected: no

## No Runtime Boundary

- serverStartAllowedInThisPhase: no
- realTtsAllowedInThisPhase: no
- asrAllowedInThisPhase: no
- live2dRendererAllowedInThisPhase: no
- rawAudioAllowedInThisPhase: no
- externalApiAllowedInThisPhase: no
- productVerificationExecutionAllowedInThisPhase: no
- remoteDiagnosticExecutionAllowedInThisPhase: no
- externalAcceptanceExecutionAllowedInThisPhase: no
- actualReceiptGenerated: no

## Quality Evidence

- nodeCheckErrorsStatus: pass
- nodeCheckServerStatus: pass
- nodeCheckFailureTaxonomyTestStatus: pass
- nodeCheckServerNegativeRoutesStatus: pass
- nodeFailureTaxonomyTestStatus: pass_9
- nodeServerNegativeRoutesStatus: pass_85
- nodeContractsBoundaryStatus: pass_195
- nodeOrchestratorServiceStatus: pass_40
- nodeLive2dForwarderStatus: pass_29
- sourceIntegrityStatus: pass
- v127SelfTestStatus: pass
- v126SelfTestStatus: pass
- v125SelfTestStatus: pass
- v124SelfTestStatus: pass
- v123SelfTestStatus: pass
- v122SelfTestStatus: pass
- npmTestStatus: pass_633_1_skipped
- localQualityGateStatus: fail_closed_pending_remote_evidence
- localQualityGateFailClosedReasons: remoteProductEvidenceRunnerStatus, formalEvidencePrecedenceStatus, remoteNpmDiagnosticNormalizationStatus
- diffCheckStatus: pass
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add registry-backed metadata to safe HTTP errors | yes |
| Change existing HTTP status semantics | no |
| Echo unknown error codes | no |
| Trust status-mismatched VoxWeaveError values | no |
| Project raw error messages or stacks | no |
| Change package discovery | no |
| Add dependency or lockfile | no |
| Claim runtime or production readiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Unknown code leaks into client body | Unknown and mismatched errors fail closed to internal_error. |
| Taxonomy fields create high-cardinality leakage | Projection uses registry enum fields only. |
| Direct 404 route drifts from safe error shape | Direct not_found responses now use the same safe error path. |
| Existing route status changes accidentally | Route tests assert current statuses and taxonomy metadata together. |

## Safe Next Action

Run Phase J validation. If local checks pass or local QG fails closed only for
expected remote evidence on a product-relevant PR, create a draft PR and wait
for natural same-head QG without manual rerun, comments, or review requests.
