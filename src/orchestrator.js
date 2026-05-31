import {
  HEALTH_SCHEMA,
  LIVE2D_RENDERER_CUE_SCHEMA,
  LIVE2D_RENDERER_DELIVERY_SCHEMA,
  SERVICE_SCHEMA,
  assertSafeResponse,
  clamp,
  extractDurationMs,
  extractInputText,
  extractLanguage,
  extractProsodyHints,
  extractScriptDirection,
  extractTrace,
  hashPayload,
  normalizeAdapterKind,
  safeId,
  safeText,
  validateInputPayload,
} from "./contracts.js";
import { repairPronunciationText } from "./pronunciationDictionary.js";
import { ReactionCache } from "./cache.js";
import { RenderGroupStore } from "./renderGroupStore.js";
import { createLive2dForwarder } from "./live2dForwarder.js";

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
} = {}) {
  return {
    health() {
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
      });
    },

    async orchestrate(payload, { routeKind = "" } = {}) {
      validateInputPayload(payload, { routeKind });

      const adapterKind =
        routeKind ||
        normalizeAdapterKind(payload.adapter_kind ?? payload.adapterKind ?? payload.mode);
      const text = extractInputText(payload);
      const { correctedText, repairs, dictionary_version } =
        repairPronunciationText(text);
      const language = extractLanguage(payload, correctedText);
      const localeStatus = isSupportedLocale(language) ? "supported" : "unsupported";
      const scriptDirection = extractScriptDirection(payload, language, correctedText);
      const durationMs = extractDurationMs(payload, correctedText);
      const trace = extractTrace(payload);
      const requestId = createRequestId(payload, now);
      const cacheKey = hashPayload({
        schema: payload.schema,
        adapter_kind: adapterKind,
        text: correctedText,
        language,
        speech_cue: payload.speech_cue ?? null,
        motion_cue: payload.motion_cue ?? null,
      });
      const cacheable = isCacheableReaction(correctedText);
      const cached = cacheable ? cache.get(cacheKey) : null;
      if (cached) {
        const renderGroup = renderGroups.update({
          adapterKind,
          traceId: trace.traceId,
          eventId: trace.eventId,
          utteranceId: trace.utteranceId,
          qualityWarningCount: cached.quality?.deductions?.length ?? 0,
        });
        return assertSafeResponse({
          ...cached,
          request_id: requestId,
          render_group: renderGroup,
          cache: {
            status: "hit",
            key: cacheKey,
          },
        });
      }

      const fallbackAllowed = extractFallbackAllowed(payload);
      const prosody = buildProsody(payload, extractProsodyHints(payload), {
        fallbackAllowed,
        localeStatus,
      });
      const readingPlan = buildReadingPlan({
        text: correctedText,
        language,
        scriptDirection,
        localeStatus,
      });
      const subtitleTiming = buildSubtitleTiming({
        text: correctedText,
        language,
        scriptDirection,
        durationMs,
        payload,
      });
      const mouthCues = buildMouthCues({ text: correctedText, durationMs });
      const live2dCue = buildLive2dCue({
        payload,
        durationMs,
        requestId,
        prosody,
        mouthCues,
      });
      const mockTts = buildMockTts({
        requestId,
        durationMs,
        mouthCues,
        language,
        localeStatus,
      });
      const quality = scoreQuality({
        text,
        correctedText,
        repairs,
        subtitleTiming,
        mouthCues,
        live2dCue,
      });
      const artifact = buildAdapterArtifact({
        adapterKind,
        requestId,
        mockTts,
        subtitleTiming,
        live2dCue,
        localeStatus,
      });
      const live2dCueDelivery = {
        schema: LIVE2D_RENDERER_DELIVERY_SCHEMA,
        cue: live2dCue,
        boundary_policy: {
          renderer_cue_only: true,
          safe_transport_only: true,
          file_refs_summary: true,
        },
        adapter_validation_required: true,
      };
      const live2dForward = adapterKind === "live2d"
        ? await live2dForwarder.forward(live2dCueDelivery)
        : {
            renderer_forward_configured: live2dForwarder.configured === true,
            renderer_forward_attempted: false,
            renderer_forward_ok: false,
            renderer_forward_status: "not_live2d_adapter",
          };
      const renderGroup = renderGroups.update({
        adapterKind,
        traceId: trace.traceId,
        eventId: trace.eventId,
        utteranceId: trace.utteranceId,
        qualityWarningCount: quality.deductions.length,
      });
      const responseSummary = buildIrisResponseSummary({
        requestId,
        eventId: trace.eventId,
        artifact,
        durationMs,
        mockTts,
        mouthCues,
      });

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
        duration_ms: durationMs,
        error_kind: null,
        sample_rate_hz: mockTts.sample_rate_hz,
        viseme_count: mouthCues.length,
        runtime_readiness_claimed: false,
        response_summary: responseSummary,
        pronunciation: {
          dictionary_version,
          corrected_text: correctedText,
          repair_count: repairs.length,
          repairs,
        },
        reading_plan: readingPlan,
        prosody,
        mock_tts: mockTts,
        tts_routing: prosody.tts_routing,
        subtitle_timing: subtitleTiming,
        subtitle_segments: subtitleTiming.chunks,
        mouth_cues: mouthCues,
        live2d_cue: live2dCue,
        live2d_cue_delivery: live2dCueDelivery,
        live2d_forward: live2dForward,
        quality,
        render_group: renderGroup,
        cache: {
          status: "miss",
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
        },
        adapter_validation_required: true,
      };

      assertSafeResponse(response);
      if (cacheable) {
        cache.set(cacheKey, {
          ...response,
          request_id: "cached",
          cache: {
            status: "stored",
            key: cacheKey,
          },
        });
      }
      return response;
    },
  };
}

function createRequestId(payload, now) {
  const base = safeId(payload.trace_id ?? payload.event_id ?? "");
  const suffix = hashPayload({ payload, timeBucket: Math.floor(now() / 1000) }).slice(0, 12);
  return `voxweave-${base || "request"}-${suffix}`;
}

function buildProsody(payload, hints, { fallbackAllowed, localeStatus }) {
  const style = hints.prosodyStyle || inferProsodyStyle(hints);
  const emotion = hints.emotion || inferEmotionFromStyle(style);
  const pace = normalizePace(hints.pace, style);
  const pitch = normalizePitch(hints.pitch, emotion);
  const volume = normalizeVolume(hints.volume, emotion);
  const breathiness = safeText(payload.speech_cue?.breathiness ?? "", 40) || "medium";
  return {
    schema: "voxweave_emotional_prosody_v1",
    style,
    emotion,
    pace,
    pitch,
    volume,
    breathiness,
    tts_routing: {
      mode: localeStatus === "supported" ? "mock_tts" : "dry_run_text_only",
      provider_required: false,
      real_tts_connected: false,
      fallback_allowed: fallbackAllowed,
      voice_switched: false,
      fallback_mode:
        localeStatus === "supported"
          ? "none"
          : fallbackAllowed
            ? "text_only_safe_fallback"
            : "text_only_no_voice_switch",
    },
  };
}

function buildReadingPlan({ text, language, scriptDirection, localeStatus }) {
  const characters = Array.from(text);
  const segmentSize = language.startsWith("ja") ? 18 : 42;
  const segments = [];
  for (let index = 0; index < characters.length; index += segmentSize) {
    segments.push({
      index: segments.length,
      text: characters.slice(index, index + segmentSize).join(""),
      language,
      script_direction: scriptDirection,
      reading_mode: resolveReadingMode(language, localeStatus),
    });
  }
  return {
    schema: "voxweave_multilingual_reading_plan_v1",
    primary_language: language,
    locale_status: localeStatus,
    fallback_mode: localeStatus === "supported" ? "none" : "text_only",
    script_direction: scriptDirection,
    segment_count: segments.length,
    segments,
    reading_candidates: buildReadingCandidates(text, language),
  };
}

function buildSubtitleTiming({ text, language, scriptDirection, durationMs, payload }) {
  const requestedStart = Number(payload.display_start_ms);
  const startMs = Number.isFinite(requestedStart) && requestedStart >= 0
    ? Math.round(requestedStart)
    : 0;
  const words = splitSubtitleUnits(text, language);
  const chunkTarget = language.startsWith("ja") ? 18 : 44;
  const chunks = [];
  let current = "";
  for (const unit of words) {
    const next = current ? `${current}${language.startsWith("ja") ? "" : " "}${unit}` : unit;
    if (Array.from(next).length > chunkTarget && current) {
      chunks.push(current);
      current = unit;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length === 0) chunks.push("");

  const totalChars = Math.max(1, chunks.reduce((sum, chunk) => sum + Array.from(chunk).length, 0));
  let cursor = startMs;
  const timedChunks = chunks.map((chunk, index) => {
    const ratio = Math.max(0.08, Array.from(chunk).length / totalChars);
    const chunkDuration = index === chunks.length - 1
      ? startMs + durationMs - cursor
      : Math.max(320, Math.round(durationMs * ratio));
    const cue = {
      index,
      text: chunk,
      start_ms: cursor,
      end_ms: Math.max(cursor + 200, cursor + chunkDuration),
    };
    cursor = cue.end_ms;
    return cue;
  });

  return {
    schema: "voxweave_subtitle_timing_v1",
    language,
    script_direction: scriptDirection,
    display_start_ms: startMs,
    display_end_ms: startMs + durationMs,
    chunks: timedChunks,
    readability_profile: {
      visible_character_count: Array.from(text).length,
      chunk_count: timedChunks.length,
      max_chunk_length: Math.max(...timedChunks.map((chunk) => Array.from(chunk.text).length)),
      average_chunk_duration_ms: Math.round(durationMs / timedChunks.length),
      fast_speech_mode: durationMs / totalChars < 55,
      overflow_risk: timedChunks.some((chunk) => Array.from(chunk.text).length > 56),
    },
    boundary_policy: {
      subtitle_display_guidance_only: true,
      authority_safe: true,
      no_memory_ids: true,
    },
  };
}

function buildMouthCues({ text, durationMs }) {
  const cueCount = clamp(Math.ceil(Math.max(1, Array.from(text).length) / 3), 4, 120);
  const step = durationMs / cueCount;
  const cues = [];
  for (let index = 0; index < cueCount; index += 1) {
    const start = Math.round(index * step);
    const end = Math.round((index + 1) * step);
    cues.push({
      index,
      start_ms: start,
      end_ms: Math.max(start + 40, end),
      viseme: VISEME_PATTERN[index % VISEME_PATTERN.length],
      openness: Number((0.25 + (index % 5) * 0.14).toFixed(2)),
    });
  }
  return cues;
}

function buildLive2dCue({ payload, durationMs, requestId, prosody, mouthCues }) {
  const rawStyle =
    payload.motion_cue?.motion_style ??
    payload.motion_style ??
    payload.live2d_adapter_guidance?.motion_guidance ??
    "";
  const motionStyle = normalizeMotionStyle(rawStyle, prosody);
  const strong = STRONG_LIVE2D_MOTION_STYLES.has(motionStyle);
  const expressionKey = expressionForMotion(motionStyle, prosody);

  return {
    schema: LIVE2D_RENDERER_CUE_SCHEMA,
    cue_id: `live2d-cue-${safeId(requestId)}`,
    motion: {
      style: motionStyle,
      intensity: strong ? "high" : "medium",
      blend_ms: strong ? 180 : 260,
      track_count: mouthCues.length,
      body_motion_hint: motionStyle === "focused_talk" ? "micro_tracking" : "soft_sway",
      gesture_hint: motionStyle === "laugh_big" ? "cover_mouth_laugh" : "small_hand",
      recovery_required: strong,
    },
    expression: {
      expression_key: expressionKey,
      blink_rate: motionStyle === "focused_talk" ? 0.32 : 0.42,
      gaze_hint: motionStyle === "focused_talk" ? "screen_focus" : "audience_soft",
    },
    breath: {
      state: prosody.breathiness === "low" ? "calm" : "speech",
      rate: motionStyle === "idle_breath" ? 0.32 : 0.46,
      intensity: strong ? "medium" : "low",
    },
    body: {
      breathing_rate: motionStyle === "idle_breath" ? 0.32 : 0.46,
      shoulder_motion: strong ? "recover_after_burst" : "subtle_breath",
      recovery_hint: strong ? "breath_recover" : "neutral",
    },
    timing: {
      duration_ms: durationMs,
      total_duration_ms: durationMs,
      start_delay_ms: 0,
      sync_policy: "voice_timing_guidance",
    },
    boundary_policy: {
      renderer_cue_only: true,
      voice_sync_guidance_only: true,
      safe_transport_only: true,
      file_refs_summary: true,
    },
    adapter_validation_required: true,
    recovery_required: strong,
    recovery_plan: strong ? { type: "breath_recover" } : undefined,
    recovery_cue: strong ? { style: "idle_breath" } : undefined,
  };
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
}) {
  if (adapterKind === "subtitle") {
    return {
      artifact_kind: "subtitle_vtt",
      artifact_url: `artifact://voxweave/subtitle/${safeId(requestId)}.vtt`,
      artifact_status: "dry_run_subtitle",
    };
  }
  if (adapterKind === "live2d") {
    return {
      artifact_kind: "live2d_cue_json",
      artifact_url: `artifact://voxweave/live2d/${safeId(requestId)}.json`,
      artifact_status: "dry_run_live2d_cue",
    };
  }
  return {
    artifact_kind: localeStatus === "supported" ? "mock_audio" : "dry_run_audio",
    artifact_url: mockTts.artifact_url,
    artifact_status: mockTts.mode,
    subtitle_preview_count: subtitleTiming.chunks.length,
  };
}

function buildIrisResponseSummary({
  requestId,
  eventId,
  artifact,
  durationMs,
  mockTts,
  mouthCues,
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
