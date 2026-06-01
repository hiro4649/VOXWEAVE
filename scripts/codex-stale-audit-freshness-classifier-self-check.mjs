#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.2

import assert from "node:assert/strict";
import { classifyStaleAuditFreshness } from "./codex-stale-audit-freshness-classifier.mjs";

function checkEventPayloadOrArtifactStale() {
  const current = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const stale = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const result = classifyStaleAuditFreshness({
    currentHeadSha: current,
    livePrBody: `Head SHA: ${current}`,
    eventPrBody: `Head SHA: ${stale}`,
    safeArtifactHeadSha: stale,
    staleAuditReasonCodes: ["stale_confirmation_detected", "stale_evidence"],
  });

  assert.equal(result.staleAuditInputStatus, "external_or_harness_input_blocked");
  assert.equal(result.staleConfirmationOwnerStatus, "event_payload_or_safe_artifact_input");
  assert.equal(result.rerunUsesStaleEventPayloadStatus, "suspected");
}

function checkPrBodyStale() {
  const current = "cccccccccccccccccccccccccccccccccccccccc";
  const stale = "dddddddddddddddddddddddddddddddddddddddd";
  const result = classifyStaleAuditFreshness({
    currentHeadSha: current,
    livePrBody: `Head SHA: ${stale}`,
    eventPrBody: `Head SHA: ${stale}`,
    safeArtifactHeadSha: current,
    staleAuditReasonCodes: ["stale_confirmation_detected"],
  });

  assert.equal(result.staleAuditInputStatus, "pr_body_blocked");
  assert.equal(result.staleConfirmationOwnerStatus, "pr_body");
}

function checkRawInputNotExposed() {
  const current = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const result = classifyStaleAuditFreshness({
    currentHeadSha: current,
    livePrBody: `Head SHA: ${current}\nraw sensitive body`,
    eventPrBody: `Head SHA: ${current}\nraw artifact text`,
    safeArtifactHeadSha: current,
    staleAuditReasonCodes: [],
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.safeSummaryOnly, true);
  assert.equal(serialized.includes("raw sensitive body"), false);
  assert.equal(serialized.includes("raw artifact text"), false);
}

checkEventPayloadOrArtifactStale();
checkPrBodyStale();
checkRawInputNotExposed();

process.stdout.write("stale audit freshness classifier self-check: pass\n");
