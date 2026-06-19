#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.2.7

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import {
  isCacheableReaction,
  isPersonalReactionCacheRisk,
} from '../src/reactionPlanBuilder.js';

export const SOURCE_TEXT_INTEGRITY_SCHEMA = 'voxweave_source_text_integrity_v1';

const DEFAULT_ROOTS = ['src', 'test'];
const INCLUDED_EXTENSIONS = new Set(['.js', '.mjs', '.json']);
const FIXTURE_MARKDOWN_PREFIX = 'test/fixtures/';
const TRUSTED_MOJIBAKE_DENYLIST_FILE = 'src/reactionPlanBuilder.js';

function textFromCodePoints(hexValues) {
  return String.fromCodePoint(...hexValues.map((value) => Number.parseInt(value, 16)));
}

const KNOWN_MOJIBAKE_FRAGMENTS = [
  ['90b5', 'ff7a', '7e5d', 'ff7b', '30fb', '30fb'],
  ['90b5', 'ff7a', '7e67', '30fb', 'ff7d', '9854', 'ff78', 'ff7a', '8815', '5a2f', '30fb', '90b5', 'ff7a', '7e5d', 'ff7b'],
  ['90b5', 'ff7a', '9708', '8cbb', 'ff7d', '30fb'],
  ['96b6', '5075', '30fb', '90b5', 'ff7a', '8373', '5947', 'ff7d', '30fb'],
  ['90b5', 'ff7a', '30fb', 'ff61', '90e2', 'ff67', '7e5d', 'ff7b', '30fb', '30fb'],
].map(textFromCodePoints);

function repoRelative(filePath, rootDir = process.cwd()) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function shouldScan(relativePath) {
  if (!relativePath || relativePath.startsWith('node_modules/') || relativePath.startsWith('.git/')) {
    return false;
  }
  if (relativePath.startsWith('docs/process/')) return false;
  const ext = path.extname(relativePath);
  if (INCLUDED_EXTENSIONS.has(ext)) return true;
  return ext === '.md' && relativePath.startsWith(FIXTURE_MARKDOWN_PREFIX);
}

function walk(dir, rootDir = process.cwd(), files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = repoRelative(fullPath, rootDir);
    if (entry.isDirectory()) {
      if (!relativePath.includes('node_modules') && !relativePath.includes('.git')) {
        walk(fullPath, rootDir, files);
      }
    } else if (entry.isFile() && shouldScan(relativePath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function maskTrustedDenylist(content, relativePath) {
  if (relativePath !== TRUSTED_MOJIBAKE_DENYLIST_FILE) return content;
  return KNOWN_MOJIBAKE_FRAGMENTS.reduce(
    (masked, fragment) => masked.split(fragment).join('[known-mojibake-denylist-entry]'),
    content,
  );
}

export function scanTextContent(content, relativePath = 'inline') {
  const findings = [];
  const scannedContent = maskTrustedDenylist(content, relativePath);
  if (scannedContent.includes('\u0000')) findings.push({ file: relativePath, reason: 'nul_character' });
  if (scannedContent.includes('\uFFFD')) findings.push({ file: relativePath, reason: 'replacement_character' });
  const embeddedBomIndex = scannedContent.indexOf('\uFEFF', scannedContent.charAt(0) === '\uFEFF' ? 1 : 0);
  if (embeddedBomIndex >= 0) findings.push({ file: relativePath, reason: 'embedded_bom' });
  for (const fragment of KNOWN_MOJIBAKE_FRAGMENTS) {
    if (scannedContent.includes(fragment)) {
      findings.push({ file: relativePath, reason: 'known_mojibake_fragment' });
      break;
    }
  }
  return findings;
}

function scanBytes(filePath, rootDir) {
  const relativePath = repoRelative(filePath, rootDir);
  const bytes = fs.readFileSync(filePath);
  let decoded = '';
  let leadingBom = false;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { findings: [{ file: relativePath, reason: 'invalid_utf8' }], leadingBom };
  }
  if (decoded.charAt(0) === '\uFEFF') {
    leadingBom = true;
    decoded = decoded.slice(1);
  }
  return { findings: scanTextContent(decoded, relativePath), leadingBom };
}

function t(hexValues) {
  return textFromCodePoints(hexValues);
}

export function validateNeutralReactionPolicy() {
  const cacheable = [
    t(['3046', '3093']),
    `${t(['3046', '3093'])}${t(['3002'])}`,
    t(['3048', '3063']),
    `${t(['3048', '3063'])}!`,
    t(['3075', '3075', '3063']),
    `${t(['3075', '3075', '3063'])}${t(['3002'])}`,
    t(['3042', '308a', '304c', '3068', '3046']),
    `${t(['3042', '308a', '304c', '3068', '3046'])}!`,
    t(['3061', '3087', '3063', '3068', '5f85', '3063', '3066']),
    `${t(['3061', '3087', '3063', '3068', '5f85', '3063', '3066'])}${t(['3002'])}`,
    'yes',
    'yes!',
    'thanks',
    'thanks.',
    'one moment',
    'one moment!',
  ];
  const notCacheable = [
    t(['4f1a', '3044', '305f', '3044']),
    t(['597d', '304d']),
    t(['304a', '304b', '3048', '308a']),
    t(['5927', '4e08', '592b']),
    t(['5143', '6c17']),
    'okay',
    'hello',
    t(['77ed', '3044', '4efb', '610f', '6587']),
    t(['7530', '4e2d', '3055', '3093']),
    t(['5c71', '7530', '69d8']),
    t(['592a', '90ce', '304f', '3093']),
    t(['304a', '59c9', '3061', '3083', '3093']),
    'remember',
    'memory',
    'sorry',
    'apologize',
    '123',
    'user@example',
    '#personal',
    ...KNOWN_MOJIBAKE_FRAGMENTS,
  ];
  const failures = [];
  for (const text of cacheable) {
    if (isCacheableReaction(text) !== true) failures.push('neutral_allowlist_rejected');
  }
  for (const text of notCacheable) {
    if (isCacheableReaction(text) !== false) failures.push('non_neutral_cacheable');
  }
  for (const text of [
    t(['7530', '4e2d', '3055', '3093']),
    t(['5c71', '7530', '69d8']),
    t(['592a', '90ce', '304f', '3093']),
    t(['304a', '59c9', '3061', '3083', '3093']),
    'remember this',
    'relationship memory',
  ]) {
    if (isPersonalReactionCacheRisk(text) !== true) failures.push('personal_risk_missed');
  }
  for (const text of [
    t(['3046', '3093']),
    t(['3042', '308a', '304c', '3068', '3046']),
    'yes',
    'thanks',
    'trace-safe',
    'event-safe',
  ]) {
    if (isPersonalReactionCacheRisk(text) !== false) failures.push('neutral_marked_personal');
  }
  return {
    neutral_policy_status: failures.length ? 'fail' : 'pass',
    personal_risk_policy_status: failures.length ? 'fail' : 'pass',
    reason_codes: [...new Set(failures)],
    safe_summary_only: true,
  };
}

export function scanSourceTextIntegrity({ roots = DEFAULT_ROOTS, rootDir = process.cwd() } = {}) {
  const files = roots.flatMap((root) => walk(path.join(rootDir, root), rootDir));
  const findings = [];
  let leadingBomCompatibilityCount = 0;
  for (const file of files) {
    const result = scanBytes(file, rootDir);
    if (result.leadingBom) leadingBomCompatibilityCount += 1;
    findings.push(...result.findings);
  }
  const neutral = validateNeutralReactionPolicy();
  const counts = findings.reduce((acc, finding) => {
    acc[finding.reason] = (acc[finding.reason] || 0) + 1;
    return acc;
  }, {});
  const status = findings.length || neutral.neutral_policy_status !== 'pass' ? 'fail' : 'pass';
  return {
    schema: SOURCE_TEXT_INTEGRITY_SCHEMA,
    status,
    scanned_file_count: files.length,
    invalid_utf8_count: counts.invalid_utf8 || 0,
    replacement_character_count: counts.replacement_character || 0,
    embedded_bom_count: counts.embedded_bom || 0,
    leading_bom_compatibility_count: leadingBomCompatibilityCount,
    known_mojibake_count: counts.known_mojibake_fragment || 0,
    neutral_policy_status: neutral.neutral_policy_status,
    personal_risk_policy_status: neutral.personal_risk_policy_status,
    findings: findings.slice(0, 10),
    safe_summary_only: true,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = scanSourceTextIntegrity();
  console.log(JSON.stringify(report));
  process.exit(report.status === 'pass' ? 0 : 1);
}
