# CODEX VOXWEAVE Adapter Contract Gates v1.0.2

Status: design only.

This document defines adapter contract gates for a future v1.0.2 harness update.
It does not change VOXWEAVE runtime behavior.

## Adapter Endpoint Summary-Only Gate

IRIS adapter endpoints must return summary-only public responses by default.

Fail when:

```text
adapter route returns debug detail -> fail
```

Required safe public fields may include response summary, artifact kind, render
group safe counters, and safe labels. They must not include raw payload, raw
audio, endpoint values, API keys, tokens, model paths, dataset paths, or raw
phoneme debug logs.

## Debug Route Isolation Gate

Debug detail must be isolated to debug routes and controlled by an explicit
environment gate.

Pass when:

```text
debug route returns debug detail only with env gate -> pass
```

Adapter routes must remain summary-only even when debug support exists.

## Mock TTS Production Boundary Gate

Mock TTS must never claim production readiness.

Fail when:

```text
mock TTS claims production ready -> fail
```

Allowed labels include `mock_audio` and `dry_run_audio`.

## IRIS HTTP Adapter Compatibility Fixture

The harness should keep a fixture proving VOXWEAVE adapter responses remain
acceptable to IRIS HTTP adapter response validation.

The fixture must verify:

- no forbidden response fields are returned
- `response_summary.ok` is safe and truthful
- artifact kind is safe for mock or dry-run output
- no endpoint, API key, token, raw payload, raw audio, model path, dataset path,
  or raw phoneme debug value leaks

## LIVE2D Cue Delivery Compatibility Fixture

The harness should keep a fixture proving VOXWEAVE Live2D cue payloads remain
compatible with the renderer delivery contract.

Fail when:

```text
LIVE2D renderer modified -> fail
```

The fixture must verify VOXWEAVE generates safe cue delivery payloads without
replacing or modifying the LIVE2D renderer.

## Sibling Repo Optional Integration Mode

IRIS and LIVE2D sibling repositories are optional for local integration tests.

When present:

- run compatibility fixtures
- keep sibling repositories read-only

When absent:

- report `siblingRepoIntegrationStatus: not_available`
- do not fail product evidence solely due to missing local sibling repositories
- keep merge readiness governed by required remote checks and review policy

