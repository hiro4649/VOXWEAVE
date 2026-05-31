# VoxWeave Contract Audit

## Scope

Repositories checked:

- `hiro4649/VOXWEAVE`
- `hiro4649/iris`
- `hiro4649/iris-live2d-renderer`

IRIS and LIVE2D source changes are intentionally out of scope for this audit.

## P0 Findings

- `hiro4649/iris` main has `src/adapters/httpPostAdapter.js` as an empty file.
- `src/adapters/runtimeAdapters.js` imports `createHttpPostAdapter` from that
  file, so the IRIS HTTP adapter runtime path is at risk until IRIS is repaired.
- VOXWEAVE now returns IRIS-compatible safe acknowledgements, but it cannot fix
  that empty IRIS adapter file without an explicit IRIS change request.

## VoxWeave Compatibility

- `POST /v1/adapter/tts` accepts `iris_adapter_packet_v1` TTS packets.
- `POST /v1/adapter/subtitle` accepts `iris_adapter_packet_v1` subtitle packets.
- `POST /v1/adapter/live2d` accepts `iris_adapter_packet_v1` Live2D packets.
- The three adapter endpoints update a safe render group by trace, event, and
  utterance identity without waiting for all three packets.
- Responses include safe IRIS HTTP adapter summary fields.
- Live2D cues validate against the sibling renderer contract when that source is
  available locally.

## Safety

- Public responses avoid raw request bodies, binary audio bodies, secrets,
  transport targets, model file references, dataset paths, raw phoneme debug
  data, memory commits, relationship commits, and game input fields.
- Mock TTS never claims production readiness.
- Forwarding to LIVE2D renderer is dry-run unless explicitly configured, and
  public responses expose only safe scope/status labels.

## Remaining Risks

- `src/orchestrator.js` is acceptable for V0 but should be split before V1.5 as
  described in `docs/V1_5_REFACTOR_PLAN.md`.
- IRIS HTTP adapter repair is P0 before real IRIS-to-VOXWEAVE runtime handoff.
