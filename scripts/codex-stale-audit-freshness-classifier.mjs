#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.2

import { fileURLToPath } from "node:url";

const SHA_RE = /\b[a-f0-9]{40}\b/iu;

function normalizeSha(value) {
  const match = String(value || "").match(SHA_RE);
  return match ? match[0].toLowerCase() : "";
}

function extractHeadValuesFromText(text) {
  const values = [];
  const body = String(text || "");
  for (const match of body.matchAll(/"headSha"\s*:\s*"([a-f0-9]{40})"/giu)) values.push(match[1]);
  for (const match of body.matchAll(/\bhead SHA\s*:\s*([a-f0-9]{40})/giu)) values.push(match[1]);
  return [...new Set(values.map(normalizeSha).filter(Boolean))];
}

function includesHead(values, headSha) {
  return Boolean(headSha) && values.includes(headSha);
}

function statusForHead(values, headSha) {
  if (!headSha) return "unknown";
  if (!values.length) return "missing";
  return includesHead(values, headSha) ? "pass" : "fail";
}

function safeOwner({ liveStatus, artifactStatus, eventDiffStatus, staleAuditReasonCodes }) {
  const hasStaleReason = staleAuditReasonCodes.includes("stale_confirmation_detected")
    || staleAuditReasonCodes.includes("stale_evidence");
  if (!hasStaleReason) return "not_applicable";
  if (liveStatus === "pass" && (artifactStatus !== "pass" || eventDiffStatus === "mismatch")) {
    return "event_payload_or_safe_artifact_input";
  }
  if (liveStatus === "fail") return "pr_body";
  if (artifactStatus === "fail") return "safe_artifact_input";
  return "stale_audit_input_selection";
}

export function classifyStaleAuditFreshness(input = {}) {
  const currentHead = normalizeSha(input.currentHeadSha);
  const liveValues = extractHeadValuesFromText(input.livePrBody);
  const eventValues = extractHeadValuesFromText(input.eventPrBody);
  const artifactValues = [
    input.safeArtifactHeadSha,
    input.evidencePackHeadSha,
    input.manualConfirmationHeadSha,
  ].map(normalizeSha).filter(Boolean);
  const staleAuditReasonCodes = Array.isArray(input.staleAuditReasonCodes)
    ? input.staleAuditReasonCodes.map(String)
    : [];

  const prBodyLiveFetchStatus = statusForHead(liveValues, currentHead);
  const eventPayloadVsLivePrBodyDiffStatus = eventValues.length && liveValues.length
    && eventValues.join(",") !== liveValues.join(",")
    ? "mismatch"
    : "not_detected";
  const githubEventPayloadFreshnessStatus = eventValues.length
    ? statusForHead(eventValues, currentHead) === "pass" ? "pass" : "stale_or_unknown"
    : "unknown";
  const safeArtifactHeadMatchStatus = artifactValues.length
    ? statusForHead(artifactValues, currentHead)
    : "unknown";
  const safeArtifactFreshnessStatus = safeArtifactHeadMatchStatus === "pass" ? "pass" : "stale_or_unknown";
  const rerunUsesStaleEventPayloadStatus = eventPayloadVsLivePrBodyDiffStatus === "mismatch"
    && githubEventPayloadFreshnessStatus !== "pass"
    ? "suspected"
    : "not_detected";
  const ownerInput = {
    liveStatus: prBodyLiveFetchStatus,
    artifactStatus: safeArtifactHeadMatchStatus,
    eventDiffStatus: eventPayloadVsLivePrBodyDiffStatus,
    staleAuditReasonCodes,
  };
  const staleConfirmationOwnerStatus = safeOwner(ownerInput);
  const staleEvidenceOwnerStatus = safeOwner(ownerInput);
  const staleAuditInputStatus = staleConfirmationOwnerStatus === "pr_body"
    ? "pr_body_blocked"
    : staleConfirmationOwnerStatus === "not_applicable"
      ? "pass"
      : "external_or_harness_input_blocked";

  return {
    schema: "codex_stale_audit_freshness_classifier_v1",
    staleAuditInputStatus,
    githubEventPayloadFreshnessStatus,
    prBodyLiveFetchStatus,
    safeArtifactHeadMatchStatus,
    safeArtifactFreshnessStatus,
    eventPayloadVsLivePrBodyDiffStatus,
    rerunUsesStaleEventPayloadStatus,
    staleConfirmationOwnerStatus,
    staleEvidenceOwnerStatus,
    mergeReadiness: "no",
    safeNextAction: "Investigate stale audit input freshness without changing PR #5.",
    codexActionAllowed: "classify_stale_audit_freshness_with_safe_summary_only",
    userManualWorkAvoided: true,
    blockedByExternalState: staleAuditInputStatus !== "pass",
    developmentMode: "5.5-low",
    safeSummaryOnly: true,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = classifyStaleAuditFreshness({
    currentHeadSha: process.env.CODEX_PR_HEAD_SHA || process.env.GITHUB_SHA || "",
    livePrBody: process.env.CODEX_LIVE_PR_BODY || "",
    eventPrBody: process.env.CODEX_EVENT_PR_BODY || process.env.CODEX_PR_BODY || "",
    safeArtifactHeadSha: process.env.CODEX_SAFE_ARTIFACT_HEAD_SHA || "",
    evidencePackHeadSha: process.env.CODEX_EVIDENCE_PACK_HEAD_SHA || "",
    manualConfirmationHeadSha: process.env.CODEX_MANUAL_CONFIRMATION_HEAD_SHA || "",
    staleAuditReasonCodes: String(process.env.CODEX_STALE_AUDIT_REASON_CODES || "")
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
