import { isIP } from "node:net";
import { throwIfOperationAborted } from "./operationContext.js";

const DEFAULT_TIMEOUT_MS = 3000;

export function createLive2dForwarder({
  endpoint = process.env.VOXWEAVE_LIVE2D_RENDERER_ENDPOINT ?? "",
  apiKey = process.env.VOXWEAVE_LIVE2D_RENDERER_API_KEY ?? "",
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const target = normalizeRendererEndpoint(endpoint);
  const configured = String(endpoint ?? "").trim() !== "";
  const scope = target?.scope ?? (configured ? "blocked" : "not_configured");
  const key = String(apiKey ?? "").trim();

  return {
    configured,
    scope,
    async forward(cueDelivery, { signal } = {}) {
      throwIfOperationAborted(signal);
      if (!configured) return dryRunSummary();
      if (!target || typeof fetchImpl !== "function") {
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "blocked",
          renderer_forward_attempted: false,
          renderer_forward_ok: false,
          renderer_forward_status: "configured_unusable",
        };
      }

      const controller = new AbortController();
      let localTimedOut = false;
      let parentAborted = false;
      const onParentAbort = () => {
        parentAborted = true;
        controller.abort();
      };
      if (signal?.aborted === true) {
        parentAborted = true;
        controller.abort();
      } else if (typeof signal?.addEventListener === "function") {
        signal.addEventListener("abort", onParentAbort, { once: true });
      }
      const timer = setTimeout(() => {
        localTimedOut = true;
        controller.abort();
      }, timeoutMs);
      try {
        const headers = {
          "content-type": "application/json",
        };
        if (key) headers["x-api-key"] = key;
        const response = await fetchImpl(target.href, {
          method: "POST",
          redirect: "error",
          headers,
          body: JSON.stringify(cueDelivery),
          signal: controller.signal,
        });
        throwIfOperationAborted(signal);
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: scope,
          renderer_forward_attempted: true,
          renderer_forward_ok: response.ok === true,
          renderer_forward_status: response.ok ? "accepted" : "renderer_rejected",
        };
      } catch (error) {
        if (parentAborted || signal?.aborted === true) throwIfOperationAborted(signal);
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: scope,
          renderer_forward_attempted: true,
          renderer_forward_ok: false,
          renderer_forward_status:
            localTimedOut || error?.name === "AbortError" ? "renderer_timeout" : "renderer_unreachable",
        };
      } finally {
        clearTimeout(timer);
        if (typeof signal?.removeEventListener === "function") {
          signal.removeEventListener("abort", onParentAbort);
        }
      }
    },
  };
}

function dryRunSummary() {
  return {
    renderer_forward_configured: false,
    renderer_forward_scope: "not_configured",
    renderer_forward_attempted: false,
    renderer_forward_ok: false,
    renderer_forward_status: "dry_run",
  };
}

function normalizeRendererEndpoint(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (!isLoopbackHost(url.hostname)) return null;
    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/live2d-engine";
      url.scope = endpointScope(url.hostname);
      return url;
    }
    url.scope = endpointScope(url.hostname);
    if (url.pathname === "/live2d-engine" || url.pathname === "/cue") return url;
    url.pathname = `${url.pathname.replace(/\/$/u, "")}/live2d-engine`;
    return url;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname) {
  const host = normalizeEndpointHost(hostname);
  if (host === "localhost") return true;
  if (isIP(host) === 4) return host.split(".")[0] === "127";
  if (isIP(host) === 6) return host === "::1";
  return false;
}

function endpointScope(hostname) {
  return isLoopbackHost(hostname) ? "loopback" : "blocked";
}

function normalizeEndpointHost(hostname) {
  let host = String(hostname ?? "").trim().toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  return host;
}
