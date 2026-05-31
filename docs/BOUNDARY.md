# VoxWeave Boundary

## IRIS

IRIS remains the owner of final utterance text, emotion, conversation state,
memory, relationship state, game approval, safety decisions, canonical enums,
and `iris_adapter_packet_v1` creation.

## VoxWeave

VoxWeave owns external voice orchestration after IRIS has created adapter
packets:

- mock or future routed TTS handoff metadata
- pronunciation repair and pronunciation dictionary lookup
- multilingual reading plans
- emotional prosody conversion for TTS routing
- reaction cache metadata
- subtitle timing
- mouth cue generation
- Live2D-safe voice synchronization cues
- voice quality scoring

VoxWeave never returns IRIS Core envelopes, command fields, memory writes,
relationship writes, game inputs, secrets, raw audio bodies, model paths, or
renderer endpoints.

The IRIS compatible primary route is the adapter-specific path:
`/v1/adapter/tts`, `/v1/adapter/subtitle`, and `/v1/adapter/live2d`. These
responses include a safe `response_summary` for IRIS HTTP adapter compatibility
and a safe `render_group` keyed by event/utterance identity. Render groups store
only receipt flags and timing/status counts, never raw text, raw audio,
endpoint values, keys, paths, or phoneme debug logs.

## LIVE2D Renderer

LIVE2D Renderer remains the owner of model loading, Cubism integration, browser
delivery, renderer health/status, and cue validation. VoxWeave only produces
`iris_live2d_renderer_cue_v1` / `iris_live2d_renderer_cue_delivery_v1`
compatible cue material for that renderer to validate and consume.
