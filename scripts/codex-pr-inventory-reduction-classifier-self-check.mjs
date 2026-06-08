import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPrInventoryReductionSafeSummary,
  classifyMainReflectionCandidate,
  classifyPrEvidenceClass,
  classifyPrInventoryAction,
  classifyStackedDependency,
} from "./codex-pr-inventory-reduction-classifier.mjs";

let checkedCases = 0;

function check(name, fn) {
  fn();
  checkedCases += 1;
}

function assertNoMutationFlags(result) {
  assert.equal(result.closesPr ?? false, false);
  assert.equal(result.mergesPr ?? false, false);
  assert.equal(result.modifiesExistingPr ?? false, false);
  assert.equal(result.requestsReview ?? false, false);
  assert.equal(result.rerunsChecks ?? false, false);
  assert.equal(result.commentsOnPr ?? false, false);
}

const evidenceCases = [
  ["docs-only evidence", { purpose: "docs-only migration plan" }, "docs_only_evidence"],
  ["candidate branch evidence", { purpose: "implementation candidate branch behavior" }, "candidate_branch_behavior_evidence"],
  ["same-head review evidence", { purpose: "same-head focused review" }, "same_head_review_evidence"],
  ["QG success only", { qgSuccess: true }, "qg_evidence_only"],
  ["acceptance audit", { purpose: "acceptance audit" }, "acceptance_audit_evidence"],
  ["compatibility review", { purpose: "compatibility review evidence" }, "compatibility_review_evidence"],
  ["scope decision", { purpose: "main reflection scope decision" }, "scope_decision_evidence"],
  ["package readiness", { purpose: "package readiness plan" }, "package_readiness_evidence"],
  ["main evidence guarded", { evidenceClass: "main_evidence", mainReflected: false }, "main_evidence"],
  ["target branch evidence guarded", { evidenceClass: "target_branch_evidence", targetBranchModified: false }, "target_branch_evidence"],
];

for (const [name, input, expected] of evidenceCases) {
  check(`evidence class: ${name}`, () => {
    const result = classifyPrEvidenceClass(input);
    assert.equal(result.evidenceClassStatus, expected);
    assert.equal(result.safe_summary_only, true);
  });
}

check("docs-only evidence is not merge evidence", () => {
  const result = classifyPrEvidenceClass({ purpose: "docs-only acceptance plan" });
  assert.equal(result.docsOnlyEvidence, true);
  assert.equal(result.mergeEvidence, false);
});

check("candidate branch evidence is not main evidence", () => {
  const result = classifyPrEvidenceClass({ purpose: "candidate branch behavior evidence" });
  assert.equal(result.candidateBranchEvidence, true);
  assert.equal(result.mainEvidence, false);
});

check("QG success alone is not merge evidence", () => {
  const result = classifyPrEvidenceClass({ qgSuccess: true });
  assert.equal(result.evidenceClassStatus, "qg_evidence_only");
  assert.equal(result.mergeEvidence, false);
  assert.equal(result.qgSuccessAloneGrantsMerge, false);
});

check("acceptance audit is not runtime evidence", () => {
  const result = classifyPrEvidenceClass({ purpose: "acceptance audit" });
  assert.equal(result.evidenceClassStatus, "acceptance_audit_evidence");
  assert.equal(result.runtimeEvidence, false);
});

check("compatibility review is not main evidence", () => {
  const result = classifyPrEvidenceClass({ purpose: "compatibility review" });
  assert.equal(result.evidenceClassStatus, "compatibility_review_evidence");
  assert.equal(result.mainEvidence, false);
});

check("scope decision does not grant actual reflection", () => {
  const result = classifyPrEvidenceClass({ purpose: "scope decision", explicitExecutionScope: false });
  assert.equal(result.evidenceClassStatus, "scope_decision_evidence");
  assert.equal(result.actualReflectionGranted, false);
});

check("package readiness is not execution", () => {
  const result = classifyPrEvidenceClass({ purpose: "package readiness", packageExecuted: false });
  assert.equal(result.evidenceClassStatus, "package_readiness_evidence");
  assert.equal(result.packageExecutionGranted, false);
});

const actionCases = [
  ["PR #89-like root", { purpose: "PR #89 standalone utility root", dependencyRoot: true }, "dependency_root"],
  ["PR #92-like stacked", { purpose: "PR #92 stacked diagnostic candidate", dependsOn: "PR #89" }, "dependent_stacked_candidate"],
  ["PR #101-like normalization", { purpose: "PR #101 normalization candidate", acceptanceEvidence: true, compatibilityEvidence: true }, "main_reflection_package_candidate"],
  ["PR #112-like failed", { purpose: "PR #112 failed candidate", qgStatus: "FAILURE" }, "blocked_by_qg"],
  ["PR #121-like audit", { purpose: "PR #121 full audit docs-only", evidenceClass: "docs_only_evidence" }, "preserve_only"],
  ["terminal no action", { purpose: "trigger status none terminal no action" }, "terminal_no_action"],
  ["TTS candidate docs absorbed", { purpose: "PR #84 TTS candidate docs", explicitRuntimeScope: false }, "absorbed_by_registry"],
  ["high docs pressure", { purpose: "docs-only plan", highDocsPressure: true, reducesBlocker: false }, "absorbed_by_registry"],
  ["review blocked", { purpose: "candidate", reviewEvidenceStatus: "missing" }, "blocked_by_review"],
  ["superseded", { purpose: "old docs", superseded: true }, "superseded"],
  ["close candidate", { purpose: "obsolete pr", closeCandidate: true }, "close_candidate"],
  ["governance scope", { purpose: "needs governance", needsGovernanceScope: true }, "needs_governance_scope"],
  ["main reflection scope", { purpose: "main reflection", needsExplicitMainReflectionScope: true }, "needs_explicit_main_reflection_scope"],
  ["runtime scope", { purpose: "runtime return", needsExplicitRuntimeScope: true }, "needs_explicit_runtime_scope"],
];

for (const [name, input, expected] of actionCases) {
  check(`inventory action: ${name}`, () => {
    const result = classifyPrInventoryAction(input);
    assert.equal(result.inventoryActionStatus, expected);
    assertNoMutationFlags(result);
    assert.equal(result.safe_summary_only, true);
  });
}

check("PR #121-like audit preserve-only or registry source", () => {
  const result = classifyPrInventoryAction({ purpose: "PR #121 audit evidence registry source", evidenceClass: "docs_only_evidence" });
  assert.equal(["preserve_only", "absorbed_by_registry"].includes(result.inventoryActionStatus), true);
});

check("terminal no-action has all mutation flags false", () => {
  const result = classifyPrInventoryAction({ purpose: "terminal no action trigger status none" });
  assert.equal(result.inventoryActionStatus, "terminal_no_action");
  assertNoMutationFlags(result);
});

check("high docs pressure blocks additional docs-only non-reducing PR", () => {
  const result = classifyPrInventoryAction({ purpose: "docs-only audit", highDocsPressure: true, reducesBlocker: false });
  assert.equal(result.inventoryActionStatus, "absorbed_by_registry");
});

const stackCases = [
  [{ pr: 92, dependsOn: "PR #89", mainReflected: false }, "stacked_on_dependency", false],
  [{ pr: 89, dependsOn: "", mainReflected: true, standaloneMainReady: true }, "no_dependency_declared", true],
  [{ pr: 61, dependsOn: "PR #53", qgStatus: "success", reviewEvidenceStatus: "missing" }, "stacked_on_dependency", false],
  [{ pr: 74, dependsOn: "PR #53", qgStatus: "failure" }, "stacked_on_dependency", false],
];

for (const [input, status, mainReady] of stackCases) {
  check(`stacked dependency ${input.pr}`, () => {
    const result = classifyStackedDependency(input);
    assert.equal(result.stackedDependencyStatus, status);
    assert.equal(result.standaloneMainReady, mainReady);
    assert.equal(result.safe_summary_only, true);
  });
}

check("explicit main reflection scope missing blocks reflection", () => {
  const result = classifyMainReflectionCandidate({
    sameHeadQGSuccess: true,
    reviewEvidence: true,
    acceptanceEvidence: true,
    runtimeConnected: false,
    workflowPackageChanged: false,
    targetBranchImpactReviewed: true,
    rollbackPreserveStrategy: true,
    explicitMainReflectionScope: false,
  });
  assert.equal(result.mainReflectionAllowed, false);
  assert.equal(result.reason, "explicit_scope_missing");
});

check("runtime evidence missing blocks runtime", () => {
  const result = classifyMainReflectionCandidate({ explicitMainReflectionScope: false });
  assert.equal(result.runtimeAllowed, false);
});

check("merge evidence missing blocks merge", () => {
  const result = classifyMainReflectionCandidate({ explicitMainReflectionScope: true });
  assert.equal(result.mergeAllowed, false);
});

check("all main reflection candidate requirements present still does not merge", () => {
  const result = classifyMainReflectionCandidate({
    sameHeadQGSuccess: true,
    reviewEvidence: true,
    acceptanceEvidence: true,
    runtimeConnected: false,
    workflowPackageChanged: false,
    targetBranchImpactReviewed: true,
    rollbackPreserveStrategy: true,
    explicitMainReflectionScope: true,
  });
  assert.equal(result.mainReflectionAllowed, true);
  assert.equal(result.mergeAllowed, false);
  assert.equal(result.runtimeAllowed, false);
});

const generatedInputs = [];
for (let index = 0; index < 150; index += 1) {
  generatedInputs.push({
    purpose: index % 5 === 0
      ? "docs-only candidate docs"
      : index % 5 === 1
        ? "candidate branch behavior"
        : index % 5 === 2
          ? "acceptance audit"
          : index % 5 === 3
            ? "scope decision"
            : "package readiness",
    qgStatus: index % 7 === 0 ? "failure" : "success",
    highDocsPressure: index % 11 === 0,
    reducesBlocker: index % 13 === 0,
  });
}

for (const [index, input] of generatedInputs.entries()) {
  check(`generated evidence/action fixture ${index}`, () => {
    const evidence = classifyPrEvidenceClass(input);
    const action = classifyPrInventoryAction(input);
    assert.equal(evidence.safe_summary_only, true);
    assert.equal(action.safe_summary_only, true);
    assertNoMutationFlags(action);
  });
}

check("safe summary is count-only", () => {
  const summary = buildPrInventoryReductionSafeSummary({ items: generatedInputs });
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.item_count, generatedInputs.length);
  assert.equal(summary.raw_pr_body_included, false);
  assert.equal(summary.raw_comments_included, false);
  assert.equal(summary.raw_reviewer_names_included, false);
});

check("safe summary excludes secrets endpoints and tokens", () => {
  const summary = buildPrInventoryReductionSafeSummary({ items: generatedInputs });
  const serialized = JSON.stringify(summary);
  assert.equal(summary.secrets_included, false);
  assert.equal(summary.endpoints_included, false);
  assert.equal(summary.tokens_included, false);
  assert.equal(serialized.includes("api_key"), false);
  assert.equal(serialized.includes("https://"), false);
});

const classifierText = readFileSync("scripts/codex-pr-inventory-reduction-classifier.mjs", "utf8");
const selfCheckText = readFileSync("scripts/codex-pr-inventory-reduction-classifier-self-check.mjs", "utf8");
for (const forbidden of [
  "scripts/codex-local-quality-gate.mjs",
  ".github/workflows",
  "gh pr review",
  "gh pr comment",
  "gh run rerun",
  "fetch(",
  "axios",
  "createServer",
  "spawn(",
  "exec(",
]) {
  check(`no forbidden runtime or mutation string in classifier: ${forbidden}`, () => {
    assert.equal(classifierText.includes(forbidden), false);
  });
}

for (const forbiddenImport of ["node:http", "node:https", "node:child_process", "child_process"]) {
  check(`self-check does not import runtime or process helper: ${forbiddenImport}`, () => {
    assert.equal(selfCheckText.includes(`from "${forbiddenImport}"`), false);
    assert.equal(selfCheckText.includes(`from '${forbiddenImport}'`), false);
  });
}

const report = {
  status: "pass",
  checked_cases: checkedCases,
  pr_inventory_reduction_classifier: true,
  evidence_class_classifier: true,
  stacked_dependency_classifier: true,
  main_reflection_candidate_classifier: true,
  safe_summary_only: true,
  runtime_connected: false,
  active_qg_connected: false,
  workflow_changed: false,
  package_changed: false,
  review_request_performed: false,
  rerun_performed: false,
  comment_created: false,
  runtime_readiness_claimed: false,
  merge_readiness: false,
};

assert.equal(checkedCases >= 180, true);
console.log(JSON.stringify(report, null, 2));
