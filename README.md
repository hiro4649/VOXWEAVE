# VoxWeave

VoxWeave is an external voice orchestration service for IRIS. It is not a TTS
engine, not a Live2D renderer, not voice actor contract management, and not an
IRIS Core phase.

## Boundary

- IRIS keeps final utterance generation, emotion, conversation state, memory,
  relationship state, game operations, safety decisions, and adapter packet
  creation.
- LIVE2D keeps Cubism/model loading, browser delivery, renderer health, and cue
  validation.
- VoxWeave receives IRIS TTS, subtitle, and Live2D adapter packets and produces
  pronunciation repair, multilingual reading metadata, emotional prosody,
  reaction cache metadata, subtitle timing, mouth cues, Live2D-safe sync cues,
  mock TTS metadata, and quality scores.

## Endpoints

- `GET /health`
- `POST /v1/orchestrate`
- `POST /v1/adapter/tts`
- `POST /v1/adapter/subtitle`
- `POST /v1/adapter/live2d`
- `POST /v1/debug/orchestrate`

The adapter endpoints accept `iris_adapter_packet_v1` payloads and return only
safe bridge metadata plus generated adapter artifacts. They never return
`canonical_envelope`, command fields, secrets, raw audio, renderer endpoints, or
model paths.

`/v1/adapter/tts`, `/v1/adapter/subtitle`, and `/v1/adapter/live2d` are the IRIS
compatible primary path. `/v1/orchestrate` is kept as a future combined path.

`/v1/debug/orchestrate` is a debug-only route. It passes `includeDebug=true` to
the orchestrator, but detailed debug material is returned only when
`VOXWEAVE_DEBUG_RESPONSE=true` is set before service creation. Without that env
flag it returns the same summary-only safe response shape. The IRIS adapter
endpoints always stay summary-only, including when `VOXWEAVE_DEBUG_RESPONSE` is
enabled.

For Live2D dry-run mode, leave `VOXWEAVE_LIVE2D_RENDERER_ENDPOINT` unset. To
forward generated renderer cues to a local LIVE2D renderer, set it to a loopback
`/live2d-engine` or `/cue` URL. `VOXWEAVE_LIVE2D_RENDERER_API_KEY` is forwarded
as `x-api-key` when present, but endpoint and key values are never included in
public responses.

## Development

```sh
npm test
npm start
```

By default the service listens on `127.0.0.1:9011`.
