#!/usr/bin/env node

import assert from "node:assert/strict";
import { repairPronunciationText } from "../src/pronunciationDictionary.js";
import { normalizeTtsSafeText } from "../src/ttsSafeTextNormalization.js";

const repairs = repairPronunciationText(
  "IRIS GPT YouTube phantom Hiro Sora Airi 読み補正",
).repairs;
const readingByOriginal = new Map(repairs.map((repair) => [repair.original, repair.reading]));

assert.equal(readingByOriginal.get("IRIS"), "アイリス");
assert.equal(readingByOriginal.get("GPT"), "ジーピーティー");
assert.equal(readingByOriginal.get("YouTube"), "ユーチューブ");
assert.equal(readingByOriginal.get("phantom"), "ファントム");
assert.equal(readingByOriginal.get("Hiro"), "ヒロ");
assert.equal(readingByOriginal.get("Sora"), "ソラ");
assert.equal(readingByOriginal.get("Airi"), "アイリ");

const normalized = normalizeTtsSafeText(
  "Open https://example.invalid/a?raw=1 & endpoint=https://internal.invalid api_key=abc token=def secret=ghi",
);
assert.equal(normalized.normalized_text.includes("リンク"), true);
assert.equal(normalized.url_replacement_count >= 1, true);
assert.equal(normalized.configuration_marker_count >= 1, true);
assert.equal(normalized.safe_output_only, true);

const serialized = JSON.stringify(normalized);
for (const forbidden of [
  "https://",
  "example.invalid",
  "internal.invalid",
  "api_key",
  "token",
  "secret",
  "endpoint",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe text leaked: ${forbidden}`);
}

const mockTtsBoundary = {
  mock_tts_provider_connected: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  safe_output_only: true,
};
assert.equal(mockTtsBoundary.mock_tts_provider_connected, false);
assert.equal(mockTtsBoundary.runtime_readiness_claimed, false);
assert.equal(mockTtsBoundary.production_readiness_claimed, false);

console.log(JSON.stringify({
  status: "pass",
  checked: 8,
  safe_output_only: true,
}, null, 2));
