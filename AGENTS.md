# AGENTS.md

<!-- CODEX_QUALITY_HARNESS_BEGIN -->
CODEX_QUALITY_HARNESS_FILE v1.0.2

## Prime Directive

Ship the smallest correct change that increases product value without weakening
truth, trust, security, or maintainability.

## Source Harness Boundary

Use the source harness as the parent authority for harness rollout only. Product
authority remains outside this block.

## Codex Target Harness Boundary

This target repository consumes Codex Development Harness v1.0.2 through
`docs/process/CODEX_HARNESS_MANIFEST.json`; do not copy or create
`CODEX_SOURCE_HARNESS_MANIFEST.json` here. Keep product authority outside this
block intact.

## Target Doctrine And Skill Routing

Keep AGENTS.md compact: doctrine, routing map, and links only. Put detailed
policy in `docs/process`. Load only task-needed skills, normally four or fewer
and never more than five. Use `docs/process/CODEX_AGENTS_DOCTRINE_POLICY.md`,
`docs/process/CODEX_SKILL_ROUTING_POLICY.md`, and related v0.9.5-v1.0.2 files.
For v1.0.1/v1.0.2 outcome, ownership, anti-accretion, visible acceptance
evidence, clean-main baseline, fixture isolation, product PR evidence, external
blocked separation, handover snapshot, toolchain preflight, branch/head, and
local gate report contract routing, use the matching
`docs/process/CODEX_*_POLICY.md` files.

## Plan-First Rule

Use plan-first for R3, ambiguous, security-sensitive, migration, release,
dependency, multi-file, or architecture tradeoff work.

## Safe Output Rule

Use safe output only. Do not print raw logs, raw diffs, raw payloads, secret
values, endpoint values, private paths, production data, or personal data.

## Merge-Ready Claim Rule

Do not make a merge-ready claim unless required gates, current-head evidence,
CI replay where applicable, and human confirmation rules are satisfied.

## Target Safety Rules

Harness-only work must stay in harness-managed files. Do not modify product
source, product tests, runtime assets, package files, lockfiles, profiles,
`scripts/run-tests.js`, or product config not owned by harness unless the
project owner explicitly requests product work and required verification
evidence is available.

## Manual Confirmation Limit

Manual confirmation cannot override non-overridable harness failures.

## Profile/Core Separation

Maintain Profile/Core Separation: target rollout uses target mode while source
harness core remains separate.

<!-- CODEX_QUALITY_HARNESS_END -->
