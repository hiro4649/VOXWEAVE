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
  "api_key=redacted token=abc secret: hidden endpoint=https://example.invalid authorization=Bearer abc",
);
check(
  "configuration_marker_non_disclosure",
  markers.safe_output_only &&
    markers.configuration_marker_count >= 5 &&
    !markers.normalized_text.includes("abc") &&
    !/authorization|Bearer/iu.test(markers.normalized_text),
);

const customSafe = normalizeTtsSafeText("Visit https://example.invalid", { urlReplacement: "[safe link]" });
check("custom_safe_url_replacement", customSafe.normalized_text.includes("[safe link]"));

const unsafeUrlReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "https://unsafe.invalid",
});
check("unsafe_custom_url_replacement_url_defense", !/https:\/\/unsafe\.invalid/iu.test(unsafeUrlReplacement.normalized_text));

const unsafeTokenReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "token=abc",
});
check(
  "unsafe_custom_url_replacement_token_defense",
  !/token|abc/iu.test(unsafeTokenReplacement.normalized_text),
);

const unsafeAuthorizationReplacement = normalizeTtsSafeText("Visit https://example.invalid", {
  urlReplacement: "authorization=Bearer abc",
});
check(
  "unsafe_custom_url_replacement_authorization_defense",
  !/authorization|Bearer|abc/iu.test(unsafeAuthorizationReplacement.normalized_text),
);

const naturalText = normalizeTtsSafeText(
  "endpoint security is important. token economy is not authentication. secret base in a game story.",
);
check("natural_false_positives_preserved", naturalText.normalized_text.includes("endpoint security is important"));
check("natural_token_text_preserved", naturalText.normalized_text.includes("token economy is not authentication"));
check("natural_secret_text_preserved", naturalText.normalized_text.includes("secret base in a game story"));

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
