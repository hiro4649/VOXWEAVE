import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import {
  assertSafeServerBind,
  assertCanonicalRequestTarget,
  assertContentLengthWithinLimit,
  classifyServerHostScope,
  closeVoxWeaveServer,
  constantTimeCredentialMatch,
  credentialDigest,
  createWriteAdmissionController,
  createVoxWeaveServer,
  DEFAULT_SERVER_LIFECYCLE_POLICY,
  DEFAULT_WRITE_ADMISSION_POLICY,
  extractWriteCredential,
  buildSafeClientErrorResponse,
  buildSafeExpectationFailedResponse,
  buildSafeServerStartupSummary,
  isRequestAbortedError,
  normalizeServerLifecyclePolicy,
  normalizeWriteAdmissionPolicy,
  parseCanonicalRequestTarget,
  SERVER_LIFECYCLE_POLICY_LIMITS,
  SERVER_SHUTDOWN_SUMMARY_SCHEMA,
  SERVER_STARTUP_SUMMARY_SCHEMA,
  startServer,
  WRITE_ADMISSION_POLICY_LIMITS,
} from "../src/server.js";
import {
  DEFAULT_OPERATION_POLICY,
  OPERATION_POLICY_LIMITS,
  classifyOperationAbortKind,
  createOperationContext,
  normalizeOperationPolicy,
  runWithOperationContext,
  throwIfOperationAborted,
} from "../src/operationContext.js";

const FAKE_API_KEY = "unit-test-key";
const OVERSIZED_BODY = "x".repeat(513_000);

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "endpoint",
  "renderer_endpoint",
  "href",
  "url",
  "api_key",
  "x-api-key",
  "secret",
  "token",
  "private_path",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "model_path",
  "raw_payload",
  "payload",
  "authorization",
  "credential",
  "credentials",
]);

function adapterPacket(adapterKind = "tts") {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: adapterKind,
    trace_id: "server-negative-trace",
    event_id: "server-negative-event",
    utterance_id: "server-negative-utterance",
    final_text: "Safe server negative route sample.",
    adapter_validation_required: true,
  };
}

test("GET /health remains public when API key is configured", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.boundaries.not_tts_engine, true);
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  }, { apiKey: FAKE_API_KEY });
});

test("GET /v1/health remains public when API key is configured", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.boundaries.not_live2d_renderer, true);
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  }, { apiKey: FAKE_API_KEY });
});

test("server host classifier separates loopback wildcard non-loopback and invalid hosts", () => {
  assert.equal(classifyServerHostScope("localhost"), "loopback");
  assert.equal(classifyServerHostScope("localhost."), "loopback");
  assert.equal(classifyServerHostScope("127.0.0.1"), "loopback");
  assert.equal(classifyServerHostScope("127.4.5.6"), "loopback");
  assert.equal(classifyServerHostScope("::1"), "loopback");
  assert.equal(classifyServerHostScope("[::1]"), "loopback");
  assert.equal(classifyServerHostScope("0.0.0.0"), "wildcard");
  assert.equal(classifyServerHostScope("::"), "wildcard");
  assert.equal(classifyServerHostScope("127.example.invalid"), "non_loopback");
  assert.equal(classifyServerHostScope("127.0.0.1.example.invalid"), "non_loopback");
  assert.equal(classifyServerHostScope("localhost.example.invalid"), "non_loopback");
  assert.equal(classifyServerHostScope(""), "invalid");
  assert.equal(classifyServerHostScope("http://localhost"), "invalid");
  assert.equal(classifyServerHostScope("local host"), "invalid");
  assert.equal(classifyServerHostScope("bad_host"), "invalid");
});

test("server bind policy requires API key and explicit opt-in outside loopback", () => {
  assert.doesNotThrow(() => assertSafeServerBind({ host: "127.0.0.1" }));
  assert.throws(
    () => assertSafeServerBind({ host: "0.0.0.0" }),
    safeBindErrorMatcher
  );
  assert.throws(
    () => assertSafeServerBind({ host: "0.0.0.0", requiredApiKey: FAKE_API_KEY }),
    safeBindErrorMatcher
  );
  assert.throws(
    () => assertSafeServerBind({ host: "0.0.0.0", allowNonLoopback: true }),
    safeBindErrorMatcher
  );
  assert.doesNotThrow(() =>
    assertSafeServerBind({
      host: "0.0.0.0",
      requiredApiKey: FAKE_API_KEY,
      allowNonLoopback: "true",
    })
  );
  assert.throws(
    () => assertSafeServerBind({ host: "example.invalid" }),
    safeBindErrorMatcher
  );
  assert.throws(
    () => assertSafeServerBind({ host: "example.invalid", requiredApiKey: FAKE_API_KEY }),
    safeBindErrorMatcher
  );
  assert.doesNotThrow(() =>
    assertSafeServerBind({
      host: "example.invalid",
      requiredApiKey: FAKE_API_KEY,
      allowNonLoopback: "1",
    })
  );
});

test("safe bind error does not expose host or API key material", () => {
  assert.throws(
    () =>
      assertSafeServerBind({
        host: "example.invalid",
        requiredApiKey: FAKE_API_KEY,
        allowNonLoopback: false,
      }),
    (error) => {
      assert.equal(error.code, "unsafe_server_bind");
      assert.equal(error.statusCode, 500);
      assert.equal(String(error.message).includes("example.invalid"), false);
      assert.equal(String(error.message).includes(FAKE_API_KEY), false);
      return true;
    }
  );
});

test("startServer rejects unsafe bind before listen", () => {
  assert.throws(
    () => startServer({ host: "0.0.0.0", port: 0 }),
    safeBindErrorMatcher
  );
});

test("server lifecycle policy applies bounded explicit defaults", async () => {
  const server = createVoxWeaveServer();
  try {
    assert.equal(server.requestTimeout, DEFAULT_SERVER_LIFECYCLE_POLICY.requestTimeoutMs);
    assert.equal(server.headersTimeout, DEFAULT_SERVER_LIFECYCLE_POLICY.headersTimeoutMs);
    assert.equal(server.keepAliveTimeout, DEFAULT_SERVER_LIFECYCLE_POLICY.keepAliveTimeoutMs);
    assert.equal(server.maxRequestsPerSocket, DEFAULT_SERVER_LIFECYCLE_POLICY.maxRequestsPerSocket);
    assert.equal(server.maxHeadersCount, DEFAULT_SERVER_LIFECYCLE_POLICY.maxHeadersCount);
    assert.equal(server.maxConnections, DEFAULT_SERVER_LIFECYCLE_POLICY.maxConnections);
  } finally {
    await closeVoxWeaveServer(server);
  }
});

test("server lifecycle policy exposes exact frozen defaults in bounds", () => {
  const policy = normalizeServerLifecyclePolicy();

  assert.deepEqual(Object.keys(policy), Object.keys(DEFAULT_SERVER_LIFECYCLE_POLICY));
  assert.equal(Object.isFrozen(policy), true);
  for (const [key, value] of Object.entries(DEFAULT_SERVER_LIFECYCLE_POLICY)) {
    assert.equal(policy[key], value);
    assert.equal(value >= SERVER_LIFECYCLE_POLICY_LIMITS[key].min, true);
    assert.equal(value <= SERVER_LIFECYCLE_POLICY_LIMITS[key].max, true);
  }
});

test("server lifecycle policy accepts explicit minimum and maximum values", () => {
  const minimum = normalizeServerLifecyclePolicy({
    requestTimeoutMs: 1_000,
    headersTimeoutMs: 1_000,
    keepAliveTimeoutMs: 500,
    maxRequestsPerSocket: 1,
    maxHeadersCount: 1,
    maxConnections: 1,
    shutdownTimeoutMs: 100,
  });
  assert.equal(minimum.requestTimeoutMs, 1_000);
  assert.equal(minimum.maxConnections, 1);

  const maximum = normalizeServerLifecyclePolicy({
    requestTimeoutMs: 120_000,
    headersTimeoutMs: 60_000,
    keepAliveTimeoutMs: 30_000,
    maxRequestsPerSocket: 1_000,
    maxHeadersCount: 256,
    maxConnections: 1_024,
    shutdownTimeoutMs: 10_000,
  });
  assert.equal(maximum.requestTimeoutMs, 120_000);
  assert.equal(maximum.maxConnections, 1_024);
});

test("server lifecycle policy rejects out of range and unsafe explicit values", () => {
  const cases = [
    { requestTimeoutMs: 999 },
    { requestTimeoutMs: 120_001 },
    { headersTimeoutMs: 999 },
    { headersTimeoutMs: 60_001 },
    { keepAliveTimeoutMs: 499 },
    { keepAliveTimeoutMs: 30_001 },
    { maxRequestsPerSocket: 0 },
    { maxRequestsPerSocket: 1_001 },
    { maxHeadersCount: 0 },
    { maxHeadersCount: 257 },
    { maxConnections: 0 },
    { maxConnections: 1_025 },
    { shutdownTimeoutMs: 99 },
    { shutdownTimeoutMs: 10_001 },
    { requestTimeoutMs: 1000.5 },
    { requestTimeoutMs: "1000" },
    { requestTimeoutMs: true },
    { requestTimeoutMs: Number.MAX_SAFE_INTEGER + 1 },
    [],
    null,
  ];

  for (const policy of cases) {
    assert.throws(
      () => normalizeServerLifecyclePolicy(policy),
      lifecyclePolicyErrorMatcher
    );
  }
});

test("server lifecycle policy rejects unknown fields and cross-field violations", () => {
  const cases = [
    { extraPolicyField: 1 },
    { requestTimeoutMs: 1_000, headersTimeoutMs: 1_001 },
    { requestTimeoutMs: 1_000, keepAliveTimeoutMs: 1_000 },
    { requestTimeoutMs: 1_000, shutdownTimeoutMs: 1_001 },
  ];

  for (const policy of cases) {
    assert.throws(
      () => normalizeServerLifecyclePolicy(policy),
      lifecyclePolicyErrorMatcher
    );
  }
});

test("create server rejects invalid lifecycle policy before returning server", () => {
  assert.throws(
    () => createVoxWeaveServer({ lifecyclePolicy: { requestTimeoutMs: 999 } }),
    lifecyclePolicyErrorMatcher
  );
});

test("create server applies maxConnections without public policy projection", async () => {
  const server = createVoxWeaveServer({ lifecyclePolicy: { maxConnections: 7 } });
  try {
    assert.equal(server.maxConnections, 7);
    assert.equal(Object.prototype.hasOwnProperty.call(server, "lifecyclePolicy"), false);
  } finally {
    await closeVoxWeaveServer(server);
  }
});

test("startServer invalid lifecycle policy rejects before listen", () => {
  assert.throws(
    () => startServer({ lifecyclePolicy: { unknownPolicyField: 1 } }),
    lifecyclePolicyErrorMatcher
  );
});

test("invalid lifecycle policy error does not expose values", () => {
  assert.throws(
    () => normalizeServerLifecyclePolicy({ requestTimeoutMs: "1000" }),
    (error) => {
      assert.equal(error.code, "invalid_server_lifecycle_policy");
      assert.equal(error.statusCode, 500);
      assert.equal(String(error.message).includes("1000"), false);
      assert.equal(String(error.message).includes("127.0.0.1"), false);
      assert.equal(String(error.message).includes(FAKE_API_KEY), false);
      return true;
    }
  );
});

test("write admission policy exposes exact frozen defaults in bounds", () => {
  const policy = normalizeWriteAdmissionPolicy();

  assert.deepEqual(Object.keys(policy), Object.keys(DEFAULT_WRITE_ADMISSION_POLICY));
  assert.equal(Object.isFrozen(policy), true);
  assert.equal(policy.maxInFlightWrites, DEFAULT_WRITE_ADMISSION_POLICY.maxInFlightWrites);
  assert.equal(policy.queueMode, "reject");
  assert.equal(
    policy.maxInFlightWrites >= WRITE_ADMISSION_POLICY_LIMITS.maxInFlightWrites.min,
    true
  );
  assert.equal(
    policy.maxInFlightWrites <= WRITE_ADMISSION_POLICY_LIMITS.maxInFlightWrites.max,
    true
  );
});

test("write admission policy accepts custom bounds and rejects unsafe values", () => {
  assert.equal(normalizeWriteAdmissionPolicy({ maxInFlightWrites: 1 }).maxInFlightWrites, 1);
  assert.equal(normalizeWriteAdmissionPolicy({ maxInFlightWrites: 256 }).maxInFlightWrites, 256);

  for (const policy of [
    { maxInFlightWrites: 0 },
    { maxInFlightWrites: 257 },
    { maxInFlightWrites: 1.5 },
    { maxInFlightWrites: "1" },
    { maxInFlightWrites: true },
    { queueMode: "queue" },
    { unknownField: 1 },
    [],
    null,
  ]) {
    assert.throws(() => normalizeWriteAdmissionPolicy(policy), writeAdmissionPolicyErrorMatcher);
  }
});

test("write admission controller bounds capacity and releases idempotently", () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 2 });
  const first = controller.tryAcquire();
  const second = controller.tryAcquire();

  assert.equal(typeof first.release, "function");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(typeof second.release, "function");
  assert.equal(controller.tryAcquire(), null);
  assert.deepEqual(controller.snapshot(), {
    max_in_flight_writes: 2,
    active_write_count: 2,
    available_write_capacity: 0,
    saturated: true,
    queue_mode: "reject",
  });

  first.release();
  first.release();
  assert.equal(controller.snapshot().active_write_count, 1);
  second.release();
  second.release();
  assert.equal(controller.snapshot().active_write_count, 0);
  assert.equal(controller.snapshot().available_write_capacity, 2);
});

test("operation policy exposes exact frozen defaults in bounds", () => {
  const policy = normalizeOperationPolicy();

  assert.deepEqual(Object.keys(policy), Object.keys(DEFAULT_OPERATION_POLICY));
  assert.equal(Object.isFrozen(policy), true);
  assert.equal(policy.operationTimeoutMs, DEFAULT_OPERATION_POLICY.operationTimeoutMs);
  assert.equal(policy.cancelOnClientDisconnect, true);
  assert.equal(
    policy.operationTimeoutMs >= OPERATION_POLICY_LIMITS.operationTimeoutMs.min,
    true
  );
  assert.equal(
    policy.operationTimeoutMs <= OPERATION_POLICY_LIMITS.operationTimeoutMs.max,
    true
  );
});

test("operation policy accepts safe explicit values and rejects unsafe values", () => {
  assert.equal(normalizeOperationPolicy({ operationTimeoutMs: 50 }).operationTimeoutMs, 50);
  assert.equal(normalizeOperationPolicy({ operationTimeoutMs: 60_000 }).operationTimeoutMs, 60_000);
  assert.equal(normalizeOperationPolicy({ cancelOnClientDisconnect: false }).cancelOnClientDisconnect, false);

  for (const policy of [
    { operationTimeoutMs: 49 },
    { operationTimeoutMs: 60_001 },
    { operationTimeoutMs: 50.5 },
    { operationTimeoutMs: "50" },
    { operationTimeoutMs: true },
    { cancelOnClientDisconnect: "true" },
    { cancelOnClientDisconnect: 1 },
    { unknownField: 1 },
    [],
    null,
  ]) {
    assert.throws(() => normalizeOperationPolicy(policy), operationPolicyErrorMatcher);
  }
});

test("operation context timeout aborts with safe error and cleanup clears timer", async () => {
  let timeoutCallback;
  let cleared = false;
  const context = createOperationContext({
    policy: { operationTimeoutMs: 50 },
    setTimeoutImpl(callback) {
      timeoutCallback = callback;
      return "timer-id";
    },
    clearTimeoutImpl(id) {
      if (id === "timer-id") cleared = true;
    },
  });

  assert.equal(Object.isFrozen(context), true);
  assert.equal(context.getAbortKind(), "none");
  timeoutCallback();
  assert.equal(context.signal.aborted, true);
  assert.equal(context.getAbortKind(), "operation_timeout");
  assert.throws(() => throwIfOperationAborted(context.signal), (error) => {
    assert.equal(error.code, "operation_timeout");
    assert.equal(error.statusCode, 504);
    assert.equal(String(error.message).includes("50"), false);
    return true;
  });
  context.cleanup();
  context.cleanup();
  assert.equal(cleared, true);
});

test("operation context parent abort uses safe cancellation reason", () => {
  const parent = new AbortController();
  const context = createOperationContext({ parentSignal: parent.signal });

  parent.abort("raw parent reason should not leak");
  assert.equal(context.signal.aborted, true);
  assert.equal(context.getAbortKind(), "parent_cancelled");
  assert.equal(classifyOperationAbortKind(context.signal), "parent_cancelled");
  assert.throws(() => throwIfOperationAborted(context.signal), (error) => {
    assert.equal(error.code, "operation_cancelled");
    assert.equal(error.statusCode, 408);
    assert.equal(String(error.message).includes("raw parent"), false);
    return true;
  });
  context.cleanup();
});

test("runWithOperationContext races operation timeout without raw reason", async () => {
  let timeoutCallback;
  const context = createOperationContext({
    policy: { operationTimeoutMs: 50 },
    setTimeoutImpl(callback) {
      timeoutCallback = callback;
      return "timer-id";
    },
    clearTimeoutImpl() {},
  });
  const result = runWithOperationContext(context, () => new Promise(() => {}));
  timeoutCallback();

  await assert.rejects(result, (error) => {
    assert.equal(error.code, "operation_timeout");
    assert.equal(error.statusCode, 504);
    assert.equal(String(error.message).includes("timer-id"), false);
    return true;
  });
  context.cleanup();
});

test("write admission saturation returns safe 503 and keeps health available", async () => {
  const deferred = createDeferred();
  const service = createDeferredWriteService(deferred);
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });

  await withRouteServer(async (baseUrl) => {
    const first = postJson(`${baseUrl}/v1/orchestrate`, adapterPacket());
    await deferred.started;

    const second = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket("tts"));
    assertSafeError(second, 503, "server_busy");
    assert.equal(second.headers.retryAfter, "1");
    assert.equal(second.headers.connection, "close");
    assert.equal(JSON.stringify(second.body).includes("max_in_flight"), false);
    assert.equal(JSON.stringify(second.body).includes("active_write"), false);
    assert.equal(JSON.stringify(second.body).includes(FAKE_API_KEY), false);
    assert.equal(JSON.stringify(second.body).includes("/v1/orchestrate"), false);
    assert.equal(service.orchestrateCallCount(), 1);

    const health = await fetchJson(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
    assert.equal(JSON.stringify(health.body).includes("active_write"), false);

    deferred.resolve();
    const firstResponse = await first;
    assert.equal(firstResponse.status, 200);
    assert.equal(controller.snapshot().active_write_count, 0);

    const third = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket("tts"));
    assert.equal(third.status, 200);
  }, { apiKey: "", service, writeAdmissionController: controller });
});

test("write admission lease releases on service failure and invalid JSON", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  const failingService = {
    health: () => createVoxWeaveService().health(),
    async orchestrate() {
      throw new Error("unit service failure");
    },
  };

  await withRouteServer(async (baseUrl) => {
    const failed = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket());
    assertSafeError(failed, 500, "internal_error");
    assert.equal(controller.snapshot().active_write_count, 0);

    const invalid = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assertSafeError(invalid, 400, "invalid_json");
    assert.equal(controller.snapshot().active_write_count, 0);
  }, { service: failingService, writeAdmissionController: controller });
});

test("server passes operation signal to service and releases lease on operation timeout", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  let observedSignal;
  const service = {
    health: () => createVoxWeaveService().health(),
    async orchestrate(_payload, context) {
      observedSignal = context.signal;
      await new Promise(() => {});
    },
  };

  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket());

    assertSafeError(response, 504, "operation_timeout");
    assert.equal(observedSignal.aborted, true);
    assert.equal(classifyOperationAbortKind(observedSignal), "operation_timeout");
    assert.equal(controller.snapshot().active_write_count, 0);
    assert.equal(JSON.stringify(response.body).includes("50"), false);
    assert.equal(JSON.stringify(response.body).includes(FAKE_API_KEY), false);

    const next = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket("tts"));
    assertSafeError(next, 504, "operation_timeout");
    assert.equal(controller.snapshot().active_write_count, 0);
  }, {
    service,
    writeAdmissionController: controller,
    operationPolicy: { operationTimeoutMs: 50 },
  });
});

test("client disconnect after body completion cancels service signal and releases lease", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  const service = createSignalWaitingService();

  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    await sendCompleteWriteAndDestroyAfterServiceStart({
      host: url.hostname,
      port: Number(url.port),
      service,
    });

    await service.aborted;
    assert.equal(service.observedSignal().aborted, true);
    assert.equal(classifyOperationAbortKind(service.observedSignal()), "client_disconnect");
    await waitFor(() => controller.snapshot().active_write_count === 0);
    assert.equal(controller.snapshot().active_write_count, 0);

    const health = await fetchJson(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
  }, {
    service,
    writeAdmissionController: controller,
    operationPolicy: { operationTimeoutMs: 1_000 },
  });
});

test("write admission is not consumed before eligible write body handling", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });

  await withRouteServer(async (baseUrl) => {
    assertSafeError(await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket()), 401, "auth_required");
    assert.equal(controller.snapshot().active_write_count, 0);

    const unknown = await postJson(`${baseUrl}/unknown`, adapterPacket(), { "x-api-key": FAKE_API_KEY });
    assertSafeError(unknown, 404, "not_found");
    assert.equal(controller.snapshot().active_write_count, 0);

    const wrongContentType = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "text/plain", "x-api-key": FAKE_API_KEY },
      body: "{}",
    });
    assertSafeError(wrongContentType, 415, "unsupported_media_type");
    assert.equal(controller.snapshot().active_write_count, 0);

    const oversized = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": FAKE_API_KEY,
      },
      body: OVERSIZED_BODY,
    });
    assertSafeError(oversized, 413, "request_body_too_large");
    assert.equal(controller.snapshot().active_write_count, 0);
  }, { apiKey: FAKE_API_KEY, writeAdmissionController: controller });
});

test("request abort classification is safe and releases admission lease", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  const service = createCountingService();

  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    await sendPartialWriteAndDestroy({
      host: url.hostname,
      port: Number(url.port),
    });

    await waitFor(() => controller.snapshot().active_write_count === 0);
    assert.equal(service.orchestrateCallCount(), 0);
    assert.equal(controller.snapshot().active_write_count, 0);

    const health = await fetchJson(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
  }, { service, writeAdmissionController: controller });
});

test("request abort helper recognizes safe transport abort codes only", () => {
  assert.equal(isRequestAbortedError({ code: "ECONNRESET" }), true);
  assert.equal(isRequestAbortedError({ code: "ERR_STREAM_PREMATURE_CLOSE" }), true);
  assert.equal(isRequestAbortedError({ code: "EOTHER" }), false);
  assert.equal(isRequestAbortedError(null), false);
});

test("safe clientError response is generic and closes socket", async () => {
  const safe = buildSafeClientErrorResponse();
  assert.equal(safe.statusCode, 400);
  assert.equal(safe.body.error, "bad_request");
  assert.equal(safe.headers.connection, "close");
  assertNoForbiddenFields(safe.body);

  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    const response = parseRawHttpJson(await sendRawMalformedHttp({
      host: url.hostname,
      port: Number(url.port),
    }));

    assertSafeError(response, 400, "bad_request");
    assert.equal(response.headers.connection, "close");
    assert.equal(JSON.stringify(response.body).includes("HTTP"), false);
    assert.equal(JSON.stringify(response.body).includes("/v1/orchestrate"), false);
  });
});

test("Expect requests are rejected safely without service call or admission slot", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  const service = createCountingService();
  const safe = buildSafeExpectationFailedResponse();
  assert.equal(safe.statusCode, 417);
  assert.equal(safe.body.error, "expectation_failed");
  assert.equal(safe.headers.connection, "close");
  assertNoForbiddenFields(safe.body);

  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    const response = parseRawHttpJson(await sendExpectRequest({
      host: url.hostname,
      port: Number(url.port),
      expectValue: "100-continue",
    }));

    assertSafeError(response, 417, "expectation_failed");
    assert.equal(response.headers.connection, "close");
    assert.equal(service.orchestrateCallCount(), 0);
    assert.equal(controller.snapshot().active_write_count, 0);

    const health = await fetchJson(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
  }, { service, writeAdmissionController: controller });
});

test("unknown Expect value is rejected safely without retaining request body", async () => {
  const service = createCountingService();

  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    const response = parseRawHttpJson(await sendExpectRequest({
      host: url.hostname,
      port: Number(url.port),
      expectValue: "unit-test-expectation",
    }));

    assertSafeError(response, 417, "expectation_failed");
    assert.equal(response.headers.connection, "close");
    assert.equal(JSON.stringify(response.body).includes("unit-test-expectation"), false);
    assert.equal(service.orchestrateCallCount(), 0);
  }, { service });
});

test("safe startup summary excludes transport values", () => {
  const summary = buildSafeServerStartupSummary();

  assert.equal(summary.schema, SERVER_STARTUP_SUMMARY_SCHEMA);
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assert.equal(summary.max_connections, DEFAULT_SERVER_LIFECYCLE_POLICY.maxConnections);
  assert.equal(summary.shutdown_timeout_ms, DEFAULT_SERVER_LIFECYCLE_POLICY.shutdownTimeoutMs);
  assertNoForbiddenFields(summary);
  assert.equal(JSON.stringify(summary).includes("127.0.0.1"), false);
  assert.equal(JSON.stringify(summary).includes("9011"), false);
  assert.equal(JSON.stringify(summary).includes(FAKE_API_KEY), false);
});

test("safe shutdown helper returns bounded safe summary", async () => {
  const server = createVoxWeaveServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const summary = await closeVoxWeaveServer(server);

  assertSafeShutdownSummary(summary, "closed");
  assert.equal(summary.forced_connection_close, false);
  assert.equal(summary.idle_connection_close_attempted, true);
  assert.equal(summary.all_connection_close_attempted, false);
  assert.equal(server.listening, false);
});

test("safe shutdown helper returns not_listening summary without transport values", async () => {
  const summary = await closeVoxWeaveServer(null);

  assertSafeShutdownSummary(summary, "not_listening");
  assert.equal(summary.forced_connection_close, false);
  assert.equal(summary.idle_connection_close_attempted, false);
  assert.equal(summary.all_connection_close_attempted, false);
});

test("safe shutdown helper force closes active partial requests after bounded timeout", async () => {
  const server = createVoxWeaveServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const socket = createConnection({ host: "127.0.0.1", port: address.port });
  await new Promise((resolve, reject) => {
    socket.once("error", reject);
    socket.once("connect", resolve);
  });
  socket.write([
    "POST /v1/orchestrate HTTP/1.1",
    `Host: 127.0.0.1:${address.port}`,
    "Content-Type: application/json",
    "Content-Length: 64",
    "Connection: keep-alive",
    "",
    "{\"text\"",
  ].join("\r\n"));

  const summary = await closeVoxWeaveServer(server, { timeoutMs: 100 });

  assertSafeShutdownSummary(summary, "closed");
  assert.equal(summary.forced_connection_close, true);
  assert.equal(summary.idle_connection_close_attempted, true);
  assert.equal(summary.all_connection_close_attempted, true);
  assert.equal(server.listening, false);
  socket.destroy();
});

test("safe shutdown helper reports safe failure when force close is unavailable", async () => {
  let closeCallback;
  const fakeServer = {
    listening: true,
    close(callback) {
      closeCallback = callback;
    },
    closeIdleConnections() {},
  };

  const summary = await closeVoxWeaveServer(fakeServer, { timeoutMs: 100 });

  assert.equal(typeof closeCallback, "function");
  assertSafeShutdownSummary(summary, "server_shutdown_failed");
  assert.equal(summary.forced_connection_close, true);
  assert.equal(summary.idle_connection_close_attempted, true);
  assert.equal(summary.all_connection_close_attempted, false);
});

test("safe shutdown helper invokes closeAllConnections only after timeout", async () => {
  let closeCallback;
  let closeAllCalls = 0;
  const fakeServer = {
    listening: true,
    close(callback) {
      closeCallback = callback;
    },
    closeIdleConnections() {},
    closeAllConnections() {
      closeAllCalls += 1;
      closeCallback();
    },
  };

  const summary = await closeVoxWeaveServer(fakeServer, { timeoutMs: 100 });

  assertSafeShutdownSummary(summary, "closed");
  assert.equal(closeAllCalls, 1);
  assert.equal(summary.forced_connection_close, true);
  assert.equal(summary.all_connection_close_attempted, true);
});

test("safe shutdown helper keeps callback errors safe", async () => {
  const fakeServer = {
    listening: true,
    close(callback) {
      callback(new Error("unsafe callback detail"));
    },
    closeIdleConnections() {},
    closeAllConnections() {},
  };

  const summary = await closeVoxWeaveServer(fakeServer, { timeoutMs: 100 });

  assertSafeShutdownSummary(summary, "server_shutdown_failed");
  assert.equal(JSON.stringify(summary).includes("unsafe callback detail"), false);
});

function assertSafeShutdownSummary(summary, status) {
  assert.equal(summary.schema, SERVER_SHUTDOWN_SUMMARY_SCHEMA);
  if (status) assert.equal(summary.status, status);
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.shutdown_timeout_bounded, true);
  assert.equal(summary.transport_values_excluded, true);
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assertNoForbiddenFields(summary);
  const keys = Object.keys(summary).sort();
  assert.deepEqual(keys, [
    "all_connection_close_attempted",
    "forced_connection_close",
    "idle_connection_close_attempted",
    "production_readiness_claimed",
    "runtime_readiness_claimed",
    "safe_summary_only",
    "schema",
    "shutdown_timeout_bounded",
    "status",
    "transport_values_excluded",
  ]);
  assert.equal(JSON.stringify(summary).includes("127.0.0.1"), false);
  assert.equal(JSON.stringify(summary).includes("9011"), false);
  assert.equal(JSON.stringify(summary).includes("socket"), false);
  assert.equal(JSON.stringify(summary).includes("100"), false);
  assert.equal(JSON.stringify(summary).includes(FAKE_API_KEY), false);
}

test("Content-Length early guard rejects oversized declared body safely", () => {
  assert.doesNotThrow(() =>
    assertContentLengthWithinLimit({ headers: { "content-length": "512000" } })
  );
  assert.throws(
    () => assertContentLengthWithinLimit({ headers: { "content-length": "512001" } }),
    (error) => {
      assert.equal(error.code, "request_body_too_large");
      assert.equal(error.statusCode, 413);
      return true;
    }
  );
});

test("operational request lifecycle matrix keeps boundary decisions aligned", () => {
  const matrix = [
    {
      axis: "credential",
      accepted: constantTimeCredentialMatch(FAKE_API_KEY, FAKE_API_KEY),
      rejected: constantTimeCredentialMatch("wrong-unit-test-key", FAKE_API_KEY),
    },
    {
      axis: "request_target",
      accepted: parseCanonicalRequestTarget("/v1/orchestrate") === "/v1/orchestrate",
      rejected: parseCanonicalRequestTarget("/v1/orchestrate?debug=1") !== "",
    },
    {
      axis: "content_length",
      accepted: doesNotThrowStatus(() =>
        assertContentLengthWithinLimit({ headers: { "content-length": "512000" } })
      ),
      rejected: doesNotThrowStatus(() =>
        assertContentLengthWithinLimit({ headers: { "content-length": "512001" } })
      ),
    },
    {
      axis: "lifecycle",
      accepted: normalizeServerLifecyclePolicy({ maxRequestsPerSocket: 2 }).maxRequestsPerSocket === 2,
      rejected: doesNotThrowStatus(() => normalizeServerLifecyclePolicy({ requestTimeoutMs: -1 })),
    },
    {
      axis: "safe_snapshot",
      accepted: buildSafeServerStartupSummary().safe_summary_only === true,
      rejected: JSON.stringify(buildSafeServerStartupSummary()).includes("127.0.0.1"),
    },
  ];

  for (const row of matrix) {
    assert.equal(row.accepted, true, `${row.axis} accepted case`);
    assert.equal(row.rejected, false, `${row.axis} rejected case`);
  }
});

test("concurrency and backpressure regression matrix keeps local fake-only boundaries aligned", async () => {
  const controller = createWriteAdmissionController({ maxInFlightWrites: 1 });
  const firstLease = controller.tryAcquire();
  const saturatedLease = controller.tryAcquire();
  firstLease.release();

  const closedSummary = await closeVoxWeaveServer(null);
  const clientError = buildSafeClientErrorResponse();
  const expectationError = buildSafeExpectationFailedResponse();
  const temporaryServer = createVoxWeaveServer();
  const matrix = [
    ["strict_lifecycle_bounds", normalizeServerLifecyclePolicy().maxConnections > 0],
    ["connection_cap", temporaryServer.maxConnections === DEFAULT_SERVER_LIFECYCLE_POLICY.maxConnections],
    ["write_admission_release", controller.snapshot().active_write_count === 0],
    ["write_overload_rejection", saturatedLease === null],
    ["request_abort_classification", isRequestAbortedError({ code: "ECONNRESET" })],
    ["client_error_safe_response", clientError.statusCode === 400 && clientError.body.error === "bad_request"],
    ["expect_boundary", expectationError.statusCode === 417 && expectationError.body.error === "expectation_failed"],
    ["forced_shutdown_safe_summary", closedSummary.status === "not_listening"],
  ];

  await closeVoxWeaveServer(temporaryServer);
  for (const [name, passed] of matrix) {
    assert.equal(passed, true, name);
  }
  assertNoForbiddenFields(clientError.body);
  assertNoForbiddenFields(expectationError.body);
  assertNoForbiddenFields(closedSummary);
});

test("POST /v1/orchestrate without auth returns safe auth_required error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket());

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate accepts bearer fake key", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket(), {
      authorization: `Bearer ${FAKE_API_KEY}`,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.response_summary.bridge_status, "accepted");
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate accepts x-api-key fake key", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket(), {
      "x-api-key": FAKE_API_KEY,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.response_summary.bridge_status, "accepted");
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate rejects wrong API key with safe error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket(), {
      authorization: "Bearer wrong-unit-test-key",
    });

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("credential helpers use fixed length digest comparison", () => {
  const digest = credentialDigest(FAKE_API_KEY);

  assert.equal(Buffer.isBuffer(digest), true);
  assert.equal(digest.length, 32);
  assert.equal(constantTimeCredentialMatch(FAKE_API_KEY, FAKE_API_KEY), true);
  assert.equal(constantTimeCredentialMatch("wrong-unit-test-key", FAKE_API_KEY), false);
  assert.equal(constantTimeCredentialMatch("", FAKE_API_KEY), false);
  assert.equal(constantTimeCredentialMatch(FAKE_API_KEY, ""), false);
});

test("extractWriteCredential accepts exactly one supported credential source", () => {
  assert.equal(
    extractWriteCredential({
      headers: { authorization: `Bearer ${FAKE_API_KEY}` },
      rawHeaders: ["authorization", `Bearer ${FAKE_API_KEY}`],
    }),
    FAKE_API_KEY
  );
  assert.equal(
    extractWriteCredential({
      headers: { "x-api-key": FAKE_API_KEY },
      rawHeaders: ["x-api-key", FAKE_API_KEY],
    }),
    FAKE_API_KEY
  );
  assert.throws(
    () =>
      extractWriteCredential({
        headers: { authorization: `Bearer ${FAKE_API_KEY}`, "x-api-key": FAKE_API_KEY },
        rawHeaders: ["authorization", `Bearer ${FAKE_API_KEY}`, "x-api-key", FAKE_API_KEY],
      }),
    safeAuthErrorMatcher
  );
});

test("POST /v1/orchestrate rejects malformed bearer credential safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket(), {
      authorization: `Bearer ${FAKE_API_KEY} extra`,
    });

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate rejects multiple credential sources safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket(), {
      authorization: `Bearer ${FAKE_API_KEY}`,
      "x-api-key": FAKE_API_KEY,
    });

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate rejects duplicate authorization header safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postRawJsonWithDuplicateHeader(baseUrl, "Authorization");

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("POST /v1/orchestrate rejects duplicate x-api-key header safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postRawJsonWithDuplicateHeader(baseUrl, "x-api-key");

    assertSafeError(response, 401, "auth_required");
  }, { apiKey: FAKE_API_KEY });
});

test("canonical request target parser accepts exact safe route paths", () => {
  assert.equal(parseCanonicalRequestTarget("/health"), "/health");
  assert.equal(parseCanonicalRequestTarget("/v1/health"), "/v1/health");
  assert.equal(parseCanonicalRequestTarget("/v1/orchestrate"), "/v1/orchestrate");
  assert.equal(parseCanonicalRequestTarget("/v1/adapter/live2d"), "/v1/adapter/live2d");
  assert.equal(assertCanonicalRequestTarget("/v1/adapter/tts"), "/v1/adapter/tts");
});

test("canonical request target parser rejects normalized aliases", () => {
  const invalidTargets = [
    "",
    "*",
    "v1/orchestrate",
    "//v1/orchestrate",
    "/v1/orchestrate/",
    "/v1//orchestrate",
    "/v1/./orchestrate",
    "/v1/../v1/orchestrate",
    "/v1/%2e/orchestrate",
    "/v1/orchestrate?debug=1",
    "/v1/orchestrate#fragment",
    "/v1\\orchestrate",
    "http://127.0.0.1/v1/orchestrate",
  ];

  for (const target of invalidTargets) {
    assert.equal(parseCanonicalRequestTarget(target), "");
    assert.throws(() => assertCanonicalRequestTarget(target), safeRequestTargetErrorMatcher);
  }
});

test("absolute-form write request target is rejected before route handling", async () => {
  await withRouteServer(async (baseUrl) => {
    const url = new URL(baseUrl);
    const response = await postRawJsonRequestTarget(
      baseUrl,
      `http://${url.hostname}:${url.port}/v1/orchestrate`
    );

    assertSafeError(response, 400, "invalid_request_target");
  }, { apiKey: FAKE_API_KEY });
});

test("query-bearing write request target is rejected before route handling", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postRawJsonRequestTarget(baseUrl, "/v1/orchestrate?debug=1");

    assertSafeError(response, 400, "invalid_request_target");
  }, { apiKey: FAKE_API_KEY });
});

test("GET /v1/orchestrate returns safe 404 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`);

    assertSafeError(response, 404, "not_found");
  });
});

test("PUT /v1/orchestrate returns safe 404 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, { method: "PUT" });

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /unknown returns safe 404 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/unknown`, adapterPacket());

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /v1/adapter/unknown returns safe 404 not_found", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/unknown`, adapterPacket());

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /adapter/unknown returns safe 404 not_found", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/adapter/unknown`, adapterPacket());

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /v1/adapter/tts/extra returns safe 404 not_found", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/tts/extra`, adapterPacket());

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /adapter/live2d/extra returns safe 404 not_found", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/adapter/live2d/extra`, adapterPacket("live2d"));

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /v1/orchestrate missing content type returns safe unsupported media type", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      body: JSON.stringify(adapterPacket()),
    });

    assertSafeError(response, 415, "unsupported_media_type");
  });
});

test("POST /v1/orchestrate text/plain content type returns safe unsupported media type", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify(adapterPacket()),
    });

    assertSafeError(response, 415, "unsupported_media_type");
  });
});

test("POST /v1/orchestrate form content type returns safe unsupported media type", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "safe=value",
    });

    assertSafeError(response, 415, "unsupported_media_type");
  });
});

test("POST /v1/orchestrate accepts application/json charset content type", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(adapterPacket()),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  });
});

test("POST unknown route remains safe 404 without content type detail", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/unknown`, {
      method: "POST",
      body: JSON.stringify(adapterPacket()),
    });

    assertSafeError(response, 404, "not_found");
  });
});

test("POST /v1/orchestrate invalid JSON returns safe invalid_json error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    assertSafeError(response, 400, "invalid_json");
  });
});

test("POST /v1/orchestrate empty body follows safe default orchestration behavior", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "",
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.adapter_kind, "orchestrate");
    assert.equal(response.body.response_summary.bridge_status, "accepted");
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter keeps generic adapter validation boundary", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter`, adapterPacket("subtitle"));

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.adapter_kind, "subtitle");
    assertSafeHeaders(response);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/tts rejects subtitle adapter kind mismatch safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/tts`, adapterPacket("subtitle"));

    assertSafeError(response, 400, "adapter_kind_mismatch");
  });
});

test("POST /v1/adapter/subtitle rejects live2d adapter kind mismatch safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/subtitle`, adapterPacket("live2d"));

    assertSafeError(response, 400, "adapter_kind_mismatch");
  });
});

test("POST /v1/orchestrate rejects forbidden input field command", async () => {
  await assertUnsafePayload({ command: "blocked" });
});

test("POST /v1/orchestrate rejects forbidden input field raw_audio", async () => {
  await assertUnsafePayload({ raw_audio: "blocked" });
});

test("POST /v1/orchestrate rejects forbidden input field endpoint", async () => {
  await assertUnsafePayload({ endpoint: "blocked" });
});

test("POST /v1/orchestrate rejects unsafe transport string", async () => {
  await assertUnsafePayload({ final_text: "blocked https://example.invalid/unit" });
});

test("POST /v1/orchestrate rejects oversized body safely", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: OVERSIZED_BODY,
    });

    assertSafeError(response, 413, "request_body_too_large");
  });
});

test("safe error responses never include forbidden raw fields", async () => {
  await withRouteServer(async (baseUrl) => {
    const responses = [
      await fetchJson(`${baseUrl}/missing`),
      await postJson(`${baseUrl}/v1/adapter/tts`, adapterPacket("subtitle")),
      await postJson(`${baseUrl}/v1/orchestrate`, {
        ...adapterPacket(),
        command: "blocked",
      }),
    ];

    for (const response of responses) {
      assert.equal(response.body.ok, false);
      assertSafeHeaders(response);
      assertNoForbiddenFields(response.body);
    }
  });
});

test("success and safe error responses use JSON content type and no-store cache control", async () => {
  await withRouteServer(async (baseUrl) => {
    const success = await postJson(`${baseUrl}/v1/orchestrate`, adapterPacket());
    const failure = await fetchJson(`${baseUrl}/missing`);

    assert.equal(success.status, 200);
    assertSafeHeaders(success);
    assertSafeError(failure, 404, "not_found");
  });
});

async function assertUnsafePayload(extraPayload) {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, {
      ...adapterPacket(),
      ...extraPayload,
    });

    assertSafeError(response, 400, "unsafe_payload");
  });
}

async function withRouteServer(
  callback,
  {
    apiKey = "",
    service = createVoxWeaveService({
      now: () => 1_777_000_000_000,
      live2dForwarder: {
        configured: false,
        scope: "not_configured",
        async forward() {
          return {
            renderer_forward_configured: false,
            renderer_forward_scope: "not_configured",
            renderer_forward_attempted: false,
            renderer_forward_ok: false,
            renderer_forward_status: "dry_run",
          };
        },
      },
    }),
    writeAdmissionController,
    operationPolicy,
  } = {}
) {
  const previousApiKey = process.env.VOXWEAVE_API_KEY;
  if (apiKey) {
    process.env.VOXWEAVE_API_KEY = apiKey;
  } else {
    delete process.env.VOXWEAVE_API_KEY;
  }

  const server = createVoxWeaveServer({ service, writeAdmissionController, operationPolicy });
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.equal(address.address, "127.0.0.1");
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await closeServer(server);
    restoreApiKey(previousApiKey);
  }
  assert.equal(server.listening, false);
  assert.equal(process.env.VOXWEAVE_API_KEY, previousApiKey);
}

async function closeServer(server) {
  if (!server.listening) return;
  const forceCloseTimer = setTimeout(() => {
    server.closeAllConnections?.();
  }, 25);
  await Promise.race([
    new Promise((resolve, reject) =>
      server.close((error) => {
        clearTimeout(forceCloseTimer);
        error ? reject(error) : resolve();
      })
    ),
    new Promise((_, reject) =>
      setTimeout(() => {
        clearTimeout(forceCloseTimer);
        reject(new Error("server_close_timeout"));
      }, 1000)
    ),
  ]);
}

function restoreApiKey(previousApiKey) {
  if (previousApiKey === undefined) {
    delete process.env.VOXWEAVE_API_KEY;
  } else {
    process.env.VOXWEAVE_API_KEY = previousApiKey;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  return {
    status: response.status,
    headers: {
      cacheControl: response.headers.get("cache-control"),
      connection: response.headers.get("connection"),
      contentType: response.headers.get("content-type"),
      nosniff: response.headers.get("x-content-type-options"),
      retryAfter: response.headers.get("retry-after"),
    },
    body: await response.json(),
  };
}

async function postJson(url, payload, headers = {}) {
  return fetchJson(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

function assertSafeError(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.error, code);
  if ("error_kind" in response.body) assert.equal(response.body.error_kind, code);
  assertSafeHeaders(response);
  assertNoForbiddenFields(response.body);
}

function assertSafeHeaders(response) {
  assert.match(response.headers.contentType, /^application\/json\b/);
  assert.equal(response.headers.cacheControl, "no-store");
  assert.equal(response.headers.nosniff, "nosniff");
}

function safeBindErrorMatcher(error) {
  assert.equal(error.code, "unsafe_server_bind");
  assert.equal(error.statusCode, 500);
  assert.equal(String(error.message).includes("0.0.0.0"), false);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  return true;
}

function lifecyclePolicyErrorMatcher(error) {
  assert.equal(error.code, "invalid_server_lifecycle_policy");
  assert.equal(error.statusCode, 500);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  assert.equal(String(error.message).includes("127.0.0.1"), false);
  assert.equal(String(error.message).includes("9011"), false);
  return true;
}

function writeAdmissionPolicyErrorMatcher(error) {
  assert.equal(error.code, "invalid_write_admission_policy");
  assert.equal(error.statusCode, 500);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  assert.equal(String(error.message).includes("256"), false);
  return true;
}

function operationPolicyErrorMatcher(error) {
  assert.equal(error.code, "invalid_operation_policy");
  assert.equal(error.statusCode, 500);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  assert.equal(String(error.message).includes("50"), false);
  assert.equal(String(error.message).includes("60000"), false);
  return true;
}

function safeAuthErrorMatcher(error) {
  assert.equal(error.code, "auth_required");
  assert.equal(error.statusCode, 401);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  return true;
}

function createDeferred() {
  let resolve;
  const wait = new Promise((done) => {
    resolve = done;
  });
  let startedResolve;
  const started = new Promise((done) => {
    startedResolve = done;
  });
  return {
    resolve,
    wait,
    started,
    startedResolve,
  };
}

function createDeferredWriteService(deferred) {
  const realService = createVoxWeaveService();
  let calls = 0;
  return {
    health: () => realService.health(),
    orchestrateCallCount: () => calls,
    async orchestrate(payload, context) {
      calls += 1;
      deferred.startedResolve();
      await deferred.wait;
      return realService.orchestrate(payload, context);
    },
  };
}

function createCountingService() {
  const realService = createVoxWeaveService();
  let calls = 0;
  return {
    health: () => realService.health(),
    orchestrateCallCount: () => calls,
    async orchestrate(payload, context) {
      calls += 1;
      return realService.orchestrate(payload, context);
    },
  };
}

function createSignalWaitingService() {
  const realService = createVoxWeaveService();
  let signal;
  let startedResolve;
  let abortedResolve;
  const started = new Promise((resolve) => {
    startedResolve = resolve;
  });
  const aborted = new Promise((resolve) => {
    abortedResolve = resolve;
  });
  return {
    health: () => realService.health(),
    started,
    aborted,
    observedSignal: () => signal,
    async orchestrate(_payload, context) {
      signal = context.signal;
      startedResolve();
      if (signal.aborted) {
        abortedResolve();
        throwIfOperationAborted(signal);
      }
      await new Promise((resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            abortedResolve();
            try {
              throwIfOperationAborted(signal);
            } catch (error) {
              reject(error);
            }
            resolve();
          },
          { once: true }
        );
      });
    },
  };
}

function safeRequestTargetErrorMatcher(error) {
  assert.equal(error.code, "invalid_request_target");
  assert.equal(error.statusCode, 400);
  assert.equal(String(error.message).includes("/v1/orchestrate"), false);
  return true;
}

function doesNotThrowStatus(callback) {
  try {
    callback();
    return true;
  } catch {
    return false;
  }
}

async function postRawJsonWithDuplicateHeader(baseUrl, headerName) {
  return postRawJsonRequestTarget(baseUrl, "/v1/orchestrate", [
    `${headerName}: ${FAKE_API_KEY}`,
    `${headerName}: ${FAKE_API_KEY}`,
  ]);
}

async function postRawJsonRequestTarget(baseUrl, requestTarget, extraHeaderLines = [
  `x-api-key: ${FAKE_API_KEY}`,
]) {
  const url = new URL(baseUrl);
  const body = JSON.stringify(adapterPacket());
  const rawResponse = await sendRawHttpRequest({
    host: url.hostname,
    port: Number(url.port),
    requestLines: [
      `POST ${requestTarget} HTTP/1.1`,
      `Host: ${url.hostname}:${url.port}`,
      "Content-Type: application/json",
      `Content-Length: ${Buffer.byteLength(body)}`,
      ...extraHeaderLines,
      "Connection: close",
      "",
      body,
    ],
  });
  return parseRawHttpJson(rawResponse);
}

async function sendRawHttpRequest({ host, port, requestLines }) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    const chunks = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    socket.setTimeout(1000, () => {
      socket.destroy();
      finish();
    });
    socket.on("connect", () => {
      socket.write(requestLines.join("\r\n"));
    });
    socket.on("data", (chunk) => {
      chunks.push(chunk);
    });
    socket.on("error", (error) => {
      if (settled) return;
      reject(error);
    });
    socket.on("end", finish);
    socket.on("close", finish);
  });
}

async function sendRawMalformedHttp({ host, port }) {
  return sendRawHttpRequest({
    host,
    port,
    requestLines: [
      "POST /v1/orchestrate HTTP/1.1",
      `Host: ${host}:${port}`,
      "Content-Length: not-a-number",
      "Connection: close",
      "",
      "",
    ],
  });
}

async function sendExpectRequest({ host, port, expectValue }) {
  const body = JSON.stringify(adapterPacket());
  return sendRawHttpRequest({
    host,
    port,
    requestLines: [
      "POST /v1/orchestrate HTTP/1.1",
      `Host: ${host}:${port}`,
      "Content-Type: application/json",
      `Content-Length: ${Buffer.byteLength(body)}`,
      `Expect: ${expectValue}`,
      "Connection: close",
      "",
      body,
    ],
  });
}

async function sendPartialWriteAndDestroy({ host, port }) {
  await new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    socket.setTimeout(1000, () => {
      socket.destroy();
      finish();
    });
    socket.on("connect", () => {
      socket.write([
        "POST /v1/orchestrate HTTP/1.1",
        `Host: ${host}:${port}`,
        "Content-Type: application/json",
        "Content-Length: 64",
        "Connection: close",
        "",
        "{\"text\"",
      ].join("\r\n"));
      setTimeout(() => socket.destroy(), 10);
    });
    socket.on("error", (error) => {
      if (error?.code === "ECONNRESET") {
        finish();
        return;
      }
      reject(error);
    });
    socket.on("close", finish);
  });
}

async function sendCompleteWriteAndDestroyAfterServiceStart({ host, port, service }) {
  await new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    socket.setTimeout(1000, () => {
      socket.destroy();
      finish();
    });
    socket.on("connect", async () => {
      const body = JSON.stringify(adapterPacket());
      socket.write([
        "POST /v1/orchestrate HTTP/1.1",
        `Host: ${host}:${port}`,
        "Content-Type: application/json",
        `Content-Length: ${Buffer.byteLength(body)}`,
        "Connection: close",
        "",
        body,
      ].join("\r\n"));
      await service.started;
      socket.destroy();
      finish();
    });
    socket.on("error", (error) => {
      if (error?.code === "ECONNRESET") {
        finish();
        return;
      }
      reject(error);
    });
    socket.on("close", finish);
  });
}

async function waitFor(predicate) {
  const deadline = Date.now() + 1000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(predicate(), true);
}

function parseRawHttpJson(rawResponse) {
  const [headerBlock, rawBody = "{}"] = rawResponse.split("\r\n\r\n");
  const status = Number(headerBlock.match(/^HTTP\/1\.1\s+(\d+)/u)?.[1] ?? 0);
  const headers = Object.fromEntries(
    headerBlock
      .split("\r\n")
      .slice(1)
      .map((line) => {
        const separator = line.indexOf(":");
        return [
          line.slice(0, separator).trim().toLowerCase(),
          line.slice(separator + 1).trim(),
        ];
      })
  );
  return {
    status,
    headers: {
      cacheControl: headers["cache-control"],
      connection: headers["connection"],
      contentType: headers["content-type"],
      nosniff: headers["x-content-type-options"],
    },
    body: JSON.parse(
      headers["transfer-encoding"] === "chunked" ? decodeChunkedBody(rawBody) : rawBody
    ),
  };
}

function decodeChunkedBody(rawBody) {
  let offset = 0;
  let decoded = "";
  while (offset < rawBody.length) {
    const lineEnd = rawBody.indexOf("\r\n", offset);
    if (lineEnd === -1) break;
    const size = Number.parseInt(rawBody.slice(offset, lineEnd), 16);
    if (!Number.isFinite(size) || size <= 0) break;
    const chunkStart = lineEnd + 2;
    decoded += rawBody.slice(chunkStart, chunkStart + size);
    offset = chunkStart + size + 2;
  }
  return decoded || "{}";
}

function assertNoForbiddenFields(value) {
  const stack = [{ value, path: "root" }];
  while (stack.length) {
    const current = stack.pop();
    if (!current || current.value === null || typeof current.value !== "object") continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) =>
        stack.push({ value: item, path: `${current.path}[${index}]` })
      );
      continue;
    }
    for (const [key, child] of Object.entries(current.value)) {
      assert.equal(
        FORBIDDEN_RESPONSE_KEYS.has(key),
        false,
        `forbidden response key at ${current.path}.${key}`
      );
      stack.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}
