import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA,
  EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA,
  assertExternalAcceptanceCandidateBundleSummarySafe,
  assertExternalAcceptanceCandidateDescriptorSafe,
  buildExternalAcceptanceCandidateBundleFingerprint,
  buildExternalAcceptanceCandidateBundleSummary,
  buildExternalAcceptanceCandidateDescriptor,
  validateExternalAcceptanceCandidateBundle,
  validateExternalAcceptanceInteropFixtureBinding,
  validateExternalAcceptancePreSendChecklist,
  validateExternalAcceptanceReceiptTemplate,
  validateOwnerExternalSendDecisionBriefTemplate,
  validateProposedExternalSendAttachmentManifest,
} from "../src/externalAcceptanceCandidateBundle.js";

const EXPECTED_CANDIDATE_FINGERPRINT =
  "10540c2de8eb841373fb0cea57f6e35e370667326bcc9b170f9848458a74c71f";

test("candidate bundle module import is pure and exposes safe schemas", async () => {
  const beforeExitCode = process.exitCode;
  const module = await import("../src/externalAcceptanceCandidateBundle.js");

  assert.equal(module.EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA, EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA);
  assert.equal(module.EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA, EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA);
  assert.equal(process.exitCode, beforeExitCode);

  const source = await readFile(new URL("../src/externalAcceptanceCandidateBundle.js", import.meta.url), "utf8");
  assert.equal(source.includes("node:fs"), false);
  assert.equal(source.includes("node:http"), false);
  assert.equal(source.includes("node:child_process"), false);
  assert.equal(source.includes("process.env"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("console."), false);
  assert.equal(source.includes("../scripts/"), false);
  assert.equal(source.includes("../test/"), false);
});

test("candidate bundle summary and descriptor preserve Candidate Bundle 1.8.0 fingerprint", async () => {
  const bundle = await loadCandidateBundleForTest();

  validateExternalAcceptanceCandidateBundle(bundle);
  const fingerprint = buildExternalAcceptanceCandidateBundleFingerprint(bundle);
  assert.equal(fingerprint, EXPECTED_CANDIDATE_FINGERPRINT);

  const summary = buildExternalAcceptanceCandidateBundleSummary(bundle);
  assertExternalAcceptanceCandidateBundleSummarySafe(summary);
  assert.equal(summary.schema, EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA);
  assert.equal(summary.status, "pass");
  assert.equal(summary.candidate_bundle_version, "1.8.0");
  assert.equal(summary.candidate_bundle_fingerprint, EXPECTED_CANDIDATE_FINGERPRINT);
  assert.equal(summary.external_team_acceptance_status, "not_started");
  assert.equal(summary.real_integration_proof_status, "no");
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assert.equal(summary.safe_summary_only, true);

  const descriptor = buildExternalAcceptanceCandidateDescriptor(bundle);
  assertExternalAcceptanceCandidateDescriptorSafe(descriptor);
  assert.equal(descriptor.schema, EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA);
  assert.equal(descriptor.candidate_bundle_fingerprint, EXPECTED_CANDIDATE_FINGERPRINT);
  assert.equal(descriptor.candidate_status, "candidate_prepared_not_sent");
  assert.deepEqual(descriptor.recipient_projects, ["IRIS", "LIVE2D"]);
});

test("candidate bundle validators reject unsafe or stale contract material", async () => {
  const bundle = await loadCandidateBundleForTest();

  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({ ...bundle, manifest: { ...bundle.manifest, source_harness: "v1.2.6" } }),
    /invalid_candidate_binding_kind/u
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({ ...bundle, manifest: { ...bundle.manifest, runtime_readiness_claimed: true } }),
    /unsafe_candidate_manifest_readiness/u
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({ ...bundle, readmeText: "contains http://unsafe.invalid" }),
    /unsafe_candidate_bundle_url/u
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({ ...bundle, manifest: { ...bundle.manifest, fixture_files: ["../unsafe.safe.json"] } }),
    /invalid_safe_relative_path|invalid_fixture_files/u
  );
});

test("candidate subdocument validators bind to the candidate version and safe states", async () => {
  const bundle = await loadCandidateBundleForTest();
  const version = bundle.manifest.candidate_bundle_version;

  assert.doesNotThrow(() => validateExternalAcceptanceReceiptTemplate(bundle.receipts[0], version));
  assert.doesNotThrow(() => validateExternalAcceptancePreSendChecklist(bundle.checklist, version));
  assert.doesNotThrow(() => validateOwnerExternalSendDecisionBriefTemplate(bundle.decisionBrief, version));
  assert.doesNotThrow(() => validateProposedExternalSendAttachmentManifest(bundle.attachmentManifest, version));
  assert.doesNotThrow(() =>
    validateExternalAcceptanceInteropFixtureBinding(bundle.fixtureManifest, bundle.fixtures)
  );

  assert.throws(
    () => validateExternalAcceptanceReceiptTemplate({ ...bundle.receipts[0], candidate_bundle_version: "1.8.1" }, version),
    /invalid_receipt_template_bundle_version/u
  );
  assert.throws(
    () => validateExternalAcceptancePreSendChecklist({ ...bundle.checklist, owner_send_authorized: true }, version),
    /unsafe_pre_send_checklist_status/u
  );
  assert.throws(
    () => validateOwnerExternalSendDecisionBriefTemplate({ ...bundle.decisionBrief, owner_send_authorized: true }, version),
    /unsafe_decision_brief_template_status/u
  );
  assert.throws(
    () => validateProposedExternalSendAttachmentManifest({ ...bundle.attachmentManifest, raw_log_material_included: true }, version),
    /unsafe_proposed_attachment_manifest_status/u
  );
});

test("candidate fingerprint is stable for order-only changes and sensitive to content changes", async () => {
  const bundle = await loadCandidateBundleForTest();
  const baseline = buildExternalAcceptanceCandidateBundleFingerprint(bundle);

  assert.equal(
    buildExternalAcceptanceCandidateBundleFingerprint({
      ...bundle,
      receipts: [...bundle.receipts].reverse(),
      fixtures: [...bundle.fixtures].reverse(),
      attachmentManifest: {
        ...bundle.attachmentManifest,
        proposed_attachment_paths: [...bundle.attachmentManifest.proposed_attachment_paths].reverse(),
        forbidden_attachment_classes: [...bundle.attachmentManifest.forbidden_attachment_classes].reverse(),
      },
    }),
    baseline
  );

  for (const changed of [
    { manifest: { ...bundle.manifest, candidate_bundle_version: "1.8.1" } },
    { manifest: { ...bundle.manifest, source_main_sha: "1".repeat(40) } },
    { receipts: [{ ...bundle.receipts[0], recipient_role: "adapter_packet_owner_v2" }, bundle.receipts[1]] },
    { readmeText: `${bundle.readmeText}\nSafe candidate bundle note.\n` },
    { checklist: { ...bundle.checklist, checklist_status: "pending_owner_recheck" } },
    { decisionBrief: { ...bundle.decisionBrief, receipt_fixture_pack_status: "pending_owner_recheck" } },
    {
      attachmentManifest: {
        ...bundle.attachmentManifest,
        forbidden_attachment_classes: [
          ...bundle.attachmentManifest.forbidden_attachment_classes,
          "safe_extra_class",
        ],
      },
    },
    { fixtureManifest: { ...bundle.fixtureManifest, fixture_version: "1.0.1" } },
    { fixtures: mutateFixture(bundle.fixtures, "iris-tts-packet.safe.json", { trace_id: "changed-tts" }) },
    { fixtures: mutateFixture(bundle.fixtures, "iris-subtitle-packet.safe.json", { trace_id: "changed-subtitle" }) },
    { fixtures: mutateFixture(bundle.fixtures, "iris-live2d-packet.safe.json", { trace_id: "changed-live2d" }) },
  ]) {
    assert.notEqual(buildExternalAcceptanceCandidateBundleFingerprint({ ...bundle, ...changed }), baseline);
  }
});

test("candidate bundle implementation is no longer duplicated in the loopback script", async () => {
  const source = await readFile(
    new URL("../scripts/voxweave-loopback-integration-evidence.mjs", import.meta.url),
    "utf8"
  );
  for (const forbidden of [
    "function validateCandidateBundle",
    "function buildCandidateBundleFingerprint",
    "function validatePreSendChecklist",
    "function validateOwnerSendDecisionBriefTemplate",
    "function validateProposedAttachmentManifest",
    "function validateReceiptTemplate",
    "function validateFixtureBinding",
    "function scanCandidateBundleSafe",
    "const CANDIDATE_MANIFEST_FIELDS",
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
  assert.equal(source.includes("externalCandidateBundleModule"), true);
});

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
  const decisionBrief = await readExternalAcceptanceFixture(
    "owner-external-send-decision-brief-template.safe.json"
  );
  const attachmentManifest = await readExternalAcceptanceFixture(
    "proposed-external-send-attachment-manifest.safe.json"
  );
  const fixtureManifest = await readInteropFixture("voxweave-interop-manifest.safe.json");
  const fixtures = await readCandidateFixtureFiles();
  return {
    manifest,
    receipts: [irisReceipt, live2dReceipt],
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  };
}

async function readExternalAcceptanceFixture(name) {
  return JSON.parse(await readExternalAcceptanceText(name));
}

async function readExternalAcceptanceText(name) {
  return readFile(new URL(`./fixtures/external-acceptance/${name}`, import.meta.url), "utf8");
}

async function readInteropFixture(name) {
  const text = await readFile(new URL(`./fixtures/interop/${name}`, import.meta.url), "utf8");
  return JSON.parse(text);
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
      content: await readInteropFixture(name),
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
