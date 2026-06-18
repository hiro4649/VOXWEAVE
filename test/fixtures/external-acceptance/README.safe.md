# VOXWEAVE External Acceptance Candidate Bundle

This bundle is a safe candidate package for IRIS and LIVE2D collaborators. It is
not acceptance, not external receipt evidence, not runtime readiness, and not
production readiness.

The manifest `source_main_sha` binds only the runtime source snapshot used for
this unsent candidate bundle. The `candidate_bundle_fingerprint` binds the
candidate manifest, receipt templates, this README, the interop fixture
manifest, and the packet fixtures. Both the source snapshot and the transitive
bundle fingerprint must match during future receipt intake.

External teams should inspect only the safe fixture manifest, safe packet
fixtures, safe receipt templates, and the local fake evidence runner contract.
They should not send secrets, tokens, endpoints, raw logs, screenshots, raw
audio, raw payloads, private paths, or implementation-specific target material.

Relevant safe references:

- `test/fixtures/interop/voxweave-interop-manifest.safe.json`
- `test/fixtures/interop/iris-tts-packet.safe.json`
- `test/fixtures/interop/iris-subtitle-packet.safe.json`
- `test/fixtures/interop/iris-live2d-packet.safe.json`
- `scripts/voxweave-loopback-integration-evidence.mjs`

An accepted candidate, if one is provided in the future, still will not be
production readiness, real renderer readiness, real TTS readiness, or ASR
readiness.

This bundle remains not sent, not accepted, and not real integration proof.
