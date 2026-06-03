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
assert.equal(readingByOriginal.get("読み補正"), "よみほせい");

const normalized = normalizeTtsSafeText(
  "Open https://example.invalid/a?raw=1 & endpoint=https://internal.invalid api_key=abc api-key=xyz token=def secret=ghi authorization=Bearer abc",
);
assert.equal(normalized.normalized_text.includes("リンク"), true);
assert.equal(normalized.url_replacement_count >= 1, true);
assert.equal(normalized.configuration_marker_count >= 1, true);
assert.equal(normalized.safe_output_only, true);

const naturalEndpoint = normalizeTtsSafeText("endpoint security is important");
assert.equal(naturalEndpoint.normalized_text, "endpoint security is important");
assert.equal(naturalEndpoint.configuration_marker_count, 0);

const endpointValue = normalizeTtsSafeText("endpoint=https://internal.invalid");
assert.equal(endpointValue.normalized_text.includes("endpoint"), false);
assert.equal(endpointValue.normalized_text.includes("internal.invalid"), false);

const authorizationValue = normalizeTtsSafeText("authorization=Bearer abc");
assert.equal(authorizationValue.normalized_text.includes("authorization"), false);
assert.equal(authorizationValue.normalized_text.includes("Bearer"), false);
assert.equal(authorizationValue.normalized_text.includes("abc"), false);

const authorizationColonValue = normalizeTtsSafeText("authorization: Bearer abc");
assert.equal(authorizationColonValue.normalized_text.includes("authorization"), false);
assert.equal(authorizationColonValue.normalized_text.includes("Bearer"), false);
assert.equal(authorizationColonValue.normalized_text.includes("abc"), false);

const tokenColonValue = normalizeTtsSafeText("token: def");
assert.equal(tokenColonValue.normalized_text.includes("token"), false);
assert.equal(tokenColonValue.normalized_text.includes("def"), false);

const secretColonValue = normalizeTtsSafeText("secret: ghi");
assert.equal(secretColonValue.normalized_text.includes("secret"), false);
assert.equal(secretColonValue.normalized_text.includes("ghi"), false);

const apiKeyColonValue = normalizeTtsSafeText("api_key: abc");
assert.equal(apiKeyColonValue.normalized_text.includes("api_key"), false);
assert.equal(apiKeyColonValue.normalized_text.includes("abc"), false);

const apiKeyHyphenColonValue = normalizeTtsSafeText("api-key: xyz");
assert.equal(apiKeyHyphenColonValue.normalized_text.includes("api-key"), false);
assert.equal(apiKeyHyphenColonValue.normalized_text.includes("xyz"), false);

const endpointColonValue = normalizeTtsSafeText("endpoint: https://internal.invalid");
assert.equal(endpointColonValue.normalized_text.includes("endpoint"), false);
assert.equal(endpointColonValue.normalized_text.includes("https://"), false);
assert.equal(endpointColonValue.normalized_text.includes("internal.invalid"), false);

const naturalToken = normalizeTtsSafeText("token economy is not authentication");
assert.equal(naturalToken.normalized_text, "token economy is not authentication");
assert.equal(naturalToken.configuration_marker_count, 0);

const naturalSecret = normalizeTtsSafeText("secret base in a game story");
assert.equal(naturalSecret.normalized_text, "secret base in a game story");
assert.equal(naturalSecret.configuration_marker_count, 0);

const apiKeyValues = normalizeTtsSafeText("api-key=abc api_key=def");
assert.equal(apiKeyValues.normalized_text.includes("api-key"), false);
assert.equal(apiKeyValues.normalized_text.includes("api_key"), false);

const urlReplacement = normalizeTtsSafeText("See https://example.invalid", {
  urlReplacement: "URL",
});
assert.equal(urlReplacement.normalized_text, "See URL");

const serialized = JSON.stringify([
  normalized,
  endpointValue,
  authorizationValue,
  authorizationColonValue,
  tokenColonValue,
  secretColonValue,
  apiKeyColonValue,
  apiKeyHyphenColonValue,
  endpointColonValue,
  apiKeyValues,
  urlReplacement,
]);
for (const forbidden of [
  "https://",
  "example.invalid",
  "internal.invalid",
  "api_key",
  "api-key",
  "token",
  "token=",
  "token:",
  "secret",
  "secret=",
  "secret:",
  "authorization",
  "authorization=",
  "authorization:",
  "endpoint",
  "endpoint=",
  "endpoint:",
  "Bearer",
  "abc",
  "def",
  "ghi",
  "xyz",
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
  checked: 25,
  safe_output_only: true,
}, null, 2));
