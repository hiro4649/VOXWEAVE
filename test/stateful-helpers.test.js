import assert from "node:assert/strict";
import { test } from "node:test";
import { ReactionCache } from "../src/cache.js";
import { RenderGroupStore } from "../src/renderGroupStore.js";

const FORBIDDEN_GROUP_KEYS = new Set([
  "endpoint",
  "renderer_endpoint",
  "href",
  "url",
  "api_key",
  "secret",
  "token",
  "private_path",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "model_path",
  "raw_payload",
  "command",
  "commands",
  "canonical_envelope",
]);

function assertNoForbiddenFields(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_GROUP_KEYS.has(key), false);
      stack.push(child);
    }
  }
}

function makeNow(start = 1_000) {
  let current = start;
  return {
    advance(ms) {
      current += ms;
    },
    now() {
      return current;
    },
  };
}

test("ReactionCache starts empty", () => {
  const cache = new ReactionCache();

  assert.equal(cache.size(), 0);
  assert.equal(cache.get("missing"), null);
});

test("ReactionCache set then get returns stored value", () => {
  const cache = new ReactionCache();

  cache.set("neutral", { reaction: "nod", nested: { count: 1 } });
  const value = cache.get("neutral");

  assert.deepEqual(value, { reaction: "nod", nested: { count: 1 } });
  assert.equal(cache.size(), 1);
});

test("ReactionCache get returns structured clone", () => {
  const cache = new ReactionCache();
  cache.set("clone", { nested: { count: 1 }, list: ["a"] });

  const first = cache.get("clone");
  first.nested.count = 99;
  first.list.push("b");
  const second = cache.get("clone");

  assert.deepEqual(second, { nested: { count: 1 }, list: ["a"] });
});

test("ReactionCache set stores structured clone", () => {
  const cache = new ReactionCache();
  const original = { nested: { count: 1 }, list: ["a"] };

  cache.set("source", original);
  original.nested.count = 99;
  original.list.push("b");

  assert.deepEqual(cache.get("source"), { nested: { count: 1 }, list: ["a"] });
});

test("ReactionCache updating existing key keeps latest value", () => {
  const cache = new ReactionCache({ maxEntries: 2 });

  cache.set("same", { version: 1 });
  cache.set("same", { version: 2 });

  assert.equal(cache.size(), 1);
  assert.deepEqual(cache.get("same"), { version: 2 });
});

test("ReactionCache evicts oldest entry when maxEntries is exceeded", () => {
  const cache = new ReactionCache({ maxEntries: 2 });

  cache.set("first", { order: 1 });
  cache.set("second", { order: 2 });
  cache.set("third", { order: 3 });

  assert.equal(cache.get("first"), null);
  assert.deepEqual(cache.get("second"), { order: 2 });
  assert.deepEqual(cache.get("third"), { order: 3 });
  assert.equal(cache.size(), 2);
});

test("ReactionCache get refreshes recency before eviction", () => {
  const cache = new ReactionCache({ maxEntries: 2 });

  cache.set("first", { order: 1 });
  cache.set("second", { order: 2 });
  assert.deepEqual(cache.get("first"), { order: 1 });
  cache.set("third", { order: 3 });

  assert.deepEqual(cache.get("first"), { order: 1 });
  assert.equal(cache.get("second"), null);
  assert.deepEqual(cache.get("third"), { order: 3 });
});

test("ReactionCache size never exceeds maxEntries after repeated inserts", () => {
  const cache = new ReactionCache({ maxEntries: 3 });

  for (let index = 0; index < 10; index += 1) {
    cache.set(`key-${index}`, { index });
    assert.equal(cache.size() <= 3, true);
  }
  assert.equal(cache.size(), 3);
});

test("ReactionCache nested values remain isolated across get calls", () => {
  const cache = new ReactionCache();
  cache.set("nested", { level: { child: { value: "safe" } } });

  const first = cache.get("nested");
  const second = cache.get("nested");
  first.level.child.value = "changed";

  assert.equal(second.level.child.value, "safe");
  assert.equal(cache.get("nested").level.child.value, "safe");
});

test("RenderGroupStore returns null for missing group", () => {
  const store = new RenderGroupStore({ now: () => 10 });

  assert.equal(store.get({ utteranceId: "missing" }), null);
});

test("RenderGroupStore tts update creates partial group", () => {
  const clock = makeNow();
  const store = new RenderGroupStore({ now: clock.now });

  const group = store.update({
    adapterKind: "tts",
    traceId: "trace-safe",
    eventId: "event-safe",
    utteranceId: "utterance-safe",
  });

  assert.equal(group.schema, "voxweave_render_group_v1");
  assert.equal(group.group_id, "utterance-safe");
  assert.equal(group.tts_received, true);
  assert.equal(group.subtitle_received, false);
  assert.equal(group.live2d_received, false);
  assert.equal(group.group_complete, false);
  assert.equal(group.artifact_sync_status, "partial");
  assert.equal(group.first_audio_latency_ms, 0);
  assertNoForbiddenFields(group);
});

test("RenderGroupStore completes group after tts subtitle and live2d updates", () => {
  const store = new RenderGroupStore({ now: () => 20 });
  const ids = { traceId: "trace-complete", eventId: "event-complete", utteranceId: "utterance-complete" };

  store.update({ ...ids, adapterKind: "tts" });
  store.update({ ...ids, adapterKind: "subtitle" });
  const group = store.update({ ...ids, adapterKind: "live2d" });

  assert.equal(group.tts_received, true);
  assert.equal(group.subtitle_received, true);
  assert.equal(group.live2d_received, true);
  assert.equal(group.group_complete, true);
  assert.equal(group.artifact_sync_status, "complete");
  assertNoForbiddenFields(group);
});

test("RenderGroupStore first audio latency is deterministic and non-negative", () => {
  const clock = makeNow(500);
  const store = new RenderGroupStore({ now: clock.now });
  const ids = { utteranceId: "latency-safe" };

  store.update({ ...ids, adapterKind: "subtitle" });
  clock.advance(42);
  const group = store.update({ ...ids, adapterKind: "tts" });

  assert.equal(group.first_audio_latency_ms, 42);
  assert.equal(group.first_audio_latency_ms >= 0, true);
});

test("RenderGroupStore first audio latency is set only once", () => {
  const clock = makeNow(700);
  const store = new RenderGroupStore({ now: clock.now });
  const ids = { utteranceId: "latency-once" };

  const first = store.update({ ...ids, adapterKind: "tts" });
  clock.advance(50);
  const second = store.update({ ...ids, adapterKind: "tts" });

  assert.equal(first.first_audio_latency_ms, 0);
  assert.equal(second.first_audio_latency_ms, 0);
});

test("RenderGroupStore aggregates positive warning counts only", () => {
  const store = new RenderGroupStore({ now: () => 1 });
  const ids = { utteranceId: "warnings-safe" };

  store.update({ ...ids, adapterKind: "tts", qualityWarningCount: 2 });
  store.update({ ...ids, adapterKind: "subtitle", qualityWarningCount: -10 });
  store.update({ ...ids, adapterKind: "live2d", qualityWarningCount: Number.NaN });
  const group = store.update({ ...ids, adapterKind: "live2d", qualityWarningCount: 3 });

  assert.equal(group.quality_warning_count, 5);
  assertNoForbiddenFields(group);
});

test("RenderGroupStore get returns public copy", () => {
  const store = new RenderGroupStore({ now: () => 1 });
  const ids = { utteranceId: "copy-safe" };

  store.update({ ...ids, adapterKind: "tts" });
  const group = store.get(ids);
  group.group_complete = true;
  group.quality_warning_count = 99;

  const fresh = store.get(ids);
  assert.equal(fresh.group_complete, false);
  assert.equal(fresh.quality_warning_count, 0);
  assertNoForbiddenFields(fresh);
});

test("RenderGroupStore group id prefers utterance then event then trace", () => {
  const store = new RenderGroupStore({ now: () => 1 });

  assert.equal(store.update({
    adapterKind: "tts",
    traceId: "trace-id",
    eventId: "event-id",
    utteranceId: "utterance-id",
  }).group_id, "utterance-id");
  assert.equal(store.update({
    adapterKind: "tts",
    traceId: "trace-only-fallback",
    eventId: "event-id-only",
  }).group_id, "event-id-only");
  assert.equal(store.update({
    adapterKind: "tts",
    traceId: "trace-only",
  }).group_id, "trace-only");
});

test("RenderGroupStore safe group id sanitizes unsafe characters and bounds length", () => {
  const store = new RenderGroupStore({ now: () => 1 });
  const unsafe = `unsafe group/${"x".repeat(120)}`;
  const group = store.update({ adapterKind: "tts", utteranceId: unsafe });

  assert.equal(group.group_id.includes(" "), false);
  assert.equal(group.group_id.includes("/"), false);
  assert.equal(group.group_id.startsWith("unsafe-group-"), true);
  assert.equal(group.group_id.length, 96);
  assertNoForbiddenFields(group);
});

test("RenderGroupStore anonymous fallback group id is safe", () => {
  const store = new RenderGroupStore({ now: () => 1 });
  const group = store.update({ adapterKind: "tts" });

  assert.equal(group.group_id, "anonymous-render-group");
  assertNoForbiddenFields(group);
});

test("RenderGroupStore evicts oldest group when maxGroups is exceeded", () => {
  const store = new RenderGroupStore({ now: () => 1, maxGroups: 2 });

  store.update({ adapterKind: "tts", utteranceId: "first" });
  store.update({ adapterKind: "tts", utteranceId: "second" });
  store.update({ adapterKind: "tts", utteranceId: "third" });

  assert.equal(store.get({ utteranceId: "first" }), null);
  assert.equal(store.get({ utteranceId: "second" })?.group_id, "second");
  assert.equal(store.get({ utteranceId: "third" })?.group_id, "third");
});

test("RenderGroupStore update refreshes recency before eviction", () => {
  const store = new RenderGroupStore({ now: () => 1, maxGroups: 2 });

  store.update({ adapterKind: "tts", utteranceId: "first" });
  store.update({ adapterKind: "tts", utteranceId: "second" });
  store.update({ adapterKind: "subtitle", utteranceId: "first" });
  store.update({ adapterKind: "tts", utteranceId: "third" });

  assert.equal(store.get({ utteranceId: "first" })?.subtitle_received, true);
  assert.equal(store.get({ utteranceId: "second" }), null);
  assert.equal(store.get({ utteranceId: "third" })?.group_id, "third");
});

test("RenderGroupStore public output omits forbidden fields", () => {
  const store = new RenderGroupStore({ now: () => 1 });
  const group = store.update({
    adapterKind: "tts",
    traceId: "trace-public",
    eventId: "event-public",
    utteranceId: "utterance-public",
    qualityWarningCount: 1,
  });

  assert.deepEqual(Object.keys(group).sort(), [
    "artifact_sync_status",
    "created_at_ms",
    "event_id",
    "first_audio_latency_ms",
    "group_complete",
    "group_id",
    "live2d_received",
    "quality_warning_count",
    "schema",
    "subtitle_received",
    "trace_id",
    "tts_received",
    "utterance_id",
  ].filter((key) => key !== "created_at_ms").sort());
  assertNoForbiddenFields(group);
});
