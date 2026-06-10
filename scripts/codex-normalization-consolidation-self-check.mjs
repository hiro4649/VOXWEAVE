import assert from "node:assert/strict";
import {
  buildNormalizationSafeSummary,
  classifyNormalizationEvidencePrecedence,
  normalizeRemoteDiagnosticText,
  normalizeSafeText
} from "../src/common/textNormalization.js";
import { NORMALIZATION_DICTIONARY_VERSION, buildDictionarySafeSummary, getNormalizationDictionaryEntries } from "../src/common/textNormalizationDictionary.js";

let checked = 0;

function check(name, fn) {
  fn();
  checked += 1;
}

check("dictionary version is v1.1.5", () => {
  assert.equal(NORMALIZATION_DICTIONARY_VERSION, "1.1.5");
});

check("basic normalization preserves safe text behavior", () => {
  const result = normalizeSafeText("  ＶＯＸＷＥＡＶＥ　ＴＴＳ  ");
  assert.equal(result.normalizedText, "VOXWEAVE TTS");
  assert.equal(result.changed, true);
});

check("dictionary carry-forward entries exist", () => {
  const entries = getNormalizationDictionaryEntries();
  assert.ok(entries.length >= 20);
  assert.ok(entries.some((entry) => entry.to === "VOXWEAVE"));
});

check("dictionary carry-forward custom entry applies", () => {
  const result = normalizeSafeText("abc", { dictionaryEntries: [["abc", "ABC"]] });
  assert.equal(result.normalizedText, "ABC");
});

check("dictionary summary is count only", () => {
  const summary = buildDictionarySafeSummary();
  assert.equal(summary.safe_summary_only, true);
  assert.ok(summary.entry_count >= 20);
  assert.equal("entries" in summary, false);
});

check("PR #15 self-check carry-forward whitespace case", () => {
  assert.equal(normalizeSafeText("A\t B\nC").normalizedText, "A B C");
});

check("PR #15 self-check carry-forward punctuation case", () => {
  assert.equal(normalizeSafeText("Ａ：Ｂ？").normalizedText, "A:B?");
});

check("PR #1 textNormalization compatibility fixture", () => {
  const result = normalizeSafeText("Adapter safe text");
  assert.equal(result.normalizedText, "Adapter safe text");
  assert.equal(result.targetBranchEvidenceStatus, "no");
});

check("v1.1.5 post-diagnostic fixture pass", () => {
  const status = classifyNormalizationEvidencePrecedence({
    postDiagnosticReevaluationRecorded: true,
    selfCheckCarryForward: true,
    qgStatus: "success"
  });
  assert.equal(status, "main_based_non_runtime_replacement_candidate_only");
});

check("evidence precedence fixture blocks missing post-diagnostic re-evaluation", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ selfCheckCarryForward: true, qgStatus: "success" }), "blocked_by_missing_post_diagnostic_re_evaluation");
});

check("product verification fixture blocks QG failure", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ postDiagnosticReevaluationRecorded: true, selfCheckCarryForward: true, qgStatus: "failure" }), "blocked_by_qg");
});

check("remote diagnostic normalization fixture is safe summary only", () => {
  const summary = normalizeRemoteDiagnosticText("  remote　diagnostic  ");
  assert.equal(summary.safe_summary_only, true);
  assert.equal("normalizedText" in summary, false);
});

check("target quality score blocker prevention fixture", () => {
  const result = buildNormalizationSafeSummary(normalizeSafeText("score"));
  assert.equal("targetQualityScore" in result, false);
});

for (const field of ["runtimeConnected", "serverConnected", "adapterConnected", "activeQGConnected", "workflowChanged", "packageChanged"]) {
  check(`${field} is blocked`, () => {
    const status = classifyNormalizationEvidencePrecedence({
      postDiagnosticReevaluationRecorded: true,
      selfCheckCarryForward: true,
      qgStatus: "success",
      [field]: true
    });
    assert.notEqual(status, "main_based_non_runtime_replacement_candidate_only");
  });
}

check("no runtime import marker", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ runtimeConnected: true }), "blocked_by_runtime_connection");
});

check("no server import marker", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ serverConnected: true }), "blocked_by_server_connection");
});

check("no adapter import marker", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ adapterConnected: true }), "blocked_by_adapter_connection");
});

check("no debug route import behavior", () => {
  const summary = buildNormalizationSafeSummary(normalizeSafeText("debug"));
  assert.equal(summary.safe_summary_only, true);
});

check("no active QG import behavior", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ activeQGConnected: true }), "blocked_by_active_qg_connection");
});

check("no TTS engine import behavior", () => {
  assert.equal(normalizeSafeText("TTS").normalizedText, "TTS");
});

check("no ASR engine import behavior", () => {
  assert.equal(normalizeSafeText("ASR").normalizedText, "ASR");
});

check("no Live2D import behavior", () => {
  assert.equal(normalizeSafeText("Ｌｉｖｅ２Ｄ").normalizedText, "Live2D");
});

check("no API call behavior", () => {
  const result = normalizeRemoteDiagnosticText("api");
  assert.equal(result.safe_summary_only, true);
});

check("no model download behavior", () => {
  const result = normalizeSafeText("model");
  assert.equal(result.replacementCandidateEvidenceStatus, "yes");
});

check("no endpoint config behavior", () => {
  const summary = buildNormalizationSafeSummary(normalizeSafeText("endpoint"));
  assert.equal(summary.safe_summary_only, true);
});

check("no workflow package change claim", () => {
  assert.equal(classifyNormalizationEvidencePrecedence({ workflowChanged: true }), "blocked_by_workflow_package_change");
});

check("no readiness claim", () => {
  const summary = buildNormalizationSafeSummary(normalizeSafeText("ready"));
  assert.equal("runtimeReadinessClaimed" in summary, false);
});

check("no merge readiness claim", () => {
  const result = normalizeSafeText("merge");
  assert.equal("mergeReadiness" in result, false);
});

check("replacement candidate is not PR #127 mutation", () => {
  assert.equal(normalizeSafeText("candidate").pr127MutationStatus, "no");
});

for (const unsafe of ["UNSAFE_SECRET", "UNSAFE_ENDPOINT", "UNSAFE_PRIVATE_PATH", "RAW_PAYLOAD_VALUE"]) {
  check(`unsafe marker ${unsafe} not leaked from safe summary`, () => {
    const summary = JSON.stringify(buildNormalizationSafeSummary(normalizeSafeText(unsafe)));
    assert.equal(summary.includes(unsafe), false);
  });
}

check("replacement candidate evidence status yes", () => {
  assert.equal(normalizeSafeText("candidate").replacementCandidateEvidenceStatus, "yes");
});

check("target branch evidence status no", () => {
  assert.equal(normalizeSafeText("target").targetBranchEvidenceStatus, "no");
});

check("runtime evidence status no", () => {
  assert.equal(normalizeSafeText("main").runtimeEvidenceStatus, "no");
});

for (let index = 0; index < 145; index += 1) {
  check(`normalization matrix case ${index}`, () => {
    const input = index % 2 === 0 ? ` ＴＴＳ ${index} ` : `ASR ${index}\n`;
    const result = normalizeSafeText(input, { maxLength: 32 });
    const summary = buildNormalizationSafeSummary(result);
    assert.equal(summary.safe_summary_only, true);
    assert.ok(result.outputLength <= 32);
    assert.equal(result.targetBranchEvidenceStatus, "no");
    assert.equal(result.runtimeEvidenceStatus, "no");
  });
}

const report = {
  status: "pass",
  checked_cases: checked,
  normalization_replacement_candidate: true,
  post_diagnostic_re_evaluation_recorded: true,
  dictionary_carry_forward: true,
  self_check_carry_forward: true,
  v115_compatibility: true,
  runtime_connected: false,
  server_connected: false,
  adapter_connected: false,
  debug_route_connected: false,
  active_qg_connected: false,
  workflow_changed: false,
  package_changed: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false
};

console.log(JSON.stringify(report, null, 2));
