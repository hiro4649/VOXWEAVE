#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.4

import assert from 'node:assert/strict';
import { buildRemoteDiagnosticSafeMetadataDiagnosticStatus } from './codex-remote-diagnostic-safe-metadata-adapter.mjs';

const cases = [
  {
    name: 'absent safe metadata is neutral',
    input: {},
    expectedStatus: 'not_available_without_effect',
  },
  {
    name: 'safe metadata is available without effect',
    input: {
      remoteNpmDiagnosticStatus: { status: 'pass', reasonCodes: [], safeSummaryOnly: true },
      safeArtifactIndexStatus: { status: 'pass', safeSummaryOnly: true },
    },
    expectedStatus: 'available_without_effect',
  },
  {
    name: 'not run safe metadata is uncertain without effect',
    input: {
      remoteNpmDiagnosticStatus: { status: 'not_run', safeSummaryOnly: true },
    },
    expectedStatus: 'unknown_without_effect',
  },
  {
    name: 'raw-like key is redacted into neutral unknown',
    input: {
      remoteNpmDiagnosticStatus: { status: 'pass', safeSummaryOnly: true },
      rawLogs: ['not emitted'],
    },
    expectedStatus: 'unknown_without_effect',
  },
  {
    name: 'unsafe source is neutral unknown',
    input: {
      diagnosticConsolidationStatus: { status: 'pass', safeSummaryOnly: false },
    },
    expectedStatus: 'unknown_without_effect',
  },
];

for (const testCase of cases) {
  const result = buildRemoteDiagnosticSafeMetadataDiagnosticStatus(testCase.input);
  assert.equal(result.status, testCase.expectedStatus, testCase.name);
  assert.equal(result.diagnosticOnly, true, testCase.name);
  assert.equal(result.nonBlocking, true, testCase.name);
  assert.equal(result.effect, 'none', testCase.name);
  assert.equal(result.safeSummaryOnly, true, testCase.name);
}

console.log(`remoteDiagnosticSafeMetadataAdapterSelfCheckStatus: pass`);
console.log(`checkedCases: ${cases.length}`);

