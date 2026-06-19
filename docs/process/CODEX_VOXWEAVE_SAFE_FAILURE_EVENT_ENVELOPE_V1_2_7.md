# VOXWEAVE Safe Failure Event Envelope v1.2.7

## Executive Summary

This record documents Phase L of the VOXWEAVE v1.2.7 continuous failure
taxonomy development chain. The change adds a pure safe failure event envelope
builder, validator, and metric label builder.

The change does not add an event sink, logger, public metrics endpoint, file
sink, network sink, runtime execution path, or readiness claim.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainSha: 0b1e00e1a85290ca574811ffe62734d6add85b31
- sourceMainMeaning: post_phase_k_live2d_forward_taxonomy_integration
- implementationPhase: Phase_L_safe_failure_event_envelope
- eventSchema: voxweave_safe_failure_event_v1
- taxonomySchema: voxweave_safe_failure_taxonomy_v1

## Scope

- changedProductSourceStatus: yes
- changedProductSourceFiles: src/safeFailureEvent.js, src/index.js
- changedTaxonomyRegistryStatus: no_registry_semantics_changed
- changedTestStatus: yes
- changedPackageStatus: no
- changedWorkflowStatus: no
- changedLockfileStatus: no
- dependencyChanged: no
- runtimeSinkAdded: no
- publicMetricsEndpointAdded: no

## Safe Failure Event Boundary

- builder: buildSafeFailureEvent
- validator: assertSafeFailureEvent
- metricLabelBuilder: buildSafeFailureMetricLabels
- outputFields: schema, event_kind, surface_kind, failure_kind, failure_category, owner_scope, retryability, http_status, safe_message_class, raw_projection_policy, safe_summary_only
- rawMetadataAccepted: no
- rawPayloadProjected: no
- rawTextProjected: no
- rawEndpointProjected: no
- rawPathProjected: no
- credentialProjected: no
- highCardinalityProjectionAllowed: no

## HTTP Failure Boundary

- sourceRegistry: HTTP_ERROR_KIND_REGISTRY
- unknownHttpKindHandling: fail_closed_internal_error
- statusSource: registry_http_status
- rawErrorMessageProjected: no
- stackProjected: no
- arbitraryCustomLabelProjected: no

## Live2D Failure Boundary

- sourceRegistry: LIVE2D_FORWARD_STATUS_REGISTRY
- live2dAcceptedEventCreated: no
- live2dDryRunEventCreated: no
- live2dNotAdapterEventCreated: no
- rendererTimeoutRetryability: unknown
- rendererUnreachableRetryability: unknown
- rendererRejectedRetryability: not_retryable
- configuredUnusableRetryability: owner_action_required
- httpStatusForLive2dFailure: none

## Metric Cardinality Boundary

- allowedLabels: event_kind, surface_kind, failure_kind, failure_category, owner_scope, retryability, http_status
- forbiddenLabels: request_id, trace_id, event_id, utterance_id, user_id, session_id, locale raw value, text, payload, endpoint, path, model, filename, timestamp, duration, arbitrary custom label
- metricBackendAdded: no
- counterAdded: no
- publicEndpointAdded: no

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

- nodeCheckSafeFailureEventStatus: pass
- nodeCheckIndexStatus: pass
- nodeCheckFailureTaxonomyTestStatus: pass
- nodeFailureTaxonomyTestStatus: pass_17
- sourceIntegrityStatus: pass
- v127SelfTestStatus: pass
- v126SelfTestStatus: pass
- v125SelfTestStatus: pass
- v124SelfTestStatus: pass
- v123SelfTestStatus: pass
- v122SelfTestStatus: pass
- npmTestStatus: pass_642_1_skipped
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
| Add pure safe failure event builder | yes |
| Add validator for safe event shape | yes |
| Add low-cardinality metric label builder | yes |
| Add logger or event sink | no |
| Add public metrics endpoint | no |
| Generate event for accepted, dry_run, or not_live2d_adapter | no |
| Project raw metadata or high-cardinality IDs | no |
| Claim runtime, production, or renderer readiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Unknown failure kind leaks into event output | Builder fail-closes unknown HTTP-like input to internal_error. |
| Non-failure Live2D statuses pollute failure metrics | Builder returns no event for accepted, dry_run, and not_live2d_adapter. |
| Metric labels gain high-cardinality data | Label builder emits an exact allowlist only. |
| Envelope becomes runtime observability sink | Module remains pure and unconnected to server, logger, file, or network sinks. |
| Local target gate is fail-closed before remote evidence exists | Candidate remains draft PR gated by natural QG before merge consideration. |

## Safe Next Action

Open a draft PR and let natural QG evaluate same-head evidence. Merge only if
final fresh gates pass and safe artifacts preserve the no-runtime boundary.
