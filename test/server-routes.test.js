import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { test } from "node:test";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  AI_CHARACTER_CONTRACT_REGISTRY,
} from "../src/contracts.js";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";
import {
  LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA,
  LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA,
  EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
  assertLoopbackFailureMatrixSafe,
  assertLoopbackEvidenceSafe,
  assertExternalAcceptanceCandidateBundleSummarySafe,
  buildExternalAcceptanceCandidateBundleFingerprint,
  buildExternalAcceptanceReceiptFingerprint,
  buildLoopbackEvidenceFingerprint,
  canonicalizeLoopbackEvidence,
  runExternalAcceptanceCandidateBundleSummary,
  runLoopbackIntegrationFailureMatrix,
  runLoopbackIntegrationEvidence,
  validateExternalAcceptanceReceipt,
  validateLoopbackIntegrationEvidence,
} from "../scripts/voxweave-loopback-integration-evidence.mjs";

const execFileAsync = promisify(execFile);

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "renderer_endpoint",
  "model_path",
  "secret",
  "token",
  "api_key",
  "private_path",
  "phoneme_debug",
]);

const basePacket = {
  schema: "iris_adapter_packet_v1",
  adapter_kind: "tts",
  trace_id: "route-contract-trace",
  event_id: "route-contract-event",
  utterance_id: "route-contract-utterance",
  final_text: "IRIS says hello to VoxWeave.",
  adapter_validation_required: true,
};

test("GET /health returns safe health shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.mode, "external_voice_orchestrator");
    assert.equal(response.body.boundaries.not_tts_engine, true);
    assert.equal(
      response.body.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.integration_boundary.runtime_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("GET /v1/health returns safe health shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.boundaries.not_live2d_renderer, true);
    assert.equal(
      response.body.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.integration_boundary.production_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/orchestrate returns safe orchestration envelope", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, basePacket);

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.schema, "voxweave_orchestration_result_v1");
    assert.equal(response.body.response_summary.ok, true);
    assert.equal(response.body.integration_boundary, undefined);
    assert.equal(
      response.body.response_summary.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.runtime_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/tts returns TTS-safe metadata only", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/tts`, {
      ...basePacket,
      adapter_kind: "tts",
      speech_cue: {
        schema: "iris_speech_cue_v1",
        estimated_duration_ms: 1200,
        adapter_validation_required: true,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "tts");
    assert.equal(response.body.mock_tts.provider_connected, false);
    assert.equal(response.body.response_summary.bridge_status, "accepted");
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/subtitle returns subtitle timing safe shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/subtitle`, {
      ...basePacket,
      adapter_kind: "subtitle",
      subtitle_text: "Safe subtitle route contract.",
      subtitle_language: "en",
      display_start_ms: 0,
      display_end_ms: 1600,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "subtitle");
    assert.equal(response.body.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
    assert.equal(Array.isArray(response.body.subtitle_timing.chunks), true);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/live2d returns Live2D-safe cue shape without renderer call", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/live2d`, {
      ...basePacket,
      adapter_kind: "live2d",
      motion_cue: {
        schema: "iris_motion_cue_v1",
        motion_style: "talk",
        adapter_validation_required: true,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "live2d");
    assert.equal(response.body.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
    assert.equal(response.body.live2d_forward.renderer_forward_attempted, false);
    assertNoForbiddenFields(response.body);
  });
});

test("unknown route returns safe 404 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/missing`);

    assert.equal(response.status, 404);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error, "not_found");
    assertNoForbiddenFields(response.body);
  });
});

test("invalid JSON returns safe 400 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, "invalid_json");
    assertNoForbiddenFields(body);
  });
});

test("loopback evidence runner returns safe pass summary", async () => {
  const evidence = await runLoopbackIntegrationEvidence({
    headSha: "a".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });

  assertLoopbackEvidenceSafe(evidence);
  assert.equal(evidence.schema, LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA);
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.evidence_mode, "local_ephemeral_loopback_fake_only");
  assert.equal(evidence.execution_scope, "loopback_only");
  assert.equal(evidence.server_bind_scope, "loopback");
  assert.equal(evidence.local_http_execution, true);
  assert.equal(evidence.external_network_execution, false);
  assert.equal(evidence.real_provider_execution, false);
  assert.equal(evidence.real_renderer_execution, false);
  assert.equal(evidence.real_tts_execution, false);
  assert.equal(evidence.asr_execution, false);
  assert.equal(evidence.translation_execution, false);
  assert.equal(evidence.health_path_status, "pass");
  assert.equal(evidence.auth_boundary_status, "pass");
  assert.equal(evidence.json_boundary_status, "pass");
  assert.equal(evidence.route_allowlist_status, "pass");
  assert.equal(evidence.tts_path_status, "pass");
  assert.equal(evidence.subtitle_path_status, "pass");
  assert.equal(evidence.live2d_path_status, "pass");
  assert.equal(evidence.contract_registry_status, "pass");
  assert.equal(evidence.contract_presence_count, AI_CHARACTER_CONTRACT_FAMILY_COUNT);
  assert.equal(evidence.fake_renderer_request_status, "pass");
  assert.equal(evidence.fake_renderer_auth_status, "pass");
  assert.equal(evidence.fake_renderer_json_status, "pass");
  assert.equal(evidence.cleanup_status, "pass");
  assert.equal(evidence.runtime_readiness_claimed, false);
  assert.equal(evidence.production_readiness_claimed, false);
  assert.equal(evidence.safe_summary_only, true);
  assert.equal(evidence.request_count, 1);
  assert.equal(evidence.failure_count, 0);
  assert.equal(evidence.primary_reason_code, "none");
  assert.equal(evidence.evidence_fingerprint_algorithm, "sha256");
  assert.match(evidence.evidence_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.evidence_fingerprint, buildLoopbackEvidenceFingerprint(evidence));
  validateLoopbackIntegrationEvidence(evidence);
  assert.deepEqual(Object.keys(evidence).sort(), LOOPBACK_EVIDENCE_KEYS);
  assertNoForbiddenEvidenceMaterial(evidence);
  for (const entry of AI_CHARACTER_CONTRACT_REGISTRY) {
    assert.equal(JSON.stringify(evidence).includes(entry.snakeCaseField), false);
  }
});

test("loopback failure matrix returns safe rollback summary", async () => {
  const matrix = await runLoopbackIntegrationFailureMatrix({
    headSha: "b".repeat(40),
    requestTimeoutMs: 200,
  });

  assertLoopbackFailureMatrixSafe(matrix);
  assert.equal(matrix.schema, LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA);
  assert.equal(matrix.status, "pass");
  assert.equal(matrix.evidence_mode, "local_ephemeral_loopback_fake_only");
  assert.equal(matrix.case_count, 5);
  assert.equal(matrix.pass_count, 5);
  assert.equal(matrix.failure_count, 0);
  assert.equal(matrix.accepted_case_status, "pass");
  assert.equal(matrix.renderer_rejected_case_status, "pass");
  assert.equal(matrix.renderer_timeout_case_status, "pass");
  assert.equal(matrix.connection_reset_case_status, "pass");
  assert.equal(matrix.redirect_blocked_case_status, "pass");
  assert.equal(matrix.redirect_sink_request_count, 0);
  assert.equal(matrix.all_servers_closed, true);
  assert.equal(matrix.external_network_execution, false);
  assert.equal(matrix.real_renderer_execution, false);
  assert.equal(matrix.raw_failure_material_excluded, true);
  assert.equal(matrix.runtime_readiness_claimed, false);
  assert.equal(matrix.production_readiness_claimed, false);
  assert.equal(matrix.safe_summary_only, true);
  assert.equal(matrix.evidence_fingerprint_algorithm, "sha256");
  assert.match(matrix.evidence_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(matrix.evidence_fingerprint, buildLoopbackEvidenceFingerprint(matrix));
  validateLoopbackIntegrationEvidence(matrix);
  assert.deepEqual(Object.keys(matrix).sort(), LOOPBACK_MATRIX_KEYS);
  assertNoForbiddenEvidenceMaterial(matrix);
});

test("loopback evidence fingerprint is deterministic and rejects unsafe summaries", async () => {
  const first = await runLoopbackIntegrationEvidence({
    headSha: "c".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });
  const second = await runLoopbackIntegrationEvidence({
    headSha: "c".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });
  const differentHead = await runLoopbackIntegrationEvidence({
    headSha: "d".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });

  assert.equal(first.evidence_fingerprint, second.evidence_fingerprint);
  assert.notEqual(first.evidence_fingerprint, differentHead.evidence_fingerprint);
  assert.equal(JSON.stringify(canonicalizeLoopbackEvidence(first)).includes("127.0.0.1"), false);
  assert.throws(() => validateLoopbackIntegrationEvidence({ ...first, extra: true }));
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      source_head_sha: "http://example.invalid",
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        source_head_sha: "http://example.invalid",
      }),
    })
  );
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      primary_reason_code: "fake-server-key",
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        primary_reason_code: "fake-server-key",
      }),
    })
  );
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      runtime_readiness_claimed: true,
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        runtime_readiness_claimed: true,
      }),
    })
  );
});

test("safe interop fixtures are static JSON and accepted by routes", async () => {
  const manifest = await readFixture("voxweave-interop-manifest.safe.json");
  const ttsFixture = await readFixture("iris-tts-packet.safe.json");
  const subtitleFixture = await readFixture("iris-subtitle-packet.safe.json");
  const live2dFixture = await readFixture("iris-live2d-packet.safe.json");

  assert.equal(manifest.schema, "voxweave_safe_interop_fixture_manifest_v1");
  assert.equal(manifest.fixture_version, "1.0.0");
  assert.equal(manifest.adapter_packet_schema, "iris_adapter_packet_v1");
  assert.equal(manifest.contract_registry_family_count, AI_CHARACTER_CONTRACT_FAMILY_COUNT);
  assert.equal(new Set(manifest.fixture_ids).size, manifest.fixture_ids.length);
  assert.deepEqual(manifest.fixture_ids, [
    "iris_tts_minimal_v1",
    "iris_subtitle_minimal_v1",
    "iris_live2d_all_contracts_v1",
  ]);
  for (const fixture of [manifest, ttsFixture, subtitleFixture, live2dFixture]) {
    assertNoForbiddenFixtureMaterial(fixture);
  }

  await withRouteServer(async (baseUrl) => {
    const tts = await postJson(`${baseUrl}/v1/adapter/tts`, ttsFixture);
    const subtitle = await postJson(`${baseUrl}/v1/adapter/subtitle`, subtitleFixture);
    const live2d = await postJson(`${baseUrl}/v1/adapter/live2d`, live2dFixture);

    assert.equal(tts.status, 200);
    assert.equal(tts.body.adapter_kind, "tts");
    assert.equal(subtitle.status, 200);
    assert.equal(subtitle.body.adapter_kind, "subtitle");
    assert.equal(live2d.status, 200);
    assert.equal(live2d.body.adapter_kind, "live2d");
    assert.equal(
      live2d.body.ai_character_contract_summary.contract_presence_count,
      AI_CHARACTER_CONTRACT_FAMILY_COUNT
    );
    assert.equal(live2d.body.live2d_forward.renderer_forward_attempted, false);
    assertNoForbiddenFixtureMaterial(tts.body);
    assertNoForbiddenFixtureMaterial(subtitle.body);
    assertNoForbiddenFixtureMaterial(live2d.body);
  });
});

test("external acceptance candidate bundle is safe and not accepted", async () => {
  const manifest = await readExternalAcceptanceFixture(
    "voxweave-external-acceptance-candidate.manifest.safe.json"
  );
  const irisReceipt = await readExternalAcceptanceFixture("iris-team-receipt-template.safe.json");
  const live2dReceipt = await readExternalAcceptanceFixture(
    "live2d-team-receipt-template.safe.json"
  );
  const readmeText = await readExternalAcceptanceText("README.safe.md");
  const receipts = [irisReceipt, live2dReceipt];
  const fixtureManifest = await readFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();

  assert.equal(manifest.schema, "voxweave_external_acceptance_candidate_manifest_v1");
  assert.equal(manifest.candidate_bundle_version, "1.1.0");
  assert.equal(manifest.source_binding_kind, "runtime_source_snapshot");
  assert.equal(manifest.bundle_binding_kind, "transitive_sha256");
  assert.equal(manifest.candidate_status, "candidate_prepared_not_sent");
  assert.equal(manifest.external_team_acceptance_status, "not_started");
  assert.equal(manifest.real_integration_proof_status, "no");
  assert.equal(manifest.runtime_readiness_claimed, false);
  assert.equal(manifest.production_readiness_claimed, false);
  assert.equal(manifest.safe_summary_only, true);
  assert.equal(new Set(receipts.map((receipt) => receipt.recipient_project)).size, 2);
  assert.deepEqual(
    receipts.map((receipt) => receipt.recipient_project).sort(),
    ["IRIS", "LIVE2D"]
  );
  for (const receipt of receipts) {
    assert.equal(receipt.schema, "voxweave_external_acceptance_receipt_template_v1");
    assert.equal(receipt.candidate_bundle_version, "1.1.0");
    assert.equal(receipt.received_status, "pending");
    assert.equal(receipt.parsed_status, "pending");
    assert.equal(receipt.acceptance_candidate_status, "pending");
    assert.equal(receipt.real_integration_proof_status, "no");
    assert.equal(receipt.runtime_readiness_claimed, false);
    assert.equal(receipt.production_readiness_claimed, false);
    assert.equal(receipt.safe_summary_only, true);
  }
  assert.equal(/\bhttps?:\/\//iu.test(readmeText), false);
  assert.equal(readmeText.includes("not acceptance"), true);
  assert.equal(readmeText.includes("not runtime readiness"), true);
  assert.equal(fixtureManifest.contract_registry_family_count, AI_CHARACTER_CONTRACT_FAMILY_COUNT);
  assert.equal(fixtures.length, 4);
  assert.deepEqual(
    manifest.fixture_files,
    [
      "test/fixtures/interop/voxweave-interop-manifest.safe.json",
      "test/fixtures/interop/iris-tts-packet.safe.json",
      "test/fixtures/interop/iris-subtitle-packet.safe.json",
      "test/fixtures/interop/iris-live2d-packet.safe.json",
    ]
  );
  for (const fixture of fixtures) assertNoDangerousCandidateMaterial(fixture);
  assertNoDangerousCandidateMaterial({ manifest, receipts, readmeText, fixtureManifest, fixtures });

  const summary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    fixtureManifest,
    fixtures,
  });
  assertExternalAcceptanceCandidateBundleSummarySafe(summary);
  assert.equal(summary.schema, EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA);
  assert.equal(summary.status, "pass");
  assert.equal(summary.candidate_bundle_version, "1.1.0");
  assert.equal(summary.source_binding_kind, "runtime_source_snapshot");
  assert.equal(summary.bundle_binding_kind, "transitive_sha256");
  assert.equal(summary.manifest_status, "pass");
  assert.equal(summary.receipt_template_count, 2);
  assert.equal(summary.forbidden_material_scan_status, "pass");
  assert.equal(summary.fixture_reference_status, "pass");
  assert.equal(summary.fixture_manifest_status, "pass");
  assert.equal(summary.fixture_file_count, 4);
  assert.equal(summary.transitive_fixture_binding_status, "pass");
  assert.equal(summary.external_team_acceptance_status, "not_started");
  assert.equal(summary.real_integration_proof_status, "no");
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assert.equal(summary.safe_summary_only, true);
  assert.match(summary.candidate_bundle_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(
    summary.candidate_bundle_fingerprint,
    buildExternalAcceptanceCandidateBundleFingerprint({
      manifest,
      receipts,
      readmeText,
      fixtureManifest,
      fixtures,
    })
  );
  const changedVersionSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest: { ...manifest, candidate_bundle_version: "1.0.1" },
    receipts: receipts.map((receipt) => ({ ...receipt, candidate_bundle_version: "1.0.1" })),
    readmeText,
    fixtureManifest,
    fixtures,
  });
  assert.notEqual(
    summary.candidate_bundle_fingerprint,
    changedVersionSummary.candidate_bundle_fingerprint
  );
  const changedTtsSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-tts-packet.safe.json", { trace_id: "changed-tts" }),
  });
  const changedSubtitleSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-subtitle-packet.safe.json", { trace_id: "changed-subtitle" }),
  });
  const changedLive2dSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-live2d-packet.safe.json", { trace_id: "changed-live2d" }),
  });
  const changedFixtureManifestSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    fixtureManifest: { ...fixtureManifest, fixture_version: "1.0.1" },
    fixtures,
  });
  const changedReceiptSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts: [{ ...irisReceipt, recipient_role: "adapter_packet_owner_v2" }, live2dReceipt],
    readmeText,
    fixtureManifest,
    fixtures,
  });
  const changedReadmeSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText: `${readmeText}\nSafe candidate bundle note.\n`,
    fixtureManifest,
    fixtures,
  });
  assert.notEqual(summary.candidate_bundle_fingerprint, changedTtsSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedSubtitleSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedLive2dSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedFixtureManifestSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedReceiptSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedReadmeSummary.candidate_bundle_fingerprint);
  assert.equal(
    summary.candidate_bundle_fingerprint,
    buildExternalAcceptanceCandidateBundleFingerprint({
      manifest,
      receipts: [live2dReceipt, irisReceipt],
      readmeText,
      fixtureManifest,
      fixtures: [...fixtures].reverse(),
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, unknown_field: "blocked" },
      receipts,
      readmeText,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts: [{ ...irisReceipt, unknown_field: "blocked" }, live2dReceipt],
      readmeText,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, fixture_files: ["../blocked"] },
      receipts,
      readmeText,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, fixture_files: ["C:/blocked"] },
      receipts,
      readmeText,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts,
      readmeText,
      fixtureManifest,
      fixtures: fixtures.slice(1),
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts,
      readmeText,
      fixtureManifest,
      fixtures: [fixtures[0], fixtures[0], fixtures[1], fixtures[2]],
    })
  );
  assert.notEqual(summary.candidate_bundle_fingerprint, manifest.source_main_sha);
});

test("external acceptance receipt validator accepts only safe receipts", async () => {
  const irisTemplate = await readExternalAcceptanceFixture("iris-team-receipt-template.safe.json");
  const live2dTemplate = await readExternalAcceptanceFixture(
    "live2d-team-receipt-template.safe.json"
  );
  const baseReceipt = {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
    recipient_project: "IRIS",
    recipient_role: "adapter_packet_owner",
    candidate_bundle_version: "1.1.0",
    source_main_sha: "e".repeat(40),
    candidate_bundle_fingerprint: "f".repeat(64),
    received_status: "received",
    parsed_status: "pass",
    forbidden_material_absent_status: "pass",
    expected_schema_observed_status: "pass",
    raw_values_absent_status: "pass",
    readiness_claim_absent_status: "pass",
    acceptance_candidate_status: "accepted_candidate",
    real_integration_proof_status: "no",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };

  assert.equal(irisTemplate.received_status, "pending");
  assert.equal(live2dTemplate.received_status, "pending");
  assert.equal(irisTemplate.acceptance_candidate_status, "pending");
  assert.equal(live2dTemplate.acceptance_candidate_status, "pending");

  const accepted = validateExternalAcceptanceReceipt(baseReceipt);
  assert.equal(accepted.status, "pass");
  assert.equal(accepted.acceptance_candidate_status, "accepted_candidate");
  assert.match(accepted.receipt_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(accepted.receipt_fingerprint, buildExternalAcceptanceReceiptFingerprint(baseReceipt));

  const pending = validateExternalAcceptanceReceipt({
    ...baseReceipt,
    received_status: "pending",
    parsed_status: "pending",
    forbidden_material_absent_status: "pending",
    expected_schema_observed_status: "pending",
    raw_values_absent_status: "pending",
    readiness_claim_absent_status: "pending",
    acceptance_candidate_status: "pending",
  });
  assert.equal(pending.acceptance_candidate_status, "pending");

  assert.throws(() =>
    validateExternalAcceptanceReceipt({ ...baseReceipt, runtime_readiness_claimed: true })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      real_integration_proof_status: "yes",
    })
  );
  assert.throws(() => validateExternalAcceptanceReceipt({ ...baseReceipt, endpoint: "blocked" }));
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      recipient_role: "token-like-value",
    })
  );
  assert.throws(() => validateExternalAcceptanceReceipt({ ...baseReceipt, extra: true }));
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      recipient_role: "error_detail",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      received_status: "pending",
    })
  );
});

test("external receipt validator CLI emits safe JSON without receipt path", async () => {
  const receiptPath = join(tmpdir(), `voxweave-invalid-receipt-${Date.now()}.json`);
  await writeFile(
    receiptPath,
    JSON.stringify({
      schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
      endpoint: "blocked",
    }),
    "utf8"
  );
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["scripts/voxweave-loopback-integration-evidence.mjs", "--validate-receipt", receiptPath],
      { cwd: process.cwd(), windowsHide: true }
    ).catch((error) => ({ stdout: error.stdout }));
    const summary = JSON.parse(stdout);
    assert.equal(summary.schema, "voxweave_external_acceptance_receipt_validation_result_v1");
    assert.equal(summary.status, "fail");
    assert.equal(summary.safe_summary_only, true);
    assert.equal(stdout.includes(receiptPath), false);
    assert.equal(stdout.includes("endpoint"), false);
    assert.equal(stdout.includes("blocked"), false);
  } finally {
    await unlink(receiptPath).catch(() => {});
  }
});

test("external acceptance candidate dry-run matrix composes safe local evidence only", async () => {
  const manifest = await readExternalAcceptanceFixture(
    "voxweave-external-acceptance-candidate.manifest.safe.json"
  );
  const irisTemplate = await readExternalAcceptanceFixture("iris-team-receipt-template.safe.json");
  const live2dTemplate = await readExternalAcceptanceFixture(
    "live2d-team-receipt-template.safe.json"
  );
  const readmeText = await readExternalAcceptanceText("README.safe.md");
  const fixtureManifest = await readFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();

  const bundle = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts: [irisTemplate, live2dTemplate],
    readmeText,
    fixtureManifest,
    fixtures,
  });
  const happyEvidence = await runLoopbackIntegrationEvidence({
    headSha: "1".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });
  const failureMatrix = await runLoopbackIntegrationFailureMatrix({
    headSha: "1".repeat(40),
    requestTimeoutMs: 200,
  });
  const syntheticAccepted = {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
    recipient_project: "IRIS",
    recipient_role: "synthetic_test_only",
    candidate_bundle_version: "1.1.0",
    source_main_sha: "1".repeat(40),
    candidate_bundle_fingerprint: bundle.candidate_bundle_fingerprint,
    received_status: "received",
    parsed_status: "pass",
    forbidden_material_absent_status: "pass",
    expected_schema_observed_status: "pass",
    raw_values_absent_status: "pass",
    readiness_claim_absent_status: "pass",
    acceptance_candidate_status: "accepted_candidate",
    real_integration_proof_status: "no",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  const syntheticRejected = {
    ...syntheticAccepted,
    recipient_project: "LIVE2D",
    recipient_role: "synthetic_test_only",
    acceptance_candidate_status: "rejected_candidate",
    parsed_status: "fail",
  };

  assertExternalAcceptanceCandidateBundleSummarySafe(bundle);
  validateLoopbackIntegrationEvidence(happyEvidence);
  validateLoopbackIntegrationEvidence(failureMatrix);
  assert.equal(bundle.external_team_acceptance_status, "not_started");
  assert.equal(bundle.real_integration_proof_status, "no");
  assert.equal(irisTemplate.acceptance_candidate_status, "pending");
  assert.equal(live2dTemplate.acceptance_candidate_status, "pending");
  assert.equal(validateExternalAcceptanceReceipt(syntheticAccepted).status, "pass");
  assert.equal(
    validateExternalAcceptanceReceipt(syntheticAccepted).acceptance_candidate_status,
    "accepted_candidate"
  );
  assert.equal(validateExternalAcceptanceReceipt(syntheticRejected).status, "pass");
  assert.throws(() => validateExternalAcceptanceReceipt({ schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA }));
  assert.throws(() => validateExternalAcceptanceReceipt({ ...syntheticAccepted, raw_payload: "x" }));

  const cliOutputs = await Promise.all([
    execFileAsync(process.execPath, [
      "scripts/voxweave-loopback-integration-evidence.mjs",
      "--candidate-bundle",
    ], { cwd: process.cwd(), windowsHide: true }),
    execFileAsync(process.execPath, [
      "scripts/voxweave-loopback-integration-evidence.mjs",
    ], { cwd: process.cwd(), windowsHide: true }),
    execFileAsync(process.execPath, [
      "scripts/voxweave-loopback-integration-evidence.mjs",
      "--matrix",
    ], { cwd: process.cwd(), windowsHide: true }),
  ]);
  for (const { stdout } of cliOutputs) {
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.status, "pass");
    assert.equal(parsed.safe_summary_only, true);
    assertNoDangerousCandidateMaterial(parsed);
  }
});

async function withRouteServer(callback) {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    live2dForwarder: {
      configured: false,
      scope: "not_configured",
      async forward() {
        return {
          renderer_forward_configured: false,
          renderer_forward_scope: "not_configured",
          renderer_forward_attempted: false,
          renderer_forward_ok: false,
          renderer_forward_status: "dry_run",
        };
      },
    },
  });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.equal(address.address, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await callback(baseUrl);
  } finally {
    await closeServer(server);
  }
  assert.equal(server.listening, false);
}

async function closeServer(server) {
  if (!server.listening) return;
  await Promise.race([
    new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("server_close_timeout")), 1000)
    ),
  ]);
}

async function fetchJson(url) {
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

function assertNoForbiddenFields(value) {
  const stack = [{ value, path: "root" }];
  while (stack.length) {
    const current = stack.pop();
    if (!current || current.value === null || typeof current.value !== "object") continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) =>
        stack.push({ value: item, path: `${current.path}[${index}]` })
      );
      continue;
    }
    for (const [key, child] of Object.entries(current.value)) {
      assert.equal(FORBIDDEN_RESPONSE_KEYS.has(key), false, `forbidden response key at ${current.path}.${key}`);
      stack.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}

const LOOPBACK_EVIDENCE_KEYS = [
  "asr_execution",
  "auth_boundary_status",
  "cleanup_status",
  "contract_presence_count",
  "contract_registry_status",
  "evidence_fingerprint",
  "evidence_fingerprint_algorithm",
  "evidence_mode",
  "execution_scope",
  "external_network_execution",
  "failure_count",
  "fake_renderer_auth_status",
  "fake_renderer_json_status",
  "fake_renderer_request_status",
  "health_path_status",
  "json_boundary_status",
  "live2d_path_status",
  "local_http_execution",
  "primary_reason_code",
  "production_readiness_claimed",
  "real_provider_execution",
  "real_renderer_execution",
  "real_tts_execution",
  "request_count",
  "route_allowlist_status",
  "runtime_readiness_claimed",
  "safe_summary_guard_status",
  "safe_summary_only",
  "schema",
  "server_bind_scope",
  "source_head_bound",
  "source_head_sha",
  "status",
  "subtitle_path_status",
  "target_fixture_version",
  "target_kind",
  "translation_execution",
  "tts_path_status",
].sort();

const LOOPBACK_MATRIX_KEYS = [
  "accepted_case_status",
  "all_servers_closed",
  "case_count",
  "connection_reset_case_status",
  "evidence_fingerprint",
  "evidence_fingerprint_algorithm",
  "evidence_mode",
  "external_network_execution",
  "failure_count",
  "pass_count",
  "production_readiness_claimed",
  "raw_failure_material_excluded",
  "real_renderer_execution",
  "redirect_blocked_case_status",
  "redirect_sink_request_count",
  "renderer_rejected_case_status",
  "renderer_timeout_case_status",
  "runtime_readiness_claimed",
  "safe_summary_only",
  "schema",
  "source_head_sha",
  "status",
].sort();

function assertNoForbiddenEvidenceMaterial(value) {
  const text = JSON.stringify(value);
  assert.equal(/\bhttps?:\/\//iu.test(text), false);
  assert.equal(/\b127\.0\.0\.1\b/u.test(text), false);
  assert.equal(/\blocalhost\b/iu.test(text), false);
  assert.equal(/\bfake-(?:server|renderer)-key\b/iu.test(text), false);
  assert.equal(/\bBearer\b/iu.test(text), false);
  assert.equal(/request_body|response_body|raw_contract|raw_cue/iu.test(text), false);
}

async function readFixture(name) {
  const text = await readFile(new URL(`./fixtures/interop/${name}`, import.meta.url), "utf8");
  return JSON.parse(text);
}

async function readExternalAcceptanceFixture(name) {
  const text = await readExternalAcceptanceText(name);
  return JSON.parse(text);
}

async function readExternalAcceptanceText(name) {
  return readFile(new URL(`./fixtures/external-acceptance/${name}`, import.meta.url), "utf8");
}

async function readCandidateFixtureFiles() {
  const names = [
    "voxweave-interop-manifest.safe.json",
    "iris-tts-packet.safe.json",
    "iris-subtitle-packet.safe.json",
    "iris-live2d-packet.safe.json",
  ];
  return Promise.all(
    names.map(async (name) => ({
      path: `test/fixtures/interop/${name}`,
      content: await readFixture(name),
    }))
  );
}

function mutateFixture(fixtures, pathSuffix, patch) {
  return fixtures.map((fixture) =>
    fixture.path.endsWith(pathSuffix)
      ? { ...fixture, content: { ...fixture.content, ...patch } }
      : fixture
  );
}

function assertNoForbiddenFixtureMaterial(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      if (current.startsWith("artifact://voxweave/")) continue;
      assert.equal(/\bhttps?:\/\//iu.test(current), false);
      assert.equal(/\b127\.0\.0\.1\b/u.test(current), false);
      assert.equal(/\blocalhost\b/iu.test(current), false);
      assert.equal(/[A-Za-z]:[\\/]/u.test(current), false);
      assert.equal(/\b(?:token|secret|api[_-]?key|endpoint|host|port)\b/iu.test(current), false);
      assert.equal(/\.(?:wav|mp3|ogg|moc3|motion3\.json)\b/iu.test(current), false);
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_FIXTURE_KEYS.has(key), false, `forbidden fixture key ${key}`);
      stack.push(child);
    }
  }
}

const FORBIDDEN_FIXTURE_KEYS = new Set([
  "api_key",
  "apiKey",
  "token",
  "secret",
  "endpoint",
  "url",
  "host",
  "port",
  "private_path",
  "raw_audio",
  "raw_transcript",
  "raw_renderer_payload",
  "raw_model_path",
  "runtime_readiness",
  "production_readiness",
]);

function assertNoDangerousCandidateMaterial(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      assert.equal(/\bhttps?:\/\//iu.test(current), false);
      assert.equal(/[A-Za-z]:[\\/]/u.test(current), false);
      assert.equal(/\bBearer\b|fake-(?:server|renderer)-key|sk-[A-Za-z0-9]/iu.test(current), false);
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    for (const child of Object.values(current)) stack.push(child);
  }
}
