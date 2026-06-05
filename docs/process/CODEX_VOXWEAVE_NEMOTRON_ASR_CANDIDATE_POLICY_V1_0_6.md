# VOXWEAVE Nemotron-3.5-ASR-Streaming Candidate Policy v1.0.6

## Status

- Status: docs-only
- Status: candidate-policy-only
- Status: planning-only
- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- ASR runtime readiness claimed: no
- Merge readiness: no
- Main reflected: no
- Active harness: v1.0.6
- User manual work avoided: yes

## Scope

This policy adds NVIDIA Nemotron-3.5-ASR-Streaming as a VOXWEAVE ASR engine candidate, Streaming Transcription candidate, and Listening Input candidate. It is not a runtime implementation, ASR engine connection, microphone input implementation, model download, API call, benchmark execution, existing PR modification, or merge permission.

## Candidate

- Candidate: Nemotron-3.5-ASR-Streaming
- model id: nvidia/nemotron-3.5-asr-streaming-0.6b
- candidate type: ASR engine candidate
- not TTS candidate
- not VoiceDesign candidate
- not voice cloning candidate
- not Live2D renderer candidate

## Official Claim Boundary

- 40 language-locales is vendor/model-card claim, not VOXWEAVE verified fact.
- 80ms / 160ms / 320ms / 560ms / 1120ms chunk sizes are vendor/model-card claim, not VOXWEAVE verified latency.
- 240 to 2400 concurrent streams on H100 is vendor/model-card claim, not VOXWEAVE verified throughput.
- 600M parameters is model-card metadata, not VOXWEAVE performance evidence.
- commercial-use / license wording requires license review.
- If metadata and model-card license terms differ, license review remains required.

## Allowed Lanes

- ASR Candidate Policy
- Listening Input Lane
- Streaming Transcription Lane
- Transcript / Subtitle Planning Lane
- Benchmark Lab
- Capability Profile
- Multilingual Listening Planning

## Forbidden Lanes

- TTS runtime lane
- Voice cloning lane
- Voice Lab voice generation lane
- Live2D renderer lane
- runtime integration lane

## Required Checks

- license review
- privacy review
- transcript safety review
- microphone input policy review
- audio retention policy review
- GPU benchmark
- VRAM benchmark
- latency benchmark
- concurrent stream benchmark
- Japanese transcription benchmark
- multilingual benchmark
- code-switching benchmark
- noise robustness benchmark
- subtitle timing alignment review
- conversation turn-taking review
- safe summary non-leakage review
- runtime boundary review

## Candidate Fields

- supports_streaming_asr
- supports_multilingual_asr
- supports_language_id_prompt
- supports_auto_language_detection
- supports_punctuation
- supports_capitalization
- supports_configurable_chunk_size
- vendor_claim_language_locale_count
- verified_language_locale_count
- vendor_claim_latency_ms
- verified_latency_ms
- vendor_claim_concurrent_streams
- verified_concurrent_streams
- asr_benchmark_required
- latency_benchmark_required
- gpu_benchmark_required
- vram_benchmark_required
- privacy_review_required
- transcript_safety_review_required
- license_review_required
- runtime_connected
- production_ready
- asr_runtime_ready

## Privacy Boundary

- raw audio must not appear in public summary
- audio chunks must not appear in public summary
- microphone input must not appear in public summary
- transcript raw text must not appear in public summary unless explicitly safe
- language tag must not be exposed if it can identify user context
- speaker identity must not be exposed
- endpoint must not appear
- API key must not appear
- token must not appear
- secret must not appear
- authorization must not appear
- Bearer must not appear
- model path must not appear
- dataset path must not appear
- private path must not appear
- raw logs must not appear
- stream id must not appear

## ASR-Specific Unsafe Summary Requirements

The public safe summary must be count-only and must not expose these ASR-specific or credential-like fields:

- raw_audio
- audio_chunk
- microphone_input
- transcript_raw
- speaker_identity
- language_tag
- stream_id
- endpoint
- api_key
- token
- secret
- authorization
- Bearer
- model_path
- dataset_path
- private_path
- raw_logs

## Safe Summary

- count-only
- candidate_count
- blocked_count
- benchmark_required_count
- privacy_review_required_count
- license_review_required_count
- runtime_connected: false
- production_ready: false
- asr_runtime_ready: false
- safe_summary_only: true

## Runtime Boundary

- do not connect Nemotron ASR to runtime
- do not implement microphone capture
- do not stream user audio
- do not install NeMo
- do not load model
- do not download model
- do not call ASR API
- do not add endpoint config
- do not run benchmark
- do not add package
- do not change workflow
- do not claim ASR readiness
- do not claim runtime readiness
- do not claim production readiness

## Relationship To Existing VOXWEAVE Specs

- MOSS-TTS / MisoTTS / Irodori-TTS remain TTS output candidates.
- Nemotron ASR is input/listening candidate.
- ASR candidate does not imply TTS readiness.
- ASR candidate does not imply Voice Lab promotion.
- ASR transcript may later feed subtitle / conversation turn-taking, but not now.
- Multilingual Locale Policy is relevant but does not authorize locale routing.
- Subtitle Timing Policy is relevant but does not authorize subtitle rendering.
- Live2D policies are relevant only indirectly and do not authorize renderer calls.

## Boundary Matrix

| area | status | allowed now | blocked reason | safe next action |
| --- | --- | --- | --- | --- |
| ASR candidate policy | documented candidate only | yes | docs-only scope | Preserve as candidate policy. |
| Listening Input Lane | planning candidate only | no runtime use | microphone policy and privacy review missing | Future docs-only input policy review. |
| Streaming Transcription Lane | planning candidate only | no runtime use | benchmark, privacy, and transcript safety missing | Future candidate profile review. |
| Transcript / Subtitle Planning Lane | conceptual relation only | no subtitle rendering | subtitle timing and transcript safety not validated | Preserve relationship only. |
| Benchmark Lab | required future evidence | no execution | benchmark lane not opened | Future benchmark plan only if scoped. |
| Capability Profile | future metadata candidate | no runtime capability claim | verified latency and throughput missing | Future ASR capability profile only if scoped. |
| Multilingual Listening Planning | future planning candidate | no locale routing | language and code-switching validation missing | Future multilingual ASR review only if scoped. |
| Runtime integration lane | prohibited | no | runtime lane blocked | Do not connect runtime. |

## Risk Register

| risk | severity | status | blocked by | safe next action |
| --- | --- | --- | --- | --- |
| raw audio leakage | high | open | privacy review missing | Keep public summary count-only. |
| transcript privacy leakage | high | open | transcript safety review missing | Do not expose raw transcript text. |
| microphone capture before consent | high | blocked | microphone input policy missing | Do not implement capture. |
| language tag privacy leakage | medium-high | open | privacy review missing | Treat identifying language tags as unsafe. |
| speaker identity leakage | high | open | privacy review missing | Do not expose speaker identity. |
| vendor latency claim misread | medium-high | open | benchmark missing | Keep vendor claim separate from verified latency. |
| vendor concurrency claim misread | medium-high | open | concurrent stream benchmark missing | Keep vendor claim separate from verified throughput. |
| 40 language-locales claim misread | medium-high | open | multilingual benchmark missing | Keep vendor claim separate from verified support. |
| license review skipped | high | open | license review missing | Require license review before any adoption. |
| model download accidental execution | high | controlled | runtime lane blocked | Do not download model. |
| NeMo install accidental package change | high | controlled | package changes prohibited | Do not install NeMo or change package. |
| API call accidental execution | high | controlled | API calls prohibited | Do not call ASR API. |
| endpoint config accidental addition | high | controlled | endpoint config prohibited | Do not add endpoint config. |
| ASR output treated as safe user intent without moderation | high | open | transcript safety review missing | Require safety gate before command use. |
| ASR transcript used as runtime command without safety gate | high | open | runtime boundary review missing | Do not use transcript as runtime command. |
| multilingual transcription errors causing unsafe behavior | medium-high | open | multilingual benchmark missing | Require multilingual benchmark before adoption. |
| code-switching misclassification | medium | open | code-switching benchmark missing | Require code-switching benchmark. |
| Japanese transcription accuracy not verified | medium-high | open | Japanese benchmark missing | Require Japanese transcription benchmark. |
| subtitle alignment misread | medium | open | subtitle timing alignment review missing | Keep subtitle relation planning-only. |
| conversation turn-taking premature adoption | medium-high | open | conversation review missing | Do not connect turn-taking runtime. |
| ASR candidate misread as production-ready | high | open | validation missing | Repeat no production readiness claim. |

## Non Goals

- do not connect ASR runtime
- do not implement microphone capture
- do not stream audio
- do not transcribe audio
- do not install NeMo
- do not load model
- do not download model
- do not call API
- do not add endpoint config
- do not run benchmark
- do not change package
- do not change workflow
- do not change runtime
- do not change src
- do not change test
- do not claim runtime readiness
- do not claim production readiness
- do not claim ASR runtime readiness
- do not claim merge readiness

## Forbidden Claims

- This policy makes Nemotron ASR runtime ready.
- This policy makes VOXWEAVE listening input ready.
- This policy makes VOXWEAVE production ready.
- This policy verifies 40 language support.
- This policy verifies 80ms latency.
- This policy verifies 240 to 2400 concurrent streams.
- This policy authorizes microphone capture.
- This policy authorizes audio streaming.
- This policy authorizes ASR API call.
- This policy authorizes model download.
- This policy authorizes NeMo install.
- This policy authorizes benchmark execution.
- This policy authorizes transcript use as runtime command.
- This policy is merge evidence.
- This policy is runtime adoption evidence.

## Completion Status

- nemotronAsrCandidatePolicyStatus: created
- asrRuntimeBoundaryStatus: complete
- privacyBoundaryStatus: complete
- benchmarkRequirementStatus: complete
- licenseReviewStatus: required
- docsOnlyBoundaryStatus: pass
- mergeReadiness: no

## Safe Next Action

Preserve this candidate policy as docs-only. Do not connect ASR runtime, implement microphone capture, install NeMo, download a model, call an API, add endpoint config, run benchmarks, or use transcripts as runtime commands. Future work requires explicit scope for privacy review, license review, ASR capability profiling, and benchmark planning before any runtime discussion.
