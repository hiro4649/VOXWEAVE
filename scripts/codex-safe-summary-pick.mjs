#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.2

import fs from 'node:fs';
import path from 'node:path';
import { pickSafeSummary } from './codex-v112-conversation-surface.mjs';

const filePath = process.argv[2] || '';
const report = filePath && fs.existsSync(filePath)
  ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
  : {};
const summary = pickSafeSummary(report, { safeArtifactPath: filePath });
function findRemoteNpmFailurePath(safeArtifactPath) {
  if (!safeArtifactPath) return '';
  const dir = path.dirname(safeArtifactPath);
  const candidates = [
    path.join(dir, 'codex-remote-npm-failure.safe.json'),
    path.join(dir, '_temp', 'codex-remote-npm-failure.safe.json'),
    path.join(process.cwd(), 'codex-remote-npm-failure.safe.json'),
    path.join(process.cwd(), '_temp', 'codex-remote-npm-failure.safe.json'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}
const remoteNpmFailurePath = findRemoteNpmFailurePath(filePath);
if (remoteNpmFailurePath && fs.existsSync(remoteNpmFailurePath)) {
  const artifact = JSON.parse(fs.readFileSync(remoteNpmFailurePath, 'utf8'));
  summary.remoteNpmFailure = {
    primaryClass: artifact.primaryClass || 'product_test_failure_safe_summary_missing',
    failureClass: artifact.failureClass || 'unknown',
    timedOut: artifact.timedOut === true,
    timeoutClass: artifact.timeoutClass || '',
    timeoutMs: Number.isFinite(Number(artifact.timeoutMs)) ? Number(artifact.timeoutMs) : 0,
    elapsedMs: Number.isFinite(Number(artifact.elapsedMs)) ? Number(artifact.elapsedMs) : 0,
    partialSummaryAvailable: artifact.partialSummaryAvailable === true,
    safeDetailUnavailable: artifact.safeDetailUnavailable === true,
    rawOutputPrinted: artifact.rawOutputPrinted === false ? false : true,
    rawStackOmitted: artifact.rawStackOmitted === true,
    githubJobLogsRead: artifact.githubJobLogsRead === true,
    operatorRawLogsRead: artifact.operatorRawLogsRead === true,
    safeSummaryOnly: true,
  };
}
console.log(JSON.stringify(summary, null, 2));
