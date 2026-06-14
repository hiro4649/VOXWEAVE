import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clamp,
  extractDurationMs,
  extractInputText,
  extractLanguage,
  extractProsodyHints,
  extractScriptDirection,
  extractTrace,
  hashPayload,
  safeId,
  safeText,
} from "../src/contracts.js";

const LONG_TEXT = "safe text ".repeat(600);
const LONG_HINT = "soft bright ".repeat(40);

test("extractInputText prefers text when present", () => {
  assert.equal(
    extractInputText({ text: "primary text", final_text: "fallback text" }),
    "primary text"
  );
});

test("extractInputText falls back to final_text", () => {
  assert.equal(extractInputText({ final_text: "final text" }), "final text");
});

test("extractInputText falls back through supported text fields", () => {
  assert.equal(extractInputText({ subtitle_text: "subtitle text" }), "subtitle text");
  assert.equal(extractInputText({ speech_text: "speech text" }), "speech text");
  assert.equal(extractInputText({ script_text: "script text" }), "script text");
  assert.equal(extractInputText({ utterance_text: "utterance text" }), "utterance text");
  assert.equal(extractInputText({ line_text: "line text" }), "line text");
  assert.equal(
    extractInputText({ subtitle_cue: { subtitle_text: "subtitle cue text" } }),
    "subtitle cue text"
  );
});

test("extractInputText returns empty string for missing text fields", () => {
  assert.equal(extractInputText({}), "");
});

test("extractInputText normalizes whitespace and clamps long text", () => {
  const text = extractInputText({ text: ` safe \n\t text ${LONG_TEXT}` });
  assert.equal(text.includes("\n"), false);
  assert.equal(text.includes("\t"), false);
  assert.equal(text.startsWith("safe text"), true);
  assert.equal(text.length, 4000);
});

test("extractTrace reads snake_case trace event and utterance ids", () => {
  assert.deepEqual(
    extractTrace({
      trace_id: "trace-1",
      event_id: "event-1",
      utterance_id: "utterance-1",
    }),
    {
      traceId: "trace-1",
      eventId: "event-1",
      utteranceId: "utterance-1",
    }
  );
});

test("extractTrace reads camelCase trace event and utterance ids", () => {
  assert.deepEqual(
    extractTrace({
      traceId: "trace.camel",
      eventId: "event.camel",
      utteranceId: "utterance.camel",
    }),
    {
      traceId: "trace.camel",
      eventId: "event.camel",
      utteranceId: "utterance.camel",
    }
  );
});

test("extractTrace sanitizes unsafe characters and returns empty safe strings", () => {
  const trace = extractTrace({
    trace_id: " trace id / unsafe ",
    event_id: "event id # unsafe",
  });

  assert.equal(trace.traceId, "trace-id---unsafe");
  assert.equal(trace.eventId, "event-id---unsafe");
  assert.equal(trace.utteranceId, "");
});

test("extractLanguage reads explicit language fields", () => {
  assert.equal(extractLanguage({ subtitle_language: "JA-JP" }, ""), "ja-jp");
  assert.equal(extractLanguage({ language: "EN-US" }, ""), "en-us");
  assert.equal(extractLanguage({ language_profile: { language: "FR" } }, ""), "fr");
  assert.equal(extractLanguage({ language_profile: { locale: "PT-BR" } }, ""), "pt-br");
  assert.equal(
    extractLanguage({ subtitle_cue: { subtitle_language: "ES" } }, ""),
    "es"
  );
});

test("extractLanguage detects supported scripts and defaults to en", () => {
  assert.equal(extractLanguage({}, "かな交じり文"), "ja");
  assert.equal(extractLanguage({}, "مرحبا"), "ar");
  assert.equal(extractLanguage({}, "বাংলা"), "bn");
  assert.equal(extractLanguage({}, "தமிழ்"), "ta");
  assert.equal(extractLanguage({}, "Привет"), "ru");
  assert.equal(extractLanguage({}, "plain safe text"), "en");
});

test("extractScriptDirection respects explicit directions", () => {
  assert.equal(extractScriptDirection({ script_direction: "ltr" }, "ar", "مرحبا"), "ltr");
  assert.equal(
    extractScriptDirection({ subtitle_cue: { script_direction: "rtl" } }, "en", "safe"),
    "rtl"
  );
  assert.equal(
    extractScriptDirection({ language_profile: { script_direction: "vertical" } }, "ja", "縦書き"),
    "vertical"
  );
});

test("extractScriptDirection infers direction and defaults to ltr", () => {
  assert.equal(extractScriptDirection({}, "ar", "safe"), "rtl");
  assert.equal(extractScriptDirection({}, "en", "שלום"), "rtl");
  assert.equal(extractScriptDirection({}, "en", "مرحبا"), "rtl");
  assert.equal(extractScriptDirection({}, "en", "plain safe text"), "ltr");
});

test("extractDurationMs uses explicit duration fields", () => {
  assert.equal(
    extractDurationMs({ speech_cue: { estimated_duration_ms: 1234 } }, "safe"),
    1234
  );
  assert.equal(extractDurationMs({ estimated_duration_ms: 1500 }, "safe"), 1500);
  assert.equal(extractDurationMs({ duration_ms: 1600 }, "safe"), 1600);
  assert.equal(
    extractDurationMs({ display_start_ms: 200, display_end_ms: 1800 }, "safe"),
    1600
  );
});

test("extractDurationMs clamps explicit values and computes fallback", () => {
  assert.equal(extractDurationMs({ duration_ms: 1 }, "safe"), 300);
  assert.equal(extractDurationMs({ duration_ms: 99_999 }, "safe"), 60_000);
  assert.equal(extractDurationMs({}, ""), 800);
  assert.equal(extractDurationMs({}, "safe"), 970);
});

test("extractProsodyHints reads supported fields", () => {
  const hints = extractProsodyHints({
    speech_cue: {
      prosody_style: "gentle",
      pace: "slow",
      pitch: "medium",
      volume: "quiet",
    },
    expression_profile: {
      emotion: "calm",
      expression_key: "soft-smile",
    },
    motion_cue: {
      motion_style: "talk",
      expression_hint: "warm",
    },
  });

  assert.deepEqual(hints, {
    prosodyStyle: "gentle",
    pace: "slow",
    pitch: "medium",
    volume: "quiet",
    emotion: "calm",
    motionStyle: "talk",
    expressionHint: "warm",
  });
});

test("extractProsodyHints uses fallback fields and clamps long hints", () => {
  const hints = extractProsodyHints({
    prosody_style: ` ${LONG_HINT} `,
    speech_rate_profile: { rate_label: "fast" },
    pitch: "high",
    volume: "clear",
    canonical_envelope: { emotion: "focused" },
    motion_style: "idle",
    expression_profile: { profile_id: LONG_HINT },
  });

  assert.equal(hints.prosodyStyle.length, 80);
  assert.equal(hints.prosodyStyle.includes("\n"), false);
  assert.equal(hints.pace, "fast");
  assert.equal(hints.pitch, "high");
  assert.equal(hints.volume, "clear");
  assert.equal(hints.emotion, "focused");
  assert.equal(hints.motionStyle, "idle");
  assert.equal(hints.expressionHint.length, 120);
});

test("extractProsodyHints returns empty strings for missing fields", () => {
  assert.deepEqual(extractProsodyHints({}), {
    prosodyStyle: "",
    pace: "",
    pitch: "",
    volume: "",
    emotion: "",
    motionStyle: "",
    expressionHint: "",
  });
});

test("hashPayload returns deterministic 32-character hex-like hash", () => {
  const first = hashPayload({ a: 1, b: "safe" });
  const second = hashPayload({ a: 1, b: "safe" });
  const changed = hashPayload({ a: 2, b: "safe" });

  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.match(first, /^[a-f0-9]{32}$/u);
});

test("safeId strips unsafe characters and bounds length", () => {
  const value = safeId(" unsafe id / value ".repeat(12));
  assert.equal(value.includes("/"), false);
  assert.equal(value.startsWith("unsafe-id---value"), true);
  assert.equal(value.length, 96);
});

test("safeText normalizes whitespace and bounds length", () => {
  assert.equal(safeText(" safe \n\t text ", 40), "safe text");
  assert.equal(safeText("abcdef", 3), "abc");
});

test("clamp clamps below above and in-range values", () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});
