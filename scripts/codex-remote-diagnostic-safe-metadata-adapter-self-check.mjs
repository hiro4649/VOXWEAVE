#!/usr/bin/env node

import assert from 'node:assert/strict';
import { classifyRemoteDiagnosticSafeMetadata } from './codex-remote-diagnostic-safe-metadata-adapter.mjs';

const REQUIRED_FLAGS = {
  diagnosticOnly: true,
  nonBlocking: true,
  effect: 'none',
  safeSummaryOnly: true,
};

function assertFlags(result) {
  for (const [key, value] of Object.entries(REQUIRED_FLAGS)) {
    assert.equal(result[key], value, `${key} must remain ${value}`);
  }
}

function assertNoRawEcho(result, rawNeedles) {
  const text = JSON.stringify(result);
  for (const needle of rawNeedles) {
    assert.equal(text.includes(needle), false, `raw value echoed: ${needle}`);
  }
}

function assertObservedSafe(result) {
  const allowed = new Set([
    'available_without_effect',
    'not_available_without_effect',
    'unknown_without_effect',
    'pass',
    'success',
    'not_run',
    'manual_confirmation_required',
  ]);
  assert.ok(Array.isArray(result.observedStatuses), 'observedStatuses must be an array');
  for (const status of result.observedStatuses) assert.ok(allowed.has(status), `unsafe observed status: ${status}`);
}

const cases = [
  {
    name: 'absent safe metadata returns not_available_without_effect',
    input: undefined,
    status: 'not_available_without_effect',
  },
  {
    name: 'safe pass metadata returns available_without_effect',
    input: { status: 'pass', safeSummaryOnly: true, reasonCodes: ['safe_metadata_available'], observedStatuses: ['pass'] },
    status: 'available_without_effect',
  },
  {
    name: 'not_run metadata returns unknown_without_effect',
    input: { status: 'not_run', safeSummaryOnly: true, observedStatuses: ['not_run'] },
    status: 'unknown_without_effect',
  },
  {
    name: 'manual_confirmation_required metadata returns unknown_without_effect',
    input: { status: 'manual_confirmation_required', safeSummaryOnly: true, observedStatuses: ['manual_confirmation_required'] },
    status: 'unknown_without_effect',
  },
  {
    name: 'safeSummaryOnly false returns unknown_without_effect',
    input: { status: 'pass', safeSummaryOnly: false },
    status: 'unknown_without_effect',
  },
  {
    name: 'raw-like key returns unknown_without_effect and does not echo raw key/value',
    input: { status: 'pass', safeSummaryOnly: true, endpointUrl: 'https://example.invalid/secret' },
    status: 'unknown_without_effect',
    noEcho: ['endpointUrl', 'https://example.invalid/secret'],
  },
  {
    name: 'status value containing endpoint content returns unknown_without_effect and does not echo original value',
    input: { status: 'https://example.invalid/token', safeSummaryOnly: true },
    status: 'unknown_without_effect',
    noEcho: ['https://example.invalid/token'],
  },
  {
    name: 'unrecognized arbitrary status returns unknown_without_effect and does not echo original value',
    input: { status: 'surprising_vendor_state', safeSummaryOnly: true },
    status: 'unknown_without_effect',
    noEcho: ['surprising_vendor_state'],
  },
  {
    name: 'reasonCodes containing raw-like value are not emitted',
    input: { status: 'pass', safeSummaryOnly: true, reasonCodes: ['safe_code', 'https://example.invalid/raw'] },
    status: 'available_without_effect',
    noEcho: ['https://example.invalid/raw'],
  },
  {
    name: 'observedStatuses contains only allowlisted safe labels',
    input: { status: 'pass', safeSummaryOnly: true, observedStatuses: ['pass', 'https://example.invalid/raw', 'unknown_without_effect'] },
    status: 'available_without_effect',
  },
  {
    name: 'unsafe source becomes unknown_without_effect',
    input: { status: 'pass', safeSummaryOnly: true, source: 'C:\\private\\artifact.log' },
    status: 'unknown_without_effect',
    noEcho: ['C:\\private\\artifact.log'],
  },
  {
    name: 'v1.1.5 required status surfaces are preserved',
    input: { status: 'success', safeSummaryOnly: true, observedStatuses: ['success'] },
    status: 'available_without_effect',
  },
];

for (const item of cases) {
  const result = classifyRemoteDiagnosticSafeMetadata(item.input);
  assert.equal(result.status, item.status, item.name);
  assertFlags(result);
  assertObservedSafe(result);
  assertNoRawEcho(result, item.noEcho || []);
}

console.log(JSON.stringify({
  status: 'pass',
  checked: cases.length,
  diagnosticOnly: true,
  nonBlocking: true,
  effect: 'none',
  safeSummaryOnly: true,
}, null, 2));
