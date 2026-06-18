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
  createVoxWeaveServer,
  DEFAULT_SERVER_LIFECYCLE_POLICY,
  extractWriteCredential,
  buildSafeServerStartupSummary,
  normalizeServerLifecyclePolicy,
  parseCanonicalRequestTarget,
  SERVER_SHUTDOWN_SUMMARY_SCHEMA,
  SERVER_STARTUP_SUMMARY_SCHEMA,
  startServer,
} from "../src/server.js";

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
  } finally {
    await closeVoxWeaveServer(server);
  }
});

test("server lifecycle policy normalizes invalid values", () => {
  const policy = normalizeServerLifecyclePolicy({
    requestTimeoutMs: -1,
    headersTimeoutMs: 0,
    keepAliveTimeoutMs: "bad",
    maxRequestsPerSocket: 2,
    maxHeadersCount: 3,
  });

  assert.equal(policy.requestTimeoutMs, DEFAULT_SERVER_LIFECYCLE_POLICY.requestTimeoutMs);
  assert.equal(policy.headersTimeoutMs, DEFAULT_SERVER_LIFECYCLE_POLICY.headersTimeoutMs);
  assert.equal(policy.keepAliveTimeoutMs, DEFAULT_SERVER_LIFECYCLE_POLICY.keepAliveTimeoutMs);
  assert.equal(policy.maxRequestsPerSocket, 2);
  assert.equal(policy.maxHeadersCount, 3);
});

test("safe startup summary excludes transport values", () => {
  const summary = buildSafeServerStartupSummary();

  assert.equal(summary.schema, SERVER_STARTUP_SUMMARY_SCHEMA);
  assert.equal(summary.safe_summary_only, true);
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assertNoForbiddenFields(summary);
  assert.equal(JSON.stringify(summary).includes("127.0.0.1"), false);
  assert.equal(JSON.stringify(summary).includes("9011"), false);
});

test("safe shutdown helper returns bounded safe summary", async () => {
  const server = createVoxWeaveServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const summary = await closeVoxWeaveServer(server);

  assert.equal(summary.schema, SERVER_SHUTDOWN_SUMMARY_SCHEMA);
  assert.equal(summary.status, "closed");
  assert.equal(summary.safe_summary_only, true);
  assert.equal(server.listening, false);
  assertNoForbiddenFields(summary);
});

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
      rejected: normalizeServerLifecyclePolicy({ requestTimeoutMs: -1 }).requestTimeoutMs === -1,
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

async function withRouteServer(callback, { apiKey = "" } = {}) {
  const previousApiKey = process.env.VOXWEAVE_API_KEY;
  if (apiKey) {
    process.env.VOXWEAVE_API_KEY = apiKey;
  } else {
    delete process.env.VOXWEAVE_API_KEY;
  }

  const service = createVoxWeaveService({
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
  });
  const server = createVoxWeaveServer({ service });
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
  await Promise.race([
    new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("server_close_timeout")), 1000)
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
      contentType: response.headers.get("content-type"),
      nosniff: response.headers.get("x-content-type-options"),
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

function safeAuthErrorMatcher(error) {
  assert.equal(error.code, "auth_required");
  assert.equal(error.statusCode, 401);
  assert.equal(String(error.message).includes(FAKE_API_KEY), false);
  return true;
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
    socket.setTimeout(1000, () => {
      socket.destroy(new Error("raw_http_timeout"));
    });
    socket.on("connect", () => {
      socket.write(requestLines.join("\r\n"));
    });
    socket.on("data", (chunk) => {
      chunks.push(chunk);
    });
    socket.on("error", reject);
    socket.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
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
