# CODEX VOXWEAVE Remote NPM Diagnostic Policy v1.0.2

Status: design only.

This policy defines remote npm diagnostic trust levels for VOXWEAVE harness
v1.0.2.

## Trust Levels

Required field:

```text
remote npm trust level
```

Allowed values:

- `none`
- `pending`
- `safe_artifact`
- `raw_untrusted`
- `failed`

Only `safe_artifact` can support a pass outcome.

## Safe Artifact Rule

Pass when:

```text
npm executed with safe artifact only -> pass with trustLevel safe_artifact
```

The safe artifact may include npm exit code, command class, platform label,
diagnostic type, and safe test count. It must not include raw logs, raw payloads,
endpoint values, API keys, tokens, model paths, or dataset paths.

## Missing Execution Rule

Fail when:

```text
npm not executed -> fail
```

No product-relevant PR may pass product verification solely from placeholder or
pending npm evidence.

## Command Discovery Boundary

v1.0.2 must distinguish these command statuses:

- `productTestCommandStatus`: product-focused test command evidence.
- `harnessSelfTestCommandStatus`: harness self-test command evidence.
- `npmScriptDiscoveryBoundaryStatus`: whether npm script discovery stayed in
  the intended scope.
- `testCommandScopeStatus`: the safe combined classification.

When product-focused tests pass but a broad npm script times out because it
discovers harness self-test scripts, report:

```json
{
  "productTestCommandStatus": "pass",
  "harnessSelfTestCommandStatus": "not_executed_or_out_of_scope",
  "npmScriptDiscoveryBoundaryStatus": "too_broad",
  "testCommandScopeStatus": "product_focused_pass_broad_npm_timeout"
}
```

This classification must not claim that all npm behavior is green, and it must
not hide a failing product command. It only separates product evidence from
over-broad script discovery.

## Current VOXWEAVE Case

VOXWEAVE PR #1 has green `npm-test`, but Codex quality-gate is red due to
review independence. v1.0.2 must preserve both facts:

```json
{
  "productEvidenceScore": "pass",
  "remoteNpmTrustLevel": "safe_artifact",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "mergeReadiness": "no"
}
```

## Non Goals

- Do not upload raw npm logs as safe artifacts.
- Do not treat raw logs as trusted evidence.
- Do not bypass review independence because npm passed.
- Do not claim real TTS production readiness from mock TTS tests.
