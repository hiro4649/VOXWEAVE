#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.4

import assert from 'node:assert/strict';
import { buildRemoteDiagnosticSafeMetadataDiagnosticStatus } from './codex-remote-diagnostic-safe-metadata-adapter.mjs';

const SAFE_STATUS_LABELS = new Set([
  'pass',
  'fail',
  'warning',
  'not_run',
  'unknown',
  'manual_confirmation_required',
  'blocked',
  'skipped',
  'completed',
  'success',
  'failure',
  'neutral',
  'not_available',
  'available',
]);

const URL_LIKE_STATUS = 'https' + '://' + 'example.invalid/status';
const URL_LIKE_VALUE = 'https' + '://' + 'example.invalid/secret-value';
const TOKEN_LIKE_STATUS = 'token' + '=abc123';
const SECRET_LIKE_STATUS = 'secret' + '=abc123';
const LOCAL_PATH_LIKE_STATUS = 'C:' + '/Users/example/private-path';
const RAW_REASON_LIKE = 'https' + '://' + 'example.invalid/raw-reason';

const cases = [
  {
    name: 'absent safe metadata returns not available without effect',
    input: {},
    expectedStatus: 'not_available_without_effect',
  },
  {
    name: 'safe pass metadata returns available without effect',
    input: {
      remoteNpmDiagnosticStatus: { status: 'pass', reasonCodes: [], safeSummaryOnly: true },
      safeArtifactIndexStatus: { status: 'success', safeSummaryOnly: true },
    },
    expectedStatus: 'available_without_effect',
  },
  {
    name: 'not run metadata returns unknown without effect',
    input: {
      remoteNpmDiagnosticStatus: { status: 'not_run', safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
  },
  {
    name: 'manual confirmation metadata returns unknown without effect',
    input: {
      remoteNpmDiagnosticStatus: { status: 'manual_confirmation_required', safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
  },
  {
    name: 'safeSummaryOnly false returns unknown without effect',
    input: {
      diagnosticConsolidationStatus: { status: 'pass', safeSummaryOnly: false },
    },
    expectedStatus: 'unknown_without_effect',
  },
  {
    name: 'raw-like key returns unknown and does not echo key value',
    input: {
      remoteNpmDiagnosticStatus: { status: 'pass', safeSummaryOnly: true },
      rawLogs: [URL_LIKE_VALUE],
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [URL_LIKE_VALUE],
  },
  {
    name: 'status containing URL is redacted',
    input: {
      remoteNpmDiagnosticStatus: { status: URL_LIKE_STATUS, safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [URL_LIKE_STATUS],
  },
  {
    name: 'status containing token-like value is redacted',
    input: {
      remoteNpmDiagnosticStatus: { status: TOKEN_LIKE_STATUS, safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [TOKEN_LIKE_STATUS],
  },
  {
    name: 'status containing secret-like value is redacted',
    input: {
      remoteNpmDiagnosticStatus: { status: SECRET_LIKE_STATUS, safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [SECRET_LIKE_STATUS],
  },
  {
    name: 'status containing local path is redacted',
    input: {
      remoteNpmDiagnosticStatus: { status: LOCAL_PATH_LIKE_STATUS, safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [LOCAL_PATH_LIKE_STATUS],
  },
  {
    name: 'unrecognized arbitrary status is redacted',
    input: {
      remoteNpmDiagnosticStatus: { status: 'surprising_state_value', safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: ['surprising_state_value'],
  },
  {
    name: 'reason code raw-like value is not emitted',
    input: {
      remoteNpmDiagnosticStatus: {
        status: 'pass',
        reasonCodes: ['safe_reason', RAW_REASON_LIKE],
        safeSummaryOnly: true,
      },
    },
    expectedStatus: 'unknown_without_effect',
    forbiddenOutput: [RAW_REASON_LIKE],
  },
  {
    name: 'observedStatuses contains only allowlisted labels',
    input: {
      remoteNpmDiagnosticStatus: { status: 'completed', safeSummaryOnly: true },
      safeArtifactIndexStatus: { status: 'neutral', safeSummaryOnly: true },
    },
    expectedStatus: 'available_without_effect',
  },
];

for (const testCase of cases) {
  const result = buildRemoteDiagnosticSafeMetadataDiagnosticStatus(testCase.input);
  assert.equal(result.status, testCase.expectedStatus, testCase.name);
  assert.equal(result.diagnosticOnly, true, testCase.name);
  assert.equal(result.nonBlocking, true, testCase.name);
  assert.equal(result.effect, 'none', testCase.name);
  assert.equal(result.safeSummaryOnly, true, testCase.name);
  for (const value of Object.values(result.observedStatuses || {})) {
    assert.equal(SAFE_STATUS_LABELS.has(value), true, `${testCase.name}: observed status allowlist`);
  }
  const serialized = JSON.stringify(result);
  for (const forbidden of testCase.forbiddenOutput || []) {
    assert.equal(serialized.includes(forbidden), false, `${testCase.name}: forbidden output redacted`);
  }
}

console.log(`remoteDiagnosticSafeMetadataAdapterSelfCheckStatus: pass`);
console.log(`checkedCases: ${cases.length}`);
