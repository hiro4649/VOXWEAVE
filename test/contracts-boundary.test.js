import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSafeResponse,
  clamp,
  IRIS_ADAPTER_PACKET_SCHEMA,
  normalizeAdapterKind,
  safeId,
  safeText,
  validateInputPayload,
} from "../src/contracts.js";
import { VoxWeaveError } from "../src/errors.js";

function minimalAdapterPacket(adapterKind) {
  return {
    schema: IRIS_ADAPTER_PACKET_SCHEMA,
    adapter_kind: adapterKind,
    adapter_validation_required: true,
    text: "safe sample",
  };
}

function assertVoxWeaveError(fn, code) {
  assert.throws(
    fn,
    (error) => error instanceof VoxWeaveError && error.code === code
  );
}

test("normalizeAdapterKind returns supported adapter kinds", () => {
  assert.equal(normalizeAdapterKind("tts"), "tts");
  assert.equal(normalizeAdapterKind(" SUBTITLE "), "subtitle");
  assert.equal(normalizeAdapterKind("live2d"), "live2d");
});

test("normalizeAdapterKind returns orchestrate for unknown or empty values", () => {
  assert.equal(normalizeAdapterKind("voice"), "orchestrate");
  assert.equal(normalizeAdapterKind(""), "orchestrate");
  assert.equal(normalizeAdapterKind(null), "orchestrate");
});

test("validateInputPayload rejects non-object payload with safe invalid payload error", () => {
  assertVoxWeaveError(() => validateInputPayload("safe text"), "invalid_payload");
  assertVoxWeaveError(() => validateInputPayload(null), "invalid_payload");
});

test("validateInputPayload rejects unsupported adapter kind for IRIS adapter packets", () => {
  assertVoxWeaveError(
    () => validateInputPayload(minimalAdapterPacket("voice")),
    "unsupported_adapter_kind"
  );
});

test("validateInputPayload rejects route kind mismatch with safe error", () => {
  assertVoxWeaveError(
    () => validateInputPayload(minimalAdapterPacket("tts"), { routeKind: "subtitle" }),
    "adapter_kind_mismatch"
  );
});

test("validateInputPayload requires adapter_validation_required for IRIS adapter packets", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        schema: IRIS_ADAPTER_PACKET_SCHEMA,
        adapter_kind: "tts",
        text: "safe sample",
      }),
    "adapter_validation_required"
  );
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for tts", () => {
  assert.equal(validateInputPayload(minimalAdapterPacket("tts"), { routeKind: "tts" }), undefined);
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for subtitle", () => {
  assert.equal(
    validateInputPayload(minimalAdapterPacket("subtitle"), { routeKind: "subtitle" }),
    undefined
  );
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for live2d", () => {
  assert.equal(
    validateInputPayload(minimalAdapterPacket("live2d"), { routeKind: "live2d" }),
    undefined
  );
});

test("validateInputPayload rejects forbidden input field command", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), command: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects forbidden input field raw_audio", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), raw_audio: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects forbidden input field endpoint", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), endpoint: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects unsafe string containing an https URL", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        text: "see https://example.invalid/sample",
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects unsafe model path string", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("live2d"),
        model_hint: "avatar.model3.json",
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload permits canonical_envelope with allowed safe fields", () => {
  assert.equal(
    validateInputPayload({
      ...minimalAdapterPacket("tts"),
      canonical_envelope: {
        action_type: "speak",
        emotion: "calm",
        trace_id: "trace-1",
      },
    }),
    undefined
  );
});

test("validateInputPayload rejects canonical_envelope unsafe field", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        canonical_envelope: {
          action_type: "speak",
          command: "blocked",
        },
      }),
    "unsafe_payload"
  );
});

test("assertSafeResponse accepts artifact URL values from VOXWEAVE namespace", () => {
  const payload = { ok: true, artifact_url: "artifact://voxweave/safe-sample" };
  assert.equal(assertSafeResponse(payload), payload);
});

test("assertSafeResponse rejects raw https URL values", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ ok: true, public_url: "https://example.invalid/sample" }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field canonical_envelope", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ canonical_envelope: { emotion: "calm" } }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field command", () => {
  assertVoxWeaveError(() => assertSafeResponse({ command: "blocked" }), "unsafe_response");
});

test("assertSafeResponse rejects response field renderer_endpoint", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ renderer_endpoint: "blocked" }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field token", () => {
  assertVoxWeaveError(() => assertSafeResponse({ token: "blocked" }), "unsafe_response");
});

test("assertSafeResponse rejects nested forbidden response keys", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ response_summary: { raw_audio: "blocked" } }),
    "unsafe_response"
  );
});

test("safeId strips unsafe characters and bounds length", () => {
  const value = safeId(" event id / unsafe ".repeat(10));
  assert.equal(value.includes("/"), false);
  assert.equal(value.length <= 96, true);
  assert.equal(value.startsWith("event-id---unsafe"), true);
});

test("safeText normalizes whitespace and bounds length", () => {
  assert.equal(safeText("  hello \n\t world  ", 20), "hello world");
  assert.equal(safeText("abcdef", 3), "abc");
});

test("clamp clamps below and above ranges", () => {
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});
