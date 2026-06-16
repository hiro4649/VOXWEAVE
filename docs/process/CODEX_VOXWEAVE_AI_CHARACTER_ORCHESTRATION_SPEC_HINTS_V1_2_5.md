# VOXWEAVE AI Character Orchestration Spec Hints v1.2.5

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
sourceMode: repo_boundary_to_docs_only_spec_hints
baselineRepresentativeValidationPr: #322
baselineRepresentativeValidationMergeCommitSha: 3315167bd5aa7fb4e1ac9cb9e6c4e71f5a3ff237
productCodeChangeStatus: none
runtimeCodeChangeStatus: none
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
externalEndpointExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
runtimeDiagnosticExecution: no
realTtsExecution: no
asrExecution: no
live2dRendererExecution: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
githubReviewSubmissionStatus: no
manualRerun: no

## Boundary Premise

VOXWEAVE does not own image generation, video generation, Live2D rendering, real TTS, real ASR, IRIS Core, LIVE2D renderer responsibility, CRIPTO-TIP responsibility, final utterance authority, memory authority, relationship authority, game operation authority, safety decision authority, or readiness claims.

VOXWEAVE owns safe voice orchestration metadata after IRIS creates adapter packets: state summaries, safe boundary metadata, adapter routing hints, pronunciation repair metadata, multilingual reading metadata, emotional prosody metadata, subtitle timing, mouth cues, Live2D-safe synchronization cues, mock TTS metadata, artifact summaries, reaction cache metadata, and quality scores.

## Spec Hint Status

characterIdentityContractStatus: proposed
realtimeInteractionContractStatus: proposed
humanOversightConsentContractStatus: proposed
structuredContextContractStatus: proposed
avatarFeedbackContractStatus: proposed
multilingualPersonalizationContractStatus: proposed
safeTtsTextNormalizationContractStatus: implemented_foundation_from_pr316

## character_identity_contract

problem: AI character systems need stable identity references without moving persona ownership into VOXWEAVE.
why_voxweave_not_other_project: VOXWEAVE can carry safe identity metadata needed for pronunciation, style, subtitle, mouth cue, and Live2D-safe sync behavior after IRIS has decided the utterance.
proposed_fields: character_profile_id, persona_version, visual_identity_id, voice_identity_id, style_preset_id, identity_lock_level, identity_source_kind, identity_consent_status, identity_asset_license_status, identity_drift_risk
safe_boundaries: fields must be IDs, statuses, or safe summaries; no likeness asset body, voice sample, raw prompt, contract text, endpoint, model path, or secret value.
do_not_own: final persona decision, memory update, relationship state, visual asset generation, voice actor contract management, likeness licensing decision.
future_tests: contract-only validation for safe IDs, bounded text, forbidden keys, and no raw asset material.
implementation_priority: next_best_candidate

## realtime_interaction_contract

problem: realtime AI conversation needs turn and interruption metadata without claiming runtime readiness or owning transport.
why_voxweave_not_other_project: VOXWEAVE already groups adapter responses by event and utterance identity and can expose safe timing guidance.
proposed_fields: session_id, turn_id, utterance_id, input_mode, output_mode, speech_state, interrupt_policy, latency_class, avatar_expression_hint, avatar_motion_hint, tts_emotion_hint, safe_summary_only
safe_boundaries: values must remain adapter guidance only and must not include live transport endpoints, raw stream bodies, raw audio, or runtime readiness claims.
do_not_own: websocket runtime, ASR stream, final dialogue policy, user safety decision, renderer health.
future_tests: route-independent schema validation and response safety tests for realtime metadata.
implementation_priority: after_character_identity_contract

## human_oversight_and_consent_contract

problem: character and voice orchestration needs consent and review status without making VOXWEAVE the legal authority.
why_voxweave_not_other_project: VOXWEAVE can refuse or downgrade unsafe voice/avatar hints based on safe status metadata.
proposed_fields: consent_status, human_review_status, brand_guard_status, voice_clone_allowed, likeness_use_allowed, commercial_use_allowed, minor_or_sensitive_context
safe_boundaries: status fields only; no legal document body, private identity document, raw approval log, or compliance claim.
do_not_own: legal approval, YouTube policy compliance, contract management, actor authorization source of truth.
future_tests: input rejection for unsafe consent payload fields and safe response summary only.
implementation_priority: after_identity_schema

## structured_context_contract

problem: AI character orchestration benefits from scene and app context, but VOXWEAVE must not become IRIS Core.
why_voxweave_not_other_project: VOXWEAVE can use safe context summaries to shape prosody, subtitles, mouth cues, and Live2D-safe cues.
proposed_fields: scene_id, actor_states, user_intent, last_user_action, visible_objects_summary, game_or_app_state_text, risk_flags, allowed_actions
safe_boundaries: context must be summary-only and bounded; no commands, memory writes, relationship writes, game inputs, canonical envelopes, raw payloads, private paths, or endpoint values.
do_not_own: game operation execution, memory persistence, relationship state, safety decision authority, final allowed action selection.
future_tests: forbidden field rejection and summary length bounds.
implementation_priority: after_human_oversight_contract

## avatar_feedback_contract

problem: avatar-facing feedback should be expressive but must remain renderer-safe guidance.
why_voxweave_not_other_project: VOXWEAVE already produces Live2D-safe cue material and mouth cue timing.
proposed_fields: expression, gaze, gesture, mouth_state, attention_state
safe_boundaries: only safe enum-like hints and timing metadata; no renderer endpoint, model path, raw motion command, raw renderer payload, or Cubism model material.
do_not_own: renderer execution, model loading, browser delivery, renderer health, cue validation.
future_tests: Live2D-safe hint allowlist and forbidden renderer field rejection.
implementation_priority: after_structured_context_contract

## multilingual_personalization_contract

problem: multilingual character speech needs safe reading and personalization metadata without private profile leakage.
why_voxweave_not_other_project: VOXWEAVE already performs multilingual reading metadata, script direction, pronunciation repair, subtitle timing, and safe text normalization.
proposed_fields: locale_in, locale_out, translation_mode, recipient_profile_kind, personalization_scope, approved_profile_facts
safe_boundaries: approved_profile_facts must be bounded safe summaries and must not include private raw profile data, memory IDs, relationship records, or secrets.
do_not_own: translation policy authority, memory source of truth, user profile storage, final utterance text.
future_tests: locale bounds, script direction preservation, and private profile field rejection.
implementation_priority: after_avatar_feedback_contract

## safe_tts_text_normalization_contract

problem: speech text can contain unsafe transport/configuration markers that must not be spoken or returned as raw runtime material.
why_voxweave_not_other_project: PR #316 added safe TTS text normalization as a VOXWEAVE product-helper foundation.
proposed_fields: urlReplacementPolicy, keyValueSanitizationPolicy, authorizationValueSanitizationPolicy, falsePositivePreservationPolicy, safeSummaryRawLeakPolicy, runtimeConnectionStatus
safe_boundaries: runtimeConnectionStatus: not_connected; no provider endpoint, token value, raw audio, raw payload, or real TTS readiness claim.
do_not_own: real provider connection, real TTS execution, ASR, external voice runtime, deployment readiness.
future_tests: preserve PR #316 tests and add contract-level status metadata once character identity schema lands.
implementation_priority: implemented_foundation

## Validation Evidence

node scripts/codex-v125-self-test.mjs: pass
node scripts/codex-v124-self-test.mjs: pass
node scripts/codex-v123-self-test.mjs: pass
node scripts/codex-v122-self-test.mjs: pass
node scripts/codex-local-quality-gate.mjs: pass
npm test: pass
git diff --check: pass

## Safe Next Action

Audit the gap between these proposed contracts and current src/contracts.js, src/orchestrator.js, and tests, then choose one minimal implementation scope.
