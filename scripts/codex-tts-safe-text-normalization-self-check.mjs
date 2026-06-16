import { repairPronunciationText } from "../src/pronunciationDictionary.js";
import { normalizeTtsSafeText } from "../src/ttsSafeTextNormalization.js";

const checks = [];

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const dictionary = repairPronunciationText("Hiro Sora Airi 読み補正");
check(
  "dictionary_readings",
  ["ヒロ", "ソラ", "アイリ", "よみほせい"].every((reading) =>
    dictionary.repairs.some((repair) => repair.reading === reading),
  ),
);

const rawUrl = normalizeTtsSafeText("Please read https://example.invalid/path now.");
check("raw_url_non_disclosure", rawUrl.safe_output_only && rawUrl.url_replacement_count === 1);

const markers = normalizeTtsSafeText(
  "api_key=sample token=sample secret: sample endpoint=https://example.invalid authorization=Bearer sample",
);
check(
  "configuration_marker_non_disclosure",
  markers.safe_output_only &&
    markers.configuration_marker_count >= 5 &&
    !markers.normalized_text.includes("sample") &&
    !/authorization|Bearer/iu.test(markers.normalized_text),
);

const authorizationEqual = normalizeTtsSafeText("authorization=sample");
check(
  "authorization_equals_value_non_disclosure",
  authorizationEqual.safe_output_only && !/authorization|sample/iu.test(authorizationEqual.normalized_text),
);

const authorizationColon = normalizeTtsSafeText("authorization: sample");
check(
  "authorization_colon_value_non_disclosure",
  authorizationColon.safe_output_only && !/authorization|sample/iu.test(authorizationColon.normalized_text),
);

const authorizationBasic = normalizeTtsSafeText("authorization: Basic sample");
check(
  "authorization_basic_value_non_disclosure",
  authorizationBasic.safe_output_only && !/authorization|Basic|sample/iu.test(authorizationBasic.normalized_text),
);

const authorizationBearer = normalizeTtsSafeText("authorization=Bearer sample");
check(
  "authorization_bearer_value_non_disclosure",
  authorizationBearer.safe_output_only && !/authorization|Bearer|sample/iu.test(authorizationBearer.normalized_text),
);

const customSafe = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "[safe link]",
});
check("custom_safe_url_replacement", customSafe.normalized_text.includes("[safe link]"));

const unsafeUrlReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "https://example.invalid",
});
check("unsafe_custom_url_replacement_url_defense", !/https:\/\//iu.test(unsafeUrlReplacement.normalized_text));

const unsafeMarkerReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "token=sample",
});
check(
  "unsafe_custom_url_replacement_marker_defense",
  !/token|sample/iu.test(unsafeMarkerReplacement.normalized_text),
);

const unsafeAuthorizationReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "authorization=Bearer sample",
});
check(
  "unsafe_custom_url_replacement_authorization_defense",
  !/authorization|Bearer|sample/iu.test(unsafeAuthorizationReplacement.normalized_text),
);

const naturalText = normalizeTtsSafeText(
  "endpoint security is important. token economy is not authentication. secret base in a game story. authorization policy is important.",
);
check("natural_endpoint_text_preserved", naturalText.normalized_text.includes("endpoint security is important"));
check("natural_token_text_preserved", naturalText.normalized_text.includes("token economy is not authentication"));
check("natural_secret_text_preserved", naturalText.normalized_text.includes("secret base in a game story"));
check("natural_authorization_text_preserved", naturalText.normalized_text.includes("authorization policy is important"));

const mockBoundary = {
  mock_tts_provider_connected: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
};
check(
  "mock_tts_boundary",
  mockBoundary.mock_tts_provider_connected === false &&
    mockBoundary.runtime_readiness_claimed === false &&
    mockBoundary.production_readiness_claimed === false,
);

check("null_input_safe", normalizeTtsSafeText(null).normalized_text === "");
check("undefined_input_safe", normalizeTtsSafeText(undefined).normalized_text === "");
check("number_input_safe", normalizeTtsSafeText(12345).normalized_text === "12345");
const multiLine = normalizeTtsSafeText("Line one\nendpoint=https://example.invalid/a\nLine three");
check(
  "multiline_marker_non_disclosure",
  multiLine.safe_output_only &&
    !/https?:\/\/|endpoint=/iu.test(multiLine.normalized_text) &&
    /Line one/u.test(multiLine.normalized_text) &&
    /Line three/u.test(multiLine.normalized_text),
);

const failed = checks.filter((item) => !item.ok);
const summary = {
  status: failed.length === 0 ? "pass" : "fail",
  checked: checks.length,
  safe_output_only: failed.length === 0,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
};

console.log(JSON.stringify(summary));

if (failed.length > 0) {
  process.exitCode = 1;
}
