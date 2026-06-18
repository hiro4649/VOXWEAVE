import assert from "node:assert/strict";
import { test } from "node:test";
import { createLive2dForwarder } from "../src/live2dForwarder.js";
import { VoxWeaveError } from "../src/errors.js";
import { createOperationContext } from "../src/operationContext.js";

const FORBIDDEN_SUMMARY_KEYS = new Set([
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
  "cue_body",
  "raw_payload",
  "command",
  "commands",
  "canonical_envelope",
]);

const SAFE_CUE = Object.freeze({
  schema: "iris_live2d_renderer_cue_delivery_v1",
  cue_id: "cue-safe",
  cue: {
    schema: "iris_live2d_renderer_cue_v1",
    motion: { style: "talk" },
  },
});

function assertNoForbiddenSummaryFields(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_SUMMARY_KEYS.has(key), false);
      stack.push(child);
    }
  }
}

function makeFetch({ ok = true, rejectWith } = {}) {
  const calls = [];
  const fetchImpl = async (target, options) => {
    calls.push({ target, options });
    if (rejectWith) throw rejectWith;
    return { ok };
  };
  return { calls, fetchImpl };
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

async function forwardWith({ endpoint, apiKey, fetchImpl, timeoutMs = 25, signal }) {
  return createLive2dForwarder({ endpoint, apiKey, fetchImpl, timeoutMs }).forward(SAFE_CUE, { signal });
}

test("no endpoint returns dry-run summary without forwarding", async () => {
  const { calls, fetchImpl } = makeFetch();
  const forwarder = createLive2dForwarder({ endpoint: "", fetchImpl });
  const summary = await forwarder.forward(SAFE_CUE);

  assert.equal(forwarder.configured, false);
  assert.equal(forwarder.scope, "not_configured");
  assert.equal(summary.renderer_forward_configured, false);
  assert.equal(summary.renderer_forward_scope, "not_configured");
  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "dry_run");
  assert.equal(calls.length, 0);
  assertNoForbiddenSummaryFields(summary);
});

test("forward without endpoint is not attempted", async () => {
  const summary = await forwardWith({ endpoint: "", fetchImpl: makeFetch().fetchImpl });

  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_status, "dry_run");
  assertNoForbiddenSummaryFields(summary);
});

test("invalid scheme returns configured unusable safe summary", async () => {
  const { calls, fetchImpl } = makeFetch();
  const summary = await forwardWith({ endpoint: "ftp://localhost/live2d-engine", fetchImpl });

  assert.equal(summary.renderer_forward_configured, true);
  assert.equal(summary.renderer_forward_scope, "blocked");
  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_status, "configured_unusable");
  assert.equal(calls.length, 0);
  assertNoForbiddenSummaryFields(summary);
});

test("credentials, query, and fragment endpoints are blocked", async () => {
  const blockedEndpoints = [
    "http://user:pass@localhost/live2d-engine",
    "http://localhost/live2d-engine?mode=test",
    "http://localhost/live2d-engine#cue",
  ];

  for (const endpoint of blockedEndpoints) {
    const { calls, fetchImpl } = makeFetch();
    const summary = await forwardWith({ endpoint, fetchImpl });
    assert.equal(summary.renderer_forward_scope, "blocked");
    assert.equal(summary.renderer_forward_attempted, false);
    assert.equal(summary.renderer_forward_status, "configured_unusable");
    assert.equal(calls.length, 0);
    assertNoForbiddenSummaryFields(summary);
  }
});

test("localhost 127 and IPv6 loopback endpoints are accepted by fake fetch", async () => {
  for (const endpoint of [
    "http://localhost/live2d-engine",
    "http://localhost./live2d-engine",
    "http://127.0.0.1/live2d-engine",
    "http://127.4.5.6/live2d-engine",
    "http://[::1]/live2d-engine",
  ]) {
    const { calls, fetchImpl } = makeFetch({ ok: true });
    const summary = await forwardWith({ endpoint, fetchImpl });

    assert.equal(summary.renderer_forward_scope, "loopback");
    assert.equal(summary.renderer_forward_attempted, true);
    assert.equal(summary.renderer_forward_ok, true);
    assert.equal(summary.renderer_forward_status, "accepted");
    assert.equal(calls.length, 1);
    assertNoForbiddenSummaryFields(summary);
  }
});

test("loopback-looking hostnames are blocked before fake fetch", async () => {
  for (const endpoint of [
    "http://127.example.invalid/live2d-engine",
    "http://127.0.0.1.example.invalid/live2d-engine",
    "http://localhost.example.invalid/live2d-engine",
  ]) {
    const { calls, fetchImpl } = makeFetch({ ok: true });
    const summary = await forwardWith({ endpoint, fetchImpl });

    assert.equal(summary.renderer_forward_configured, true);
    assert.equal(summary.renderer_forward_scope, "blocked");
    assert.equal(summary.renderer_forward_attempted, false);
    assert.equal(summary.renderer_forward_ok, false);
    assert.equal(summary.renderer_forward_status, "configured_unusable");
    assert.equal(calls.length, 0);
    assertNoForbiddenSummaryFields(summary);
  }
});

test("private IPv4 endpoints are blocked before fake fetch", async () => {
  for (const endpoint of ["http://10.0.0.5/live2d-engine", "http://172.16.0.5/live2d-engine", "http://172.31.0.5/live2d-engine", "http://192.168.0.5/live2d-engine"]) {
    const { calls, fetchImpl } = makeFetch({ ok: true });
    const summary = await forwardWith({ endpoint, fetchImpl });

    assert.equal(summary.renderer_forward_configured, true);
    assert.equal(summary.renderer_forward_scope, "blocked");
    assert.equal(summary.renderer_forward_attempted, false);
    assert.equal(summary.renderer_forward_ok, false);
    assert.equal(summary.renderer_forward_status, "configured_unusable");
    assert.equal(calls.length, 0);
    assertNoForbiddenSummaryFields(summary);
  }
});

test("public endpoint is blocked before fake fetch", async () => {
  const { calls, fetchImpl } = makeFetch();
  const summary = await forwardWith({ endpoint: "https://example.invalid/live2d-engine", fetchImpl });

  assert.equal(summary.renderer_forward_scope, "blocked");
  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_status, "configured_unusable");
  assert.equal(calls.length, 0);
  assertNoForbiddenSummaryFields(summary);
});

test("non-loopback IPv6 endpoint is blocked before fake fetch", async () => {
  const { calls, fetchImpl } = makeFetch();
  const summary = await forwardWith({ endpoint: "http://[2001:db8::1]/live2d-engine", fetchImpl });

  assert.equal(summary.renderer_forward_scope, "blocked");
  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_status, "configured_unusable");
  assert.equal(calls.length, 0);
  assertNoForbiddenSummaryFields(summary);
});

test("root path defaults to live2d engine path for fake fetch target", async () => {
  const { calls, fetchImpl } = makeFetch({ ok: true });
  const summary = await forwardWith({ endpoint: "http://localhost/", fetchImpl });

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(new URL(calls[0].target).pathname, "/live2d-engine");
  assertNoForbiddenSummaryFields(summary);
});

test("cue path is preserved for fake fetch target", async () => {
  const { calls, fetchImpl } = makeFetch({ ok: true });
  const summary = await forwardWith({ endpoint: "http://localhost/cue", fetchImpl });

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(new URL(calls[0].target).pathname, "/cue");
  assertNoForbiddenSummaryFields(summary);
});

test("custom path appends live2d engine path for fake fetch target", async () => {
  const { calls, fetchImpl } = makeFetch({ ok: true });
  const summary = await forwardWith({ endpoint: "http://localhost/render", fetchImpl });

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(new URL(calls[0].target).pathname, "/render/live2d-engine");
  assertNoForbiddenSummaryFields(summary);
});

test("fake fetch ok true returns accepted summary", async () => {
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ ok: true }).fetchImpl,
  });

  assert.equal(summary.renderer_forward_ok, true);
  assert.equal(summary.renderer_forward_status, "accepted");
  assertNoForbiddenSummaryFields(summary);
});

test("fake fetch ok false returns renderer rejected summary", async () => {
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ ok: false }).fetchImpl,
  });

  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "renderer_rejected");
  assertNoForbiddenSummaryFields(summary);
});

test("fake fetch receives JSON content type", async () => {
  const { calls, fetchImpl } = makeFetch({ ok: true });
  const summary = await forwardWith({ endpoint: "http://localhost/live2d-engine", fetchImpl });

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.redirect, "error");
  assert.equal(calls[0].options.headers["content-type"], "application/json");
  assert.equal(typeof calls[0].options.body, "string");
  assertNoForbiddenSummaryFields(summary);
});

test("redirect failure returns renderer unreachable summary without target material", async () => {
  const redirectError = new TypeError("fake redirect blocked");
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ rejectWith: redirectError }).fetchImpl,
  });

  assert.equal(summary.renderer_forward_attempted, true);
  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "renderer_unreachable");
  assertNoForbiddenSummaryFields(summary);
});

test("api key header is only present when fake api key is provided", async () => {
  const withoutKey = makeFetch({ ok: true });
  const withKey = makeFetch({ ok: true });

  await forwardWith({ endpoint: "http://localhost/live2d-engine", fetchImpl: withoutKey.fetchImpl });
  await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    apiKey: "fake-live2d-key",
    fetchImpl: withKey.fetchImpl,
  });

  assert.equal(Object.hasOwn(withoutKey.calls[0].options.headers, "x-api-key"), false);
  assert.equal(Object.hasOwn(withKey.calls[0].options.headers, "x-api-key"), true);
});

test("abort error returns renderer timeout summary", async () => {
  const timeoutError = new Error("fake abort");
  timeoutError.name = "AbortError";
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ rejectWith: timeoutError }).fetchImpl,
  });

  assert.equal(summary.renderer_forward_attempted, true);
  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "renderer_timeout");
  assertNoForbiddenSummaryFields(summary);
});

test("pre-aborted parent signal rejects safely before fake fetch", async () => {
  const { calls, fetchImpl } = makeFetch({ ok: true });
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  operation.abort("client_disconnect");

  await assert.rejects(
    async () =>
      forwardWith({
        endpoint: "http://localhost/live2d-engine",
        fetchImpl,
        signal: operation.signal,
      }),
    assertSafeOperationCancellation
  );

  assert.equal(calls.length, 0);
  operation.cleanup();
});

test("parent abort during fetch rejects operation cancellation not renderer timeout", async () => {
  const started = makeDeferred();
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  const fetchImpl = async (_target, options) => {
    started.resolve(options.signal);
    await new Promise((resolve) => options.signal.addEventListener("abort", resolve, { once: true }));
    const error = new Error("fake parent abort");
    error.name = "AbortError";
    throw error;
  };

  const result = forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl,
    signal: operation.signal,
    timeoutMs: 500,
  });
  await started.promise;
  operation.abort("client_disconnect");

  await assert.rejects(result, assertSafeOperationCancellation);
  operation.cleanup();
});

test("local timeout remains renderer timeout when parent signal is active", async () => {
  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  const fetchImpl = async (_target, options) => {
    await new Promise((resolve) => options.signal.addEventListener("abort", resolve, { once: true }));
    const error = new Error("fake local timeout");
    error.name = "AbortError";
    throw error;
  };

  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl,
    signal: operation.signal,
    timeoutMs: 5,
  });

  assert.equal(summary.renderer_forward_attempted, true);
  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "renderer_timeout");
  assertNoForbiddenSummaryFields(summary);
  operation.cleanup();
});

test("Live2D cancellation regression matrix distinguishes parent cancel from local renderer outcomes", async () => {
  const accepted = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ ok: true }).fetchImpl,
  });
  assert.equal(accepted.renderer_forward_status, "accepted");
  assertNoForbiddenSummaryFields(accepted);

  const rejected = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ ok: false }).fetchImpl,
  });
  assert.equal(rejected.renderer_forward_status, "renderer_rejected");
  assertNoForbiddenSummaryFields(rejected);

  const unreachable = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ rejectWith: new Error("fake unreachable") }).fetchImpl,
  });
  assert.equal(unreachable.renderer_forward_status, "renderer_unreachable");
  assertNoForbiddenSummaryFields(unreachable);

  const localTimeoutError = new Error("fake local timeout");
  localTimeoutError.name = "AbortError";
  const localTimeout = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ rejectWith: localTimeoutError }).fetchImpl,
  });
  assert.equal(localTimeout.renderer_forward_status, "renderer_timeout");
  assertNoForbiddenSummaryFields(localTimeout);

  const operation = createOperationContext({ policy: { operationTimeoutMs: 1_000 } });
  operation.abort("client_disconnect");
  await assert.rejects(
    async () =>
      forwardWith({
        endpoint: "http://localhost/live2d-engine",
        fetchImpl: makeFetch({ ok: true }).fetchImpl,
        signal: operation.signal,
      }),
    assertSafeOperationCancellation
  );
  operation.cleanup();
});

test("generic fetch error returns renderer unreachable summary", async () => {
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ rejectWith: new Error("fake fetch failure") }).fetchImpl,
  });

  assert.equal(summary.renderer_forward_attempted, true);
  assert.equal(summary.renderer_forward_ok, false);
  assert.equal(summary.renderer_forward_status, "renderer_unreachable");
  assertNoForbiddenSummaryFields(summary);
});

test("missing fetch implementation returns configured unusable summary", async () => {
  const summary = await forwardWith({ endpoint: "http://localhost/live2d-engine", fetchImpl: null });

  assert.equal(summary.renderer_forward_scope, "blocked");
  assert.equal(summary.renderer_forward_attempted, false);
  assert.equal(summary.renderer_forward_status, "configured_unusable");
  assertNoForbiddenSummaryFields(summary);
});

test("timeout timer is cleared after forward completes", async () => {
  let signal;
  const fetchImpl = async (_target, options) => {
    signal = options.signal;
    return { ok: true };
  };

  const summary = await forwardWith({ endpoint: "http://localhost/live2d-engine", fetchImpl, timeoutMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(signal.aborted, false);
  assertNoForbiddenSummaryFields(summary);
});

test("parent abort listener is removed after forward completes", async () => {
  let listenerCount = 0;
  const parentSignal = {
    aborted: false,
    addEventListener(event) {
      if (event === "abort") listenerCount += 1;
    },
    removeEventListener(event) {
      if (event === "abort") listenerCount -= 1;
    },
  };

  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    fetchImpl: makeFetch({ ok: true }).fetchImpl,
    signal: parentSignal,
  });

  assert.equal(summary.renderer_forward_status, "accepted");
  assert.equal(listenerCount, 0);
  assertNoForbiddenSummaryFields(summary);
});

test("summary never exposes endpoint, key, cue body, or forbidden fields", async () => {
  const summary = await forwardWith({
    endpoint: "http://localhost/live2d-engine",
    apiKey: "fake-live2d-key",
    fetchImpl: makeFetch({ ok: true }).fetchImpl,
  });

  assert.deepEqual(Object.keys(summary).sort(), [
    "renderer_forward_attempted",
    "renderer_forward_configured",
    "renderer_forward_ok",
    "renderer_forward_scope",
    "renderer_forward_status",
  ]);
  assertNoForbiddenSummaryFields(summary);
});
