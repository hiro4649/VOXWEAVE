# VOXWEAVE Runtime Text Structure Guard v1.2.7

## Executive Summary

This record documents Phase E3 of the VOXWEAVE v1.2.7 continuous chain. The
change hardens runtime JSON body text decoding and payload structure scanning
without adding dependencies, workflows, package changes, external integrations,
or readiness claims.

## Scope

- currentActiveHarness: v1.2.7
- implementationScope: runtime_text_structure_guard
- changedProductSourceStatus: yes
- changedWorkflowStatus: no
- changedPackageStatus: no
- changedLockfileStatus: no

## UTF-8 Boundary

- httpBodyFatalUtf8DecodeStatus: enforced
- invalidUtf8BytesStatus: safe_invalid_json_400
- rawBytesOutputStatus: no
- splitMultibyteDecodeStatus: pass
- ordinaryMultilingualUtf8Status: pass

## Runtime Text Boundary

- replacementCharacterRejectedStatus: pass
- nulRejectedStatus: pass
- embeddedBomRejectedStatus: pass
- unpairedSurrogateRejectedStatus: pass
- safeTextCodePointBoundaryStatus: pass

## Payload Structure Boundary

- scanUnsafeInputTraversalStatus: iterative
- maxDepthStatus: enforced
- maxNodeCountStatus: enforced
- maxArrayLengthStatus: enforced
- maxObjectKeyCountStatus: enforced
- cycleRejectedStatus: pass
- bigintRejectedStatus: pass
- functionRejectedStatus: pass
- symbolRejectedStatus: pass
- nonFiniteNumberRejectedStatus: pass
- stackOverflowPreventionStatus: guarded

## No Runtime Readiness Boundary

- realTtsAllowedInThisTask: no
- asrAllowedInThisTask: no
- live2dRendererAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- externalApiAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Quality Evidence

- nodeContractsBoundaryTestStatus: pass
- nodeServerNegativeRoutesTestStatus: pass
- npmTestStatus: pass
- localQualityGateStatus: fail_closed_until_remote_product_evidence
- localQualityGatePrimaryReason: remote_product_evidence_required_before_internal_qg_pass
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Use fatal UTF-8 body decode | yes |
| Reject unsafe scalar payload values | yes |
| Convert recursive input scan to iterative scan | yes |
| Add package/workflow changes | no |
| Claim runtime readiness | no |

## Safe Next Action

Create a draft PR and wait for same-head natural QG remote product evidence
without manual rerun. Merge only if same-head natural QG passes.
