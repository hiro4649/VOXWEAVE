import { randomUUID } from "node:crypto";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  HEALTH_SCHEMA,
  LIVE2D_RENDERER_DELIVERY_SCHEMA,
  SERVICE_SCHEMA,
  assertSafeResponse,
  buildIntegrationBoundarySnapshot,
  extractAiCharacterContracts,
  extractDurationMs,
  extractInputText,
  extractLanguage,
  extractScriptDirection,
  extractTrace,
  normalizeAdapterKind,
  safeId,
  validateInputPayload,
} from "./contracts.js";
import { VoxWeaveError } from "./errors.js";
import {
  assertAiCharacterResponseSafeSummary,
  buildAiCharacterContractAdapterMetadata,
  buildAiCharacterContractPresence,
  buildAiCharacterContractResponseGuard,
  buildAiCharacterContractSafeSummary,
} from "./aiCharacterMetadata.js";
import { repairPronunciationText } from "./pronunciationDictionary.js";
import { ReactionCache } from "./cache.js";
import { RenderGroupStore } from "./renderGroupStore.js";
import { createLive2dForwarder } from "./live2dForwarder.js";
import {
  buildReactionPlanCacheKey,
  validateReactionPlanCacheEntry,
} from "./reactionPlanCache.js";
import {
  buildReactionPlan,
  isCacheableReaction as isCacheableReactionPlan,
  isPersonalReactionCacheRisk,
  isSupportedLocale as isSupportedReactionLocale,
} from "./reactionPlanBuilder.js";
import { throwIfOperationAborted } from "./operationContext.js";

export { assertAiCharacterResponseSafeSummary } from "./aiCharacterMetadata.js";

const ALLOWED_LIVE2D_MOTION_STYLES = new Set([
  "talk",
  "focused_talk",
  "laugh_big",
  "idle_breath",
  "surprise_scream",
  "happy_humming",
  "happy_dance",
  "happy_loud_sing",
]);

const STRONG_LIVE2D_MOTION_STYLES = new Set([
  "laugh_big",
  "surprise_scream",
  "happy_dance",
  "happy_loud_sing",
]);

const VISEME_PATTERN = ["A", "I", "U", "E", "O", "N"];
const CACHEABLE_NEUTRAL_REACTIONS = new Set([
  "うん",
  "えっ",
  "ふふっ",
  "ありがとう",
  "ちょっと待って",
  "yes",
  "thanks",
  "one moment",
]);
const SUPPORTED_LOCALES = new Set([
  "ar",
  "bn",
  "de",
  "en",
  "es",
  "fr",
  "hi",
  "id",
  "it",
  "ja",
  "jv",
  "ko",
  "pl",
  "pt",
  "ru",
  "ta",
  "th",
  "tr",
  "ur",
  "vi",
  "zh",
]);

export function createVoxWeaveService({
  now = () => Date.now(),
  cache = new ReactionCache(),
  renderGroups = new RenderGroupStore({ now }),
  live2dForwarder = createLive2dForwarder(),
  requestIdFactory = null,
} = {}) {
  return {
    health() {
      const integrationBoundary = buildIntegrationBoundarySnapshot({
        live2dForwarder,
        contractRegistryFamilyCount: AI_CHARACTER_CONTRACT_FAMILY_COUNT,
      });
      return assertSafeResponse({
        schema: HEALTH_SCHEMA,
        service: "voxweave",
        status: "ok",
        mode: "external_voice_orchestrator",
        node: ">=20",
        capabilities: {
          mock_tts: true,
          pronunciation_dictionary: true,
          multilingual_reading: true,
          emotional_prosody: true,
          reaction_cache: true,
          subtitle_timing: true,
          mouth_cues: true,
          live2d_safe_sync_cue: true,
          quality_score: true,
        },
        boundaries: {
          not_tts_engine: true,
          not_live2d_renderer: true,
          not_voice_actor_contract_management: true,
          not_iris_core_phase: true,
          iris_keeps_adapter_packet_creation: true,
          live2d_keeps_renderer_validation: true,
        },
        supported_adapter_kinds: ["tts", "subtitle", "live2d"],
        cache_entries: cache.size(),
        runtime_readiness_claimed: false,
        production_readiness_claimed: false,
        integration_boundary: integrationBoundary,
      });
    },

    async orchestrate(payload, { routeKind = "", signal } = {}) {
      throwIfOperationAborted(signal);
      validateInputPayload(payload, { routeKind });
      throwIfOperationAborted(signal);
      const extractedAiCharacterContracts = extractAiCharacterContracts(payload);
      throwIfOperationAborted(signal);
      const aiCharacterContracts = buildAiCharacterContractPresence(
        extractedAiCharacterContracts
      );
      const aiCharacterContractSummary = buildAiCharacterContractSafeSummary(
        extractedAiCharacterContracts,
        aiCharacterContracts
      );

      const adapterKind =
        routeKind ||
        normalizeAdapterKind(payload.adapter_kind ?? payload.adapterKind ?? payload.mode);
      const integrationBoundary = buildIntegrationBoundarySnapshot({
        live2dForwarder,
        contractRegistryFamilyCount: AI_CHARACTER_CONTRACT_FAMILY_COUNT,
      });
      const aiCharacterAdapterMetadata = buildAiCharacterContractAdapterMetadata(
        aiCharacterContracts,
        aiCharacterContractSummary,
        adapterKind
      );
      const text = extractInputText(payload);
      const { correctedText, repairs, dictionary_version } =
        repairPronunciationText(text);
      const language = extractLanguage(payload, correctedText);
      const localeStatus = isSupportedReactionLocale(language) ? "supported" : "unsupported";
      const scriptDirection = extractScriptDirection(payload, language, correctedText);
      const durationMs = extractDurationMs(payload, correctedText);
      const trace = extractTrace(payload);
      const cacheKey = buildReactionPlanCacheKey({
        payload,
        adapterKind,
        correctedText,
        dictionaryVersion: dictionary_version,
      });
      const cacheable =
        isCacheableReactionPlan(correctedText) &&
        isCacheableReactionPlan(text) &&
        !isPersonalReactionCacheRisk(
          `${text} ${payload.final_text ?? ""} ${payload.finalText ?? ""} ${payload.subtitle_text ?? ""} ${payload.trace_id ?? ""} ${payload.event_id ?? ""} ${payload.utterance_id ?? ""}`
        );
      throwIfOperationAborted(signal);
      const cached = cacheable ? cache.get(cacheKey) : null;
      if (cached) {
        try {
          const reactionPlan = validateReactionPlanCacheEntry(cached);
          throwIfOperationAborted(signal);
          return await materializeReactionPlanResponse({
            reactionPlan,
            payload,
            adapterKind,
            trace,
            cacheKey,
            cacheStatus: "hit",
            now,
            live2dForwarder,
            renderGroups,
            requestIdFactory,
            aiCharacterContracts,
            aiCharacterContractSummary,
            aiCharacterAdapterMetadata,
            integrationBoundary,
            signal,
          });
        } catch (error) {
          if (error instanceof VoxWeaveError && error.code === "invalid_cache_entry") {
            cache.delete(cacheKey);
            // Rebuild the plan below without exposing stale cached material.
          } else {
            throw error;
          }
        }
      }

      const reactionPlan = buildReactionPlan({
        payload,
        text,
        correctedText,
        repairs,
        dictionaryVersion: dictionary_version,
        language,
        localeStatus,
        scriptDirection,
        durationMs,
      });
      throwIfOperationAborted(signal);
      const response = await materializeReactionPlanResponse({
        reactionPlan,
        payload,
        adapterKind,
        trace,
        cacheKey,
        cacheStatus: "miss",
        now,
        live2dForwarder,
        renderGroups,
        requestIdFactory,
        aiCharacterContracts,
        aiCharacterContractSummary,
        aiCharacterAdapterMetadata,
        integrationBoundary,
        signal,
      });
      throwIfOperationAborted(signal);
      if (cacheable) {
        cache.set(cacheKey, reactionPlan);
      }
      throwIfOperationAborted(signal);
      return response;
    },
  };
}

function createRequestId({ trace, adapterKind, requestIdFactory }) {
  const base = safeId(trace.traceId || trace.eventId || "request");
  const value =
    typeof requestIdFactory === "function"
      ? requestIdFactory({ trace: structuredClone(trace), adapterKind })
      : `voxweave-${base || "request"}-${randomUUID()}`;
  const normalized = String(value ?? "");
  if (
    normalized.length === 0 ||
    normalized.length > 160 ||
    !normalized.startsWith("voxweave-") ||
    safeId(normalized, 160) !== normalized
  ) {
    throw new VoxWeaveError("Invalid request id.", "invalid_request_id", 500);
  }
  return normalized;
}

async function materializeReactionPlanResponse({
  reactionPlan,
  payload,
  adapterKind,
  trace,
  cacheKey,
  cacheStatus,
  now,
  live2dForwarder,
  renderGroups,
  requestIdFactory,
  aiCharacterContracts,
  aiCharacterContractSummary,
  aiCharacterAdapterMetadata,
  integrationBoundary,
  signal,
}) {
  throwIfOperationAborted(signal);
  const requestId = createRequestId({ trace, adapterKind, requestIdFactory });
  const mouthCues = structuredClone(reactionPlan.mouth_cues);
  const subtitleTiming = structuredClone(reactionPlan.subtitle_timing);
  const live2dCue = {
    ...structuredClone(reactionPlan.live2d_cue_template),
    cue_id: `live2d-cue-${safeId(requestId)}`,
  };
  const mockTts = buildMockTts({
    requestId,
    durationMs: reactionPlan.duration_ms,
    mouthCues,
    language: reactionPlan.language,
    localeStatus: reactionPlan.locale_status,
  });
  const artifact = buildAdapterArtifact({
    adapterKind,
    requestId,
    mockTts,
    subtitleTiming,
    live2dCue,
    localeStatus: reactionPlan.locale_status,
    aiCharacterContracts,
    aiCharacterAdapterMetadata,
  });
  const live2dCueDelivery = {
    schema: LIVE2D_RENDERER_DELIVERY_SCHEMA,
    cue: live2dCue,
    boundary_policy: {
      renderer_cue_only: true,
      safe_transport_only: true,
      file_refs_summary: true,
      ai_character_contract_adapter_metadata_present:
        aiCharacterAdapterMetadata.ai_character_contracts_present,
      raw_ai_character_contracts_excluded: true,
      ai_character_contract_response_safe_summary_guard: true,
    },
    adapter_validation_required: true,
  };
  throwIfOperationAborted(signal);
  const live2dForward = adapterKind === "live2d"
    ? await live2dForwarder.forward(live2dCueDelivery, { signal })
    : {
        renderer_forward_configured: live2dForwarder.configured === true,
        renderer_forward_attempted: false,
        renderer_forward_ok: false,
        renderer_forward_status: "not_live2d_adapter",
      };
  throwIfOperationAborted(signal);
  const renderGroupInput = {
    adapterKind,
    traceId: trace.traceId,
    eventId: trace.eventId,
    utteranceId: trace.utteranceId,
    requestId,
    qualityWarningCount: reactionPlan.quality.deductions.length,
  };
  const renderGroup = typeof renderGroups.previewUpdate === "function"
    ? renderGroups.previewUpdate(renderGroupInput)
    : renderGroups.update(renderGroupInput);
  const responseSummary = buildIrisResponseSummary({
    requestId,
    eventId: trace.eventId,
    artifact,
    durationMs: reactionPlan.duration_ms,
    mockTts,
    mouthCues,
    aiCharacterContracts,
    aiCharacterContractSummary,
    aiCharacterAdapterMetadata,
    aiCharacterResponseGuard: buildAiCharacterContractResponseGuard(),
    integrationBoundary,
  });
  throwIfOperationAborted(signal);

  const response = {
    schema: SERVICE_SCHEMA,
    ok: true,
    response_kind: "json",
    request_id: requestId,
    trace_id: trace.traceId,
    event_id: trace.eventId,
    utterance_id: trace.utteranceId,
    adapter_kind: adapterKind,
    bridge_status: "accepted",
    artifact_kind: artifact.artifact_kind,
    artifact_url: artifact.artifact_url,
    duration_ms: reactionPlan.duration_ms,
    error_kind: null,
    sample_rate_hz: mockTts.sample_rate_hz,
    viseme_count: mouthCues.length,
    runtime_readiness_claimed: false,
    ai_character_contract_summary: aiCharacterContractSummary,
    response_summary: responseSummary,
    pronunciation: {
      dictionary_version: reactionPlan.dictionary_version,
      corrected_text: reactionPlan.corrected_text,
      repair_count: reactionPlan.repairs.length,
      repairs: structuredClone(reactionPlan.repairs),
    },
    reading_plan: structuredClone(reactionPlan.reading_plan),
    prosody: structuredClone(reactionPlan.prosody),
    mock_tts: mockTts,
    tts_routing: structuredClone(reactionPlan.prosody.tts_routing),
    subtitle_timing: subtitleTiming,
    subtitle_segments: subtitleTiming.chunks,
    mouth_cues: mouthCues,
    live2d_cue: live2dCue,
    live2d_cue_delivery: live2dCueDelivery,
    live2d_forward: live2dForward,
    quality: structuredClone(reactionPlan.quality),
    render_group: renderGroup,
    cache: {
      status: cacheStatus,
      key: cacheKey,
    },
    boundary_policy: {
      adapter_guidance_only: true,
      no_core_envelope_returned: true,
      authority_fields_excluded: true,
      sensitive_values_excluded: true,
      binary_content_excluded: true,
      live2d_renderer_not_replaced: true,
      iris_core_not_replaced: true,
      ai_character_contract_response_safe_summary_guard: true,
      raw_ai_character_contracts_excluded: true,
      ai_character_contract_values_excluded: true,
    },
    adapter_validation_required: true,
  };

  assertSafeResponse(response);
  const safeResponse = assertAiCharacterResponseSafeSummary(response);
  throwIfOperationAborted(signal);
  if (typeof renderGroups.previewUpdate === "function") {
    renderGroups.update(renderGroupInput);
  }
  throwIfOperationAborted(signal);
  return safeResponse;
}

function buildMockTts({ requestId, durationMs, mouthCues, language, localeStatus }) {
  const dryRun = localeStatus !== "supported";
  return {
    schema: "voxweave_mock_tts_v1",
    mode: dryRun ? "dry_run_audio" : "mock_audio",
    provider_connected: false,
    artifact_url: `artifact://voxweave/${dryRun ? "dry-run" : "mock"}/${safeId(requestId)}.wav`,
    artifact_kind: dryRun ? "dry_run_audio" : "mock_audio",
    duration_ms: durationMs,
    sample_rate_hz: 48000,
    viseme_count: mouthCues.length,
    language,
    locale_status: localeStatus,
    boundary_policy: {
      mock_audio_metadata_only: true,
      binary_content_excluded: true,
      no_vendor_payload: true,
    },
  };
}

function buildAdapterArtifact({
  adapterKind,
  requestId,
  mockTts,
  subtitleTiming,
  localeStatus,
  aiCharacterContracts,
  aiCharacterAdapterMetadata,
}) {
  if (adapterKind === "subtitle") {
    return {
      artifact_kind: "subtitle_vtt",
      artifact_url: `artifact://voxweave/subtitle/${safeId(requestId)}.vtt`,
      artifact_status: "dry_run_subtitle",
      ai_character_contracts: aiCharacterContracts,
      ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    };
  }
  if (adapterKind === "live2d") {
    return {
      artifact_kind: "live2d_cue_json",
      artifact_url: `artifact://voxweave/live2d/${safeId(requestId)}.json`,
      artifact_status: "dry_run_live2d_cue",
      ai_character_contracts: aiCharacterContracts,
      ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    };
  }
  return {
    artifact_kind: localeStatus === "supported" ? "mock_audio" : "dry_run_audio",
    artifact_url: mockTts.artifact_url,
    artifact_status: mockTts.mode,
    subtitle_preview_count: subtitleTiming.chunks.length,
    ai_character_contracts: aiCharacterContracts,
    ai_character_adapter_metadata: aiCharacterAdapterMetadata,
  };
}

function buildIrisResponseSummary({
  requestId,
  eventId,
  artifact,
  durationMs,
  mockTts,
  mouthCues,
  aiCharacterContracts,
  aiCharacterContractSummary,
  aiCharacterAdapterMetadata,
  aiCharacterResponseGuard,
  integrationBoundary,
}) {
  return {
    status: 200,
    ok: true,
    response_kind: "json",
    response_omitted: false,
    error_kind: null,
    request_id: requestId,
    request_id_present: requestId !== "",
    bridge_status: "accepted",
    artifact_url: artifact.artifact_url,
    artifact_url_present: artifact.artifact_url !== "",
    artifact_kind: artifact.artifact_kind,
    manifest_id: "",
    manifest_id_present: false,
    event_id: eventId,
    event_id_present: eventId !== "",
    duration_ms: durationMs,
    sample_rate_hz: mockTts.sample_rate_hz,
    viseme_count: mouthCues.length,
    ai_character_contracts: aiCharacterContracts,
    ai_character_contract_summary: aiCharacterContractSummary,
    ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    ai_character_contract_response_guard: aiCharacterResponseGuard,
    integration_boundary: integrationBoundary,
  };
}

function scoreQuality({
  text,
  correctedText,
  repairs,
  subtitleTiming,
  mouthCues,
  live2dCue,
}) {
  let score = 100;
  const deductions = [];
  if (!text) {
    score -= 25;
    deductions.push("missing_text");
  }
  if (repairs.length > 0) {
    score -= Math.min(8, repairs.length * 2);
    deductions.push("pronunciation_repaired");
  }
  if (subtitleTiming.readability_profile.overflow_risk) {
    score -= 10;
    deductions.push("subtitle_overflow_risk");
  }
  if (mouthCues.length === 0) {
    score -= 15;
    deductions.push("mouth_cues_missing");
  }
  if (live2dCue.schema !== LIVE2D_RENDERER_CUE_SCHEMA) {
    score -= 20;
    deductions.push("live2d_cue_schema_mismatch");
  }
  if (correctedText.length > 1000) {
    score -= 5;
    deductions.push("long_utterance");
  }
  const finalScore = clamp(score, 0, 100);
  return {
    schema: "voxweave_quality_score_v1",
    score: finalScore,
    label: finalScore >= 90 ? "good" : finalScore >= 70 ? "usable" : "needs_attention",
    deductions,
    component_scores: {
      pronunciation: repairs.length === 0 ? 100 : 92,
      subtitle_timing: subtitleTiming.readability_profile.overflow_risk ? 82 : 100,
      mouth_cues: mouthCues.length > 0 ? 100 : 0,
      live2d_sync: live2dCue.schema === LIVE2D_RENDERER_CUE_SCHEMA ? 100 : 0,
    },
  };
}

function inferProsodyStyle(hints) {
  const joined = `${hints.motionStyle} ${hints.expressionHint} ${hints.emotion}`.toLowerCase();
  if (joined.includes("laugh")) return "laughing_speech";
  if (joined.includes("surprise") || joined.includes("scream")) return "surprised_speech";
  if (joined.includes("focused")) return "focused_speech";
  if (joined.includes("happy")) return "bright_speech";
  return "natural_speech";
}

function inferEmotionFromStyle(style) {
  if (style.includes("laugh")) return "joy";
  if (style.includes("surpris")) return "surprise";
  if (style.includes("focused")) return "focused";
  if (style.includes("bright")) return "happy";
  return "neutral";
}

function normalizePace(pace, style) {
  const normalized = String(pace ?? "").toLowerCase();
  if (["slow", "normal", "fast"].includes(normalized)) return normalized;
  if (style.includes("surpris") || style.includes("laugh")) return "fast";
  if (style.includes("focused")) return "normal";
  return "normal";
}

function normalizePitch(pitch, emotion) {
  const normalized = String(pitch ?? "").toLowerCase();
  if (["low", "medium", "high"].includes(normalized)) return normalized;
  if (["joy", "happy", "surprise"].includes(emotion)) return "high";
  return "medium";
}

function normalizeVolume(volume, emotion) {
  const normalized = String(volume ?? "").toLowerCase();
  if (["low", "medium", "high"].includes(normalized)) return normalized;
  if (emotion === "surprise") return "high";
  return "medium";
}

function splitSubtitleUnits(text, language) {
  if (!text) return [];
  if (language.startsWith("ja") || language.startsWith("zh")) return Array.from(text);
  return text.split(/\s+/u).filter(Boolean);
}

function normalizeMotionStyle(value, prosody) {
  const style = safeText(value, 80);
  if (ALLOWED_LIVE2D_MOTION_STYLES.has(style)) return style;
  if (prosody.style.includes("laugh")) return "laugh_big";
  if (prosody.style.includes("surpris")) return "surprise_scream";
  if (prosody.style.includes("focused")) return "focused_talk";
  return "talk";
}

function isSupportedLocale(language) {
  const normalized = String(language ?? "").trim().toLowerCase();
  const primary = normalized.split(/[-_]/u, 1)[0];
  return SUPPORTED_LOCALES.has(primary);
}

function extractFallbackAllowed(payload) {
  const value =
    payload.tts_adapter_guidance?.fallback_allowed ??
    payload.engine_preferences?.fallback_allowed ??
    payload.voice_preferences?.fallback_allowed ??
    payload.fallback_allowed;
  return value === false ? false : true;
}

function resolveReadingMode(language, localeStatus) {
  if (localeStatus !== "supported") return "text_only_safe_fallback";
  if (language.startsWith("ja")) return "mixed_japanese_reading";
  if (language.startsWith("zh")) return "chinese_text_reading_candidate";
  if (language.startsWith("ko")) return "korean_text_reading_candidate";
  if (language.startsWith("ar")) return "arabic_text_reading_candidate";
  return "plain_text_reading";
}

function buildReadingCandidates(text, language) {
  if (!/^(?:zh|ko|ar)(?:$|[-_])/iu.test(language)) return [];
  const candidates = Array.from(
    new Set(
      String(text ?? "")
        .split(/[\s、。,.!?！？]+/u)
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && containsTargetScript(part, language))
        .slice(0, 8)
    )
  );
  return candidates.map((surface, index) => ({
    index,
    surface: safeText(surface, 80),
    language,
    reading_status: "candidate_review_required",
    confidence: "low",
    requires_operator_review: true,
    forced_reading: false,
  }));
}

function containsTargetScript(text, language) {
  if (language.startsWith("zh")) return /[\u3400-\u9fff]/u.test(text);
  if (language.startsWith("ko")) return /[\uac00-\ud7af]/u.test(text);
  if (language.startsWith("ar")) return /[\u0600-\u06ff]/u.test(text);
  return false;
}

function isCacheableReaction(text) {
  const normalized = String(text ?? "").trim().replace(/[。.!！?？]+$/u, "");
  if (!CACHEABLE_NEUTRAL_REACTIONS.has(normalized)) return false;
  if (/[@#]|\d|さん|様|くん|ちゃん|remember|memory|sorry|apolog/i.test(normalized)) {
    return false;
  }
  return Array.from(normalized).length <= 16;
}

function expressionForMotion(motionStyle, prosody) {
  if (motionStyle === "laugh_big") return "eyes_smile_open_mouth_laugh";
  if (motionStyle === "surprise_scream") return "wide_eyes_short_scream";
  if (motionStyle === "happy_humming") return "closed_mouth_happy_hum";
  if (motionStyle === "happy_dance" || motionStyle === "happy_loud_sing") {
    return "bright_smile_high_energy";
  }
  if (motionStyle === "focused_talk" || prosody.emotion === "focused") {
    return "focused_bright";
  }
  if (motionStyle === "idle_breath") return "neutral_breath";
  return "soft_smile";
}
