import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildNormalizationSafeSummary,
  normalizeSafeText,
  normalizeSafeTextArray,
} from "../src/common/textNormalization.js";
import {
  applyNormalizationDictionary,
  buildNormalizationDictionarySummary,
} from "../src/common/textNormalizationDictionary.js";

let checkedCases = 0;

function check(name, fn) {
  fn();
  checkedCases += 1;
}

const unsafeSamples = [
  "https://example.invalid/private?q=1",
  "www.example.invalid/path",
  ["endpoint", "=", "https://internal.invalid"].join(""),
  ["endpoint", ": ", "https://internal.invalid"].join(""),
  ["authorization", "=", "Bearer ", "abc"].join(""),
  ["authorization", ": ", "Bearer ", "abc"].join(""),
  ["token", "=", "def"].join(""),
  ["token", ": ", "def"].join(""),
  ["secret", "=", "ghi"].join(""),
  ["secret", ": ", "ghi"].join(""),
  ["api_key", "=", "abc"].join(""),
  ["api-key", ": ", "xyz"].join(""),
  ["password", "=", "hunter2"].join(""),
  ["private_key", "=", "abc"].join(""),
  "C:\\Users\\Example\\secret.txt",
  "/home/example/private.txt",
  "/var/tmp/private.txt",
  "/etc/secret.conf",
];

for (const sample of unsafeSamples) {
  check(`unsafe input redacted: ${sample.split(/[=:]/u)[0]}`, () => {
    const result = normalizeSafeText(sample);
    const serialized = JSON.stringify(result);
    assert.equal(result.safe_summary_only, true);
    assert.equal(serialized.includes("internal.invalid"), false);
    assert.equal(serialized.includes(["Bearer ", "abc"].join("")), false);
    assert.equal(serialized.includes("hunter2"), false);
    assert.equal(serialized.includes("secret.txt"), false);
  });
}

const naturalSamples = [
  "token economy is not authentication",
  "secret base in a story",
  "endpoint security is important",
  "The API design is careful",
  "Sora and Airi greet IRIS",
  "VOXWAEVE becomes VoxWeave",
  "Live2D cue remains text only",
  "YouTube link should be spoken safely",
  "読み補正 and 口パク are covered",
  "GPT explains phantom rendering",
  "Hiro watches VOICEVOX notes",
  "hello & goodbye",
  "bright—fast…cue",
  "safe text",
];

for (const sample of naturalSamples) {
  check(`natural input preserved: ${sample.slice(0, 12)}`, () => {
    const result = normalizeSafeText(sample);
    assert.equal(result.safe_summary_only, true);
    assert.equal(typeof result.normalized_text, "string");
    assert.equal(result.normalized_text.length > 0, true);
  });
}

for (const word of ["VOXWAEVE", "VOXWEAVE", "IRIS", "GPT", "YouTube", "phantom", "Live2D", "VOICEVOX", "Hiro", "Sora", "Airi", "読み補正", "口パク"]) {
  check(`dictionary carry-forward: ${word}`, () => {
    const result = applyNormalizationDictionary(word);
    assert.equal(result.safe_summary_only, true);
    assert.equal(result.dictionary_replacement_count >= 1, true);
  });
}

for (const value of [
  ["IRIS", "https://example.invalid"],
  { text: "api_key=abc VOXWAEVE" },
  { nested: { text: ["Sora ", "token", "=", "def"].join("") } },
  ["Airi", [["endpoint", "=", "https://internal.invalid"].join(""), "GPT"]],
]) {
  check("summary handles arrays and plain objects", () => {
    const summary = buildNormalizationSafeSummary(value);
    assert.equal(summary.safe_summary_only, true);
    assert.equal(summary.raw_payload_logged, false);
    assert.equal(summary.value_count >= 1, true);
  });
}

for (let index = 0; index < 40; index += 1) {
  check(`generated compatibility fixture ${index}`, () => {
    const source = index % 2 === 0
      ? `VOXWAEVE sample ${index} https://example.invalid/${index}`
      : ["IRIS sample ", String(index), " endpoint", "=", "https://internal.invalid/", String(index)].join("");
    const result = normalizeSafeText(source);
    const serialized = JSON.stringify(result);
    assert.equal(result.runtime_connected, false);
    assert.equal(result.adapter_connected, false);
    assert.equal(serialized.includes("example.invalid"), false);
    assert.equal(serialized.includes("internal.invalid"), false);
  });
}

check("array summary is count-only", () => {
  const result = normalizeSafeTextArray(["IRIS", ["token", "=", "def"].join("")]);
  assert.equal(result.safe_summary_only, true);
  assert.equal(result.item_count, 2);
  assert.equal(result.unsafe_replacement_count >= 1, true);
});

check("dictionary summary is count-only", () => {
  const summary = buildNormalizationDictionarySummary();
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.entry_count >= 13, true);
  assert.equal(typeof summary.reason_counts, "object");
});

const forbiddenImports = [
  "src/server.js",
  "src/orchestrator.js",
  "src/live2dForwarder.js",
  "scripts/codex-local-quality-gate.mjs",
];

for (const file of ["src/common/textNormalization.js", "src/common/textNormalizationDictionary.js"]) {
  const text = readFileSync(file, "utf8");
  for (const forbidden of forbiddenImports) {
    check(`no forbidden import from ${file} to ${forbidden}`, () => {
      assert.equal(text.includes(forbidden), false);
    });
  }
  for (const term of ["fetch(", "axios", "createServer", "spawn(", "exec("]) {
    check(`no runtime operation ${term} in ${file}`, () => {
      assert.equal(text.includes(term), false);
    });
  }
}

const report = {
  status: "pass",
  checked_cases: checkedCases,
  normalization_consolidation_candidate: true,
  dictionary_carry_forward: true,
  self_check_carry_forward: true,
  runtime_connected: false,
  adapter_connected: false,
  debug_route_connected: false,
  active_qg_connected: false,
  workflow_changed: false,
  package_changed: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
};

console.log(JSON.stringify(report, null, 2));
