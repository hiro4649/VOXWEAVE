# VOXWEAVE Live2D Loopback Target Boundary v1.2.6

## Executive Summary

This candidate hardens the Live2D forwarder target boundary without running a
real renderer. It replaces prefix-based 127 host checks with exact normalized
loopback classification and makes fetch reject redirects.

## Source Evidence

- currentActiveHarness: v1.2.6
- baselineServerBoundaryPr: Phase B server bind/auth/JSON boundary
- implementationScope: live2d_loopback_target_boundary
- changed files:
  - src/live2dForwarder.js
  - test/live2d-forwarder.test.js
  - docs/process/CODEX_VOXWEAVE_LIVE2D_LOOPBACK_TARGET_BOUNDARY_V1_2_6.md

## Loopback Classification Boundary

- exactLoopbackClassificationStatus: pass
- accepted loopback forms:
  - localhost
  - localhost.
  - 127.0.0.1
  - 127.4.5.6
  - [::1]
- blocked non-loopback forms:
  - 127.example.invalid
  - 127.0.0.1.example.invalid
  - localhost.example.invalid
  - private IPv4
  - public host targets
  - non-loopback IPv6

## Redirect Boundary

- redirectFollowStatus: forbidden
- redirectPolicyStatus: error
- redirect failure safe status: renderer_unreachable
- redirect target projection: forbidden

## Fetch Boundary

- method: POST preserved
- JSON content type: preserved
- signal: preserved
- API key header behavior: preserved
- path behavior: root, cue, and custom path behavior preserved

## Product Boundary

- externalNetworkExecutionStatus: no
- realRendererExecutionStatus: no
- endpointMaterialProjectionStatus: forbidden
- cueBodyProjectionStatus: forbidden
- secretProjectionStatus: forbidden

## Package / Workflow Boundary

- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none

## Validation Plan

- node --check src/live2dForwarder.js
- node --test test/live2d-forwarder.test.js
- common local validation

## Decision Matrix

- currentActiveHarness: v1.2.6
- implementationScope: live2d_loopback_target_boundary
- loopbackHostnameSpoofGuardStatus: pass
- privateIpv4BlockedStatus: pass
- publicTargetBlockedStatus: pass
- redirectPolicyStatus: error
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- Real renderer compatibility is not claimed because this task uses fake fetch
  only.
- Network redirect behavior is represented by fetch option inspection and fake
  rejection, not by contacting a renderer or remote target.

## Safe Next Action

Run the scoped local tests and common local validation, then create the Phase C
candidate PR if the same allowed-file boundary remains intact.
