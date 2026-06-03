# VOXWEAVE MOSS-TTS Candidate Policy

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.3 -->

## Status

- Document type: candidate engine policy
- Development mode: 5.5-low
- Runtime readiness claimed: no
- Production readiness claimed: no
- Merge readiness: no

This policy classifies MOSS-TTS-v1.5 as a VOXWEAVE TTS engine candidate only.
It does not connect MOSS-TTS to VOXWEAVE Runtime, does not add model downloads,
does not add API calls, and does not claim real TTS readiness.

## Candidate Classification

MOSS-TTS is candidate only.

Candidate lane:

- VOXWEAVE Voice Lab
- VOXWEAVE Benchmark Lab
- VOXWEAVE Capability Profile

Forbidden lane until separate approval:

- VOXWEAVE Runtime
- IRIS public speech path
- Live2D cue delivery path
- production subtitle or lip-sync path
- public diagnostics

MOSS-TTS generated candidates must not be auto-promoted to runtime voices.
Human Review Gate and benchmark evidence are required before any runtime
adoption discussion.

## Capability Profile Fields

Every MOSS-TTS candidate profile must use safe capability fields:

- engine_id
- engine_family
- candidate_status
- license_review_status
- supports_multilingual
- supported_languages
- supports_voice_cloning
- supports_long_form
- supports_pause_control
- supports_pronunciation_control
- supports_code_switching
- supports_streaming
- supports_realtime
- requires_reference_voice_consent
- requires_human_review
- runtime_connected
- production_ready
- benchmark_required

Required default values for this policy:

- candidate_status: candidate_only
- license_review_status: required
- requires_reference_voice_consent: true
- requires_human_review: true
- runtime_connected: false
- production_ready: false
- benchmark_required: true

## Candidate Capabilities To Evaluate

MOSS-TTS-v1.5 may be evaluated for:

- multilingual synthesis
- 31-language synthesis capability
- voice cloning
- long-form speech generation
- duration control
- Pinyin, IPA, or pronunciation control
- code-switching
- explicit pause control with pause markers
- SGLang backend candidate usage

MOSS-TTS-Realtime must be treated as a separate low-latency candidate. It must
not inherit runtime approval from MOSS-TTS-v1.5.

## Verification Cautions

The following claims require verification before VOXWEAVE may treat them as
runtime support:

- vLLM-Omni support must be verified before claiming official runtime support.
- SGLang backend support is described in official MOSS-TTS material, but
  SGLang-Omni wording must be verified separately before being used in
  VOXWEAVE specs.
- Hugging Face trending rank and download count are unstable public metrics and
  must not be used as VOXWEAVE specification facts.

VOXWEAVE specs must not rely on trending rank, social media momentum, demo
quality, or download count for production decisions.

## Voice Lab Boundary

MOSS-TTS may be evaluated inside VOXWEAVE Voice Lab only.

Voice Lab evaluation may include:

- style candidate generation
- pronunciation candidate generation
- pause-control candidate generation
- multilingual candidate generation
- reference voice review experiments
- safe capability profile notes

Voice Lab output must not be runtime-approved automatically. Human Review Gate
is required. Approved Candidate promotion remains a separate decision and does
not imply runtime adoption.

## Reference Voice Policy

Voice cloning requires explicit consent.

Allowed reference voice:

- licensed voice actor recordings
- contract-approved IRIS or VOXWEAVE voice material
- recordings with documented speaker identity, usage scope, retention scope,
  and reuse permission

Forbidden reference voice:

- unlicensed voice material
- unconsented voice actor material
- third-party private voices
- celebrity voices
- public figure voices
- streamer or creator voices
- general private individual voices
- audio extracted from public videos, streams, interviews, podcasts, films,
  games, ads, social media, or short-form clips

Reference voice material must not enter runtime or public diagnostics.

## Human Review Gate

Human Review Gate is required before any MOSS-TTS generated candidate may be
considered an approved voice candidate.

The review must cover:

- reference voice consent
- license review
- IRIS voice fit
- speaker misidentification risk
- pronunciation naturalness
- pause behavior
- code-switch behavior
- multilingual behavior
- emotional expression control
- noise, collapse, clipping, or hallucinated audio risk
- subtitle timing compatibility
- lip-sync compatibility
- Live2D cue alignment compatibility
- approved usage scope

AI-only scoring is not sufficient. Human review must remain the final adoption
authority.

## Benchmark Requirements

Benchmark evidence is required before runtime adoption.

Required benchmark areas:

- license review
- GPU requirement
- latency
- VRAM usage
- multilingual synthesis
- pause control
- pronunciation control
- code-switching
- long-form stability
- subtitle alignment
- lip-sync alignment
- Live2D cue alignment
- runtime safety boundary
- public summary leakage prevention

Benchmark implementation is not part of this PR.

## Runtime Boundary

This PR must not:

- connect MOSS-TTS to VOXWEAVE Runtime
- add model downloads
- add API calls
- add endpoint config
- add package dependencies
- add workflow changes
- add benchmark implementation
- alter orchestrator
- alter runtime adapter paths
- claim real TTS production readiness
- claim runtime readiness

Runtime may only consume future approved engine identifiers, approved voice
profile identifiers, approved style profile identifiers, safe pronunciation
hints, safe prosody hints, and safe metadata after a separate runtime adoption
PR.

## Safety Boundary

The following must not appear in runtime responses, public diagnostics, health
responses, adapter responses, readiness reports, or Live2D cue payloads:

- raw audio
- raw reference voice
- dataset path
- model path
- endpoint
- API key
- token
- secret
- raw prompt
- raw caption debug
- raw benchmark logs
- unreviewed candidate body

Safe public summary fields may include:

- engine_id
- candidate_status
- license_review_status
- benchmark_required
- runtime_connected: false
- production_ready: false
- requires_human_review: true
- requires_reference_voice_consent: true

## Non Goals

This policy does not:

- approve MOSS-TTS for production
- connect MOSS-TTS to VOXWEAVE Runtime
- connect MOSS-TTS to IRIS
- connect MOSS-TTS to LIVE2D renderer
- add MOSS-TTS dependencies
- add MOSS-TTS inference code
- add benchmark implementation
- approve any generated voice
- weaken Human Review Gate
- weaken reference voice consent rules
- claim real TTS production readiness
- claim runtime readiness

## Adoption Rule

MOSS-TTS-v1.5 may be tracked as a candidate engine for Voice Lab and Benchmark
Lab only. Runtime adoption requires separate license review, benchmark evidence,
Human Review Gate approval, and a separate runtime integration PR.
