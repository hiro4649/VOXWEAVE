# VOXWEAVE Voice Lab / Human Review Gate Spec

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.3 -->

## Status

- Document type: adoption specification
- Development mode: 5.5-low
- Runtime readiness claimed: no
- Production readiness claimed: no
- Merge readiness: no

This specification defines the adoption boundary for experimental voice
candidate workflows such as Irodori-TTS VoiceDesign. It is design-only and does
not connect any voice generation system to VOXWEAVE Runtime.

## VOXWEAVE Runtime

VOXWEAVE Runtime is the production voice path. It is optimized for stable,
low-latency speech orchestration and safe adapter output.

Runtime owns:

- production speech orchestration
- reading correction
- pronunciation correction
- subtitle synchronization
- mouth cue synchronization
- Live2D-safe cue generation
- safe summary responses
- runtime-safe metadata only

Runtime does not own voice candidate generation, Colab execution, dataset
preparation, raw reference voice handling, or human review workflows.

## VOXWEAVE Voice Lab

VOXWEAVE Voice Lab is a research and production lane for exploring voice,
acting, emotion, reading, and performance candidates.

Voice Lab may produce candidate artifacts for human evaluation, including:

- voice timbre candidates
- acting direction candidates
- emotion and prosody candidates
- short voice sample candidates
- VoiceDesign captions
- review metadata for comparison and rejection
- Irodori-TTS VoiceDesign experiments
- Colab-based candidate generation
- caption-based voice design
- dataset preparation for reviewed material only

Voice Lab is not the production runtime. Voice Lab output must not be routed
directly into IRIS runtime responses, public speech, livestream delivery,
subtitle delivery, Live2D cue delivery, or user-visible adapter diagnostics.

## Runtime Boundary

VOXWEAVE Runtime is the low-latency orchestration lane for production speech
coordination. Runtime responsibilities include:

- receiving IRIS adapter packets
- pronunciation repair
- reading correction
- subtitle timing
- mouth cue generation
- Live2D-safe cue generation
- mock TTS orchestration until real TTS is separately approved
- safe public response summaries

Runtime must not run Irodori-TTS, Colab notebooks, candidate generation jobs, or
unreviewed voice model selection.

Runtime must not receive Voice Lab raw audio, raw datasets, raw reference voice,
model paths, Colab paths, API keys, endpoints, raw prompts, or raw caption
debug output.

Runtime may receive only:

- approved voice_profile_id
- approved style_profile_id
- safe pronunciation hints
- safe prosody hints
- safe metadata

Unapproved candidate identifiers must not be treated as runtime voice profile
identifiers.

## Human Review Gate

Human Review Gate is required before any Voice Lab output can become a
production candidate.

The gate must confirm:

- the reference voice source is allowed by policy
- the candidate has required metadata
- the candidate does not impersonate a third party, celebrity, public figure, or
  unconsented speaker
- the candidate fits IRIS voice direction and character continuity
- the candidate does not contain unsafe, private, raw, or diagnostic material
- the candidate is approved by an authorized human reviewer
- IRIS-likeness
- consistency with the contracted actor voice
- consistency with character personality
- pronunciation naturalness
- intonation quality
- emotion expression range
- absence of noise, collapse, clipping, or unstable delivery
- compatibility with subtitles, mouth cues, and Live2D expression timing
- viewer misidentification risk
- contract scope fit
- whether production runtime use is allowed

AI-only scoring, ranking, labeling, or preference selection is not sufficient
for final adoption. AI may assist review, but cannot be the final approval
authority.

## VoiceDesign Candidate

A VoiceDesign Candidate is a non-runtime candidate generated for review. It may
include safe summaries of:

- intended voice direction
- acting style
- emotion range
- language or reading target
- sample duration class
- review status
- consent status label

The initial status is always candidate. Until the candidate is approved, it must
not be used in runtime, livestreams, public videos, advertising, applications,
games, or external API responses.

It must not include raw audio, raw reference voice, dataset path, model path,
endpoint, API key, raw caption debug, raw prompt, private file path, or vendor
diagnostics in runtime or public diagnostics.

## VoiceDesign Caption

A VoiceDesign Caption is a short review-facing description of a candidate's
intended performance. It may describe safe attributes such as:

- calm, bright, restrained, energetic, warm, or focused delivery
- intended emotion range
- language target
- review scenario
- non-identifying style notes

VoiceDesign captions must not be unconstrained free text in adoption workflows.
For IRIS work, captions must be selected from approved style caption presets.
Captions that conflict with the reference voice, contract scope, or IRIS
character direction must be rejected.

The following caption intents are forbidden or require explicit review:

- excessive screaming
- excessive crying
- excessive breathiness
- acting that may cause speaker misidentification
- sexual performance direction
- political persuasion
- scam-like performance direction
- aggressive or abusive performance direction

It must not encode a command to imitate an unconsented person, celebrity, public
figure, private individual, or third-party voice sample.

## Reference Voice Policy

Allowed reference voices:

- explicitly consented voice actor recordings
- contract-approved recordings for IRIS or VOXWEAVE use
- recordings with documented usage scope, review scope, and retention policy
- recordings whose actor, contract, language scope, medium scope, retention
  scope, and reuse scope are known

Forbidden reference voices:

- unlicensed or unconsented voices
- third-party private voices
- celebrity voices
- public figure voices
- streamer voices
- general private individual voices
- voices extracted from public videos, streams, interviews, films, games, or
  social media
- voices extracted from advertisements, podcasts, livestream archives, or
  short-form public clips
- raw samples whose rights, speaker identity, or usage scope cannot be verified

Reference voice material must remain outside runtime and public diagnostics.

## Required Metadata

Every VoiceDesign Candidate must carry safe metadata:

- candidate_id
- source_voice_profile_id
- reference_voice_consent_status
- voice_design_model
- caption_preset_id
- generated_text
- generated_audio_ref
- language
- locale
- emotion_style
- review_status
- reviewer_id_or_role
- review_notes_redacted
- approved_for_runtime
- approved_for_dataset
- approved_for_training
- approved_for_publication
- approved_for_multilingual_use
- prohibited_use_cases
- created_at
- updated_at

Default required values before approval:

- review_status: candidate
- approved_for_runtime: false
- approved_for_publication: false
- safe_summary_only: true

The metadata must not include raw audio, raw reference voice, dataset path,
model path, endpoint, API key, raw caption debug, raw prompt, or private file
paths.

## Voice Candidate Promotion

Candidate promotion is manual and gated.

Promotion flow:

1. Voice Lab generates a candidate for review.
2. The candidate is stored as review-only material.
3. Human Review Gate evaluates consent, safety, quality, and IRIS fit.
4. Rejected candidates remain non-runtime and must not be reused silently.
5. Approved candidates become Approved Voice Candidates.
6. Runtime integration requires a separate implementation decision and separate
   runtime safety validation.

Voice Lab output must not be automatically promoted based on AI score, model
confidence, generated caption quality, or successful sample generation.

After approval, usage scope must remain metadata-controlled:

- language
- locale
- emotion style
- media type
- publication scope
- storage duration
- retraining permission
- multilingual permission

## Approved Voice Candidate

An Approved Voice Candidate is a candidate that has passed Human Review Gate.

Approval means the candidate may be considered for future runtime integration.
It does not mean:

- real TTS production readiness
- automatic deployment
- automatic public use
- automatic IRIS adoption
- automatic Live2D synchronization use

Runtime adoption still requires a separate production integration PR, runtime
safety checks, adapter contract checks, and explicit production readiness
evidence.

## Safety Boundary

The following must never appear in runtime responses, public diagnostics, health
responses, adapter responses, or Live2D cue payloads:

- raw audio
- raw reference voice
- dataset path
- model path
- endpoint
- API key
- token
- secret
- raw caption debug
- raw prompt
- vendor diagnostics
- private file path
- unreviewed candidate body

Voice Lab must preserve a safe-summary-only boundary for public and runtime
surfaces.

Allowed public safe summaries include:

- candidate_count
- approved_count
- review_required_count
- blocked_count
- voice_lab_enabled
- runtime_connected: false

## Non Goals

This specification does not:

- connect Irodori-TTS to VOXWEAVE Runtime
- connect Colab-generated audio to production speech
- approve any real TTS provider
- approve any voice actor contract
- approve any model checkpoint
- change IRIS Core
- change LIVE2D renderer
- change quality-gate semantics
- change package.json
- change workflow files
- claim runtime readiness
- claim production readiness

## Adoption Rule

Voice Lab is allowed to explore voice candidates only as a non-runtime,
human-reviewed research lane. Human Review Gate is mandatory. Only approved
candidates may be considered for production work, and even approved candidates
require a separate runtime adoption decision.
