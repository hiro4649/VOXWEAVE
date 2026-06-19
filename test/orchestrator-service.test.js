import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { buildVoxWeaveHealth } from "../src/serviceHealth.js";
import { VoxWeaveError } from "../src/errors.js";
import {
  createReactionPlanCacheEntry,
  stripTopLevelRequestCorrelation,
} from "../src/reactionPlanCache.js";
import { createOperationContext } from "../src/operationContext.js";

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "renderer_endpoint",
  "model_path",
  "secret",
  "token",
  "api_key",
  "private_path",
  "phoneme_debug",
]);

function makeService(options = {}) {
  return createVoxWeaveService({
    now: () => 1_777_000_000_000,
    ...options,
  });
}

function makeSpyCache() {
  const entries = new Map();
  const calls = [];
  return {
    calls,
    entries,
    get(key) {
      calls.push(["get", key]);
      return entries.get(key) ?? null;
    },
    set(key, value) {
      calls.push(["set", key]);
      entries.set(key, structuredClone(value));
    },
    delete(key) {
      calls.push(["delete", key]);
      return entries.delete(key);
    },
    size() {
      return entries.size;
    },
  };
}

function makeRenderGroupSpy() {
  const calls = [];
  const previewCalls = [];
  const buildGroup = (input) => ({
    schema: "voxweave_render_group_v1",
    group_id: "spy-render-group",
    group_complete: false,
    tts_received: input.adapterKind === "tts",
    subtitle_received: input.adapterKind === "subtitle",
    live2d_received: input.adapterKind === "live2d",
    first_audio_latency_ms: 0,
    quality_warning_count: input.qualityWarningCount,
  });
  return {
    calls,
    previewCalls,
    previewUpdate(input) {
      previewCalls.push(structuredClone(input));
      return buildGroup(input);
    },
    update(input) {
      calls.push(structuredClone(input));
      return buildGroup(input);
    },
  };
}

function makeDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

function assertSafeOperationCancellation(error) {
  assert.equal(error instanceof VoxWeaveError, true);
  assert.equal(error.code, "operation_cancelled");
  assert.equal(error.statusCode, 408);
  assert.equal(String(error.message).includes("raw"), false);
  return true;
}

function makeTtsPacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "tts",
    trace_id: "trace-service",
    event_id: "event-service",
    utterance_id: "utterance-service",
    text: "IRIS says hello to VOXWAEVE and Live2D.",
    final_text: "IRIS says hello to VOXWAEVE and Live2D.",
    language: "en",
    speech_cue: {
      prosody_style: "natural_speech",
      pace: "normal",
      pitch: "medium",
      volume: "medium",
      breathiness: "medium",
      estimated_duration_ms: 2400,
      adapter_validation_required: true,
    },
    adapter_validation_required: true,
    ...overrides,
  };
}

function makeSubtitlePacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "subtitle",
    trace_id: "trace-subtitle-service",
    event_id: "event-subtitle-service",
    utterance_id: "utterance-subtitle-service",
    subtitle_text: "Safe subtitle fixture",
    subtitle_language: "en",
    display_start_ms: 0,
    display_end_ms: 1800,
    script_direction: "ltr",
    adapter_validation_required: true,
    ...overrides,
  };
}

function makeLive2dPacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "live2d",
    trace_id: "trace-live2d-service",
    event_id: "event-live2d-service",
    utterance_id: "utterance-live2d-service",
    text: "Safe Live2D cue fixture",
    canonical_envelope: {
      action_type: "speak",
      emotion: "joy",
      continuity_maintained: true,
    },
    motion_cue: {
      motion_style: "talk",
      adapter_validation_required: true,
    },
    adapter_validation_required: true,
    ...overrides,
  };
}

function safeCharacterIdentityContract() {
  return {
    schema: "voxweave_character_identity_contract_v1",
    character_profile_id: "iris-main",
    persona_version: "v1-safe",
    identity_lock_level: "soft",
    identity_source_kind: "synthetic",
    identity_consent_status: "not_required",
    identity_asset_license_status: "not_required",
    identity_drift_risk: "low",
  };
}

function safeRealtimeInteractionContract() {
  return {
    schema: "voxweave_realtime_interaction_contract_v1",
    session_id: "session-matrix",
    turn_id: "turn-matrix",
    utterance_id: "utterance-matrix",
    input_mode: "text",
    output_mode: "tts",
    speech_state: "thinking",
    interrupt_policy: "allow_user_barge_in",
    latency_class: "interactive",
  };
}

function safeHumanOversightConsentContract() {
  return {
    schema: "voxweave_human_oversight_consent_contract_v1",
    consent_status: "not_required",
    human_review_status: "not_required",
    brand_guard_status: "not_required",
    voice_clone_allowed: false,
    likeness_use_allowed: false,
    commercial_use_allowed: false,
    minor_or_sensitive_context: false,
  };
}

function safeStructuredContextContract() {
  return {
    schema: "voxweave_structured_context_contract_v1",
    scene_id: "scene-matrix",
    context_source_kind: "app_state_summary",
    context_confidence: "high",
    risk_flags: ["none"],
    allowed_action_kinds: ["speak"],
  };
}

function safeAvatarFeedbackContract() {
  return {
    schema: "voxweave_avatar_feedback_contract_v1",
    expression: "happy",
    gaze: "user",
    gesture: "idle",
    mouth_state: "speaking",
    attention_state: "focused",
    intensity: "medium",
  };
}

function safeMultilingualPersonalizationContract() {
  return {
    schema: "voxweave_multilingual_personalization_contract_v1",
    locale_in: "en",
    locale_out: "ja",
    translation_mode: "none",
    recipient_profile_kind: "user",
    personalization_scope: "none",
    approved_profile_facts: [],
  };
}

function allSafeContracts() {
  return {
    character_identity_contract: safeCharacterIdentityContract(),
    realtime_interaction_contract: safeRealtimeInteractionContract(),
    human_oversight_consent_contract: safeHumanOversightConsentContract(),
    structured_context_contract: safeStructuredContextContract(),
    avatar_feedback_contract: safeAvatarFeedbackContract(),
    multilingual_personalization_contract: safeMultilingualPersonalizationContract(),
  };
}

function assertNoForbiddenFields(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_RESPONSE_KEYS.has(key), false);
      stack.push(child);
    }
  }
}

function assertArtifactUrl(value) {
  assert.equal(typeof value, "string");
  assert.equal(value.startsWith("artifact://voxweave/"), true);
}

function assertIntegrationBoundarySnapshot(snapshot) {
  assert.equal(snapshot.schema, "voxweave_integration_boundary_snapshot_v1");
  assert.equal(snapshot.integration_state, "boundary_defined_execution_unverified");
  assert.deepEqual(snapshot.supported_adapter_kinds, ["tts", "subtitle", "live2d"]);
  assert.equal(snapshot.contract_registry_family_count, 6);
  assert.equal(snapshot.server_bind_policy.default_scope, "loopback");
  assert.equal(snapshot.server_bind_policy.non_loopback_requires_explicit_opt_in, true);
  assert.equal(snapshot.server_bind_policy.non_loopback_requires_auth, true);
  assert.equal(snapshot.server_bind_policy.json_write_content_type_required, true);
  assert.equal(snapshot.operational_boundary.lifecycle_bounds_enforced, true);
  assert.equal(snapshot.operational_boundary.connection_cap_enabled, true);
  assert.equal(snapshot.operational_boundary.write_admission_enabled, true);
  assert.equal(snapshot.operational_boundary.write_queue_enabled, false);
  assert.equal(snapshot.operational_boundary.write_overload_rejection_enabled, true);
  assert.equal(snapshot.operational_boundary.health_bypasses_write_admission, true);
  assert.equal(snapshot.operational_boundary.admission_lease_release_on_failure, true);
  assert.equal(snapshot.operational_boundary.request_abort_safe_classification, true);
  assert.equal(snapshot.operational_boundary.destroyed_response_write_guard, true);
  assert.equal(snapshot.operational_boundary.client_error_safe_response, true);
  assert.equal(snapshot.operational_boundary.expect_continue_allowed, false);
  assert.equal(snapshot.operational_boundary.forced_shutdown_available, true);
  assert.equal(snapshot.operational_boundary.idle_connection_cleanup_available, true);
  assert.equal(snapshot.operational_boundary.shutdown_timer_cleanup_required, true);
  assert.equal(snapshot.operational_boundary.transport_values_excluded, true);
  assert.equal(snapshot.operational_boundary.application_operation_deadline_bounded, true);
  assert.equal(snapshot.operational_boundary.client_disconnect_cancellation_enabled, true);
  assert.equal(snapshot.operational_boundary.server_to_service_abort_signal, true);
  assert.equal(snapshot.operational_boundary.orchestrator_cooperative_cancellation, true);
  assert.equal(snapshot.operational_boundary.live2d_parent_signal_propagation, true);
  assert.equal(snapshot.operational_boundary.live2d_local_timeout_preserved, true);
  assert.equal(snapshot.operational_boundary.parent_abort_distinguished_from_renderer_timeout, true);
  assert.equal(snapshot.operational_boundary.cache_commit_after_cancellation_prevented, true);
  assert.equal(snapshot.operational_boundary.render_group_commit_after_cancellation_prevented, true);
  assert.equal(snapshot.operational_boundary.external_side_effect_rollback_guaranteed, false);
  assert.equal(snapshot.operational_boundary.operation_timeout_safe_error, true);
  assert.equal(snapshot.operational_boundary.operation_cancellation_safe_error, true);
  assert.equal(snapshot.operational_boundary.operation_deadline_values_excluded, true);
  assert.equal(snapshot.operational_boundary.active_operation_counts_excluded, true);
  assert.equal(snapshot.tts_boundary.mode, "mock_only");
  assert.equal(snapshot.tts_boundary.provider_connected, false);
  assert.equal(snapshot.asr_boundary.mode, "not_connected");
  assert.equal(snapshot.asr_boundary.provider_connected, false);
  assert.equal(snapshot.subtitle_boundary.mode, "metadata_only");
  assert.equal(snapshot.subtitle_boundary.renderer_connected, false);
  assert.equal(snapshot.live2d_boundary.cue_generation_available, true);
  assert.equal(snapshot.live2d_boundary.redirect_follow_allowed, false);
  assert.equal(snapshot.live2d_boundary.renderer_readiness_claimed, false);
  assert.equal(snapshot.translation_boundary.mode, "not_connected");
  assert.equal(snapshot.translation_boundary.provider_connected, false);
  assert.equal(snapshot.runtime_execution_required, false);
  assert.equal(snapshot.adapter_execution_required, false);
  assert.equal(snapshot.network_target_material_excluded, true);
  assert.equal(snapshot.runtime_readiness_claimed, false);
  assert.equal(snapshot.production_readiness_claimed, false);
  assert.equal(snapshot.safe_summary_only, true);
  assert.equal(JSON.stringify(snapshot).includes("active_write"), false);
  assert.equal(JSON.stringify(snapshot).includes("max_connections"), false);
  assert.equal(JSON.stringify(snapshot).includes("shutdown_timeout_ms"), false);
  assertNoForbiddenFields(snapshot);
}

function assertDryRunIntegrationBoundary(result, expectedContractCount) {
  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.response_summary.integration_boundary.asr_boundary.provider_connected, false);
  assert.equal(
    result.response_summary.integration_boundary.translation_boundary.provider_connected,
    false
  );
  assert.equal(
    result.response_summary.integration_boundary.live2d_boundary.renderer_readiness_claimed,
    false
  );
  assert.equal(result.response_summary.integration_boundary.production_readiness_claimed, false);
  assert.equal(result.ai_character_contract_summary.contract_presence_count, expectedContractCount);
  assert.equal(
    result.response_summary.ai_character_adapter_metadata.contract_presence_count,
    expectedContractCount
  );
  assert.equal(result.response_summary.ai_character_contract_response_guard.response_guard_applied, true);
  assertIntegrationBoundarySnapshot(result.response_summary.integration_boundary);
  assertNoForbiddenFields(result);
}

test("health returns safe health metadata and no forbidden fields", () => {
  const health = makeService().health();

  assert.equal(health.schema, "voxweave_health_v1");
  assert.equal(health.service, "voxweave");
  assert.equal(health.status, "ok");
  assert.equal(health.capabilities.mock_tts, true);
  assert.equal(health.boundaries.not_tts_engine, true);
  assert.equal(health.boundaries.not_live2d_renderer, true);
  assert.equal(health.runtime_readiness_claimed, false);
  assert.equal(health.production_readiness_claimed, false);
  assertIntegrationBoundarySnapshot(health.integration_boundary);
  assertNoForbiddenFields(health);
});

test("service health module builds the same safe health response", () => {
  const cache = makeSpyCache();
  cache.set("safe-entry", { ok: true });
  const live2dForwarder = {
    configured: true,
    scope: "loopback",
  };
  const health = buildVoxWeaveHealth({ cache, live2dForwarder });

  assert.equal(health.schema, "voxweave_health_v1");
  assert.equal(health.service, "voxweave");
  assert.equal(health.status, "ok");
  assert.equal(health.cache_entries, 1);
  assert.equal(health.integration_boundary.live2d_boundary.forwarder_configured, true);
  assert.equal(health.integration_boundary.live2d_boundary.forwarder_scope, "loopback");
  assert.equal(health.runtime_readiness_claimed, false);
  assert.equal(health.production_readiness_claimed, false);
  assertNoForbiddenFields(health);
});

test("integration boundary snapshot exposes loopback fake forwarder scope only", async () => {
  const service = makeService({
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward() {
        throw new Error("forward should not run for tts snapshot");
      },
    },
  });
  const result = await service.orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.integration_boundary, undefined);
  assertIntegrationBoundarySnapshot(result.response_summary.integration_boundary);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_configured, true);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_scope, "loopback");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assertNoForbiddenFields(result);
});

test("integration boundary snapshot exposes blocked fake forwarder scope only", async () => {
  const service = makeService({
    live2dForwarder: {
      configured: true,
      scope: "blocked",
      async forward() {
        throw new Error("forward should not run for subtitle snapshot");
      },
    },
  });
  const result = await service.orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" });

  assertIntegrationBoundarySnapshot(result.response_summary.integration_boundary);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_configured, true);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_scope, "blocked");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assertNoForbiddenFields(result);
});

test("dry-run integration matrix covers adapter kinds and contract combinations", async () => {
  const scenarios = [
    { adapterKind: "tts", packet: makeTtsPacket(), contractPatch: {}, contractCount: 0 },
    {
      adapterKind: "subtitle",
      packet: makeSubtitlePacket(),
      contractPatch: { character_identity_contract: safeCharacterIdentityContract() },
      contractCount: 1,
    },
    {
      adapterKind: "live2d",
      packet: makeLive2dPacket(),
      contractPatch: allSafeContracts(),
      contractCount: 6,
    },
  ];

  for (const scenario of scenarios) {
    const result = await makeService().orchestrate(
      { ...scenario.packet, ...scenario.contractPatch },
      { routeKind: scenario.adapterKind }
    );
    assert.equal(result.adapter_kind, scenario.adapterKind);
    assertDryRunIntegrationBoundary(result, scenario.contractCount);
  }
});

test("dry-run integration matrix preserves snapshot on cache hit", async () => {
  const service = makeService();
  const packet = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    event_id: "event-matrix-cache",
    ...allSafeContracts(),
  });

  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assertDryRunIntegrationBoundary(second, 6);
});

test("pre-aborted operation signal rejects before cache forward or render group update", async () => {
  const cache = makeSpyCache();
  const renderGroups = makeRenderGroupSpy();
  let forwardCount = 0;
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  operation.abort("client_disconnect");
  const service = makeService({
    cache,
    renderGroups,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward() {
        forwardCount += 1;
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "loopback",
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "accepted",
        };
      },
    },
  });

  await assert.rejects(
    async () =>
      service.orchestrate(
        makeLive2dPacket({ text: "yes", final_text: "yes" }),
        { routeKind: "live2d", signal: operation.signal }
      ),
    assertSafeOperationCancellation
  );

  assert.equal(cache.calls.length, 0);
  assert.equal(renderGroups.calls.length, 0);
  assert.equal(forwardCount, 0);
  operation.cleanup();
});

test("abort during fake Live2D forward rejects operation without render or cache commit", async () => {
  const cache = makeSpyCache();
  const renderGroups = makeRenderGroupSpy();
  const started = makeDeferred();
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  const service = makeService({
    cache,
    renderGroups,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward(_cueDelivery, { signal } = {}) {
        started.resolve(signal);
        await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }));
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "loopback",
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "accepted",
        };
      },
    },
  });
  const result = service.orchestrate(
    makeLive2dPacket({ text: "yes", final_text: "yes" }),
    { routeKind: "live2d", signal: operation.signal }
  );

  await started.promise;
  operation.abort("client_disconnect");
  await assert.rejects(result, assertSafeOperationCancellation);

  assert.equal(renderGroups.calls.length, 0);
  assert.equal(cache.entries.size, 0);
  assert.equal(cache.calls.some(([kind]) => kind === "set"), false);
  operation.cleanup();
});

test("cancelled cache hit keeps existing cache entry and skips render update", async () => {
  const cache = makeSpyCache();
  const renderGroups = makeRenderGroupSpy();
  const firstForward = async () => ({
    renderer_forward_configured: true,
    renderer_forward_scope: "loopback",
    renderer_forward_attempted: true,
    renderer_forward_ok: true,
    renderer_forward_status: "accepted",
  });
  const service = makeService({
    cache,
    renderGroups,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      forward: firstForward,
    },
  });
  const packet = makeLive2dPacket({ text: "yes", final_text: "yes" });
  const first = await service.orchestrate(packet, { routeKind: "live2d" });
  assert.equal(first.cache.status, "miss");
  assert.equal(cache.entries.size, 1);
  assert.equal(renderGroups.calls.length, 1);

  const started = makeDeferred();
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  const cancellingService = makeService({
    cache,
    renderGroups,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward(_cueDelivery, { signal } = {}) {
        started.resolve(signal);
        await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }));
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "loopback",
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "accepted",
        };
      },
    },
  });
  const second = cancellingService.orchestrate(packet, {
    routeKind: "live2d",
    signal: operation.signal,
  });

  await started.promise;
  operation.abort("client_disconnect");
  await assert.rejects(second, assertSafeOperationCancellation);

  assert.equal(cache.entries.size, 1);
  assert.equal(cache.calls.some(([kind]) => kind === "delete"), false);
  assert.equal(renderGroups.calls.length, 1);
  operation.cleanup();
});

test("abort after Live2D forward before state commit rejects without cache or render commit", async () => {
  const cache = makeSpyCache();
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  const renderGroups = {
    previewCalls: [],
    calls: [],
    previewUpdate(input) {
      this.previewCalls.push(structuredClone(input));
      operation.abort("client_disconnect");
      return {
        schema: "voxweave_render_group_v1",
        group_id: "preview-render-group",
        group_complete: false,
        tts_received: false,
        subtitle_received: false,
        live2d_received: true,
        first_audio_latency_ms: null,
        quality_warning_count: input.qualityWarningCount,
      };
    },
    update(input) {
      this.calls.push(structuredClone(input));
      throw new Error("render group commit should not run after cancellation");
    },
  };
  let forwardCount = 0;
  const service = makeService({
    cache,
    renderGroups,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward() {
        forwardCount += 1;
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "loopback",
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "accepted",
        };
      },
    },
  });

  await assert.rejects(
    async () =>
      service.orchestrate(
        makeLive2dPacket({ text: "yes", final_text: "yes" }),
        { routeKind: "live2d", signal: operation.signal }
      ),
    assertSafeOperationCancellation
  );

  assert.equal(forwardCount, 1);
  assert.equal(renderGroups.previewCalls.length, 1);
  assert.equal(renderGroups.calls.length, 0);
  assert.equal(cache.calls.some(([kind]) => kind === "set"), false);
  assert.equal(cache.entries.size, 0);
  operation.cleanup();
});

test("failed safe response guard prevents render group and cache commit", async () => {
  const cache = makeSpyCache();
  const renderGroups = {
    previewCalls: [],
    calls: [],
    previewUpdate(input) {
      this.previewCalls.push(structuredClone(input));
      return {
        schema: "voxweave_render_group_v1",
        group_id: "unsafe-preview-render-group",
        group_complete: false,
        tts_received: input.adapterKind === "tts",
        subtitle_received: false,
        live2d_received: false,
        first_audio_latency_ms: 0,
        quality_warning_count: input.qualityWarningCount,
        canonical_envelope: { action_type: "blocked" },
      };
    },
    update(input) {
      this.calls.push(structuredClone(input));
      throw new Error("render group commit should not run after unsafe preview");
    },
  };
  const service = makeService({ cache, renderGroups });

  await assert.rejects(
    async () =>
      service.orchestrate(
        makeTtsPacket({ text: "yes", final_text: "yes" }),
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_response"
  );

  assert.equal(renderGroups.previewCalls.length, 1);
  assert.equal(renderGroups.calls.length, 0);
  assert.equal(cache.calls.some(([kind]) => kind === "set"), false);
  assert.equal(cache.entries.size, 0);
});

test("orchestrate tts minimal safe packet returns accepted bridge output", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.schema, "voxweave_orchestration_result_v1");
  assert.equal(result.ok, true);
  assert.equal(result.response_kind, "json");
  assert.equal(result.adapter_kind, "tts");
  assert.equal(result.bridge_status, "accepted");
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.response_summary.bridge_status, "accepted");
  assert.equal(result.request_id.startsWith("voxweave-"), true);
  assertNoForbiddenFields(result);
});

test("tts response includes mock metadata without real provider connection", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.mock_tts.schema, "voxweave_mock_tts_v1");
  assert.equal(result.mock_tts.mode, "mock_audio");
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.mock_tts.artifact_kind, "mock_audio");
  assertArtifactUrl(result.mock_tts.artifact_url);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.tts_routing.voice_switched, false);
});

test("tts response includes mouth cues and response summary", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(Array.isArray(result.mouth_cues), true);
  assert.equal(result.mouth_cues.length > 0, true);
  assert.equal(result.viseme_count, result.mouth_cues.length);
  assert.equal(Number.isFinite(result.response_summary.duration_ms), true);
  for (const cue of result.mouth_cues) {
    assert.equal(cue.end_ms > cue.start_ms, true);
    assert.match(cue.viseme, /^(A|I|U|E|O|N)$/u);
  }
});

test("tts response includes quality score and no runtime readiness claim", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.quality.schema, "voxweave_quality_score_v1");
  assert.equal(Number.isFinite(result.quality.score), true);
  assert.equal(result.quality.score >= 0 && result.quality.score <= 100, true);
  assert.equal(typeof result.quality.label, "string");
  assert.equal(result.runtime_readiness_claimed, false);
});

test("subtitle packet returns subtitle timing and segments safe shape", async () => {
  const result = await makeService().orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" });

  assert.equal(result.adapter_kind, "subtitle");
  assert.equal(result.artifact_kind, "subtitle_vtt");
  assert.equal(result.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
  assert.equal(Array.isArray(result.subtitle_timing.chunks), true);
  assert.equal(result.subtitle_segments.length, result.subtitle_timing.chunks.length);
  assert.equal(result.subtitle_timing.script_direction, "ltr");
  assertArtifactUrl(result.artifact_url);
  assertNoForbiddenFields(result);
});

test("live2d packet returns safe cue and delivery without renderer endpoint", async () => {
  const result = await makeService().orchestrate(makeLive2dPacket(), { routeKind: "live2d" });

  assert.equal(result.adapter_kind, "live2d");
  assert.equal(result.artifact_kind, "live2d_cue_json");
  assert.equal(result.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(result.live2d_cue_delivery.schema, "iris_live2d_renderer_cue_delivery_v1");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assert.equal(result.boundary_policy.live2d_renderer_not_replaced, true);
  assertArtifactUrl(result.artifact_url);
  assertNoForbiddenFields(result);
});

test("unsupported locale returns text-only dry-run fallback without provider connection", async () => {
  const result = await makeService().orchestrate(
    makeTtsPacket({
      language: "zz-safe",
      tts_adapter_guidance: { fallback_allowed: false },
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.locale_status, "unsupported");
  assert.equal(result.reading_plan.fallback_mode, "text_only");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.fallback_allowed, false);
  assert.equal(result.tts_routing.fallback_mode, "text_only_no_voice_switch");
  assert.equal(result.mock_tts.provider_connected, false);
});

test("pronunciation repair path records known dictionary repairs", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.pronunciation.corrected_text.includes("VoxWeave"), true);
  assert.equal(result.pronunciation.repair_count >= 1, true);
  assert.equal(Array.isArray(result.pronunciation.repairs), true);
  assert.equal(typeof result.pronunciation.dictionary_version, "string");
});

test("cacheable neutral reaction returns miss then hit on repeated request", async () => {
  const service = makeService();
  const packet = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    event_id: "event-cache-service",
  });

  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assertIntegrationBoundarySnapshot(second.response_summary.integration_boundary);
  assertNoForbiddenFields(second);
});

test("Japanese neutral reaction cache ignores correlation-only changes", async () => {
  const service = makeService();
  const first = await service.orchestrate(
    makeTtsPacket({
      text: "ありがとう",
      final_text: "ありがとう",
      trace_id: "trace-japanese-neutral-first",
      event_id: "event-japanese-neutral-first",
      utterance_id: "utterance-japanese-neutral-first",
    }),
    { routeKind: "tts" }
  );
  const second = await service.orchestrate(
    makeTtsPacket({
      text: "ありがとう",
      final_text: "ありがとう",
      trace_id: "trace-japanese-neutral-second",
      event_id: "event-japanese-neutral-second",
      utterance_id: "utterance-japanese-neutral-second",
    }),
    { routeKind: "tts" }
  );

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assert.equal(second.trace_id, "trace-japanese-neutral-second");
  assert.equal(second.event_id, "event-japanese-neutral-second");
  assert.equal(second.utterance_id, "utterance-japanese-neutral-second");
  assert.notEqual(second.request_id, first.request_id);
  assert.notEqual(second.artifact_url, first.artifact_url);
  assertNoForbiddenFields(second);
});

test("non-neutral short Japanese and honorific reactions stay uncached", async () => {
  for (const text of ["会いたい", "田中さん", "山田様", "太郎くん", "お兄ちゃん"]) {
    const service = makeService();
    const first = await service.orchestrate(
      makeTtsPacket({ text, final_text: text, event_id: `event-${text}-first` }),
      { routeKind: "tts" }
    );
    const second = await service.orchestrate(
      makeTtsPacket({ text, final_text: text, event_id: `event-${text}-second` }),
      { routeKind: "tts" }
    );

    assert.equal(first.cache.status, "miss");
    assert.equal(second.cache.status, "miss");
    assertNoForbiddenFields(first);
    assertNoForbiddenFields(second);
  }
});

test("cache hit rematerializes current request-bound response values", async () => {
  let tick = 0;
  const service = makeService({
    now: () => 1_777_000_000_000 + tick,
  });
  const firstPacket = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    trace_id: "trace-cache-first",
    event_id: "event-cache-first",
    utterance_id: "utterance-cache-first",
  });
  const secondPacket = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    trace_id: "trace-cache-second",
    event_id: "event-cache-second",
    utterance_id: "utterance-cache-second",
  });

  const first = await service.orchestrate(firstPacket, { routeKind: "tts" });
  tick = 2_500;
  const second = await service.orchestrate(secondPacket, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assert.notEqual(second.request_id, first.request_id);
  assert.equal(second.trace_id, "trace-cache-second");
  assert.equal(second.event_id, "event-cache-second");
  assert.equal(second.utterance_id, "utterance-cache-second");
  assert.equal(second.response_summary.request_id, second.request_id);
  assert.equal(second.response_summary.event_id, second.event_id);
  assert.equal(second.response_summary.artifact_url, second.artifact_url);
  assert.equal(second.mock_tts.artifact_url, second.artifact_url);
  assert.notEqual(second.artifact_url, first.artifact_url);
  assert.notEqual(second.live2d_cue.cue_id, first.live2d_cue.cue_id);
  assert.equal(second.live2d_cue_delivery.cue.cue_id, second.live2d_cue.cue_id);
  assert.equal(second.render_group.group_id, "utterance-cache-second");
  assertNoForbiddenFields(second);
});

test("reaction plan cache strips top-level correlation but rejects cached request values", () => {
  const stripped = stripTopLevelRequestCorrelation({
    trace_id: "trace-cache-strip",
    event_id: "event-cache-strip",
    utterance_id: "utterance-cache-strip",
    request_id: "request-cache-strip",
    nested: {
      utterance_id: "semantic-nested-utterance",
    },
    text: "yes",
  });

  assert.equal(stripped.trace_id, undefined);
  assert.equal(stripped.event_id, undefined);
  assert.equal(stripped.utterance_id, undefined);
  assert.equal(stripped.request_id, undefined);
  assert.equal(stripped.nested.utterance_id, "semantic-nested-utterance");

  assert.throws(
    () =>
      createReactionPlanCacheEntry({
        corrected_text: "yes",
        repairs: [],
        dictionary_version: "test-dictionary",
        language: "en",
        locale_status: "supported",
        script_direction: "ltr",
        duration_ms: 500,
        prosody: { tts_routing: {} },
        reading_plan: {},
        subtitle_timing: { chunks: [] },
        mouth_cues: [],
        live2d_cue_template: { cue_id: "request-bound-cue" },
        quality: { deductions: [] },
      }),
    (error) => error?.code === "invalid_cache_entry"
  );
});

test("live2d cache hit forwards current cue without caching forward side effect", async () => {
  let tick = 0;
  const forwardedDeliveries = [];
  const service = makeService({
    now: () => 1_777_000_000_000 + tick,
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward(delivery) {
        forwardedDeliveries.push(structuredClone(delivery));
        return {
          renderer_forward_configured: true,
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "accepted",
          renderer_forward_scope: "loopback",
        };
      },
    },
  });
  const firstPacket = makeLive2dPacket({
    text: "yes",
    trace_id: "trace-live2d-cache-first",
    event_id: "event-live2d-cache-first",
    utterance_id: "utterance-live2d-cache-first",
  });
  const secondPacket = makeLive2dPacket({
    text: "yes",
    trace_id: "trace-live2d-cache-second",
    event_id: "event-live2d-cache-second",
    utterance_id: "utterance-live2d-cache-second",
  });

  const first = await service.orchestrate(firstPacket, { routeKind: "live2d" });
  tick = 2_500;
  const second = await service.orchestrate(secondPacket, { routeKind: "live2d" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assert.equal(forwardedDeliveries.length, 2);
  assert.equal(first.live2d_forward.renderer_forward_attempted, true);
  assert.equal(second.live2d_forward.renderer_forward_attempted, true);
  assert.notEqual(second.request_id, first.request_id);
  assert.notEqual(second.live2d_cue.cue_id, first.live2d_cue.cue_id);
  assert.equal(forwardedDeliveries[0].cue.cue_id, first.live2d_cue.cue_id);
  assert.equal(forwardedDeliveries[1].cue.cue_id, second.live2d_cue.cue_id);
  assert.equal(second.trace_id, "trace-live2d-cache-second");
  assert.equal(second.event_id, "event-live2d-cache-second");
  assert.equal(second.utterance_id, "utterance-live2d-cache-second");
  assertNoForbiddenFields(first);
  assertNoForbiddenFields(second);
});

test("identical payloads at fixed time receive unique request ids", async () => {
  const service = makeService();
  const packet = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    trace_id: "trace-fixed-request",
    event_id: "event-fixed-request",
    utterance_id: "utterance-fixed-request",
  });

  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.notEqual(second.request_id, first.request_id);
  assert.match(first.request_id, /^voxweave-/u);
  assert.match(second.request_id, /^voxweave-/u);
  assert.equal(first.request_id.includes("yes"), false);
  assert.equal(second.request_id.includes("yes"), false);
  assertNoForbiddenFields(first);
  assertNoForbiddenFields(second);
});

test("requests without correlation ids do not share one render group", async () => {
  const service = makeService();
  const tts = await service.orchestrate(
    makeTtsPacket({
      trace_id: "",
      event_id: "",
      utterance_id: "",
    }),
    { routeKind: "tts" }
  );
  const subtitle = await service.orchestrate(
    makeSubtitlePacket({
      trace_id: "",
      event_id: "",
      utterance_id: "",
    }),
    { routeKind: "subtitle" }
  );

  assert.notEqual(tts.render_group.group_id, subtitle.render_group.group_id);
  assert.equal(tts.render_group.group_complete, false);
  assert.equal(subtitle.render_group.group_complete, false);
  assertNoForbiddenFields(tts);
  assertNoForbiddenFields(subtitle);
});

test("explicit shared utterance correlation still completes one render group", async () => {
  let counter = 0;
  const service = makeService({
    requestIdFactory: () => `voxweave-test-${++counter}`,
  });
  const correlation = {
    trace_id: "trace-explicit-group",
    event_id: "event-explicit-group",
    utterance_id: "utterance-explicit-group",
  };

  const tts = await service.orchestrate(makeTtsPacket(correlation), { routeKind: "tts" });
  const subtitle = await service.orchestrate(
    makeSubtitlePacket(correlation),
    { routeKind: "subtitle" }
  );
  const live2d = await service.orchestrate(makeLive2dPacket(correlation), { routeKind: "live2d" });

  assert.equal(tts.render_group.group_id, "utterance-explicit-group");
  assert.equal(subtitle.render_group.group_id, "utterance-explicit-group");
  assert.equal(live2d.render_group.group_id, "utterance-explicit-group");
  assert.equal(live2d.render_group.group_complete, true);
  assert.equal(live2d.render_group.tts_received, true);
  assert.equal(live2d.render_group.subtitle_received, true);
  assert.equal(live2d.render_group.live2d_received, true);
  assertNoForbiddenFields(live2d);
});

test("invalid injected request id factory output rejects safely", async () => {
  const service = makeService({
    requestIdFactory: () => "unsafe request id",
  });

  await assert.rejects(
    async () => service.orchestrate(makeTtsPacket(), { routeKind: "tts" }),
    (error) => error instanceof VoxWeaveError && error.code === "invalid_request_id"
  );
});

test("cache semantic key matrix hits only non-semantic correlation changes", async () => {
  const service = makeService();
  const base = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    trace_id: "trace-cache-matrix-a",
    event_id: "event-cache-matrix-a",
    utterance_id: "utterance-cache-matrix-a",
    display_start_ms: 0,
    speech_cue: {
      prosody_style: "natural_speech",
      pace: "normal",
      pitch: "medium",
      volume: "medium",
      breathiness: "medium",
      estimated_duration_ms: 900,
      adapter_validation_required: true,
    },
  });
  const reordered = {
    adapter_validation_required: true,
    speech_cue: {
      adapter_validation_required: true,
      estimated_duration_ms: 900,
      breathiness: "medium",
      volume: "medium",
      pitch: "medium",
      pace: "normal",
      prosody_style: "natural_speech",
    },
    display_start_ms: 0,
    language: "en",
    final_text: "yes",
    text: "yes",
    utterance_id: "utterance-cache-matrix-b",
    event_id: "event-cache-matrix-b",
    trace_id: "trace-cache-matrix-b",
    adapter_kind: "tts",
    schema: "iris_adapter_packet_v1",
  };

  const first = await service.orchestrate(base, { routeKind: "tts" });
  const traceOnly = await service.orchestrate(
    {
      ...base,
      trace_id: "trace-cache-matrix-c",
      event_id: "event-cache-matrix-c",
      utterance_id: "utterance-cache-matrix-c",
    },
    { routeKind: "tts" }
  );
  const propertyOrderOnly = await service.orchestrate(reordered, { routeKind: "tts" });
  const semanticChanges = [
    { name: "display_start_ms", patch: { display_start_ms: 200 } },
    { name: "duration_ms", patch: { speech_cue: { ...base.speech_cue, estimated_duration_ms: 1200 } } },
    { name: "fallback_allowed", patch: { fallback_allowed: false } },
    { name: "prosody_style", patch: { speech_cue: { ...base.speech_cue, prosody_style: "focused_speech" } } },
    { name: "pitch", patch: { speech_cue: { ...base.speech_cue, pitch: "high" } } },
    { name: "volume", patch: { speech_cue: { ...base.speech_cue, volume: "high" } } },
    { name: "language", patch: { language: "ja" } },
  ];

  assert.equal(first.cache.status, "miss");
  assert.equal(traceOnly.cache.status, "hit");
  assert.equal(propertyOrderOnly.cache.status, "hit");
  assert.equal(traceOnly.cache.key, first.cache.key);
  assert.equal(propertyOrderOnly.cache.key, first.cache.key);

  for (const change of semanticChanges) {
    const result = await service.orchestrate(
      {
        ...base,
        ...change.patch,
        trace_id: `trace-cache-matrix-${change.name}`,
        event_id: `event-cache-matrix-${change.name}`,
        utterance_id: `utterance-cache-matrix-${change.name}`,
      },
      { routeKind: "tts" }
    );
    assert.equal(result.cache.status, "miss");
    assert.notEqual(result.cache.key, first.cache.key);
    assertNoForbiddenFields(result);
  }
});

test("neutral reaction cache contract matrix covers text adapter and cue boundaries", async () => {
  const service = makeService();
  const base = makeTtsPacket({
    text: "thanks.",
    final_text: "thanks.",
    trace_id: "trace-neutral-matrix-base",
    event_id: "event-neutral-matrix-base",
    utterance_id: "utterance-neutral-matrix-base",
  });

  const first = await service.orchestrate(base, { routeKind: "tts" });
  const correlationOnly = await service.orchestrate(
    makeTtsPacket({
      text: "thanks.",
      final_text: "thanks.",
      trace_id: "trace-neutral-matrix-correlation",
      event_id: "event-neutral-matrix-correlation",
      utterance_id: "utterance-neutral-matrix-correlation",
    }),
    { routeKind: "tts" }
  );
  const punctuationChanged = await service.orchestrate(
    makeTtsPacket({
      text: "thanks",
      final_text: "thanks",
      trace_id: "trace-neutral-matrix-punctuation",
      event_id: "event-neutral-matrix-punctuation",
      utterance_id: "utterance-neutral-matrix-punctuation",
    }),
    { routeKind: "tts" }
  );
  const arbitraryShort = await service.orchestrate(
    makeTtsPacket({
      text: "okay",
      final_text: "okay",
      trace_id: "trace-neutral-matrix-short",
      event_id: "event-neutral-matrix-short",
      utterance_id: "utterance-neutral-matrix-short",
    }),
    { routeKind: "tts" }
  );
  const adapterChanged = await service.orchestrate(
    makeSubtitlePacket({
      text: "thanks.",
      final_text: "thanks.",
      trace_id: "trace-neutral-matrix-subtitle",
      event_id: "event-neutral-matrix-subtitle",
      utterance_id: "utterance-neutral-matrix-subtitle",
    }),
    { routeKind: "subtitle" }
  );
  const live2dCue = await service.orchestrate(
    makeLive2dPacket({
      text: "thanks.",
      final_text: "thanks.",
      trace_id: "trace-neutral-matrix-live2d",
      event_id: "event-neutral-matrix-live2d",
      utterance_id: "utterance-neutral-matrix-live2d",
      live2d_cue: {
        expression: "neutral",
        motion: "idle",
        intensity: 0.2,
        duration_ms: 700,
        adapter_validation_required: true,
      },
    }),
    { routeKind: "live2d" }
  );

  assert.equal(first.cache.status, "miss");
  assert.equal(correlationOnly.cache.status, "hit");
  assert.equal(correlationOnly.cache.key, first.cache.key);
  assert.equal(punctuationChanged.cache.status, "miss");
  assert.notEqual(punctuationChanged.cache.key, first.cache.key);
  assert.equal(arbitraryShort.cache.status, "miss");
  assert.equal(adapterChanged.cache.status, "miss");
  assert.equal(live2dCue.cache.status, "miss");
  assert.equal(live2dCue.live2d_forward.renderer_forward_attempted, false);
  for (const result of [first, correlationOnly, punctuationChanged, arbitraryShort, adapterChanged, live2dCue]) {
    assertNoForbiddenFields(result);
  }
});

test("invalid reaction cache entry is deleted and rebuilt as current miss", async () => {
  const calls = [];
  const cache = {
    get(key) {
      calls.push(["get", key]);
      return { schema: "invalid_cache_entry", request_id: "cached-request" };
    },
    delete(key) {
      calls.push(["delete", key]);
      return true;
    },
    set(key) {
      calls.push(["set", key]);
    },
    size() {
      return 1;
    },
  };
  const service = makeService({ cache });
  const result = await service.orchestrate(
    makeTtsPacket({
      text: "yes",
      final_text: "yes",
      trace_id: "trace-invalid-cache-entry",
      event_id: "event-invalid-cache-entry",
      utterance_id: "utterance-invalid-cache-entry",
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.cache.status, "miss");
  assert.equal(result.trace_id, "trace-invalid-cache-entry");
  assert.equal(calls.map((entry) => entry[0]).join(","), "get,delete,set");
  assertNoForbiddenFields(result);
});

test("strong live2d motion cue includes recovery requirement", async () => {
  const result = await makeService().orchestrate(
    makeLive2dPacket({
      motion_cue: {
        motion_style: "laugh_big",
        adapter_validation_required: true,
      },
    }),
    { routeKind: "live2d" }
  );

  assert.equal(result.live2d_cue.motion.style, "laugh_big");
  assert.equal(result.live2d_cue.recovery_required, true);
  assert.equal(result.live2d_cue.recovery_plan.type, "breath_recover");
});

test("empty text path is accepted with safe quality deduction", async () => {
  const result = await makeService().orchestrate(
    makeTtsPacket({
      text: "",
      final_text: "",
      event_id: "event-empty-quality",
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.ok, true);
  assert.equal(result.quality.deductions.includes("missing_text"), true);
  assert.equal(result.quality.label, "usable");
  assertNoForbiddenFields(result);
});

test("service rejects unsafe raw audio payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), raw_audio: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service rejects unsafe command payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), command: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service rejects unsafe endpoint payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), endpoint: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service response never includes forbidden fields recursively", async () => {
  const service = makeService();
  const results = [
    await service.orchestrate(makeTtsPacket(), { routeKind: "tts" }),
    await service.orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" }),
    await service.orchestrate(makeLive2dPacket(), { routeKind: "live2d" }),
  ];

  for (const result of results) assertNoForbiddenFields(result);
});
