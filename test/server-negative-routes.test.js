import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";

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
