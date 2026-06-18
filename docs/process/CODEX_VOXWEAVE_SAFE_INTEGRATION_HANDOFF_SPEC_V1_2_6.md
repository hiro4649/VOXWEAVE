# VOXWEAVE Safe Integration Handoff Specification v1.2.6

## Executive Summary

This document defines the safe handoff boundary between VOXWEAVE, IRIS, and
LIVE2D. It is a contract-defined, execution-unverified handoff specification.

## Source State

- currentActiveHarness: v1.2.6
- handoffState: contract_defined_execution_unverified
- runtimeIntegrationStatus: not_started
- realTtsIntegrationStatus: not_started
- asrIntegrationStatus: not_started
- live2dRendererIntegrationStatus: execution_unverified
- translationProviderIntegrationStatus: not_started
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## VOXWEAVE Owns

- safe input validation
- contract registry
- safe metadata
- pronunciation repair
- reading metadata
- prosody metadata
- subtitle timing
- mouth cue metadata
- safe Live2D cue construction
- mock TTS metadata
- quality score
- integration boundary snapshot
- server bind/auth policy

## IRIS Owns

- final text
- conversation state
- memory
- relationship state
- game operations
- safety decisions
- adapter packet creation

## LIVE2D Owns

- model loading
- renderer health
- browser delivery
- renderer-side cue validation
- actual rendering

## Forbidden Handoff Material

The handoff must not include:

- secret
- token
- API key
- network target
- private path
- raw audio
- raw transcript
- raw contract
- raw model path
- raw renderer payload

## Required Future Evidence

Future runtime evidence must include:

- exact version pair
- same-head source evidence
- loopback-only target control
- non-loopback opt-in and auth policy
- JSON write boundary
- redirect blocking
- failure taxonomy
- timeout behavior
- rollback behavior
- privacy boundary
- latency budget
- resource budget
- no raw projection
- owner-scoped product verification
- external team acceptance evidence

## Runtime Evidence Boundary

No runtime integration is claimed by this document. The current safe state is
contract-defined and execution-unverified. Runtime evidence must be separately
owner-scoped and must not use this handoff document as proof of production,
real TTS, ASR, Live2D renderer, translation provider, or deployment readiness.

## Recommended Next Implementation Scope

- recommendedNextImplementationScope: owner_scoped_loopback_integration_evidence_plan
- safeNextBranch: codex/voxweave-v1-2-6-loopback-integration-evidence-plan-001

## Decision Matrix

- currentActiveHarness: v1.2.6
- handoffState: contract_defined_execution_unverified
- runtimeIntegrationStatus: not_started
- realTtsIntegrationStatus: not_started
- asrIntegrationStatus: not_started
- live2dRendererIntegrationStatus: execution_unverified
- translationProviderIntegrationStatus: not_started
- forbiddenHandoffMaterialStatus: excluded
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- mergeReadiness: no

## Safe Next Action

Create an owner-scoped loopback integration evidence plan as a docs-only or
test-only planning artifact before any runtime execution is attempted.
