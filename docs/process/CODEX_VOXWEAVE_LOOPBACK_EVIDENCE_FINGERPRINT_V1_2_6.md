# VOXWEAVE Deterministic Loopback Evidence Fingerprint v1.2.6

## Executive Summary

This record documents the deterministic safe evidence fingerprint contract for
VOXWEAVE loopback evidence. The fingerprint is computed from canonicalized safe
summary fields only. It excludes ephemeral ports, network targets, keys, raw
payloads, request IDs, timestamps, measured durations, raw errors, and private
execution material.

## Source State

- currentActiveHarness: v1.2.6
- baselineFailureMatrixPr: #374
- implementationScope: deterministic_safe_evidence_contract
- fingerprintAlgorithm: sha256
- sameHeadBindingStatus: pass
- ephemeralPortExcludedStatus: pass
- networkTargetExcludedStatus: pass
- secretMaterialExcludedStatus: pass
- deterministicReplayStatus: pass
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Exported Contract

The runner now exports:

- `validateLoopbackIntegrationEvidence`
- `buildLoopbackEvidenceFingerprint`
- `canonicalizeLoopbackEvidence`

The validator rejects unknown top-level fields, unsafe keys, unsafe strings,
wrong schemas, `safe_summary_only: false`, readiness true, external network
true, real provider true, and real renderer true.

## Fingerprint Boundary

The fingerprint input includes:

- schema
- status
- source head
- target fixture version
- evidence mode
- execution scope
- safe status fields
- request count
- failure count
- cleanup status
- readiness false fields

The fingerprint input excludes:

- port
- URL
- target
- API key
- request ID
- timestamp
- measured duration
- raw error
- raw request
- raw response
- raw cue
- raw contract

## Determinism Evidence

Repeated same-head happy evidence produces the same fingerprint even though the
servers use ephemeral ports. A different source head produces a different
fingerprint. Matrix evidence is canonicalized with the same algorithm and also
validates against the safe summary contract.

## Test Coverage Evidence

- `node --check scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs --matrix`: pass
- `node --test test/server-routes.test.js`: pass

The tests verify happy evidence validation, matrix evidence validation, unknown
field rejection, URL string rejection, fake key-like string rejection, readiness
true rejection, same-head deterministic replay, different-head fingerprint
change, ephemeral port absence, CLI output validation, and recomputed
fingerprint equality.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | deterministic_safe_evidence_contract |
| fingerprintAlgorithm | sha256 |
| sameHeadBindingStatus | pass |
| ephemeralPortExcludedStatus | pass |
| networkTargetExcludedStatus | pass |
| secretMaterialExcludedStatus | pass |
| deterministicReplayStatus | pass |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add a safe cross-project interop fixture bundle for IRIS TTS, subtitle, and
Live2D adapter packets, keeping all fixtures fake, local, raw-material-free, and
explicitly non-readiness.
