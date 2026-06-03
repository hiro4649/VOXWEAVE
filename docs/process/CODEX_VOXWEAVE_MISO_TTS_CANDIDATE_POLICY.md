# VOXWEAVE MisoTTS Candidate Policy

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.5 -->

## Status

- Document type: adopted candidate policy
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Merge readiness: no

This document records the VOXWEAVE candidate policy for MisoTTS / Miso TTS 8B.
It is design-only and spec-only. It does not connect MisoTTS to VOXWEAVE
Runtime, does not add model downloads, does not add API calls, does not add
endpoint configuration, and does not run benchmarks.

## Candidate Classification

MisoTTS / Miso TTS 8B is a VOXWEAVE TTS engine candidate.

Candidate evaluation lanes:

- VOXWEAVE Voice Lab
- VOXWEAVE Benchmark Lab
- VOXWEAVE TTS Engine Capability Profile

Prohibited lanes until separate review and approval:

- VOXWEAVE Runtime
- runtime adapter path
- orchestrator path
- public IRIS voice path
- production subtitle, lip sync, or Live2D delivery path
- public API response path

## Runtime Boundary

Runtime adoption is prohibited for this policy.

This policy does not:

- connect MisoTTS to runtime
- call MisoTTS
- download any MisoTTS model
- call any MisoTTS API
- add endpoint configuration
- change `package.json`
- change workflow files
- execute benchmarks

`runtime_connected` must remain `false`.

## Safety Boundary

Prompt audio and audio context conditioning are treated as voice reference and
voice cloning risk surfaces. They require explicit consent checks and Human
Review Gate review before any adoption discussion.

The following must not be exposed in public summaries:

- watermark key
- raw generated audio
- prompt audio
- raw audio context
- model path
- dataset path
- endpoint
- API key
- token
- secret

Vendor latency claims and VOXWEAVE verified latency must be separated. A vendor
latency claim is not VOXWEAVE benchmark evidence.

Modified MIT or vendor license terms must be handled as `license_review_required`
until license review is complete.

## Required Checks

The following checks are required before any runtime adoption discussion:

- license review required
- watermark policy review required
- GPU benchmark required
- VRAM benchmark required
- latency benchmark required
- voice cloning consent check required
- Human Review Gate required
- audio context safety review required
- Japanese pronunciation benchmark required
- multilingual benchmark required if multilingual support is claimed
- subtitle / lip sync / Live2D alignment benchmark required
- runtime boundary review required

## Required Candidate Fields

Candidate metadata must include:

- `supports_emotive_speech`
- `supports_conversational_speech`
- `supports_audio_context_conditioning`
- `supports_prompt_audio_conditioning`
- `supports_voice_cloning`
- `supports_watermarking`
- `watermark_policy_required`
- `watermark_key_secret_required`
- `license_review_status`
- `vendor_latency_claim_ms`
- `verified_latency_ms`
- `latency_benchmark_required`
- `gpu_benchmark_required`
- `vram_benchmark_required`
- `runtime_connected`
- `production_ready`

## Non Goals

This policy does not approve:

- runtime adoption
- production adoption
- public IRIS voice use
- MisoTTS integration
- model download
- API calls
- endpoint configuration
- benchmark execution
- package or workflow changes

## Forbidden Claims

The following claims are forbidden:

- MisoTTS is production ready for VOXWEAVE
- MisoTTS is runtime connected
- MisoTTS latency is verified in VOXWEAVE
- MisoTTS API is stable for VOXWEAVE runtime
- MisoTTS can clone voice actor voices without explicit consent
- MisoTTS generated voice can bypass Human Review Gate
- MisoTTS benchmark is complete
- MisoTTS can be used for public IRIS voice without review

## Readiness

- Runtime adoption: prohibited
- Production readiness: prohibited
- Runtime readiness: prohibited
- User manual work avoided: yes
