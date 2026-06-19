import {
  LIVE2D_RENDERER_CUE_SCHEMA,
  clamp,
  extractProsodyHints,
  safeId,
  safeText,
} from "./contracts.js";
import { createReactionPlanCacheEntry } from "./reactionPlanCache.js";

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
const TRAILING_REACTION_PUNCTUATION_PATTERN = /[、。.!?！？]+$/u;
const PERSONAL_REACTION_CACHE_RISK_PATTERN =
  /さん|様|くん|ちゃん|remember|memory|sorry|apolog|personal|relationship/iu;
const KNOWN_MOJIBAKE_REACTION_FRAGMENTS = [
  "邵ｺ繝ｻ・・",
  "邵ｺ繧・ｽ顔ｸｺ蠕娯・邵ｺ繝ｻ",
  "邵ｺ霈費ｽ・",
  "隶偵・邵ｺ荳奇ｽ・",
  "邵ｺ・｡郢ｧ繝ｻ・・",
];
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

export function buildReactionPlan({
  payload,
  text,
  correctedText,
  repairs,
  dictionaryVersion,
  language,
  localeStatus,
  scriptDirection,
  durationMs,
}) {
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
    requestId: "voxweave-template",
    prosody,
    mouthCues,
  });
  const quality = scoreQuality({
    text,
    correctedText,
    repairs,
    subtitleTiming,
    mouthCues,
    live2dCue,
  });

  return createReactionPlanCacheEntry({
    corrected_text: correctedText,
    repairs,
    dictionary_version: dictionaryVersion,
    language,
    locale_status: localeStatus,
    script_direction: scriptDirection,
    duration_ms: durationMs,
    prosody,
    reading_plan: readingPlan,
    subtitle_timing: subtitleTiming,
    mouth_cues: mouthCues,
    live2d_cue_template: stripLive2dCueRequestIdentity(live2dCue),
    quality,
  });
}

function stripLive2dCueRequestIdentity(live2dCue) {
  const template = structuredClone(live2dCue);
  delete template.cue_id;
  return template;
}

export function buildProsody(payload, hints, { fallbackAllowed, localeStatus }) {
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

export function buildReadingPlan({ text, language, scriptDirection, localeStatus }) {
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

export function buildSubtitleTiming({ text, language, scriptDirection, durationMs, payload }) {
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

export function buildMouthCues({ text, durationMs }) {
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

export function buildLive2dCue({ payload, durationMs, requestId, prosody, mouthCues }) {
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

export function scoreQuality({
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

export function isSupportedLocale(language) {
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
        .split(/[\s、。.!?！？]+/u)
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

export function isCacheableReaction(text) {
  const normalized = normalizeReactionCacheText(text);
  if (!normalized) return false;
  if (
    /[@#]|\d/u.test(normalized) ||
    PERSONAL_REACTION_CACHE_RISK_PATTERN.test(normalized) ||
    KNOWN_MOJIBAKE_REACTION_FRAGMENTS.some((fragment) => normalized.includes(fragment))
  ) {
    return false;
  }
  return CACHEABLE_NEUTRAL_REACTIONS.has(normalized);
}

export function isPersonalReactionCacheRisk(value) {
  try {
    const serialized = JSON.stringify(value ?? {});
    if (typeof serialized !== "string") return true;
    const normalized = normalizeReactionCacheText(serialized);
    return (
      PERSONAL_REACTION_CACHE_RISK_PATTERN.test(normalized) ||
      KNOWN_MOJIBAKE_REACTION_FRAGMENTS.some((fragment) => normalized.includes(fragment))
    );
  } catch {
    return true;
  }
}

function normalizeReactionCacheText(text) {
  let normalized = String(text ?? "").trim();
  normalized = normalized.replace(TRAILING_REACTION_PUNCTUATION_PATTERN, "").trim();
  return normalized;
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
