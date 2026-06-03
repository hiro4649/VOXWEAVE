#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildMultilingualLocaleSafeSummary,
  validateMultilingualLocalePolicy,
} from "../src/multilingualLocale/multilingualLocaleValidator.js";

function policy(overrides = {}) {
  return {
    locale_policy_id: "locale-policy-1",
    language: "ja",
    locale: "ja-JP",
    script: "kana",
    direction: "ltr",
    engine_family: "mock-tts",
    engine_id_redacted: "mock-redacted",
    candidate_status: "candidate_only",
    supports_runtime: false,
    supports_voice_cloning: false,
    supports_code_switching: false,
    supports_multilingual: false,
    requires_human_review: false,
    requires_reference_voice_consent: false,
    requires_pronunciation_review: false,
    pronunciation_hint_policy_status: "candidate",
    subtitle_direction_policy_status: "candidate",
    lip_sync_policy_status: "candidate",
    live2d_policy_status: "candidate",
    fallback_policy: "text_only",
    safety_status: "candidate",
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
    ...overrides,
  };
}

function assertValid(overrides = {}) {
  const result = validateMultilingualLocalePolicy(policy(overrides));
  assert.equal(result.blocked, false);
  assert.equal(result.runtime_ready, false);
  return result;
}

function assertBlocked(overrides, reasonCode) {
  const result = validateMultilingualLocalePolicy(policy(overrides));
  assert.equal(result.blocked, true, `${reasonCode} should block`);
  assert.equal(result.reason_codes.includes(reasonCode), true, `${reasonCode} missing`);
  return result;
}

assertValid();
assertValid({ language: "en", locale: "en-US", script: "latin" });
assertValid({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "rtl" });
assertBlocked({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "ltr" }, "arabic_locale_requires_rtl_or_unknown_direction");
assertBlocked({ language: "en", locale: "en-US", script: "arabic", direction: "ltr" }, "arabic_locale_requires_rtl_or_unknown_direction");
assertValid({ language: "zh", locale: "zh-CN", script: "simplified_chinese" });
assertValid({ language: "ko", locale: "ko-KR", script: "hangul" });
assertBlocked({ language: "multi", locale: "multi", script: "mixed", supports_multilingual: true, requires_human_review: false }, "code_switching_requires_human_review");
assertBlocked({ language: "multi", locale: "multi", script: "mixed", supports_multilingual: false, requires_human_review: true }, "multilingual_language_requires_multilingual_support");
assertBlocked({ supports_voice_cloning: true, requires_reference_voice_consent: false, requires_human_review: true }, "voice_cloning_requires_reference_voice_consent");
assertBlocked({ supports_voice_cloning: true, requires_reference_voice_consent: true, requires_human_review: false }, "voice_cloning_requires_human_review");
assertBlocked({ locale: "endpoint=https://bad.invalid" }, "locale_value_invalid");
assertBlocked({ engine_id_redacted: "model_path/C:/private/model" }, "engine_id_redacted_invalid");
assertValid({ safety_status: "approved", supports_runtime: true });
assertBlocked({ fallback_policy: "blocked" }, "locale_fallback_policy_blocked");
assertBlocked({ language: "blocked" }, "locale_language_blocked");
assertBlocked({ script: "blocked" }, "locale_script_blocked");
assertBlocked({ direction: "blocked" }, "locale_direction_blocked");
assertBlocked({ candidate_status: "blocked" }, "locale_candidate_status_blocked");
assertBlocked({ safety_status: "blocked" }, "locale_safety_status_blocked");

const summary = buildMultilingualLocaleSafeSummary([
  policy(),
  policy({ language: "en", locale: "en-US", script: "latin" }),
  policy({ language: "ar", locale: "ar-MSA", script: "arabic", direction: "rtl" }),
  policy({ language: "zh", locale: "zh-CN", script: "simplified_chinese" }),
  policy({ language: "ko", locale: "ko-KR", script: "hangul" }),
  policy({
    language: "multi",
    locale: "multi",
    script: "mixed",
    supports_multilingual: true,
    supports_code_switching: true,
    requires_human_review: true,
    safety_status: "review_required",
  }),
  policy({ supports_voice_cloning: true, requires_reference_voice_consent: true, requires_human_review: true }),
  policy({ locale: "endpoint=https://bad.invalid", engine_id_redacted: "engine-redacted" }),
  policy({ safety_status: "approved", supports_runtime: true }),
]);

assert.equal(summary.locale_policy_count, 9);
assert.equal(summary.runtime_ready_count, 0);
assert.equal(summary.safe_summary_only, true);

const serialized = JSON.stringify(summary);
for (const forbidden of [
  "locale_policy_id",
  "engine_id_redacted",
  "engine_id",
  "engine_family",
  "script",
  "direction",
  "ja-JP",
  "en-US",
  "ar-MSA",
  "mock-tts",
  "endpoint",
  "api_key",
  "token",
  "secret",
  "model path",
  "dataset path",
  "raw text",
  "raw prompt",
  "raw_pr_body",
  "raw_artifact_text",
]) {
  assert.equal(serialized.includes(forbidden), false, `unsafe summary leaked: ${forbidden}`);
}

console.log(JSON.stringify({
  status: "pass",
  checked: 38,
  safe_summary_only: true,
}, null, 2));
