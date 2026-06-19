import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { createVoxWeaveService } from "./orchestrator.js";
import { VoxWeaveError, toSafeError } from "./errors.js";
import { normalizeAdapterKind } from "./contracts.js";
import {
  DEFAULT_OPERATION_POLICY,
  createOperationContext,
  normalizeOperationPolicy,
  runWithOperationContext,
} from "./operationContext.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 9011;
const MAX_BODY_BYTES = 512_000;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
export const SERVER_STARTUP_SUMMARY_SCHEMA = "voxweave_server_startup_summary_v1";
export const SERVER_SHUTDOWN_SUMMARY_SCHEMA = "voxweave_server_shutdown_summary_v1";
export const DEFAULT_SERVER_LIFECYCLE_POLICY = Object.freeze({
  requestTimeoutMs: 30_000,
  headersTimeoutMs: 10_000,
  keepAliveTimeoutMs: 5_000,
  maxRequestsPerSocket: 100,
  maxHeadersCount: 64,
  maxConnections: 128,
  shutdownTimeoutMs: 2_000,
});
export const SERVER_LIFECYCLE_POLICY_LIMITS = Object.freeze({
  requestTimeoutMs: Object.freeze({ min: 1_000, max: 120_000 }),
  headersTimeoutMs: Object.freeze({ min: 1_000, max: 60_000 }),
  keepAliveTimeoutMs: Object.freeze({ min: 500, max: 30_000 }),
  maxRequestsPerSocket: Object.freeze({ min: 1, max: 1_000 }),
  maxHeadersCount: Object.freeze({ min: 1, max: 256 }),
  maxConnections: Object.freeze({ min: 1, max: 1_024 }),
  shutdownTimeoutMs: Object.freeze({ min: 100, max: 10_000 }),
});
const SERVER_LIFECYCLE_POLICY_SYMBOL = Symbol("voxweave.server.lifecycle_policy");
export const DEFAULT_WRITE_ADMISSION_POLICY = Object.freeze({
  maxInFlightWrites: 16,
  queueMode: "reject",
});
export const WRITE_ADMISSION_POLICY_LIMITS = Object.freeze({
  maxInFlightWrites: Object.freeze({ min: 1, max: 256 }),
});
const ALLOWED_POST_ROUTES = new Set([
  "/v1/orchestrate",
  "/orchestrate",
  "/v1/adapter",
  "/v1/adapter/tts",
  "/v1/adapter/subtitle",
  "/v1/adapter/live2d",
  "/adapter/tts",
  "/adapter/subtitle",
  "/adapter/live2d",
  "/tts",
  "/subtitle",
  "/live2d",
]);

export function createVoxWeaveServer({
  service = createVoxWeaveService(),
  requiredApiKey = process.env.VOXWEAVE_API_KEY,
  lifecyclePolicy = DEFAULT_SERVER_LIFECYCLE_POLICY,
  writeAdmissionPolicy = DEFAULT_WRITE_ADMISSION_POLICY,
  writeAdmissionController,
  operationPolicy = DEFAULT_OPERATION_POLICY,
  operationContextFactory = createOperationContext,
} = {}) {
  const writeApiKey = String(requiredApiKey ?? "").trim();
  const normalizedOperationPolicy = normalizeOperationPolicy(operationPolicy);
  const admissionController = normalizeWriteAdmissionController(
    writeAdmissionController ?? createWriteAdmissionController(writeAdmissionPolicy)
  );
  async function handleRequest(request, response) {
    try {
      const pathname = assertCanonicalRequestTarget(request.url ?? "/");
      if (request.method === "GET" && ["/health", "/v1/health"].includes(pathname)) {
        sendJson(response, 200, service.health());
        return;
      }

      if (request.method !== "POST") {
        sendSafeError(response, new VoxWeaveError("not found", "not_found", 404));
        return;
      }

      assertAuthorizedWrite(request, writeApiKey);
      const routeKind = resolveRouteKind(pathname);
      if (isAllowedPostRoute(pathname)) {
        assertJsonContentType(request);
        assertContentLengthWithinLimit(request);
        const lease = admissionController.tryAcquire();
        if (!lease) {
          request.resume();
          sendServerBusy(response);
          return;
        }
        try {
          const payload = await readJson(request);
          const operationContext = operationContextFactory({
            policy: normalizedOperationPolicy,
          });
          const detachClientDisconnect = attachClientDisconnectCancellation({
            request,
            response,
            operationContext,
            policy: normalizedOperationPolicy,
          });
          try {
            const result = await runWithOperationContext(operationContext, (signal) =>
              service.orchestrate(payload, { routeKind, signal })
            );
            sendJson(response, 200, result);
          } finally {
            detachClientDisconnect();
            operationContext.cleanup();
          }
        } finally {
          lease.release();
        }
        return;
      }

      sendSafeError(response, new VoxWeaveError("not found", "not_found", 404));
    } catch (error) {
      if (response.destroyed || response.writableEnded) return;
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const safe = toSafeError(error);
      sendJson(response, safe.statusCode, safe.body);
    }
  }

  const server = createServer(handleRequest);
  installSafeHttpProtocolBoundaries(server);
  applyServerLifecyclePolicy(server, lifecyclePolicy);
  return server;
}

function isAllowedPostRoute(pathname) {
  return ALLOWED_POST_ROUTES.has(pathname);
}

export function parseCanonicalRequestTarget(requestTarget) {
  const target = String(requestTarget ?? "");
  if (
    !target ||
    target.length > 512 ||
    target === "*" ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.endsWith("/") ||
    target.includes("?") ||
    target.includes("#") ||
    target.includes("\\") ||
    target.includes("%") ||
    target.includes("://") ||
    /[\u0000-\u001f\u007f\s]/u.test(target)
  ) {
    return "";
  }
  const parts = target.split("/");
  if (parts.some((part) => part === "." || part === "..")) return "";
  if (parts.some((part, index) => index > 0 && part === "")) return "";
  return target;
}

export function assertCanonicalRequestTarget(requestTarget) {
  const pathname = parseCanonicalRequestTarget(requestTarget);
  if (pathname) return pathname;
  throw new VoxWeaveError("invalid request target", "invalid_request_target", 400);
}

function assertAuthorizedWrite(request, requiredApiKey) {
  if (!requiredApiKey) return;
  const credential = extractWriteCredential(request);
  if (constantTimeCredentialMatch(credential, requiredApiKey)) return;
  throw new VoxWeaveError("auth required", "auth_required", 401);
}

export function credentialDigest(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest();
}

export function constantTimeCredentialMatch(candidate, expected) {
  const candidateText = String(candidate ?? "");
  const expectedText = String(expected ?? "");
  if (!candidateText || !expectedText) return false;
  return timingSafeEqual(credentialDigest(candidateText), credentialDigest(expectedText));
}

export function extractWriteCredential(request) {
  const duplicateHeaderNames = findDuplicateCredentialHeaderNames(request.rawHeaders);
  if (duplicateHeaderNames.size > 0) {
    throw new VoxWeaveError("auth required", "auth_required", 401);
  }

  const authorization = getSingleHeaderValue(request.headers.authorization);
  const explicitApiKey = getSingleHeaderValue(request.headers["x-api-key"]);
  const bearerToken = parseBearerCredential(authorization);
  const bearerSourcePresent = authorization.trim() !== "";
  const apiKeySourcePresent = explicitApiKey.trim() !== "";

  if (bearerSourcePresent && apiKeySourcePresent) {
    throw new VoxWeaveError("auth required", "auth_required", 401);
  }
  return bearerToken || explicitApiKey.trim();
}

function findDuplicateCredentialHeaderNames(rawHeaders = []) {
  const counts = new Map();
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = String(rawHeaders[index] ?? "").toLowerCase();
    if (name !== "authorization" && name !== "x-api-key") continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
}

function getSingleHeaderValue(value) {
  if (Array.isArray(value)) {
    if (value.length !== 1) throw new VoxWeaveError("auth required", "auth_required", 401);
    return String(value[0] ?? "");
  }
  return String(value ?? "");
}

function parseBearerCredential(authorization) {
  const text = String(authorization ?? "").trim();
  if (!text) return "";
  const match = text.match(/^Bearer ([^\s]+)$/u);
  return match?.[1] ?? "";
}

function assertJsonContentType(request) {
  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (contentType === "application/json" || contentType.startsWith("application/json;")) {
    return;
  }
  throw new VoxWeaveError("unsupported media type", "unsupported_media_type", 415);
}

export function startServer({
  host = process.env.VOXWEAVE_HOST || DEFAULT_HOST,
  port = Number(process.env.VOXWEAVE_PORT || DEFAULT_PORT),
  service = createVoxWeaveService(),
  requiredApiKey = process.env.VOXWEAVE_API_KEY,
  allowNonLoopback = process.env.VOXWEAVE_ALLOW_NON_LOOPBACK,
  lifecyclePolicy = DEFAULT_SERVER_LIFECYCLE_POLICY,
  operationPolicy = DEFAULT_OPERATION_POLICY,
  logger = console,
} = {}) {
  assertSafeServerBind({ host, requiredApiKey, allowNonLoopback });
  const policy = normalizeServerLifecyclePolicy(lifecyclePolicy);
  const server = createVoxWeaveServer({
    service,
    requiredApiKey,
    lifecyclePolicy: policy,
    operationPolicy,
  });
  server.listen(port, host, () => {
    logger?.log?.(JSON.stringify(buildSafeServerStartupSummary({ policy })));
  });
  return server;
}

export function normalizeServerLifecyclePolicy(policy = {}) {
  assertServerLifecyclePolicyObject(policy);
  const normalized = {
    requestTimeoutMs: normalizeBoundedPolicyInteger(policy, "requestTimeoutMs"),
    headersTimeoutMs: normalizeBoundedPolicyInteger(policy, "headersTimeoutMs"),
    keepAliveTimeoutMs: normalizeBoundedPolicyInteger(policy, "keepAliveTimeoutMs"),
    maxRequestsPerSocket: normalizeBoundedPolicyInteger(policy, "maxRequestsPerSocket"),
    maxHeadersCount: normalizeBoundedPolicyInteger(policy, "maxHeadersCount"),
    maxConnections: normalizeBoundedPolicyInteger(policy, "maxConnections"),
    shutdownTimeoutMs: normalizeBoundedPolicyInteger(policy, "shutdownTimeoutMs"),
  };
  assertServerLifecyclePolicyRelationships(normalized);
  return Object.freeze(normalized);
}

export function normalizeWriteAdmissionPolicy(policy = {}) {
  assertWriteAdmissionPolicyObject(policy);
  const normalized = {
    maxInFlightWrites: normalizeWriteAdmissionLimit(policy.maxInFlightWrites),
    queueMode: policy.queueMode === undefined ? DEFAULT_WRITE_ADMISSION_POLICY.queueMode : policy.queueMode,
  };
  if (normalized.queueMode !== "reject") throwInvalidWriteAdmissionPolicy();
  return Object.freeze(normalized);
}

export function createWriteAdmissionController(policy = DEFAULT_WRITE_ADMISSION_POLICY) {
  const normalized = normalizeWriteAdmissionPolicy(policy);
  let activeWriteCount = 0;
  return Object.freeze({
    tryAcquire() {
      if (activeWriteCount >= normalized.maxInFlightWrites) return null;
      activeWriteCount += 1;
      let released = false;
      return Object.freeze({
        release() {
          if (released) return;
          released = true;
          activeWriteCount = Math.max(0, activeWriteCount - 1);
        },
      });
    },
    snapshot() {
      const available = Math.max(0, normalized.maxInFlightWrites - activeWriteCount);
      return Object.freeze({
        max_in_flight_writes: normalized.maxInFlightWrites,
        active_write_count: activeWriteCount,
        available_write_capacity: available,
        saturated: available === 0,
        queue_mode: normalized.queueMode,
      });
    },
  });
}

export function applyServerLifecyclePolicy(server, policy = DEFAULT_SERVER_LIFECYCLE_POLICY) {
  const normalized = normalizeServerLifecyclePolicy(policy);
  server.requestTimeout = normalized.requestTimeoutMs;
  server.headersTimeout = normalized.headersTimeoutMs;
  server.keepAliveTimeout = normalized.keepAliveTimeoutMs;
  server.maxRequestsPerSocket = normalized.maxRequestsPerSocket;
  server.maxHeadersCount = normalized.maxHeadersCount;
  server.maxConnections = normalized.maxConnections;
  Object.defineProperty(server, SERVER_LIFECYCLE_POLICY_SYMBOL, {
    value: normalized,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return normalized;
}

export function assertContentLengthWithinLimit(request) {
  const values = headerValues(request.headers["content-length"]);
  if (values.length === 0) return;
  if (values.length !== 1) {
    throw new VoxWeaveError("request body too large", "request_body_too_large", 413);
  }
  const value = values[0].trim();
  if (!/^\d+$/u.test(value) || Number(value) > MAX_BODY_BYTES) {
    throw new VoxWeaveError("request body too large", "request_body_too_large", 413);
  }
}

export function buildSafeServerStartupSummary({ policy = DEFAULT_SERVER_LIFECYCLE_POLICY } = {}) {
  const normalized = normalizeServerLifecyclePolicy(policy);
  return {
    schema: SERVER_STARTUP_SUMMARY_SCHEMA,
    status: "listening",
    bind_scope: "configured",
    lifecycle_policy_applied: true,
    request_timeout_ms: normalized.requestTimeoutMs,
    headers_timeout_ms: normalized.headersTimeoutMs,
    keep_alive_timeout_ms: normalized.keepAliveTimeoutMs,
    max_requests_per_socket: normalized.maxRequestsPerSocket,
    max_headers_count: normalized.maxHeadersCount,
    max_connections: normalized.maxConnections,
    shutdown_timeout_ms: normalized.shutdownTimeoutMs,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export async function closeVoxWeaveServer(server, { timeoutMs } = {}) {
  if (!server?.listening) {
    return buildSafeServerShutdownSummary("not_listening");
  }
  const boundedTimeoutMs = normalizeShutdownTimeout(server, timeoutMs);
  const state = {
    forcedConnectionClose: false,
    idleConnectionCloseAttempted: false,
    allConnectionCloseAttempted: false,
  };

  if (typeof server.closeIdleConnections === "function") {
    state.idleConnectionCloseAttempted = true;
    server.closeIdleConnections();
  }

  return await new Promise((resolve) => {
    let settled = false;
    let timeout;
    let forceGraceTimeout;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(forceGraceTimeout);
      resolve(buildSafeServerShutdownSummary(status, state));
    };

    server.close((error) => {
      finish(error ? "server_shutdown_failed" : "closed");
    });

    timeout = setTimeout(() => {
      state.forcedConnectionClose = true;
      if (typeof server.closeAllConnections !== "function") {
        finish("server_shutdown_failed");
        return;
      }
      state.allConnectionCloseAttempted = true;
      server.closeAllConnections();
      forceGraceTimeout = setTimeout(() => {
        finish("server_shutdown_failed");
      }, Math.min(100, boundedTimeoutMs));
    }, boundedTimeoutMs);
  });
}

function buildSafeServerShutdownSummary(status, state = {}) {
  return {
    schema: SERVER_SHUTDOWN_SUMMARY_SCHEMA,
    status,
    forced_connection_close: state.forcedConnectionClose === true,
    idle_connection_close_attempted: state.idleConnectionCloseAttempted === true,
    all_connection_close_attempted: state.allConnectionCloseAttempted === true,
    shutdown_timeout_bounded: true,
    transport_values_excluded: true,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function assertSafeServerBind({ host, requiredApiKey, allowNonLoopback } = {}) {
  const scope = classifyServerHostScope(host);
  if (scope === "loopback") return;
  const hasApiKey = String(requiredApiKey ?? "").trim() !== "";
  const explicitOptIn = isNonLoopbackOptIn(allowNonLoopback);
  if ((scope === "wildcard" || scope === "non_loopback") && hasApiKey && explicitOptIn) {
    return;
  }
  throw new VoxWeaveError("unsafe server bind", "unsafe_server_bind", 500);
}

export function classifyServerHostScope(host) {
  const normalized = normalizeServerHost(host);
  if (!normalized) return "invalid";
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    if (normalized === "0.0.0.0") return "wildcard";
    if (normalized.split(".")[0] === "127") return "loopback";
    return "non_loopback";
  }
  if (ipVersion === 6) {
    if (normalized === "::") return "wildcard";
    if (normalized === "::1") return "loopback";
    return "non_loopback";
  }
  if (normalized === "localhost") return "loopback";
  if (!isValidHostname(normalized)) return "invalid";
  return "non_loopback";
}

function normalizeServerHost(host) {
  let text = String(host ?? "").trim().toLowerCase();
  if (!text) return "";
  if (text.endsWith(".")) text = text.slice(0, -1);
  if (text.startsWith("[") && text.endsWith("]")) text = text.slice(1, -1);
  if (
    !text ||
    text.includes("://") ||
    text.includes("/") ||
    /\s/u.test(text)
  ) {
    return "";
  }
  return text;
}

function isValidHostname(hostname) {
  if (hostname.length > 253 || hostname.includes(":")) return false;
  const labels = hostname.split(".");
  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label)
  );
}

function isNonLoopbackOptIn(value) {
  if (value === true) return true;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "1" || text === "true";
}

async function readJson(request) {
  assertRequestNotAborted(request);
  const chunks = [];
  let total = 0;
  try {
    for await (const chunk of request) {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        throw new VoxWeaveError(
          "request body too large",
          "request_body_too_large",
          413
        );
      }
      chunks.push(chunk);
    }
  } catch (error) {
    if (isRequestAbortedError(error) || request.aborted) throwRequestAborted();
    throw error;
  }
  assertRequestNotAborted(request);
  let body = "";
  try {
    body = UTF8_DECODER.decode(Buffer.concat(chunks));
  } catch {
    throw new VoxWeaveError("invalid json", "invalid_json", 400);
  }
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new VoxWeaveError("invalid json", "invalid_json", 400);
  }
}

function assertRequestNotAborted(request) {
  if (request.aborted) throwRequestAborted();
}

export function isRequestAbortedError(error) {
  return error?.code === "ECONNRESET" || error?.code === "ERR_STREAM_PREMATURE_CLOSE";
}

function throwRequestAborted() {
  throw new VoxWeaveError("request aborted", "request_aborted", 400);
}

function assertServerLifecyclePolicyObject(policy) {
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    throwInvalidServerLifecyclePolicy();
  }
  const allowed = new Set(Object.keys(SERVER_LIFECYCLE_POLICY_LIMITS));
  for (const key of Object.keys(policy)) {
    if (!allowed.has(key)) throwInvalidServerLifecyclePolicy();
  }
}

function normalizeBoundedPolicyInteger(policy, key) {
  const value = policy[key];
  if (value === undefined) return DEFAULT_SERVER_LIFECYCLE_POLICY[key];
  const limit = SERVER_LIFECYCLE_POLICY_LIMITS[key];
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < limit.min ||
    value > limit.max
  ) {
    throwInvalidServerLifecyclePolicy();
  }
  return value;
}

function assertServerLifecyclePolicyRelationships(policy) {
  if (
    policy.headersTimeoutMs > policy.requestTimeoutMs ||
    policy.keepAliveTimeoutMs >= policy.requestTimeoutMs ||
    policy.shutdownTimeoutMs > policy.requestTimeoutMs
  ) {
    throwInvalidServerLifecyclePolicy();
  }
}

function normalizeShutdownTimeout(server, explicitTimeoutMs) {
  if (explicitTimeoutMs !== undefined) {
    return normalizeBoundedPolicyInteger({ shutdownTimeoutMs: explicitTimeoutMs }, "shutdownTimeoutMs");
  }
  return server?.[SERVER_LIFECYCLE_POLICY_SYMBOL]?.shutdownTimeoutMs
    ?? DEFAULT_SERVER_LIFECYCLE_POLICY.shutdownTimeoutMs;
}

function throwInvalidServerLifecyclePolicy() {
  throw new VoxWeaveError(
    "invalid server lifecycle policy",
    "invalid_server_lifecycle_policy",
    500
  );
}

function assertWriteAdmissionPolicyObject(policy) {
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    throwInvalidWriteAdmissionPolicy();
  }
  const allowed = new Set(["maxInFlightWrites", "queueMode"]);
  for (const key of Object.keys(policy)) {
    if (!allowed.has(key)) throwInvalidWriteAdmissionPolicy();
  }
}

function normalizeWriteAdmissionLimit(value) {
  if (value === undefined) return DEFAULT_WRITE_ADMISSION_POLICY.maxInFlightWrites;
  const limit = WRITE_ADMISSION_POLICY_LIMITS.maxInFlightWrites;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < limit.min ||
    value > limit.max
  ) {
    throwInvalidWriteAdmissionPolicy();
  }
  return value;
}

function normalizeWriteAdmissionController(controller) {
  if (
    !controller ||
    typeof controller.tryAcquire !== "function" ||
    typeof controller.snapshot !== "function"
  ) {
    throwInvalidWriteAdmissionPolicy();
  }
  return controller;
}

function throwInvalidWriteAdmissionPolicy() {
  throw new VoxWeaveError(
    "invalid write admission policy",
    "invalid_write_admission_policy",
    500
  );
}

function headerValues(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ""));
  if (value === undefined) return [];
  return [String(value)];
}

function resolveRouteKind(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const last = normalizeAdapterKind(parts.at(-1));
  if (last !== "orchestrate") return last;
  return "";
}

function sendJson(response, statusCode, body, headers = {}) {
  if (response.destroyed || response.writableEnded) return false;
  if (response.headersSent) {
    response.destroy();
    return false;
  }
  try {
    response.writeHead(statusCode, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    });
    response.end(JSON.stringify(body));
    return true;
  } catch {
    response.destroy();
    return false;
  }
}

function sendSafeError(response, error, headers = {}) {
  const safe = toSafeError(error);
  return sendJson(response, safe.statusCode, safe.body, headers);
}

function sendServerBusy(response) {
  sendSafeError(response, new VoxWeaveError("server busy", "server_busy", 503), {
    "connection": "close",
    "retry-after": "1",
  });
}

function attachClientDisconnectCancellation({ request, response, operationContext, policy }) {
  if (policy.cancelOnClientDisconnect !== true) return () => {};
  const cancel = () => operationContext.abort("client_disconnect");
  const onRequestAborted = () => cancel();
  const onResponseClose = () => {
    if (!response.writableEnded) cancel();
  };
  request.on("aborted", onRequestAborted);
  response.on("close", onResponseClose);
  return () => {
    request.off("aborted", onRequestAborted);
    response.off("close", onResponseClose);
  };
}

export function buildSafeClientErrorResponse() {
  const safe = toSafeError(new VoxWeaveError("bad request", "bad_request", 400));
  return Object.freeze({
    statusCode: safe.statusCode,
    body: Object.freeze({ ...safe.body }),
    headers: Object.freeze({
      "connection": "close",
    }),
  });
}

export function buildSafeExpectationFailedResponse() {
  const safe = toSafeError(new VoxWeaveError("expectation failed", "expectation_failed", 417));
  return Object.freeze({
    statusCode: safe.statusCode,
    body: Object.freeze({ ...safe.body }),
    headers: Object.freeze({
      "connection": "close",
    }),
  });
}

export function installSafeHttpProtocolBoundaries(server) {
  server.on("clientError", (_error, socket) => {
    writeSafeSocketJson(socket, buildSafeClientErrorResponse());
  });
  server.on("checkContinue", (request, response) => {
    request.resume();
    const safe = buildSafeExpectationFailedResponse();
    sendJson(response, safe.statusCode, safe.body, safe.headers);
  });
  server.on("checkExpectation", (request, response) => {
    request.resume();
    const safe = buildSafeExpectationFailedResponse();
    sendJson(response, safe.statusCode, safe.body, safe.headers);
  });
  return server;
}

function writeSafeSocketJson(socket, safeResponse) {
  if (!socket?.writable || socket.destroyed) {
    socket?.destroy?.();
    return false;
  }
  const body = JSON.stringify(safeResponse.body);
  const headers = [
    `HTTP/1.1 ${safeResponse.statusCode} ${safeHttpReason(safeResponse.statusCode)}`,
    "Content-Type: application/json; charset=utf-8",
    "Cache-Control: no-store",
    "X-Content-Type-Options: nosniff",
    "Connection: close",
    `Content-Length: ${Buffer.byteLength(body)}`,
    "",
    body,
  ].join("\r\n");
  socket.end(headers);
  return true;
}

function safeHttpReason(statusCode) {
  if (statusCode === 400) return "Bad Request";
  if (statusCode === 417) return "Expectation Failed";
  if (statusCode === 503) return "Service Unavailable";
  return "Error";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
