#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runOwnerScopedRuntimeReturnLimitedLocal } from "./codex-owner-scoped-runtime-return-limited-local.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const policyPath = resolve(
  repoRoot,
  "docs/process/CODEX_OWNER_SCOPED_RUNTIME_RETURN_LIMITED_LOCAL_POLICY_V1_1_7.json"
);
const fixtureDir = resolve(repoRoot, "docs/fixtures/owner-scoped-runtime-return-limited-local");
const fixtureFiles = [
  "tts-request.json",
  "subtitle-request.json",
  "live2d-request.json",
  "unsafe-request.json",
];

const cases = [];

function record(name, pass, details = {}) {
  cases.push({ name, status: pass ? "pass" : "fail", ...details });
}

async function main() {
  const policy = JSON.parse(await readFile(policyPath, "utf8"));
  record("policy_json_parse", policy.currentActiveHarness === "v1.1.7");
  record("policy_loopback_only", policy.loopbackOnly === true && policy.externalNetworkAllowed === false);
  record("policy_no_engines", policy.realTtsAllowed === false && policy.asrAllowed === false && policy.live2dRendererAllowed === false);
  record("policy_no_raw_audio", policy.rawAudioAllowed === false);
  record("policy_no_readiness", policy.runtimeReadinessClaimed === false && policy.mergeReadiness === false);

  for (const file of fixtureFiles) {
    const fixture = JSON.parse(await readFile(resolve(fixtureDir, file), "utf8"));
    record(`fixture_json_parse_${file}`, fixture.schema === "iris_adapter_packet_v1");
  }

  const report = await runOwnerScopedRuntimeReturnLimitedLocal();
  record("local_smoke_pass", report.localSmokeStatus === "pass", { checkedCases: report.checkedCases });
  record("loopback_pass", report.loopbackStatus === "pass");
  record("server_lifecycle_safe", report.serverLifecycleStatus === "pending_stop");
  record("safe_summary_only", report.safeSummaryOnly === true);
  record("checked_cases_present", report.checkedCases >= 5, { checkedCases: report.checkedCases });
  record("forbidden_fields_absent", report.cases.every((entry) => entry.forbidden_field_absent === true));
  record("raw_audio_absent", report.cases.every((entry) => entry.raw_audio_absent === true));
  record(
    "endpoint_secret_model_path_absent",
    report.cases.every((entry) => entry.endpoint_secret_model_path_absent === true)
  );
  record("no_runtime_readiness_claim", report.cases.every((entry) => entry.runtime_readiness_claimed === false));
  record("unsafe_request_fail_closed", report.cases.some((entry) => entry.bridge_status === "fail_closed"));

  const failed = cases.filter((entry) => entry.status !== "pass");
  const result = {
    selfCheckStatus: failed.length === 0 ? "pass" : "fail",
    checkedCases: cases.length,
    localSmokeCheckedCases: report.checkedCases,
    cases,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stdout.write(`${JSON.stringify({ selfCheckStatus: "fail", reason: error.message }, null, 2)}\n`);
  process.exitCode = 1;
});
