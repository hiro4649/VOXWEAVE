# VOXWEAVE Safe Cross-Project Interop Fixture Bundle v1.2.6

## Executive Summary

This record documents the safe static fixture bundle intended for IRIS and
LIVE2D collaborators to inspect without changing other repositories. The bundle
contains fake, static, raw-material-free adapter packets for TTS, subtitle, and
Live2D paths. It does not claim external team acceptance, runtime integration,
production readiness, real TTS readiness, ASR readiness, or real Live2D renderer
readiness.

## Source State

- currentActiveHarness: v1.2.6
- baselineFingerprintPr: #375
- implementationScope: safe_cross_project_interop_fixture_bundle
- fixtureVersion: 1.0.0
- fixtureCount: 3
- adapterPacketSchema: iris_adapter_packet_v1
- safeFixtureStatus: pass
- rawMaterialExcludedStatus: pass
- externalTeamAcceptanceStatus: not_started
- realRendererAcceptanceStatus: not_started
- realTtsAcceptanceStatus: not_started
- asrAcceptanceStatus: not_started
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Fixture Bundle

The bundle contains:

- `test/fixtures/interop/voxweave-interop-manifest.safe.json`
- `test/fixtures/interop/iris-tts-packet.safe.json`
- `test/fixtures/interop/iris-subtitle-packet.safe.json`
- `test/fixtures/interop/iris-live2d-packet.safe.json`

Fixture IDs:

- `iris_tts_minimal_v1`
- `iris_subtitle_minimal_v1`
- `iris_live2d_all_contracts_v1`

## Safety Boundary

Fixtures must not include:

- API key
- token
- secret
- endpoint
- URL
- host
- port
- private path
- raw audio
- raw transcript
- raw renderer payload
- raw model path
- runtime readiness claim
- production readiness claim

The Live2D fixture includes all six safe AI character contract families and
keeps them summary-only.

## Test Coverage Evidence

- `node --test test/server-routes.test.js`: pass

The tests verify manifest schema, unique fixture IDs, registry family count
alignment, absence of forbidden fields, absence of target material, absence of
credentials, route acceptance for TTS/subtitle/Live2D fixtures, Live2D contract
presence count matching the registry count, response raw-contract exclusion,
private material exclusion, static JSON loading, and no external team acceptance
claim.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | safe_cross_project_interop_fixture_bundle |
| fixtureVersion | 1.0.0 |
| fixtureCount | 3 |
| adapterPacketSchema | iris_adapter_packet_v1 |
| safeFixtureStatus | pass |
| rawMaterialExcludedStatus | pass |
| externalTeamAcceptanceStatus | not_started |
| realRendererAcceptanceStatus | not_started |
| realTtsAcceptanceStatus | not_started |
| asrAcceptanceStatus | not_started |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Record the loopback integration evidence closure inventory after the plan,
runner, failure matrix, deterministic fingerprint, and safe interop fixture
bundle have all merged and passed post-merge validation.
