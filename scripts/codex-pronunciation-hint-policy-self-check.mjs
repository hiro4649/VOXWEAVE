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

function assertBlocked(overrides, reasonCode) {
  const result = validatePronunciationHint(hint(overrides));
  assert.equal(result.blocked, true, `${reasonCode} should block`);
  assert.equal(result.reason_codes.includes(reasonCode), true, `${reasonCode} missing`);
  return result;
}

function assertValid(overrides = {}) {
  const result = validatePronunciationHint(hint(overrides));
  assert.equal(result.blocked, false);
  assert.equal(result.runtime_ready, false);
  return result;
}

const kana = assertValid();
assert.equal(kana.runtime_ready, false);

assertValid({
  surface: "你好",
  normalized_surface: "你好",
  hint_type: "pinyin",
  hint_value: "ni3 hao3",
  language: "zh",
  locale: "zh-CN",
  script: "pinyin",
});

assertValid({
  surface: "phantom",
  normalized_surface: "phantom",
  hint_type: "ipa",
  hint_value: "a i ɾ i s",
  language: "en",
  locale: "en-US",
  script: "ipa",
});

assertBlocked({
  hint_type: "phoneme",
  hint_value: "F AE N T AH M",
  script: "latin",
  requires_human_review: false,
}, "phoneme_hint_requires_human_review");

assertValid({
  hint_type: "phoneme",
  hint_value: "F AE N T AH M",
  script: "latin",
  requires_human_review: true,
});

assertBlocked({ confidence: "0.8" }, "hint_confidence_invalid");
assertBlocked({ confidence: -0.1 }, "hint_confidence_invalid");
assertBlocked({ confidence: 1.2 }, "hint_confidence_invalid");
assertBlocked({ confidence: Number.NaN }, "hint_confidence_invalid");
assertBlocked({ confidence: 0.7, requires_human_review: false }, "low_confidence_requires_human_review");
assertValid({ confidence: 0.7, requires_human_review: true });

assertBlocked({
  approved_for_runtime: true,
  safety_status: "candidate",
}, "runtime_approval_requires_approved_safety_status");
assertValid({
  approved_for_runtime: true,
  safety_status: "approved",
});

assertBlocked({ hint_type: "blocked" }, "hint_type_blocked");
assertBlocked({ source: "blocked" }, "hint_source_blocked");
assertBlocked({ script: "blocked" }, "hint_script_blocked");
assertBlocked({ safety_status: "blocked" }, "hint_safety_status_blocked");

assertBlocked({
  engine_mapping_status: "blocked",
  engine_mapping: "",
}, "engine_mapping_status_blocked");
assertBlocked({
  engine_mapping_status: "not_mapped",
  engine_mapping: "placeholder",
}, "engine_mapping_must_be_empty_when_not_mapped");

for (const engineMapping of [
  "moss:ipa",
  "moss:pinyin",
  "ipa:/a/",
  "pinyin:ni3",
  "engine:pronunciation",
  '<phoneme alphabet="ipa">',
]) {
  assertBlocked({
    engine_mapping_status: "placeholder",
    engine_mapping: engineMapping,
  }, "engine_mapping_must_remain_placeholder");
}

assertBlocked({ language: "" }, "required_metadata_missing");
assertBlocked({ language: "https://bad.invalid" }, "pronunciation_language_invalid");
assertBlocked({ locale: "endpoint=https://bad.invalid" }, "pronunciation_locale_invalid");
assertBlocked({ created_at: "not a timestamp" }, "pronunciation_timestamp_invalid");

assertValid({ hint_type: "kana", hint_value: "アイリス", script: "kana" });
assertBlocked({ hint_type: "kana", hint_value: "https://bad.invalid", script: "kana" }, "unsafe_pronunciation_hint_value");
assertValid({
  hint_type: "pinyin",
  hint_value: "ni3 hao3",
  language: "zh",
  locale: "zh-CN",
  script: "pinyin",
});
assertBlocked({
  hint_type: "pinyin",
  hint_value: "api_key=abc",
  language: "zh",
  locale: "zh-CN",
  script: "pinyin",
}, "unsafe_pronunciation_hint_value");
assertValid({
  hint_type: "ipa",
  hint_value: "a i ɾ i s",
  language: "en",
  locale: "en-US",
  script: "ipa",
});
assertBlocked({
  hint_type: "ipa",
  hint_value: "endpoint=https://bad.invalid",
  language: "en",
  locale: "en-US",
  script: "ipa",
}, "unsafe_pronunciation_hint_value");
assertValid({
  hint_type: "alias",
  hint_value: "IRIS",
  script: "latin",
});
assertBlocked({
  hint_type: "alias",
  hint_value: "token=abc",
  script: "latin",
}, "unsafe_pronunciation_hint_value");

for (const unsafeField of [
  "raw_phoneme_debug",
  "raw_pronunciation_payload",
  "raw_tts_engine_payload",
  "engine_specific_mapping",
  "vendor_pronunciation_syntax",
  "ssml_payload",
  "raw_alias_source",
]) {
  assertBlocked({ [unsafeField]: "unsafe" }, "unsafe_pronunciation_hint_fields_present");
}

const blockedApproved = hint({
  safety_status: "approved",
  raw_phoneme_debug: "raw phoneme",
});
const summary = buildPronunciationHintSafeSummary([
  hint(),
  hint({
    hint_type: "pinyin",
    hint_value: "ni3 hao3",
    language: "zh",
    locale: "zh-CN",
    script: "pinyin",
  }),
  hint({
    hint_type: "ipa",
    hint_value: "a i ɾ i s",
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
    hint_type: "alias",
    hint_value: "endpoint=https://bad.invalid api_key=secret token=secret",
    endpoint: "https://hint.invalid",
    raw_audio: "raw audio",
    model_path: "model/path",
    dataset_path: "dataset/path",
  }),
  blockedApproved,
]);

assert.equal(summary.hint_count, 8);
assert.equal(summary.candidate_count, 3);
assert.equal(summary.review_required_count, 1);
assert.equal(summary.approved_count, 1);
assert.equal(summary.blocked_count, 3);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.human_review_required_count, 1);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "hint_id",
  "surface",
  "normalized_surface",
  "hint_value",
  "アイリス",
  "ni3 hao3",
  "a i ɾ i s",
  "IRIS",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "raw phoneme",
  "raw_phoneme_debug",
  "raw prompt",
  "raw audio",
  "model path",
  "dataset path",
  "private path",
  "engine_mapping",
  "moss:ipa",
  "pinyin:ni3",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 54,
  safe_summary_only: true,
}, null, 2));
