import {
  buildSafeRouteSummary,
  hasForbiddenKey,
  loadFixtures,
  loadPolicy,
  runLimitedLocalSmoke,
  validateSafeSummary
} from "./codex-runtime-return-limited-local-smoke.mjs";

const cases = [];

function record(name, pass) {
  cases.push({ name, status: pass ? "pass" : "fail" });
}

function assertNoFailures() {
  const failed = cases.filter((item) => item.status !== "pass");
  if (failed.length > 0) {
    const reasonCodes = failed.map((item) => item.name);
    process.stdout.write(`${JSON.stringify({
      selfCheckStatus: "fail",
      checkedCases: cases.length,
      reasonCodes,
      runtimeReadinessClaimed: false,
      mergeReadiness: false
    }, null, 2)}\n`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

const policy = await loadPolicy();
record("policy_current_harness_v117", policy.currentActiveHarness === "v1.1.7");
record("policy_future_harness_planning_only", policy.futureHarnessAssumption === "v1.1.8 planning only");
record("policy_loopback_only", policy.loopbackOnly === true && policy.allowedHost === "127.0.0.1");
record("policy_external_network_blocked", policy.externalNetworkAllowed === false);
record("policy_real_engines_blocked", policy.realTtsAllowed === false && policy.asrAllowed === false);
record("policy_live2d_renderer_blocked", policy.live2dRendererAllowed === false);
record("policy_raw_audio_blocked", policy.rawAudioAllowed === false);
record("policy_endpoint_secret_blocked", policy.endpointConfigAllowed === false && policy.tokenSecretChangeAllowed === false);
record("policy_product_remote_diagnostic_blocked", policy.productVerificationExecutionAllowed === false && policy.remoteDiagnosticExecutionAllowed === false);
record("policy_no_readiness_claim", policy.runtimeReadinessClaimed === false && policy.mergeReadiness === false);

const fixtures = await loadFixtures();
record("fixture_tts_parse", fixtures.tts.adapter_kind === "tts");
record("fixture_subtitle_parse", fixtures.subtitle.adapter_kind === "subtitle");
record("fixture_live2d_parse", fixtures.live2d.adapter_kind === "live2d");
record("fixture_unsafe_parse", Object.hasOwn(fixtures.unsafe, "raw_audio"));
record("safe_fixture_forbidden_absent", !hasForbiddenKey(fixtures.tts) && !hasForbiddenKey(fixtures.subtitle) && !hasForbiddenKey(fixtures.live2d));
record("unsafe_fixture_forbidden_present", hasForbiddenKey(fixtures.unsafe));

const syntheticSafe = buildSafeRouteSummary({
  route: "/v1/adapter/tts",
  statusCode: 200,
  expectedKind: "tts",
  body: {
    schema: "voxweave_orchestration_result_v1",
    adapter_kind: "tts",
    response_summary: { bridge_status: "safe", adapter_kind: "tts", artifact_kind: "mock_audio" },
    adapter_artifact: { artifact_kind: "mock_audio" },
    duration_ms: 1200,
    mouth_cues: []
  }
});
record("synthetic_safe_summary_passes", validateSafeSummary(syntheticSafe).length === 0);

const syntheticUnsafe = buildSafeRouteSummary({
  route: "/v1/adapter/tts",
  statusCode: 200,
  expectedKind: "tts",
  body: { raw_audio: "blocked", endpoint: "blocked" }
});
record("synthetic_unsafe_summary_fails", validateSafeSummary(syntheticUnsafe).length >= 2);

const dryRun = await runLimitedLocalSmoke({ dryRun: true });
record("dry_run_passes", dryRun.status === "pass" && dryRun.dryRunMode === true);

const smoke = await runLimitedLocalSmoke();
record("actual_smoke_passes", smoke.status === "pass");
record("actual_smoke_checked_cases", smoke.checkedCases >= 16);
record("actual_smoke_loopback", smoke.loopbackStatus === "pass");
record("actual_smoke_server_started", smoke.serverLifecycleStatus === "started_loopback");
record("actual_smoke_no_external_network", smoke.externalNetworkStatus === "not_used");
record("actual_smoke_no_runtime_readiness", smoke.runtimeReadinessClaimed === false);
record("actual_smoke_no_merge_readiness", smoke.mergeReadiness === false);
record("actual_smoke_routes_count", smoke.routeSummaries.length === 5);
record("unsafe_request_fail_closed", smoke.routeSummaries.some((item) => item.route.endsWith(":unsafe") && item.ok === false));
record("safe_routes_forbidden_absent", smoke.routeSummaries.filter((item) => !item.route.endsWith(":unsafe")).every((item) => item.forbidden_field_absent === true));
record("safe_routes_raw_audio_absent", smoke.routeSummaries.filter((item) => !item.route.endsWith(":unsafe")).every((item) => item.raw_audio_absent === true));
record("safe_routes_endpoint_secret_model_absent", smoke.routeSummaries.filter((item) => !item.route.endsWith(":unsafe")).every((item) => item.endpoint_secret_model_path_absent === true));

if (assertNoFailures()) {
  process.stdout.write(`${JSON.stringify({
    selfCheckStatus: "pass",
    checkedCases: cases.length,
    smokeCheckedCases: smoke.checkedCases,
    serverLifecycleStatus: "closed_after_smoke",
    loopbackStatus: smoke.loopbackStatus,
    runtimeReadinessClaimed: false,
    mergeReadiness: false
  }, null, 2)}\n`);
}
