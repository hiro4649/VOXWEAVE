#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.3

import assert from 'node:assert/strict';
import { buildStalePrAuditReport } from './codex-stale-pr-audit-gate.mjs';
import { classifyStaleAuditFreshness } from './codex-stale-audit-freshness-classifier.mjs';

function checkClassifierStandalone() {
  const current = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const stale = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const result = classifyStaleAuditFreshness({
    currentHeadSha: current,
    livePrBody: `Head SHA: ${current}`,
    eventPrBody: `Head SHA: ${stale}`,
    safeArtifactHeadSha: stale,
    staleAuditReasonCodes: ['stale_confirmation_detected', 'stale_evidence'],
  });

  assert.equal(result.staleAuditInputStatus, 'external_or_harness_input_blocked');
  assert.equal(result.staleConfirmationOwnerStatus, 'event_payload_or_safe_artifact_input');
  assert.equal(result.rerunUsesStaleEventPayloadStatus, 'suspected');
  assert.equal(result.safeSummaryOnly, true);
}

function checkStaleAuditReportConnectionKeepsFail() {
  const current = 'cccccccccccccccccccccccccccccccccccccccc';
  const stale = 'dddddddddddddddddddddddddddddddddddddddd';
  const report = buildStalePrAuditReport({
    CODEX_EVENT_NAME: 'pull_request',
    CODEX_PR_HEAD_SHA: current,
    CODEX_PR_BODY: `Head SHA: ${stale}`,
    CODEX_LIVE_PR_BODY: `Head SHA: ${current}`,
    CODEX_SAFE_ARTIFACT_HEAD_SHA: stale,
  });
  const status = report.stalePrAuditStatus;

  assert.equal(status.status, 'fail');
  assert.equal(status.reasonCodes.includes('stale_confirmation_detected'), true);
  assert.equal(status.reasonCodes.includes('stale_evidence'), true);
  assert.equal(status.freshnessClassification.staleAuditInputStatus, 'external_or_harness_input_blocked');
  assert.equal(status.freshnessClassification.prBodyLiveFetchStatus, 'pass');
  assert.equal(status.freshnessClassification.safeArtifactHeadMatchStatus, 'fail');
}

function checkRawInputNotExposed() {
  const current = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  const report = buildStalePrAuditReport({
    CODEX_EVENT_NAME: 'pull_request',
    CODEX_PR_HEAD_SHA: current,
    CODEX_PR_BODY: `Head SHA: ${current}\nraw sensitive body`,
    CODEX_LIVE_PR_BODY: `Head SHA: ${current}\nraw artifact body`,
    CODEX_SAFE_ARTIFACT_HEAD_SHA: current,
  });
  const serialized = JSON.stringify(report);

  assert.equal(serialized.includes('raw sensitive body'), false);
  assert.equal(serialized.includes('raw artifact body'), false);
  assert.equal(report.stalePrAuditStatus.freshnessClassification.safeSummaryOnly, true);
}

checkClassifierStandalone();
checkStaleAuditReportConnectionKeepsFail();
checkRawInputNotExposed();

process.stdout.write('stale audit freshness integration self-check: pass\n');
