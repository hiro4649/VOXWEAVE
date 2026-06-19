# VOXWEAVE Live2D Forward Status Taxonomy Integration v1.2.7

## Executive Summary

This record documents Phase K of the VOXWEAVE v1.2.7 continuous failure
taxonomy development chain. The change adds a nested, registry-backed
`renderer_forward_taxonomy` summary to Live2D forward metadata.

The integration keeps Live2D forward statuses separate from HTTP error kinds.
It does not execute a real renderer, expose renderer endpoints, change HTTP
error projection, create runtime sinks, or claim readiness.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainSha: 86b7367396b7ebc9f497305b6b23db1a9aa60a38
- sourceMainMeaning: post_phase_j_safe_error_projection_integration
- implementationPhase: Phase_K_live2d_forward_status_taxonomy_integration
- registrySchema: voxweave_safe_failure_taxonomy_v1
- live2dForwardTaxonomyField: renderer_forward_taxonomy

## Scope

- changedProductSourceStatus: yes
- changedProductSourceFiles: src/failureTaxonomy.js, src/live2dForwarder.js, src/orchestrationResponse.js
- changedTestStatus: yes
- changedPackageStatus: no
- changedWorkflowStatus: no
- changedLockfileStatus: no
- dependencyChanged: no
- changedHttpErrorProjectionStatus: no
- changedRendererExecutionStatus: no

## Live2D Forward Taxonomy Boundary

- nestedField: renderer_forward_taxonomy
- sourceRegistry: LIVE2D_FORWARD_STATUS_REGISTRY
- projectedFields: schema, renderer_forward_status, outcome, failure_category, owner_scope, retryability, raw_projection_policy, renderer_readiness_claimed, runtime_readiness_claimed, production_readiness_claimed, safe_summary_only
- httpStatusProjected: no
- rendererEndpointProjected: no
- rendererApiKeyProjected: no
- cueBodyProjected: no
- rawResponseProjected: no
- highCardinalityProjectionAllowed: no

## Status Semantics Boundary

- acceptedOutcome: success
- dryRunOutcome: not_attempted
- notLive2dAdapterOutcome: not_applicable
- configuredUnusableRetryability: owner_action_required
- rendererRejectedRetryability: not_retryable
- rendererTimeoutRetryability: unknown
- rendererUnreachableRetryability: unknown
- acceptedFailureCounted: no
- dryRunFailureCounted: no
- notLive2dAdapterFailureCounted: no

## Return Path Boundary

- live2dForwarderReturnPathsCovered: yes
- orchestrationLive2dAdapterPathCovered: yes
- orchestrationNonLive2dAdapterPathCovered: yes
- fakeForwarderMetadataNormalizationCovered: yes
- metadataDriftGuardStatus: registry_shape_preserved_with_import_graph_boundary
- sourceForwarderRegistryHelperStatus: uses_failure_taxonomy_helper
- orchestrationTaxonomyShapeStatus: local_safe_shape_preserves_existing_import_graph

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
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- rendererReadinessClaimed: no

## Quality Evidence

- nodeCheckFailureTaxonomyStatus: pass
- nodeCheckLive2dForwarderStatus: pass
- nodeCheckOrchestrationResponseStatus: pass
- nodeCheckFailureTaxonomyTestStatus: pass
- nodeCheckLive2dForwarderTestStatus: pass
- nodeFailureTaxonomyTestStatus: pass_10
- nodeLive2dForwarderStatus: pass_30
- nodeOrchestratorServiceStatus: pass_40
- nodeArtifactMetadataBoundariesStatus: pass_67
- nodeOrchestratorExtractionIntegrationStatus: pass_71
- sourceIntegrityStatus: pass
- v127SelfTestStatus: pass
- v126SelfTestStatus: pass
- v125SelfTestStatus: pass
- v124SelfTestStatus: pass
- v123SelfTestStatus: pass
- v122SelfTestStatus: pass
- npmTestStatus: pass_635_1_skipped
- localQualityGateStatus: fail_closed_pending_remote_product_evidence
- localQualityGateTargetQualityScore: 70
- diffCheckStatus: pass
- changedFileBoundaryStatus: pass
- packageWorkflowLockBoundaryStatus: pass
- hiddenBidirectionalUnicodeStatus: pass
- secretLikePatternScanStatus: pass
- positiveReadinessClaimScanStatus: pass
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add nested Live2D forward taxonomy summary | yes |
| Convert renderer statuses to HTTP error kinds | no |
| Mark renderer timeout or unreachable retryable | no |
| Count accepted or dry_run as failures | no |
| Expose renderer endpoint or API key | no |
| Execute real renderer | no |
| Add runtime sink or public metrics endpoint | no |
| Claim runtime, production, or renderer readiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Live2D statuses drift from registry | Shared helper derives nested summary from registry. |
| Renderer timeout becomes overclassified | Retryability remains unknown. |
| Non-Live2D adapter path lacks taxonomy | Orchestration applies the helper to not_live2d_adapter. |
| Fake forwarder summaries drift from real forwarder summaries | Orchestration normalizes returned summaries with the same helper. |
| Local target gate is fail-closed before remote evidence exists | Candidate remains draft PR gated by natural QG before merge consideration. |

## Safe Next Action

Run Phase K validation. If local checks pass or local QG fails closed only for
expected remote evidence on a product-relevant PR, create a draft PR and wait
for natural same-head QG without manual rerun, comments, or review requests.
