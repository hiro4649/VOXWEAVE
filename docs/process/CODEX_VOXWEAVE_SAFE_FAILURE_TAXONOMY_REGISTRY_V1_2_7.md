# VOXWEAVE Safe Failure Taxonomy Registry v1.2.7

## Executive Summary

This record documents Phase I of the VOXWEAVE v1.2.7 continuous failure
taxonomy development chain. The change adds a safe failure taxonomy registry
for current HTTP error kinds and Live2D forward statuses.

The registry is a pure low-cardinality metadata surface. It does not change
HTTP response bodies, route behavior, runtime behavior, package dependencies,
workflow behavior, external acceptance state, or readiness status.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainSha: dbdbf4f8b0c583aeff546d1d406ce5332d29e336
- sourceMainMeaning: post_phase_h_safe_observability_failure_taxonomy_gap_audit
- implementationPhase: Phase_I_safe_failure_taxonomy_registry
- registrySchema: voxweave_safe_failure_taxonomy_v1
- registryVersion: 1

## Scope

- changedProductSourceStatus: yes
- changedProductSourceFiles: src/failureTaxonomy.js, src/index.js
- changedTestStatus: yes
- changedPackageStatus: yes
- packageChangeScope: scripts_test_exact_file_append_only
- changedWorkflowStatus: no
- changedLockfileStatus: no
- changedRuntimeBehaviorStatus: no
- changedHttpResponseShapeStatus: no
- dependencyChanged: no

## HTTP Error Registry

- registryName: HTTP_ERROR_KIND_REGISTRY
- baselineErrorKindCount: 35
- sourceCoverageStatus: current_source_exact_coverage_required
- retryabilityInferredFromHttpStatusOnly: no
- rendererStatusMixedIntoHttpRegistry: no
- rawProjectionPolicy: safe_enum_only
- aggregateMetricAllowed: true
- highCardinalityDimensionsAllowed: false
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- safeSummaryOnly: true

## Live2D Forward Status Registry

- registryName: LIVE2D_FORWARD_STATUS_REGISTRY
- statusCount: 7
- registeredStatuses: dry_run, configured_unusable, accepted, renderer_rejected, renderer_timeout, renderer_unreachable, not_live2d_adapter
- httpStatusForNestedStatuses: null
- rendererTimeoutRetryability: unknown
- rendererUnreachableRetryability: unknown
- configuredUnusableRetryability: owner_action_required
- rendererRejectedRetryability: not_retryable
- acceptedFailureStatus: no
- dryRunFailureStatus: no
- rendererReadinessClaimed: no

## Retryability Boundary

- server_busy: retryable
- operation_timeout: unknown
- renderer_timeout: unknown
- renderer_unreachable: unknown
- operation_cancelled: not_retryable
- request_aborted: not_retryable
- auth_required: owner_action_required
- unsafe_configuration_errors: owner_action_required
- input_and_iris_packet_errors: not_retryable
- internal_guard_errors: unknown

## Raw Projection Boundary

- rawMessageProjectionAllowed: no
- rawStackProjectionAllowed: no
- rawPayloadProjectionAllowed: no
- rawTextProjectionAllowed: no
- endpointProjectionAllowed: no
- pathProjectionAllowed: no
- credentialProjectionAllowed: no
- idProjectionAllowed: no
- highCardinalityMetricDimensionsAllowed: no

## Behavior Preservation Boundary

- toSafeErrorBehaviorChanged: no
- existingSafeErrorBodyFieldsPreserved: yes
- taxonomyMetadataProjectedIntoHttpResponses: no
- existingHttpStatusChanged: no
- existingErrorKindChanged: no
- existingLive2dForwardStatusChanged: no
- externalNetworkExecutionStatus: no
- realRendererExecutionStatus: no

## Package Test Discovery Boundary

- packageTestDiscoveryChangeStatus: exact_test_file_append_only
- addedTestFile: test/failure-taxonomy.test.js
- broadNodeTestDiscoveryRestored: no
- dependencyChanged: no
- lockfileChanged: no

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

- nodeCheckFailureTaxonomyStatus: pass
- nodeCheckFailureTaxonomyTestStatus: pass
- nodeCheckIndexStatus: pass
- nodeFailureTaxonomyTestStatus: pass_8
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
- npmTestStatus: pass_632_1_skipped
- localQualityGateStatus: fail_closed_pending_remote_evidence
- localQualityGateFailClosedReasons: remoteProductEvidenceRunnerStatus, formalEvidencePrecedenceStatus, remoteNpmDiagnosticNormalizationStatus
- diffCheckStatus: pass
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add safe registry module | yes |
| Export registry helpers from public index | yes |
| Project taxonomy metadata into HTTP responses | no |
| Mix Live2D forward statuses into HTTP errors | no |
| Treat renderer timeout as retryable | no |
| Change package beyond test discovery | no |
| Add dependency or lockfile | no |
| Claim runtime or production readiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Registry can drift from source error kinds | Source coverage test scans current src error kind literals. |
| Live2D nested statuses can be mistaken for HTTP errors | Surface separation tests keep registries disjoint. |
| Retryability can be overclaimed | Timeout and renderer reachability entries stay unknown. |
| Registry can leak raw material | Raw projection safety test rejects unsafe keys and values. |

## Safe Next Action

Run Phase I validation. If local checks pass or local QG fails closed only for
expected remote evidence on a product-relevant PR, create a draft PR and wait
for natural same-head QG without manual rerun, comments, or review requests.
