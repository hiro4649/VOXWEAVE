import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
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
  EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
  assertExternalAcceptanceCandidateDescriptorSafe,
  assertExternalAcceptanceReceiptBindingResultSafe,
  assertExternalAcceptanceReceiptIntakeMatrixSafe,
  assertLoopbackFailureMatrixSafe,
  assertLoopbackEvidenceSafe,
  assertExternalAcceptanceCandidateBundleSummarySafe,
  buildExternalAcceptanceCandidateDescriptor,
  buildExternalAcceptanceCandidateBundleFingerprint,
  buildExternalAcceptanceReceiptIntakeMatrixFingerprint,
  buildExternalAcceptanceReceiptFingerprint,
  buildLoopbackEvidenceFingerprint,
  canonicalizeLoopbackEvidence,
  runExternalAcceptanceCandidateBundleSummary,
  runExternalAcceptanceReceiptIntakeMatrix,
  runLoopbackIntegrationFailureMatrix,
  runLoopbackIntegrationEvidence,
  validateExternalAcceptanceReceiptAgainstCandidate,
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
    assertOperationCancellationBoundarySnapshot(response.body.integration_boundary);
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
    assertOperationCancellationBoundarySnapshot(response.body.integration_boundary);
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
    assertOperationCancellationBoundarySnapshot(
      response.body.response_summary.integration_boundary
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
  const checklist = await readExternalAcceptanceFixture("owner-pre-send-checklist.safe.json");
  const receipts = [irisReceipt, live2dReceipt];
  const fixtureManifest = await readFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();

  assert.equal(manifest.schema, "voxweave_external_acceptance_candidate_manifest_v1");
  assert.equal(manifest.candidate_bundle_version, "1.7.0");
  assert.equal(manifest.source_main_sha, "baaad589e877568dfa983522fd3ef818f12898b0");
  assert.equal(
    manifest.receipt_intake_policy_schema,
    "voxweave_external_acceptance_receipt_intake_policy_v1"
  );
  assert.equal(manifest.receipt_intake_policy_version, 1);
  assert.equal(
    manifest.receipt_binding_result_schema,
    EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA
  );
  assert.equal(manifest.receipt_intake_matrix_required, true);
  assert.equal(manifest.receipt_intake_hardening_present, true);
  assert.equal(manifest.receipt_provenance_fail_closed_present, true);
  assert.equal(manifest.receipt_duplicate_key_rejection_present, true);
  assert.equal(manifest.receipt_fatal_utf8_present, true);
  assert.equal(manifest.receipt_size_bound_present, true);
  assert.equal(
    manifest.pre_send_checklist_path,
    "test/fixtures/external-acceptance/owner-pre-send-checklist.safe.json"
  );
  assert.equal(manifest.source_binding_kind, "runtime_source_snapshot");
  assert.equal(manifest.bundle_binding_kind, "transitive_sha256");
  assert.equal(manifest.candidate_status, "candidate_prepared_not_sent");
  assert.equal(manifest.external_team_acceptance_status, "not_started");
  assert.equal(manifest.real_integration_proof_status, "no");
  assert.equal(manifest.safe_failure_taxonomy_registry_present, true);
  assert.equal(manifest.http_safe_error_projection_metadata_present, true);
  assert.equal(manifest.live2d_forward_taxonomy_metadata_present, true);
  assert.equal(manifest.safe_failure_event_envelope_available, true);
  assert.equal(manifest.public_metrics_endpoint_present, false);
  assert.equal(manifest.runtime_event_sink_present, false);
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
    assert.equal(receipt.candidate_bundle_version, "1.7.0");
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
  assert.equal(readmeText.includes("not send authorization"), true);
  assert.equal(readmeText.includes("not runtime readiness"), true);
  assert.equal(checklist.schema, "voxweave_external_acceptance_pre_send_checklist_v1");
  assert.equal(checklist.candidate_bundle_version, "1.7.0");
  assert.equal(checklist.checklist_status, "pending_owner_action");
  assert.equal(checklist.owner_send_authorized, false);
  assert.equal(checklist.receipt_intake_policy_required, true);
  assert.equal(checklist.receipt_intake_matrix_pass_required, true);
  assert.equal(checklist.receipt_source_provenance_review_required, true);
  assert.equal(checklist.receipt_duplicate_key_rejection_required, true);
  assert.equal(checklist.receipt_fatal_utf8_required, true);
  assert.equal(checklist.receipt_candidate_binding_required, true);
  assert.equal(checklist.receipt_acceptance_authority_must_remain_external, true);
  assert.deepEqual(checklist.recipient_project_scope, ["IRIS", "LIVE2D"]);
  assert.equal(checklist.actual_send_status, "not_started");
  assert.equal(checklist.actual_receipt_status, "none");
  assert.equal(checklist.external_team_acceptance_status, "not_started");
  assert.equal(checklist.real_integration_proof_status, "no");
  assert.equal(checklist.runtime_readiness_claimed, false);
  assert.equal(checklist.production_readiness_claimed, false);
  assert.equal(checklist.safe_summary_only, true);
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
  assertNoDangerousCandidateMaterial({
    manifest,
    receipts,
    readmeText,
    checklist,
    fixtureManifest,
    fixtures,
  });

  const summary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    checklist,
    fixtureManifest,
    fixtures,
  });
  assertExternalAcceptanceCandidateBundleSummarySafe(summary);
  assert.equal(summary.schema, EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA);
  assert.equal(summary.status, "pass");
  assert.equal(summary.candidate_bundle_version, "1.7.0");
  assert.equal(summary.safe_failure_taxonomy_registry_present, true);
  assert.equal(summary.http_safe_error_projection_metadata_present, true);
  assert.equal(summary.live2d_forward_taxonomy_metadata_present, true);
  assert.equal(summary.safe_failure_event_envelope_available, true);
  assert.equal(summary.public_metrics_endpoint_present, false);
  assert.equal(summary.runtime_event_sink_present, false);
  assert.equal(summary.source_binding_kind, "runtime_source_snapshot");
  assert.equal(summary.bundle_binding_kind, "transitive_sha256");
  assert.equal(summary.manifest_status, "pass");
  assert.equal(summary.receipt_template_count, 2);
  assert.equal(summary.forbidden_material_scan_status, "pass");
  assert.equal(summary.fixture_reference_status, "pass");
  assert.equal(summary.fixture_manifest_status, "pass");
  assert.equal(summary.fixture_file_count, 4);
  assert.equal(summary.transitive_fixture_binding_status, "pass");
  assert.equal(summary.pre_send_checklist_status, "pending_owner_action");
  assert.equal(summary.pre_send_checklist_binding_status, "pass");
  assert.equal(summary.owner_send_authorized, false);
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
      checklist,
      fixtureManifest,
      fixtures,
    })
  );
  const changedVersionSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest: { ...manifest, candidate_bundle_version: "1.0.1" },
    receipts: receipts.map((receipt) => ({ ...receipt, candidate_bundle_version: "1.0.1" })),
    checklist: { ...checklist, candidate_bundle_version: "1.0.1" },
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
    checklist,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-tts-packet.safe.json", { trace_id: "changed-tts" }),
  });
  const changedSubtitleSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    checklist,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-subtitle-packet.safe.json", { trace_id: "changed-subtitle" }),
  });
  const changedLive2dSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    checklist,
    fixtureManifest,
    fixtures: mutateFixture(fixtures, "iris-live2d-packet.safe.json", { trace_id: "changed-live2d" }),
  });
  const changedFixtureManifestSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    checklist,
    fixtureManifest: { ...fixtureManifest, fixture_version: "1.0.1" },
    fixtures,
  });
  const changedReceiptSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts: [{ ...irisReceipt, recipient_role: "adapter_packet_owner_v2" }, live2dReceipt],
    readmeText,
    checklist,
    fixtureManifest,
    fixtures,
  });
  const changedReadmeSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText: `${readmeText}\nSafe candidate bundle note.\n`,
    checklist,
    fixtureManifest,
    fixtures,
  });
  const changedChecklistSummary = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts,
    readmeText,
    checklist: { ...checklist, recipient_project_scope: ["LIVE2D", "IRIS"] },
    fixtureManifest,
    fixtures,
  });
  assert.notEqual(summary.candidate_bundle_fingerprint, changedTtsSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedSubtitleSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedLive2dSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedFixtureManifestSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedReceiptSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedReadmeSummary.candidate_bundle_fingerprint);
  assert.notEqual(summary.candidate_bundle_fingerprint, changedChecklistSummary.candidate_bundle_fingerprint);
  assert.equal(
    summary.candidate_bundle_fingerprint,
    buildExternalAcceptanceCandidateBundleFingerprint({
      manifest,
      receipts: [live2dReceipt, irisReceipt],
      readmeText,
      checklist,
      fixtureManifest,
      fixtures: [...fixtures].reverse(),
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, unknown_field: "blocked" },
      receipts,
      readmeText,
      checklist,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts: [{ ...irisReceipt, unknown_field: "blocked" }, live2dReceipt],
      readmeText,
      checklist,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, fixture_files: ["../blocked"] },
      receipts,
      readmeText,
      checklist,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest: { ...manifest, fixture_files: ["C:/blocked"] },
      receipts,
      readmeText,
      checklist,
      fixtureManifest,
      fixtures,
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts,
      readmeText,
      checklist,
      fixtureManifest,
      fixtures: fixtures.slice(1),
    })
  );
  await assert.rejects(() =>
    runExternalAcceptanceCandidateBundleSummary({
      manifest,
      receipts,
      readmeText,
      checklist,
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
    candidate_bundle_version: "1.2.0",
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
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      received_status: "rejected",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      acceptance_candidate_status: "pending",
      received_status: "rejected",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      acceptance_candidate_status: "rejected_candidate",
      received_status: "pending",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      recipient_role: " adapter_packet_owner",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      candidate_bundle_version: "01.2.0",
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      source_main_sha: "E".repeat(40),
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      candidate_bundle_fingerprint: "F".repeat(64),
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      recipient_role: { nested: true },
    })
  );
  assert.throws(() =>
    validateExternalAcceptanceReceipt({
      ...baseReceipt,
      recipient_role: ["adapter_packet_owner"],
    })
  );
  assert.throws(() => {
    const cyclicReceipt = { ...baseReceipt };
    cyclicReceipt.recipient_role = cyclicReceipt;
    validateExternalAcceptanceReceipt(cyclicReceipt);
  });
  const nullPrototypeReceipt = Object.assign(Object.create(null), baseReceipt);
  assert.equal(validateExternalAcceptanceReceipt(nullPrototypeReceipt).status, "pass");
});

test("external receipt binding validator binds safe receipts to current candidate", async () => {
  const candidate = await loadCandidateBundleForTest();
  const descriptor = buildExternalAcceptanceCandidateDescriptor(candidate);
  assertExternalAcceptanceCandidateDescriptorSafe(descriptor);
  assert.equal(descriptor.schema, EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA);
  assert.equal(descriptor.status, "pass");
  assert.equal(descriptor.candidate_bundle_version, "1.7.0");
  assert.match(descriptor.runtime_source_head_sha, /^[a-f0-9]{40}$/u);
  assert.equal(descriptor.source_binding_kind, "runtime_source_snapshot");
  assert.equal(descriptor.bundle_fingerprint_algorithm, "sha256");
  assert.match(descriptor.candidate_bundle_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(descriptor.fixture_file_count, 4);
  assert.equal(descriptor.receipt_template_count, 2);
  assert.deepEqual(descriptor.recipient_projects, ["IRIS", "LIVE2D"]);
  assertNoDangerousCandidateMaterial(descriptor);
  assert.equal(JSON.stringify(descriptor).includes("fixture_id"), false);
  assert.equal(JSON.stringify(descriptor).includes("Safe interop TTS fixture text."), false);

  const boundReceipt = buildSyntheticBoundReceipt(candidate, descriptor, {
    acceptance_candidate_status: "accepted_candidate",
  });
  const syntheticAccepted = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
    receiptSourceKind: "synthetic_test_only",
  });
  assertExternalAcceptanceReceiptBindingResultSafe(syntheticAccepted);
  assert.equal(syntheticAccepted.status, "fail");
  assert.equal(syntheticAccepted.receipt_source_kind, "synthetic_test_only");
  assert.equal(syntheticAccepted.receipt_provenance_class, "synthetic_non_authoritative");
  assert.equal(syntheticAccepted.acceptance_authority_created, false);
  assert.equal(syntheticAccepted.external_acceptance_effective, false);
  assert.equal(syntheticAccepted.primary_reason_code, "synthetic_receipt_acceptance_claim_forbidden");

  const unclassifiedAccepted = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
  });
  assertExternalAcceptanceReceiptBindingResultSafe(unclassifiedAccepted);
  assert.equal(unclassifiedAccepted.status, "fail");
  assert.equal(unclassifiedAccepted.receipt_source_kind, "unclassified");
  assert.equal(unclassifiedAccepted.receipt_provenance_class, "unclassified_non_authoritative");
  assert.equal(
    unclassifiedAccepted.primary_reason_code,
    "receipt_acceptance_claim_requires_owner_provenance"
  );

  const invalidSourceKind = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
    receiptSourceKind: "externally_verified",
  });
  assertExternalAcceptanceReceiptBindingResultSafe(invalidSourceKind);
  assert.equal(invalidSourceKind.status, "fail");
  assert.equal(invalidSourceKind.receipt_source_kind, "unclassified");
  assert.equal(invalidSourceKind.receipt_source_status, "fail");
  assert.equal(invalidSourceKind.primary_reason_code, "invalid_receipt_source_kind");

  const accepted = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
    receiptSourceKind: "owner_provided",
  });
  assertExternalAcceptanceReceiptBindingResultSafe(accepted);
  assert.equal(accepted.schema, EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA);
  assert.equal(accepted.status, "pass");
  assert.equal(accepted.receipt_source_kind, "owner_provided");
  assert.equal(accepted.receipt_provenance_class, "owner_supplied_unverified_metadata");
  assert.equal(accepted.acceptance_authority_created, false);
  assert.equal(accepted.external_acceptance_effective, false);
  assert.equal(accepted.intake_disposition, "bound_accepted_candidate_unverified");
  assert.equal(accepted.source_head_binding_status, "pass");
  assert.equal(accepted.bundle_version_binding_status, "pass");
  assert.equal(accepted.bundle_fingerprint_binding_status, "pass");
  assert.equal(accepted.recipient_template_binding_status, "pass");
  assert.equal(accepted.recipient_role_binding_status, "pass");
  assert.equal(accepted.receipt_safety_status, "pass");
  assert.equal(accepted.receipt_candidate_status, "accepted_candidate");
  assert.equal(accepted.external_team_acceptance_status, "not_claimed_by_validator");
  assert.equal(accepted.real_integration_proof_status, "no");
  assert.equal(accepted.primary_reason_code, "none");
  assert.match(accepted.binding_fingerprint, /^[a-f0-9]{64}$/u);
  assertNoDangerousCandidateMaterial(accepted);

  const pending = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: buildSyntheticBoundReceipt(candidate, descriptor, {
      received_status: "pending",
      parsed_status: "pending",
      forbidden_material_absent_status: "pending",
      expected_schema_observed_status: "pending",
      raw_values_absent_status: "pending",
      readiness_claim_absent_status: "pending",
      acceptance_candidate_status: "pending",
    }),
    receiptSourceKind: "synthetic_test_only",
  });
  assert.equal(pending.status, "pass");
  assert.equal(pending.receipt_candidate_status, "pending");

  const ownerProvided = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
    receiptSourceKind: "owner_provided",
  });
  assert.equal(ownerProvided.status, "pass");
  assert.equal(ownerProvided.receipt_source_kind, "owner_provided");
  assert.equal(ownerProvided.external_team_acceptance_status, "not_claimed_by_validator");

  const versionMismatch = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, candidate_bundle_version: "1.2.0" },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(versionMismatch.status, "fail");
  assert.equal(versionMismatch.primary_reason_code, "candidate_bundle_version_mismatch");
  assert.equal(versionMismatch.candidate_bundle_version, descriptor.candidate_bundle_version);

  const sourceMismatch = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, source_main_sha: "a".repeat(40) },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(sourceMismatch.status, "fail");
  assert.equal(sourceMismatch.primary_reason_code, "candidate_source_head_mismatch");

  const fingerprintMismatch = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, candidate_bundle_fingerprint: "b".repeat(64) },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(fingerprintMismatch.status, "fail");
  assert.equal(fingerprintMismatch.primary_reason_code, "candidate_bundle_fingerprint_mismatch");

  const templateMissing = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipts: candidate.receipts.filter((receipt) => receipt.recipient_project !== "LIVE2D"),
    receipt: buildSyntheticBoundReceipt(candidate, descriptor, {
      recipient_project: "LIVE2D",
      recipient_role: "renderer_boundary_owner",
    }),
    receiptSourceKind: "owner_provided",
  });
  assert.equal(templateMissing.status, "fail");
  assert.equal(templateMissing.primary_reason_code, "candidate_receipt_binding_invalid");

  const roleMismatch = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, recipient_role: "renderer_boundary_owner" },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(roleMismatch.status, "fail");
  assert.equal(roleMismatch.primary_reason_code, "candidate_recipient_role_mismatch");

  const unsafeReceipt = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, runtime_readiness_claimed: true },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(unsafeReceipt.status, "fail");
  assert.equal(unsafeReceipt.primary_reason_code, "candidate_receipt_safety_invalid");

  const incompleteAccepted = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, parsed_status: "pending" },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(incompleteAccepted.status, "fail");
  assert.equal(incompleteAccepted.primary_reason_code, "candidate_receipt_safety_invalid");

  const rejectedAccepted = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: { ...boundReceipt, received_status: "rejected" },
    receiptSourceKind: "owner_provided",
  });
  assert.equal(rejectedAccepted.status, "fail");
  assert.equal(rejectedAccepted.primary_reason_code, "candidate_receipt_safety_invalid");

  const acceptedAgain = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: boundReceipt,
    receiptSourceKind: "owner_provided",
  });
  assert.equal(accepted.binding_fingerprint, acceptedAgain.binding_fingerprint);
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

test("external receipt binding CLI emits safe candidate-bound JSON only", async () => {
  const candidate = await loadCandidateBundleForTest();
  const descriptor = buildExternalAcceptanceCandidateDescriptor(candidate);
  const boundReceipt = buildSyntheticBoundReceipt(candidate, descriptor);
  const receiptPath = join(tmpdir(), `voxweave-bound-receipt-${Date.now()}.json`);
  const pendingPath = join(tmpdir(), `voxweave-pending-receipt-${Date.now()}.json`);
  const wrongVersionPath = join(tmpdir(), `voxweave-wrong-version-receipt-${Date.now()}.json`);
  const wrongSourcePath = join(tmpdir(), `voxweave-wrong-source-receipt-${Date.now()}.json`);
  const wrongFingerprintPath = join(tmpdir(), `voxweave-wrong-fingerprint-receipt-${Date.now()}.json`);
  const wrongRolePath = join(tmpdir(), `voxweave-wrong-role-receipt-${Date.now()}.json`);
  const malformedPath = join(tmpdir(), `voxweave-malformed-receipt-${Date.now()}.json`);
  const unsafePath = join(tmpdir(), `voxweave-unsafe-receipt-${Date.now()}.json`);
  const missingPath = join(tmpdir(), `voxweave-missing-receipt-${Date.now()}.json`);
  const duplicatePath = join(tmpdir(), `voxweave-duplicate-receipt-${Date.now()}.json`);
  const escapedDuplicatePath = join(tmpdir(), `voxweave-escaped-duplicate-receipt-${Date.now()}.json`);
  const nestedPath = join(tmpdir(), `voxweave-nested-receipt-${Date.now()}.json`);
  const invalidUtf8Path = join(tmpdir(), `voxweave-invalid-utf8-receipt-${Date.now()}.json`);
  const bomPath = join(tmpdir(), `voxweave-bom-receipt-${Date.now()}.json`);
  const oversizedPath = join(tmpdir(), `voxweave-oversized-receipt-${Date.now()}.json`);
  const directoryPath = join(tmpdir(), `voxweave-directory-receipt-${Date.now()}`);
  const paths = [
    receiptPath,
    pendingPath,
    wrongVersionPath,
    wrongSourcePath,
    wrongFingerprintPath,
    wrongRolePath,
    malformedPath,
    unsafePath,
    duplicatePath,
    escapedDuplicatePath,
    nestedPath,
    invalidUtf8Path,
    bomPath,
    oversizedPath,
  ];
  try {
    await writeFile(receiptPath, JSON.stringify(boundReceipt), "utf8");
    await writeFile(
      pendingPath,
      JSON.stringify(buildSyntheticBoundReceipt(candidate, descriptor, {
        received_status: "pending",
        parsed_status: "pending",
        forbidden_material_absent_status: "pending",
        expected_schema_observed_status: "pending",
        raw_values_absent_status: "pending",
        readiness_claim_absent_status: "pending",
        acceptance_candidate_status: "pending",
      })),
      "utf8"
    );
    await writeFile(wrongVersionPath, JSON.stringify({ ...boundReceipt, candidate_bundle_version: "1.2.0" }), "utf8");
    await writeFile(wrongSourcePath, JSON.stringify({ ...boundReceipt, source_main_sha: "a".repeat(40) }), "utf8");
    await writeFile(
      wrongFingerprintPath,
      JSON.stringify({ ...boundReceipt, candidate_bundle_fingerprint: "b".repeat(64) }),
      "utf8"
    );
    await writeFile(wrongRolePath, JSON.stringify({ ...boundReceipt, recipient_role: "renderer_boundary_owner" }), "utf8");
    await writeFile(malformedPath, "{", "utf8");
    await writeFile(unsafePath, JSON.stringify({ ...boundReceipt, runtime_readiness_claimed: true }), "utf8");
    await writeFile(
      duplicatePath,
      `{"schema":"${EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA}","schema":"${EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA}"}`,
      "utf8"
    );
    await writeFile(
      escapedDuplicatePath,
      `{"recipient_project":"IRIS","recipient\\u005fproject":"LIVE2D"}`,
      "utf8"
    );
    await writeFile(nestedPath, `{"schema":{"nested":true}}`, "utf8");
    await writeFile(invalidUtf8Path, Buffer.from([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    await writeFile(bomPath, Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(JSON.stringify(boundReceipt)),
    ]));
    await writeFile(oversizedPath, Buffer.alloc(32769, 0x20));
    await mkdir(directoryPath);

    const pass = await runBindingCli(receiptPath, "owner_provided");
    assert.equal(pass.exitCode, 0);
    assert.equal(pass.output.schema, EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA);
    assert.equal(pass.output.status, "pass");
    assert.equal(pass.output.receipt_source_kind, "owner_provided");
    assert.equal(pass.output.receipt_provenance_class, "owner_supplied_unverified_metadata");
    assert.equal(pass.output.acceptance_authority_created, false);
    assert.equal(pass.output.external_acceptance_effective, false);
    assert.equal(pass.output.intake_disposition, "bound_accepted_candidate_unverified");
    assert.equal(pass.output.external_team_acceptance_status, "not_claimed_by_validator");
    assert.equal(pass.output.real_integration_proof_status, "no");
    assert.equal(pass.output.runtime_readiness_claimed, false);
    assert.equal(pass.output.production_readiness_claimed, false);
    assertOneSafeJsonObject(pass.stdout);

    const syntheticAccepted = await runBindingCli(receiptPath, "synthetic_test_only");
    assert.equal(syntheticAccepted.exitCode, 1);
    assert.equal(
      syntheticAccepted.output.primary_reason_code,
      "synthetic_receipt_acceptance_claim_forbidden"
    );

    const pending = await runBindingCli(pendingPath, "synthetic_test_only");
    assert.equal(pending.exitCode, 0);
    assert.equal(pending.output.status, "pass");
    assert.equal(pending.output.receipt_candidate_status, "pending");

    const wrongVersion = await runBindingCli(wrongVersionPath, "owner_provided");
    assert.equal(wrongVersion.exitCode, 1);
    assert.equal(wrongVersion.output.primary_reason_code, "candidate_bundle_version_mismatch");

    const wrongSource = await runBindingCli(wrongSourcePath, "owner_provided");
    assert.equal(wrongSource.exitCode, 1);
    assert.equal(wrongSource.output.primary_reason_code, "candidate_source_head_mismatch");

    const wrongFingerprint = await runBindingCli(wrongFingerprintPath, "owner_provided");
    assert.equal(wrongFingerprint.exitCode, 1);
    assert.equal(wrongFingerprint.output.primary_reason_code, "candidate_bundle_fingerprint_mismatch");

    const wrongRole = await runBindingCli(wrongRolePath, "owner_provided");
    assert.equal(wrongRole.exitCode, 1);
    assert.equal(wrongRole.output.primary_reason_code, "candidate_recipient_role_mismatch");

    const malformed = await runBindingCli(malformedPath, "synthetic_test_only");
    assert.equal(malformed.exitCode, 1);
    assert.equal(malformed.output.primary_reason_code, "invalid_receipt_json");

    const unsafe = await runBindingCli(unsafePath, "owner_provided");
    assert.equal(unsafe.exitCode, 1);
    assert.equal(unsafe.output.primary_reason_code, "candidate_receipt_safety_invalid");

    const missing = await runBindingCli(missingPath, "owner_provided");
    assert.equal(missing.exitCode, 1);
    assert.equal(missing.output.receipt_source_kind, "owner_provided");
    assert.equal(missing.output.primary_reason_code, "invalid_receipt_file");

    const duplicate = await runBindingCli(duplicatePath, "owner_provided");
    assert.equal(duplicate.exitCode, 1);
    assert.equal(duplicate.output.primary_reason_code, "invalid_receipt_duplicate_key");

    const escapedDuplicate = await runBindingCli(escapedDuplicatePath, "owner_provided");
    assert.equal(escapedDuplicate.exitCode, 1);
    assert.equal(escapedDuplicate.output.primary_reason_code, "invalid_receipt_duplicate_key");

    const nested = await runBindingCli(nestedPath, "owner_provided");
    assert.equal(nested.exitCode, 1);
    assert.equal(nested.output.primary_reason_code, "invalid_receipt_nested_value");

    const invalidUtf8 = await runBindingCli(invalidUtf8Path, "owner_provided");
    assert.equal(invalidUtf8.exitCode, 1);
    assert.equal(invalidUtf8.output.primary_reason_code, "invalid_receipt_utf8");

    const bom = await runBindingCli(bomPath, "owner_provided");
    assert.equal(bom.exitCode, 1);
    assert.equal(bom.output.primary_reason_code, "invalid_receipt_bom");

    const oversized = await runBindingCli(oversizedPath, "owner_provided");
    assert.equal(oversized.exitCode, 1);
    assert.equal(oversized.output.primary_reason_code, "invalid_receipt_file_size");

    const directory = await runBindingCli(directoryPath, "owner_provided");
    assert.equal(directory.exitCode, 1);
    assert.equal(directory.output.primary_reason_code, "invalid_receipt_file_type");

    const invalidSourceKind = await runReceiptScriptCli([
      "--validate-receipt-against-bundle",
      receiptPath,
      "--receipt-source-kind",
      "externally_verified",
    ]);
    assert.equal(invalidSourceKind.exitCode, 1);
    assert.equal(invalidSourceKind.output.primary_reason_code, "invalid_receipt_source_kind");
    assert.equal(invalidSourceKind.output.receipt_source_kind, "unclassified");

    const duplicateSourceKind = await runReceiptScriptCli([
      "--validate-receipt-against-bundle",
      receiptPath,
      "--receipt-source-kind",
      "owner_provided",
      "--receipt-source-kind",
      "synthetic_test_only",
    ]);
    assert.equal(duplicateSourceKind.exitCode, 1);
    assert.equal(duplicateSourceKind.output.primary_reason_code, "invalid_receipt_cli_arguments");

    const sourceKindOutsideBinding = await runReceiptScriptCli([
      "--validate-receipt",
      receiptPath,
      "--receipt-source-kind",
      "owner_provided",
    ]);
    assert.equal(sourceKindOutsideBinding.exitCode, 1);
    assert.equal(sourceKindOutsideBinding.output.primary_reason_code, "invalid_receipt_cli_arguments");

    const conflictingMode = await runReceiptScriptCli([
      "--validate-receipt-against-bundle",
      receiptPath,
      "--candidate-bundle",
    ]);
    assert.equal(conflictingMode.exitCode, 1);
    assert.equal(conflictingMode.output.primary_reason_code, "invalid_receipt_cli_arguments");

    const unknownArg = await runReceiptScriptCli(["--unknown-receipt-mode"]);
    assert.equal(unknownArg.exitCode, 1);
    assert.equal(unknownArg.output.primary_reason_code, "invalid_receipt_cli_arguments");

    const missingPathArgument = await runReceiptScriptCli(["--validate-receipt-against-bundle"]);
    assert.equal(missingPathArgument.exitCode, 1);
    assert.equal(missingPathArgument.output.primary_reason_code, "invalid_receipt_cli_arguments");

    for (const result of [
      pass,
      syntheticAccepted,
      pending,
      wrongVersion,
      wrongSource,
      wrongFingerprint,
      wrongRole,
      malformed,
      unsafe,
      missing,
      duplicate,
      escapedDuplicate,
      nested,
      invalidUtf8,
      bom,
      oversized,
      directory,
      invalidSourceKind,
      duplicateSourceKind,
      sourceKindOutsideBinding,
      conflictingMode,
      unknownArg,
      missingPathArgument,
    ]) {
      assertExternalAcceptanceReceiptBindingResultSafe(result.output);
      assert.equal(result.stdout.includes("voxweave-"), false);
      assert.equal(result.stdout.includes(receiptPath), false);
      assert.equal(result.stdout.includes(boundReceipt.source_main_sha), false);
      assert.equal(result.stdout.includes("runtime_readiness_claimed"), true);
      assert.equal(result.stdout.includes("accepted_candidate"), result.output.receipt_candidate_status === "accepted_candidate");
      assertNoDangerousCandidateMaterial(result.output);
    }
  } finally {
    await Promise.all(paths.map((path) => unlink(path).catch(() => {})));
    await rm(directoryPath, { recursive: true, force: true }).catch(() => {});
  }
});

test("acceptance provenance drift matrix rejects unsafe or stale bindings", async () => {
  const candidate = await loadCandidateBundleForTest();
  const descriptor = buildExternalAcceptanceCandidateDescriptor(candidate);
  const exactReceipt = buildSyntheticBoundReceipt(candidate, descriptor);
  const pendingReceipt = buildSyntheticBoundReceipt(candidate, descriptor, {
    received_status: "pending",
    parsed_status: "pending",
    forbidden_material_absent_status: "pending",
    expected_schema_observed_status: "pending",
    raw_values_absent_status: "pending",
    readiness_claim_absent_status: "pending",
    acceptance_candidate_status: "pending",
  });
  const exact = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: exactReceipt,
    receiptSourceKind: "owner_provided",
  });
  const pending = validateExternalAcceptanceReceiptAgainstCandidate({
    ...candidate,
    receipt: pendingReceipt,
    receiptSourceKind: "synthetic_test_only",
  });
  assert.equal(exact.status, "pass");
  assert.equal(pending.status, "pass");
  assert.equal(exact.external_team_acceptance_status, "not_claimed_by_validator");
  assert.equal(exact.acceptance_authority_created, false);
  assert.equal(exact.external_acceptance_effective, false);
  assert.equal(pending.external_team_acceptance_status, "not_claimed_by_validator");
  assert.equal(candidate.receipts.find((receipt) => receipt.recipient_project === "IRIS").recipient_role, "adapter_packet_owner");
  assert.equal(candidate.receipts.find((receipt) => receipt.recipient_project === "LIVE2D").recipient_role, "renderer_boundary_owner");

  const mismatchCases = [
    ["version", { candidate_bundle_version: "1.2.0" }, "candidate_bundle_version_mismatch"],
    ["source", { source_main_sha: "a".repeat(40) }, "candidate_source_head_mismatch"],
    ["fingerprint", { candidate_bundle_fingerprint: "b".repeat(64) }, "candidate_bundle_fingerprint_mismatch"],
    ["recipient_project", { recipient_project: "LIVE2D", recipient_role: "adapter_packet_owner" }, "candidate_recipient_role_mismatch"],
    ["recipient_role", { recipient_role: "renderer_boundary_owner" }, "candidate_recipient_role_mismatch"],
    ["readiness", { runtime_readiness_claimed: true }, "candidate_receipt_safety_invalid"],
    ["real_proof", { real_integration_proof_status: "yes" }, "candidate_receipt_safety_invalid"],
    ["accepted_pending_safety", { parsed_status: "pending" }, "candidate_receipt_safety_invalid"],
  ];
  for (const [, patch, reason] of mismatchCases) {
    const result = validateExternalAcceptanceReceiptAgainstCandidate({
      ...candidate,
      receipt: { ...exactReceipt, ...patch },
      receiptSourceKind: "owner_provided",
    });
    assert.equal(result.status, "fail");
    assert.equal(result.primary_reason_code, reason);
    assertExternalAcceptanceReceiptBindingResultSafe(result);
    assertNoDangerousCandidateMaterial(result);
  }
  assert.throws(() => validateExternalAcceptanceReceipt({ ...exactReceipt, raw_payload: "x" }));
  assert.throws(() => validateExternalAcceptanceReceipt({ ...exactReceipt, recipient_role: "error_detail" }));
  assert.equal(
    validateExternalAcceptanceReceipt({ ...exactReceipt, candidate_bundle_version: "1.2.0" }).status,
    "pass"
  );
  assert.equal(
    validateExternalAcceptanceReceiptAgainstCandidate({
      ...candidate,
      receipt: { ...exactReceipt, candidate_bundle_version: "1.2.0" },
      receiptSourceKind: "owner_provided",
    }).status,
    "fail"
  );

  const baseFingerprint = descriptor.candidate_bundle_fingerprint;
  const fingerprintMutations = [
    { fixtureManifest: { ...candidate.fixtureManifest, fixture_version: "1.0.1" } },
    { fixtures: mutateFixture(candidate.fixtures, "iris-tts-packet.safe.json", { trace_id: "drift-tts" }) },
    { fixtures: mutateFixture(candidate.fixtures, "iris-subtitle-packet.safe.json", { trace_id: "drift-subtitle" }) },
    { fixtures: mutateFixture(candidate.fixtures, "iris-live2d-packet.safe.json", { trace_id: "drift-live2d" }) },
    { receipts: [{ ...candidate.receipts[0], recipient_role: "adapter_packet_owner_v2" }, candidate.receipts[1]] },
    { readmeText: `${candidate.readmeText}\nSafe drift note.\n` },
    { checklist: { ...candidate.checklist, recipient_project_scope: ["LIVE2D", "IRIS"] } },
    { manifest: { ...candidate.manifest, candidate_bundle_version: "1.1.1" }, receipts: candidate.receipts.map((receipt) => ({ ...receipt, candidate_bundle_version: "1.1.1" })), checklist: { ...candidate.checklist, candidate_bundle_version: "1.1.1" } },
    { manifest: { ...candidate.manifest, source_main_sha: "c".repeat(40) } },
  ];
  for (const mutation of fingerprintMutations) {
    const mutated = {
      ...candidate,
      ...mutation,
    };
    const mutatedDescriptor = buildExternalAcceptanceCandidateDescriptor(mutated);
    assert.notEqual(baseFingerprint, mutatedDescriptor.candidate_bundle_fingerprint);
    const staleReceipt = validateExternalAcceptanceReceiptAgainstCandidate({
      ...mutated,
      receipt: exactReceipt,
      receiptSourceKind: "owner_provided",
    });
    assert.equal(staleReceipt.status, "fail");
  }
  assert.equal(
    baseFingerprint,
    buildExternalAcceptanceCandidateDescriptor({
      ...candidate,
      receipts: [...candidate.receipts].reverse(),
      fixtures: [...candidate.fixtures].reverse(),
    }).candidate_bundle_fingerprint
  );
  for (const invalidCandidate of [
    { manifest: { ...candidate.manifest, unknown_field: "blocked" } },
    { receipts: [{ ...candidate.receipts[0], unknown_field: "blocked" }, candidate.receipts[1]] },
    { manifest: { ...candidate.manifest, fixture_manifest_path: "../blocked" } },
    { manifest: { ...candidate.manifest, fixture_manifest_path: "C:/blocked" } },
    { manifest: { ...candidate.manifest, fixture_files: [candidate.manifest.fixture_files[0], candidate.manifest.fixture_files[0], candidate.manifest.fixture_files[1], candidate.manifest.fixture_files[2]] } },
    { fixtures: candidate.fixtures.slice(1) },
  ]) {
    assert.throws(() => buildExternalAcceptanceCandidateDescriptor({ ...candidate, ...invalidCandidate }));
  }

  const malformedPath = join(tmpdir(), `voxweave-drift-malformed-${Date.now()}.json`);
  const missingPath = join(tmpdir(), `voxweave-drift-missing-${Date.now()}.json`);
  try {
    await writeFile(malformedPath, "{", "utf8");
    const malformed = await runBindingCli(malformedPath, "synthetic_test_only");
    const missing = await runBindingCli(missingPath, "synthetic_test_only");
    assert.equal(malformed.exitCode, 1);
    assert.equal(malformed.output.primary_reason_code, "invalid_receipt_json");
    assert.equal(missing.exitCode, 1);
    assert.equal(missing.output.primary_reason_code, "invalid_receipt_file");
    assert.equal(malformed.stdout.includes(malformedPath), false);
    assert.equal(missing.stdout.includes(missingPath), false);
    assertOneSafeJsonObject(malformed.stdout);
    assertOneSafeJsonObject(missing.stdout);
  } finally {
    await unlink(malformedPath).catch(() => {});
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
  const checklist = await readExternalAcceptanceFixture("owner-pre-send-checklist.safe.json");
  const fixtureManifest = await readFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();

  const bundle = await runExternalAcceptanceCandidateBundleSummary({
    manifest,
    receipts: [irisTemplate, live2dTemplate],
    readmeText,
    checklist,
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
    candidate_bundle_version: "1.7.0",
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

test("external acceptance receipt intake matrix covers safe local negative cases", async () => {
  const candidate = await loadCandidateBundleForTest();
  const matrix = await runExternalAcceptanceReceiptIntakeMatrix({
    headSha: "1".repeat(40),
    candidateBundle: candidate,
  });
  assertExternalAcceptanceReceiptIntakeMatrixSafe(matrix);
  assert.equal(matrix.schema, EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA);
  assert.equal(matrix.status, "pass");
  assert.equal(matrix.evidence_mode, "local_synthetic_receipt_intake_only");
  assert.equal(matrix.provenance_case_status, "pass");
  assert.equal(matrix.state_coherence_case_status, "pass");
  assert.equal(matrix.binding_case_status, "pass");
  assert.equal(matrix.encoding_case_status, "pass");
  assert.equal(matrix.duplicate_key_case_status, "pass");
  assert.equal(matrix.size_bound_case_status, "pass");
  assert.equal(matrix.cli_argument_case_status, "pass");
  assert.equal(matrix.output_minimality_case_status, "pass");
  assert.equal(matrix.authority_non_creation_status, "pass");
  assert.equal(matrix.actual_receipt_generated, false);
  assert.equal(matrix.external_send_executed, false);
  assert.equal(matrix.external_acceptance_claimed, false);
  assert.equal(matrix.real_integration_proof_claimed, false);
  assert.equal(matrix.runtime_readiness_claimed, false);
  assert.equal(matrix.production_readiness_claimed, false);
  assert.equal(
    matrix.evidence_fingerprint,
    buildExternalAcceptanceReceiptIntakeMatrixFingerprint(matrix)
  );

  const changed = {
    ...matrix,
    provenance_case_status: "fail",
    evidence_fingerprint: "",
  };
  changed.evidence_fingerprint = buildExternalAcceptanceReceiptIntakeMatrixFingerprint(changed);
  assert.notEqual(matrix.evidence_fingerprint, changed.evidence_fingerprint);

  const cli = await runReceiptScriptCli(["--receipt-intake-matrix"]);
  assert.equal(cli.exitCode, 0);
  assertExternalAcceptanceReceiptIntakeMatrixSafe(cli.output);
  assert.equal(cli.output.schema, EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA);
  assert.equal(cli.output.status, "pass");
  assert.equal(cli.output.actual_receipt_generated, false);
  assert.equal(cli.output.external_send_executed, false);
  assert.equal(cli.output.external_acceptance_claimed, false);
  assert.equal(cli.stdout.includes("recipient_role"), false);
  assert.equal(cli.stdout.includes("candidate_bundle_fingerprint"), false);
  assert.equal(cli.stdout.includes("source_main_sha"), false);
  assertNoDangerousCandidateMaterial(cli.output);
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

function assertOperationCancellationBoundarySnapshot(snapshot) {
  assert.equal(snapshot.operational_boundary.application_operation_deadline_bounded, true);
  assert.equal(snapshot.operational_boundary.client_disconnect_cancellation_enabled, true);
  assert.equal(snapshot.operational_boundary.server_to_service_abort_signal, true);
  assert.equal(snapshot.operational_boundary.orchestrator_cooperative_cancellation, true);
  assert.equal(snapshot.operational_boundary.live2d_parent_signal_propagation, true);
  assert.equal(snapshot.operational_boundary.live2d_local_timeout_preserved, true);
  assert.equal(snapshot.operational_boundary.parent_abort_distinguished_from_renderer_timeout, true);
  assert.equal(snapshot.operational_boundary.cache_commit_after_cancellation_prevented, true);
  assert.equal(snapshot.operational_boundary.render_group_commit_after_cancellation_prevented, true);
  assert.equal(snapshot.operational_boundary.external_side_effect_rollback_guaranteed, false);
  assert.equal(snapshot.operational_boundary.operation_timeout_safe_error, true);
  assert.equal(snapshot.operational_boundary.operation_cancellation_safe_error, true);
  assert.equal(snapshot.operational_boundary.operation_deadline_values_excluded, true);
  assert.equal(snapshot.operational_boundary.active_operation_counts_excluded, true);

  const serialized = JSON.stringify(snapshot);
  assert.equal(serialized.includes("operationTimeoutMs"), false);
  assert.equal(serialized.includes("operation_timeout_ms"), false);
  assert.equal(serialized.includes("absolute_deadline"), false);
  assert.equal(serialized.includes("remaining_time"), false);
  assert.equal(serialized.includes("\"active_operation_count\":"), false);
  assert.equal(serialized.includes("abort_reason"), false);
  assert.equal(serialized.includes("AbortSignal"), false);
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

async function loadCandidateBundleForTest() {
  const manifest = await readExternalAcceptanceFixture(
    "voxweave-external-acceptance-candidate.manifest.safe.json"
  );
  const irisReceipt = await readExternalAcceptanceFixture("iris-team-receipt-template.safe.json");
  const live2dReceipt = await readExternalAcceptanceFixture(
    "live2d-team-receipt-template.safe.json"
  );
  const readmeText = await readExternalAcceptanceText("README.safe.md");
  const checklist = await readExternalAcceptanceFixture("owner-pre-send-checklist.safe.json");
  const fixtureManifest = await readFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();
  return {
    manifest,
    receipts: [irisReceipt, live2dReceipt],
    readmeText,
    checklist,
    fixtureManifest,
    fixtures,
  };
}

function buildSyntheticBoundReceipt(candidate, descriptor, overrides = {}) {
  const template = candidate.receipts.find(
    (receipt) => receipt.recipient_project === (overrides.recipient_project ?? "IRIS")
  );
  return {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
    recipient_project: template?.recipient_project ?? overrides.recipient_project ?? "IRIS",
    recipient_role: template?.recipient_role ?? overrides.recipient_role ?? "adapter_packet_owner",
    candidate_bundle_version: descriptor.candidate_bundle_version,
    source_main_sha: descriptor.runtime_source_head_sha,
    candidate_bundle_fingerprint: descriptor.candidate_bundle_fingerprint,
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
    ...overrides,
  };
}

async function runBindingCli(receiptPath, receiptSourceKind) {
  return runReceiptScriptCli([
    "--validate-receipt-against-bundle",
    receiptPath,
    "--receipt-source-kind",
    receiptSourceKind,
  ]);
}

async function runReceiptScriptCli(args) {
  const result = await execFileAsync(process.execPath, [
    "scripts/voxweave-loopback-integration-evidence.mjs",
    ...args,
  ], {
    cwd: process.cwd(),
    windowsHide: true,
  })
    .then(({ stdout }) => ({ exitCode: 0, stdout }))
    .catch((error) => ({
      exitCode: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout,
    }));
  return {
    ...result,
    output: JSON.parse(result.stdout),
  };
}

function assertOneSafeJsonObject(stdout) {
  const trimmed = stdout.trim();
  assert.equal(trimmed.startsWith("{"), true);
  assert.equal(trimmed.endsWith("}"), true);
  assert.equal(trimmed.split(/\r?\n/u).length, 1);
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
