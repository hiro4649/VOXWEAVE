import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA,
  EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA,
  EXTERNAL_ACCEPTANCE_CANDIDATE_MANIFEST_PATH,
  EXTERNAL_ACCEPTANCE_FORBIDDEN_ATTACHMENT_CLASSES,
  EXTERNAL_ACCEPTANCE_FORBIDDEN_MATERIAL_POLICY,
  EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES,
  EXTERNAL_ACCEPTANCE_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH,
  EXTERNAL_ACCEPTANCE_PRE_SEND_CHECKLIST_PATH,
  EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_PATHS,
  EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_MANIFEST_PATH,
  EXTERNAL_ACCEPTANCE_README_PATH,
  EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS,
  MAX_CANDIDATE_BUNDLE_STRING_LENGTH,
  MAX_CANDIDATE_README_LENGTH,
  buildOwnerExternalSendDecisionScope,
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

test("candidate subdocument validators reject equal malformed bundle versions", async () => {
  const bundle = await loadCandidateBundleForTest();
  const version = bundle.manifest.candidate_bundle_version;
  const malformedVersions = ["1.8", "01.8.0", "1.8.0-beta", "", "1.8.0.0"];

  for (const malformedVersion of malformedVersions) {
    assert.throws(
      () => validateExternalAcceptanceReceiptTemplate({
        ...bundle.receipts[0],
        candidate_bundle_version: malformedVersion,
      }),
      /invalid_receipt_template_bundle_version/u
    );
    assert.throws(
      () => validateExternalAcceptanceReceiptTemplate({
        ...bundle.receipts[0],
        candidate_bundle_version: malformedVersion,
      }, malformedVersion),
      /invalid_receipt_template_bundle_version/u
    );
    assert.throws(
      () => validateExternalAcceptancePreSendChecklist({
        ...bundle.checklist,
        candidate_bundle_version: malformedVersion,
      }, malformedVersion),
      /invalid_pre_send_checklist_bundle_version/u
    );
    assert.throws(
      () => validateProposedExternalSendAttachmentManifest({
        ...bundle.attachmentManifest,
        candidate_bundle_version: malformedVersion,
      }, malformedVersion),
      /unsafe_proposed_attachment_manifest_status/u
    );
    assert.throws(
      () => validateOwnerExternalSendDecisionBriefTemplate({
        ...bundle.decisionBrief,
        candidate_bundle_version: malformedVersion,
      }, malformedVersion),
      /invalid_candidate_bundle_version/u
    );
  }

  assert.throws(
    () => validateOwnerExternalSendDecisionBriefTemplate({
      ...bundle.decisionBrief,
      candidate_bundle_version: "1.8",
    }, version),
    /unsafe_decision_brief_template_status/u
  );
});

test("candidate decision scope is derived from strict semantic versions", () => {
  assert.equal(
    buildOwnerExternalSendDecisionScope("1.8.0"),
    "candidate_bundle_1_8_0_external_send_decision_only"
  );
  assert.equal(
    buildOwnerExternalSendDecisionScope("1.9.0"),
    "candidate_bundle_1_9_0_external_send_decision_only"
  );
  for (const version of ["1.8", "01.8.0", "1.8.0-beta", "", null]) {
    assert.throws(() => buildOwnerExternalSendDecisionScope(version), /invalid_candidate_bundle_version/u);
  }
});

test("candidate bundle contract rejects unsafe graph shapes and scalar values", async () => {
  const bundle = await loadCandidateBundleForTest();
  const shared = { safe: "shared" };
  const cyclic = {};
  cyclic.self = cyclic;
  const deep = {};
  let cursor = deep;
  for (let index = 0; index < 25; index += 1) {
    cursor.next = {};
    cursor = cursor.next;
  }

  for (const value of [
    null,
    [],
    new (class UnsafeCandidate {})(),
    { ...bundle, manifest: { ...bundle.manifest, unsafe: undefined } },
    { ...bundle, manifest: { ...bundle.manifest, unsafe: () => true } },
    { ...bundle, manifest: { ...bundle.manifest, unsafe: Symbol("unsafe") } },
    { ...bundle, manifest: { ...bundle.manifest, unsafe: 1n } },
    { ...bundle, manifest: { ...bundle.manifest, unsafe: Number.NaN } },
    { ...bundle, manifest: { ...bundle.manifest, unsafe: Number.POSITIVE_INFINITY } },
    { ...bundle, manifest: cyclic },
    { ...bundle, manifest: { a: shared }, checklist: { b: shared } },
    { ...bundle, manifest: deep },
    { ...bundle, receipts: [Array.from({ length: 257 }, (_, index) => index), bundle.receipts[1]] },
    { ...bundle, manifest: Object.fromEntries(Array.from({ length: 257 }, (_, index) => [`k${index}`, index])) },
    { ...bundle, readmeText: "x".repeat(65537) },
    { ...bundle, readmeText: "safe\u0000blocked" },
    { ...bundle, readmeText: "safe\uFEFFblocked" },
    { ...bundle, readmeText: "safe\uFFFDblocked" },
    { ...bundle, readmeText: "safe\uD800blocked" },
  ]) {
    assert.throws(() => validateExternalAcceptanceCandidateBundle(value));
  }
  assert.throws(() => buildExternalAcceptanceCandidateBundleFingerprint({ ...bundle, readmeText: "x".repeat(65537) }));
});

test("candidate bundle root contract rejects hidden fields before fingerprinting", async () => {
  const bundle = await loadCandidateBundleForTest();
  let getterCalls = 0;
  const accessorBundle = { ...bundle };
  Object.defineProperty(accessorBundle, "accessor", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "blocked";
    },
  });
  const nonEnumerableBundle = { ...bundle };
  Object.defineProperty(nonEnumerableBundle, "hidden", {
    enumerable: false,
    value: "blocked",
  });
  const symbolBundle = { ...bundle };
  symbolBundle[Symbol("blocked")] = "blocked";
  const missingBundle = { ...bundle };
  delete missingBundle.manifest;

  for (const invalid of [
    { ...bundle, extra: "blocked" },
    { ...bundle, extra: "http://blocked.invalid" },
    symbolBundle,
    nonEnumerableBundle,
    accessorBundle,
    missingBundle,
    [],
  ]) {
    assert.throws(() => validateExternalAcceptanceCandidateBundle(invalid));
    assert.throws(() => buildExternalAcceptanceCandidateBundleFingerprint(invalid));
  }
  assert.equal(getterCalls, 0);
});

test("candidate bundle dense array policy rejects hidden array material", async () => {
  const bundle = await loadCandidateBundleForTest();
  const sparseReceipts = [...bundle.receipts];
  delete sparseReceipts[1];
  const extraReceipts = [...bundle.receipts];
  extraReceipts.extra = "blocked";
  const symbolReceipts = [...bundle.receipts];
  symbolReceipts[Symbol("blocked")] = "blocked";
  const accessorReceipts = [...bundle.receipts];
  let getterCalls = 0;
  Object.defineProperty(accessorReceipts, "1", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return bundle.receipts[1];
    },
  });

  for (const receipts of [sparseReceipts, extraReceipts, symbolReceipts, accessorReceipts]) {
    assert.throws(() => validateExternalAcceptanceCandidateBundle({ ...bundle, receipts }));
  }
  assert.equal(getterCalls, 0);
});

test("candidate direct validators reject hidden properties and cycles synchronously", async () => {
  const bundle = await loadCandidateBundleForTest();
  const summary = buildExternalAcceptanceCandidateBundleSummary(bundle);
  const descriptor = buildExternalAcceptanceCandidateDescriptor(bundle);
  const cyclicSummary = { ...summary };
  cyclicSummary.self = cyclicSummary;
  const cyclicDescriptor = { ...descriptor };
  cyclicDescriptor.self = cyclicDescriptor;
  const cyclicFixture = structuredClone(bundle.fixtures);
  cyclicFixture[1].content.self = cyclicFixture[1].content;
  const accessorChecklist = { ...bundle.checklist };
  let getterCalls = 0;
  Object.defineProperty(accessorChecklist, "blocked", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "blocked";
    },
  });
  const hiddenAttachment = { ...bundle.attachmentManifest };
  Object.defineProperty(hiddenAttachment, "hidden", {
    enumerable: false,
    value: "blocked",
  });
  const symbolSummary = { ...summary };
  symbolSummary[Symbol("blocked")] = "blocked";
  const symbolDescriptor = { ...descriptor };
  symbolDescriptor[Symbol("blocked")] = "blocked";

  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe(cyclicSummary), /invalid_candidate_bundle_reference_graph/u);
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe(cyclicDescriptor), /invalid_candidate_bundle_reference_graph/u);
  assert.throws(() => validateExternalAcceptanceInteropFixtureBinding(bundle.fixtureManifest, cyclicFixture), /invalid_candidate_bundle_reference_graph/u);
  assert.throws(() => validateExternalAcceptancePreSendChecklist(accessorChecklist, bundle.manifest.candidate_bundle_version), /invalid_candidate_bundle_property/u);
  assert.throws(() => validateProposedExternalSendAttachmentManifest(hiddenAttachment, bundle.manifest.candidate_bundle_version), /invalid_candidate_bundle_property/u);
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe(symbolSummary), /invalid_candidate_bundle_property/u);
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe(symbolDescriptor), /invalid_candidate_bundle_property/u);
  assert.equal(getterCalls, 0);
});

test("candidate README length and disclaimer contracts are enforced", async () => {
  const bundle = await loadCandidateBundleForTest();
  const compactDisclaimer = [
    "not acceptance",
    "not send authorization",
    "not runtime readiness",
    "not production readiness",
    "pending owner action",
    "actual receipt remains none",
    "actual external acceptance remains not started",
    "external send remains not started",
  ].join(" ");
  const paddedReadme = (targetLength) =>
    `${compactDisclaimer} ${"x".repeat(targetLength - compactDisclaimer.length - 1)}`;

  for (const length of [
    MAX_CANDIDATE_BUNDLE_STRING_LENGTH,
    MAX_CANDIDATE_BUNDLE_STRING_LENGTH + 1,
    MAX_CANDIDATE_README_LENGTH,
  ]) {
    assert.doesNotThrow(() =>
      validateExternalAcceptanceCandidateBundle({ ...bundle, readmeText: paddedReadme(length) })
    );
  }
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({
      ...bundle,
      readmeText: paddedReadme(MAX_CANDIDATE_README_LENGTH + 1),
    }),
    /candidate_bundle_string_limit_exceeded/u
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({
      ...bundle,
      manifest: { ...bundle.manifest, source_project: "x".repeat(MAX_CANDIDATE_BUNDLE_STRING_LENGTH + 1) },
    }),
    /candidate_bundle_string_limit_exceeded/u
  );
  assert.doesNotThrow(() =>
    validateExternalAcceptanceCandidateBundle({
      ...bundle,
      readmeText: paddedReadme(MAX_CANDIDATE_BUNDLE_STRING_LENGTH).toUpperCase(),
    })
  );
  assert.doesNotThrow(() =>
    validateExternalAcceptanceCandidateBundle({
      ...bundle,
      readmeText: compactDisclaimer.replaceAll(" ", "\n  "),
    })
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({
      ...bundle,
      readmeText: bundle.readmeText.replace("not acceptance", "accepted"),
    }),
    /invalid_candidate_readme_disclaimer/u
  );
  for (const authorityClaim of [
    "External send is authorized.",
    "Owner send is authorized.",
    "Send authorization has been granted.",
    "Actual receipt exists.",
    "Actual receipt has been received.",
    "External acceptance is complete.",
    "External acceptance has been confirmed.",
    "Runtime readiness is confirmed.",
    "Production readiness is confirmed.",
    "This bundle is ready for production.",
    "EXTERNAL\nSEND   IS   AUTHORIZED.",
  ]) {
    assert.throws(
      () => validateExternalAcceptanceCandidateBundle({
        ...bundle,
        readmeText: `${bundle.readmeText}\n${authorityClaim}`,
      }),
      /invalid_candidate_readme_authority_claim/u
    );
  }
  for (const safePhrase of [
    "do not authorize sending",
    "accepted candidate, if one is provided",
    "external send remains not started",
  ]) {
    assert.doesNotThrow(() =>
      validateExternalAcceptanceCandidateBundle({
        ...bundle,
        readmeText: `${bundle.readmeText}\n${safePhrase}`,
      })
    );
  }
});

test("candidate string policy rejects private paths while preserving relative fixture paths", async () => {
  const bundle = await loadCandidateBundleForTest();
  assert.doesNotThrow(() => validateExternalAcceptanceCandidateBundle(bundle));
  for (const unsafePath of [
    "/home/blocked",
    "/Users/blocked",
    "/private/blocked",
    "/tmp/blocked",
    "/var/blocked",
    "/etc/blocked",
    "/root/blocked",
    "/opt/blocked",
    "/srv/blocked",
    "/mnt/blocked",
    "/Volumes/blocked",
    "C:/blocked",
    "safe note /home/user/file",
    "path=/tmp/private.json",
    "source: /Users/account/file",
    "open(/mnt/private/data)",
    "\"quoted /var/private\"",
    "prefix=/etc/config",
  ]) {
    assert.throws(
      () => validateExternalAcceptanceCandidateBundle({
        ...bundle,
        readmeText: `${bundle.readmeText}\n${unsafePath}`,
      }),
      /unsafe_candidate_bundle_private_path/u
    );
  }
  for (const safeRelativePath of [
    "docs/home/example",
    "test/fixtures/tmp/example.safe.json",
    "relative/Users/example",
    "relative/mnt/example",
    "/health",
    "/v1/adapter/tts",
  ]) {
    assert.doesNotThrow(() =>
      validateExternalAcceptanceCandidateBundle({
        ...bundle,
        readmeText: `${bundle.readmeText}\n${safeRelativePath}`,
      })
    );
  }
});

test("candidate decision scope rejects coercive version values", () => {
  for (const value of [
    { toString: () => "1.8.0" },
    new String("1.8.0"),
    1.8,
    ["1.8.0"],
    null,
    undefined,
  ]) {
    assert.throws(() => buildOwnerExternalSendDecisionScope(value), /invalid_candidate_bundle_version/u);
  }
});

test("candidate bundle manifest and path authorities are exact module-owned contracts", async () => {
  const bundle = await loadCandidateBundleForTest();
  validateExternalAcceptanceCandidateBundle(bundle);
  assert.deepEqual(bundle.manifest.fixture_files, EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES);
  assert.equal(bundle.attachmentManifest.proposed_attachment_paths.includes(EXTERNAL_ACCEPTANCE_CANDIDATE_MANIFEST_PATH), true);
  assert.equal(bundle.attachmentManifest.proposed_attachment_paths.includes(EXTERNAL_ACCEPTANCE_README_PATH), true);
  assert.deepEqual(bundle.manifest.receipt_templates, EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS);
  assert.equal(bundle.manifest.pre_send_checklist_path, EXTERNAL_ACCEPTANCE_PRE_SEND_CHECKLIST_PATH);
  assert.equal(
    bundle.manifest.owner_send_decision_brief_template_path,
    EXTERNAL_ACCEPTANCE_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH
  );
  assert.equal(
    bundle.manifest.proposed_attachment_manifest_path,
    EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_MANIFEST_PATH
  );
  assert.deepEqual(bundle.manifest.forbidden_material_policy, EXTERNAL_ACCEPTANCE_FORBIDDEN_MATERIAL_POLICY);
  assert.deepEqual(bundle.attachmentManifest.proposed_attachment_paths, EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_PATHS);
  assert.deepEqual(bundle.attachmentManifest.forbidden_attachment_classes, EXTERNAL_ACCEPTANCE_FORBIDDEN_ATTACHMENT_CLASSES);

  const invalids = [
    { manifest: { ...bundle.manifest, candidate_bundle_version: "1.8" } },
    { manifest: { ...bundle.manifest, evidence_runner_script: "node scripts/other.mjs" } },
    { manifest: { ...bundle.manifest, failure_matrix_command: "node scripts/other.mjs --matrix" } },
    { manifest: { ...bundle.manifest, receipt_quarantine_capsule_schema: "stale_schema" } },
    { manifest: { ...bundle.manifest, receipt_intake_matrix_required: false } },
    { manifest: { ...bundle.manifest, forbidden_material_policy: [...bundle.manifest.forbidden_material_policy, "extra_policy"] } },
    { manifest: { ...bundle.manifest, forbidden_material_policy: [bundle.manifest.forbidden_material_policy[0], bundle.manifest.forbidden_material_policy[0]] } },
    { manifest: { ...bundle.manifest, fixture_files: [...bundle.manifest.fixture_files, "test/fixtures/interop/extra.safe.json"] } },
    { manifest: { ...bundle.manifest, fixture_files: [bundle.manifest.fixture_files[0], bundle.manifest.fixture_files[0]] } },
  ];
  for (const patch of invalids) {
    assert.throws(() => validateExternalAcceptanceCandidateBundle({ ...bundle, ...patch }));
  }
});

test("candidate receipt, decision, and attachment templates are closed contracts", async () => {
  const bundle = await loadCandidateBundleForTest();
  const version = bundle.manifest.candidate_bundle_version;
  const [irisReceipt, live2dReceipt] = bundle.receipts;

  assert.throws(
    () => validateExternalAcceptanceReceiptTemplate({ ...irisReceipt, recipient_role: "renderer_boundary_owner" }, version),
    /invalid_receipt_template_role/u
  );
  assert.throws(
    () => validateExternalAcceptanceReceiptTemplate({ ...live2dReceipt, recipient_role: "adapter_packet_owner" }, version),
    /invalid_receipt_template_role/u
  );
  assert.throws(
    () => validateExternalAcceptanceReceiptTemplate({ ...irisReceipt, source_main_sha_placeholder: "source_main_sha" }, version),
    /invalid_receipt_template_placeholder/u
  );
  assert.throws(
    () => validateExternalAcceptanceCandidateBundle({
      ...bundle,
      receipts: [{ ...irisReceipt, recipient_project: "IRIS" }, { ...live2dReceipt, recipient_project: "IRIS" }],
    }),
    /invalid_receipt_recipients/u
  );
  assert.throws(
    () => validateOwnerExternalSendDecisionBriefTemplate({ ...bundle.decisionBrief, candidate_bundle_version: "1.9.0" }, version),
    /unsafe_decision_brief_template_status/u
  );
  assert.throws(
    () => validateOwnerExternalSendDecisionBriefTemplate({ ...bundle.decisionBrief, decision_scope: "candidate_bundle_1_8_0" }, version),
    /unsafe_decision_brief_template_status/u
  );
  assert.throws(
    () => validateProposedExternalSendAttachmentManifest({
      ...bundle.attachmentManifest,
      proposed_attachment_paths: [...bundle.attachmentManifest.proposed_attachment_paths, "test/fixtures/extra.safe.json"],
    }, version),
    /invalid_proposed_attachment_paths/u
  );
  assert.throws(
    () => validateProposedExternalSendAttachmentManifest({
      ...bundle.attachmentManifest,
      forbidden_attachment_classes: [...bundle.attachmentManifest.forbidden_attachment_classes, "extra_class"],
    }, version),
    /invalid_forbidden_attachment_classes/u
  );
});

test("candidate fixture manifest and packet alignment reject stale or unsafe fixtures", async () => {
  const bundle = await loadCandidateBundleForTest();
  const [manifestFixture, ttsFixture, subtitleFixture, live2dFixture] = bundle.fixtures;

  const invalids = [
    { fixtureManifest: { ...bundle.fixtureManifest, extra: "blocked" } },
    { fixtureManifest: { ...bundle.fixtureManifest, fixture_version: "1.0" } },
    { fixtureManifest: { ...bundle.fixtureManifest, safe_summary_only: false } },
    { fixtureManifest: { ...bundle.fixtureManifest, fixture_ids: [bundle.fixtureManifest.fixture_ids[0], bundle.fixtureManifest.fixture_ids[0]] } },
    { fixtureManifest: { ...bundle.fixtureManifest, fixture_ids: bundle.fixtureManifest.fixture_ids.slice(1) } },
    { fixtures: [{ ...manifestFixture, content: { ...manifestFixture.content, fixture_version: "1.0.1" } }, ttsFixture, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, path: "test/fixtures/interop/iris-subtitle-packet.safe.json" }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, fixture_id: "wrong_id" } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, adapter_kind: "subtitle" } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, adapter_validation_required: false } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, endpoint: "blocked" } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, note: "http://blocked.invalid" } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, private_path: "C:/blocked" } }, subtitleFixture, live2dFixture] },
    { fixtures: [manifestFixture, { ...ttsFixture, content: { ...ttsFixture.content, token: "blocked" } }, subtitleFixture, live2dFixture] },
  ];
  for (const patch of invalids) {
    assert.throws(() => validateExternalAcceptanceCandidateBundle({ ...bundle, ...patch }));
  }
});

test("candidate summary and descriptor assertions reject unsafe public evidence", async () => {
  const bundle = await loadCandidateBundleForTest();
  const summary = buildExternalAcceptanceCandidateBundleSummary(bundle);
  const descriptor = buildExternalAcceptanceCandidateDescriptor(bundle);

  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, status: "fail" }));
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, candidate_bundle_version: "1.8" }));
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, public_metrics_endpoint_present: true }));
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, runtime_readiness_claimed: true }));
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, candidate_bundle_fingerprint: "x".repeat(64) }));
  assert.throws(() => assertExternalAcceptanceCandidateBundleSummarySafe({ ...summary, url: "blocked" }));
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe({ ...descriptor, status: "fail" }));
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe({ ...descriptor, candidate_bundle_version: "1.8" }));
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe({ ...descriptor, recipient_projects: ["LIVE2D", "IRIS"] }));
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe({ ...descriptor, runtime_source_head_sha: "z".repeat(40) }));
  assert.throws(() => assertExternalAcceptanceCandidateDescriptorSafe({ ...descriptor, runtime_readiness_claimed: true }));
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

  const changedFixtureManifest = {
    ...bundle.fixtureManifest,
    fixture_version: "1.0.1",
  };
  for (const changed of [
    { manifest: { ...bundle.manifest, source_main_sha: "1".repeat(40) } },
    { readmeText: `${bundle.readmeText}\nSafe candidate bundle note.\n` },
    {
      fixtureManifest: changedFixtureManifest,
      fixtures: bundle.fixtures.map((fixture) =>
        fixture.path.endsWith("voxweave-interop-manifest.safe.json")
          ? { ...fixture, content: structuredClone(changedFixtureManifest) }
          : fixture
      ),
    },
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
  assert.equal(source.includes("const EXPECTED_FIXTURE_FILES"), false);
  assert.equal(source.includes("EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES"), true);
  for (const forbidden of [
    "voxweave-external-acceptance-candidate.manifest.safe.json",
    "iris-team-receipt-template.safe.json",
    "live2d-team-receipt-template.safe.json",
    "README.safe.md",
    "owner-pre-send-checklist.safe.json",
    "owner-external-send-decision-brief-template.safe.json",
    "proposed-external-send-attachment-manifest.safe.json",
    "iris-tts-packet.safe.json",
    "iris-subtitle-packet.safe.json",
    "iris-live2d-packet.safe.json",
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
});

test("candidate bundle module does not retain stale script or receipt policy copies", async () => {
  const source = await readFile(new URL("../src/externalAcceptanceCandidateBundle.js", import.meta.url), "utf8");
  for (const forbidden of [
    "scanExternalAcceptanceReceiptSafe",
    "EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS",
    "ALLOWED_RECEIPT_SOURCE_KINDS",
    "RECEIPT_DRY_RUN_FIXTURE_BASE",
    "EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES",
    "candidate_bundle_1_8_0_external_send_decision_only",
    "node:fs",
    "node:http",
    "node:child_process",
    "process.env",
    "fetch(",
    "console.",
    "../scripts/",
    "../test/",
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
  assert.equal(source.includes("VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA"), true);
  assert.equal(source.includes("voxweave_external_acceptance_receipt_quarantine_capsule_v1"), false);
  for (const forbidden of [
    "function validateExternalAcceptanceCandidateBundle({",
    "function buildExternalAcceptanceCandidateBundleFingerprint({",
    "function buildExternalAcceptanceCandidateBundleSummary({",
    "function buildExternalAcceptanceCandidateDescriptor({",
    "function scanCandidateBundleSafe",
    "Object.entries(item)",
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
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
