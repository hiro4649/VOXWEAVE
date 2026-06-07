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
const remoteNpmFailurePath = filePath
  ? path.join(path.dirname(filePath), 'codex-remote-npm-failure.safe.json')
  : '';
if (remoteNpmFailurePath && fs.existsSync(remoteNpmFailurePath)) {
  const artifact = JSON.parse(fs.readFileSync(remoteNpmFailurePath, 'utf8'));
  summary.remoteNpmFailure = {
    primaryClass: artifact.primaryClass || 'product_test_failure_safe_summary_missing',
    failureClass: artifact.failureClass || 'unknown',
    safeDetailUnavailable: artifact.safeDetailUnavailable === true,
    rawOutputPrinted: artifact.rawOutputPrinted === false ? false : true,
    rawStackOmitted: artifact.rawStackOmitted === true,
    githubJobLogsRead: artifact.githubJobLogsRead === true,
    operatorRawLogsRead: artifact.operatorRawLogsRead === true,
    safeSummaryOnly: true,
  };
}
console.log(JSON.stringify(summary, null, 2));
