# AGENTS.md

## VOXWEAVE Working Guide

VOXWEAVE is a voice and agent-facing product workspace. Use Node.js >=20.
Normal work should stay in the explicitly approved scope and be verified with
the smallest relevant command.

Default commands:
- Test: `npm test`
- Local server: `npm start` only when explicitly asked.

Do not claim runtime, production, real TTS, ASR, external voice, or deployment
readiness unless the owner explicitly scopes that evidence. Done means the
smallest relevant verification was run or honestly reported unavailable without
raw logs or secret-like output.

<!-- CODEX_QUALITY_HARNESS_BEGIN -->
CODEX_QUALITY_HARNESS_FILE v1.2.6

## Prime Directive

Ship the smallest correct change that increases product value without weakening
truth, trust, security, or maintainability.

This AGENTS.md is a compact doctrine and routing map; detailed policy lives in
docs/process.

## Active Harness

Active target harness: v1.2.6 / v126.
Read first: AGENTS.md, docs/process/CODEX_HARNESS_MANIFEST.json,
docs/process/CODEX_V126_SPEC.md, and docs/process/CODEX_ACTIVE_POLICY_INDEX.json.
README, legacy specs, and PR history are conditional reads only.

## Authority

v1.1.8 Final Decision remains final authority.
v1.1.9 P0 artifacts and operator-visible statuses remain preserved.
v1.2.0 adaptive routing, v1.2.1 calibration, v1.2.2 read-budget routing,
and v1.2.3 observed evidence/decision closure remain compatibility layers.
v1.2.4 specialist-governance fields remain compatibility layers.
v1.2.5 adds internal Goal Shard, Worktree Fleet, Evidence Lane,
Typed Monitor Inbox, Fanout Guard, and Yield fields inside the existing P0
artifacts. v1.2.6 adds observed workspace state, owner/delegated receipts,
checker-builder loop, evidence lane state machine, context/skill/validation
budget routing, and effectiveness fields inside existing P0 artifacts without
expanding final authority.

## Target Footprint

Do not add new P0 artifacts, top-level statuses, skills, workflow behavior,
product code, package or lockfile changes, runtime code, or readiness claims
for harness rollout unless separately scoped by the owner.
Target AGENTS.md is a compact routing map. Put detailed policy in docs/process
and use profile IDs instead of repeated forbidden-scope text.

## Safety Boundary

Use safe artifacts only. Do not read raw logs. Do not use 8-session.
Do not access wallet/RPC/deploy/secrets, submit GitHub approval review,
self-approve, release, publish, BscScan verify, or claim runtime, production,
legal, or YouTube policy compliance.
Expert agents may make technical findings and one safe next action inside the
goal scope; they cannot create owner authority or widen product/runtime/package
scope. Skeptic review is abnormal-condition only. Safe session learning is
proposal-only and owner-approval-required.

## Local Task Discipline

Start from clean default branch or clean worktree. Preserve user changes.
Run v126 self-test and the local quality gate for harness rollout. v125, v124,
v123, and v122 self-tests are compatibility checks when relevant. For product
work, use the repo-specific commands above and keep product evidence separate
from harness evidence.
<!-- CODEX_QUALITY_HARNESS_END -->
