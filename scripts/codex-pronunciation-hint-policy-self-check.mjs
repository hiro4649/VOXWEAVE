#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildPronunciationHintSafeSummary,
  validatePronunciationHint,
} from "../src/pronunciationHint/pronunciationHintValidator.js";

function hint(overrides = {}) {
  return {
    hint_id: "hint-1",
    surface: "IRIS",
    normalized_surface: "iris",
    hint_type: "kana",
    hint_value: "アイリス",
    language: "ja",
    locale: "ja-JP",
    script: "kana",
    source: "dictionary",
    confidence: 0.9,
    approved_for_runtime: false,
    requires_human_review: false,
    engine_mapping_status: "placeholder",
    engine_mapping: "placeholder",
    safety_status: "candidate",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

const kana = validatePronunciationHint(hint());
assert.equal(kana.blocked, false);
assert.equal(kana.runtime_ready, false);

const pinyin = validatePronunciationHint(hint({
  surface: "你好",
  normalized_surface: "你好",
  hint_type: "pinyin",
  hint_value: "ni3 hao3",
  language: "zh",
  locale: "zh-CN",
  script: "pinyin",
}));
assert.equal(pinyin.blocked, false);
assert.equal(pinyin.runtime_ready, false);

const ipa = validatePronunciationHint(hint({
  surface: "phantom",
  normalized_surface: "phantom",
  hint_type: "ipa",
  hint_value: "ˈfæn.təm",
  language: "en",
  locale: "en-US",
  script: "ipa",
}));
assert.equal(ipa.blocked, false);
assert.equal(ipa.runtime_ready, false);

const phonemeNoReview = validatePronunciationHint(hint({
  hint_type: "phoneme",
  hint_value: "F AE N T AH M",
  script: "latin",
  requires_human_review: false,
}));
assert.equal(phonemeNoReview.blocked, true);
assert.equal(phonemeNoReview.reason_codes.includes("phoneme_hint_requires_human_review"), true);

const lowConfidence = validatePronunciationHint(hint({ confidence: 0.7 }));
assert.equal(lowConfidence.blocked, true);
assert.equal(lowConfidence.reason_codes.includes("low_confidence_requires_human_review"), true);

const runtimeCandidate = validatePronunciationHint(hint({
  approved_for_runtime: true,
  safety_status: "candidate",
}));
assert.equal(runtimeCandidate.blocked, true);
assert.equal(
  runtimeCandidate.reason_codes.includes("runtime_approval_requires_approved_safety_status"),
  true,
);

const runtimeApproved = validatePronunciationHint(hint({
  approved_for_runtime: true,
  safety_status: "approved",
}));
assert.equal(runtimeApproved.blocked, false);
assert.equal(runtimeApproved.runtime_ready, false);

const blockedType = validatePronunciationHint(hint({ hint_type: "blocked" }));
assert.equal(blockedType.blocked, true);
assert.equal(blockedType.reason_codes.includes("hint_type_blocked"), true);

const blockedSource = validatePronunciationHint(hint({ source: "blocked" }));
assert.equal(blockedSource.blocked, true);
assert.equal(blockedSource.reason_codes.includes("hint_source_blocked"), true);

const blockedScript = validatePronunciationHint(hint({ script: "blocked" }));
assert.equal(blockedScript.blocked, true);
assert.equal(blockedScript.reason_codes.includes("hint_script_blocked"), true);

const blockedMapping = validatePronunciationHint(hint({
  engine_mapping_status: "blocked",
  engine_mapping: "",
}));
assert.equal(blockedMapping.blocked, true);
assert.equal(blockedMapping.reason_codes.includes("engine_mapping_status_blocked"), true);

const rawMapping = validatePronunciationHint(hint({
  engine_mapping_status: "placeholder",
  engine_mapping: "moss:phoneme",
}));
assert.equal(rawMapping.blocked, true);
assert.equal(rawMapping.reason_codes.includes("engine_mapping_must_remain_placeholder_or_empty"), true);

const notMappedWithValue = validatePronunciationHint(hint({
  engine_mapping_status: "not_mapped",
  engine_mapping: "placeholder",
}));
assert.equal(notMappedWithValue.blocked, true);
assert.equal(
  notMappedWithValue.reason_codes.includes("engine_mapping_must_remain_placeholder_or_empty"),
  true,
);

const unsafeAlias = validatePronunciationHint(hint({
  hint_type: "alias",
  hint_value: "endpoint=https://bad.invalid api_key=secret token=secret",
  script: "latin",
}));
assert.equal(unsafeAlias.blocked, true);
assert.equal(unsafeAlias.reason_codes.includes("hint_value_invalid_or_unsafe"), true);

const unsafe = validatePronunciationHint(hint({
  raw_phoneme_debug: "raw phoneme debug",
  raw_prompt: "raw prompt",
  raw_audio: "raw audio",
  endpoint: "https://hint.invalid",
  api_key: "api-key",
  token: "token",
  secret: "secret",
  model_path: "model/path",
  dataset_path: "dataset/path",
}));
assert.equal(unsafe.blocked, true);
assert.equal(unsafe.reason_codes.includes("unsafe_pronunciation_hint_fields_present"), true);

const summary = buildPronunciationHintSafeSummary([
  hint(),
  hint({
    surface: "你好",
    normalized_surface: "你好",
    hint_type: "pinyin",
    hint_value: "ni3 hao3",
    language: "zh",
    locale: "zh-CN",
    script: "pinyin",
  }),
  hint({
    surface: "phantom",
    normalized_surface: "phantom",
    hint_type: "ipa",
    hint_value: "ˈfæn.təm",
    language: "en",
    locale: "en-US",
    script: "ipa",
  }),
  hint({
    hint_type: "phoneme",
    hint_value: "F AE N T AH M",
    script: "latin",
    requires_human_review: true,
    safety_status: "review_required",
  }),
  hint({ confidence: 0.7 }),
  hint({
    approved_for_runtime: true,
    safety_status: "approved",
  }),
  hint({
    hint_value: "endpoint=https://bad.invalid api_key=secret token=secret",
    endpoint: "https://hint.invalid",
    raw_audio: "raw audio",
    model_path: "model/path",
    dataset_path: "dataset/path",
  }),
]);

assert.equal(summary.hint_count, 7);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "IRIS",
  "iris",
  "アイリス",
  "你好",
  "ni3 hao3",
  "phantom",
  "ˈfæn.təm",
  "F AE N T AH M",
  "surface",
  "normalized_surface",
  "hint_value",
  "endpoint",
  "https://hint.invalid",
  "api_key",
  "token",
  "secret",
  "raw audio",
  "raw_audio",
  "raw phoneme debug",
  "raw_phoneme_debug",
  "model/path",
  "model_path",
  "dataset/path",
  "dataset_path",
  "private_path",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 17,
  safe_summary_only: true,
}, null, 2));
