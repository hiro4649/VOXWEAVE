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
    async forward(cueDelivery) {
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
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers = {
          "content-type": "application/json",
        };
        if (key) headers["x-api-key"] = key;
        const response = await fetchImpl(target.href, {
          method: "POST",
          headers,
          body: JSON.stringify(cueDelivery),
          redirect: "error",
          signal: controller.signal,
        });
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: scope,
          renderer_forward_attempted: true,
          renderer_forward_ok: response.ok === true,
          renderer_forward_status: response.ok ? "accepted" : "renderer_rejected",
        };
      } catch (error) {
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: scope,
          renderer_forward_attempted: true,
          renderer_forward_ok: false,
          renderer_forward_status:
            error?.name === "AbortError" ? "renderer_timeout" : "renderer_unreachable",
        };
      } finally {
        clearTimeout(timer);
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
    return null;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname) {
  const host = String(hostname ?? "").toLowerCase();
  return host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.startsWith("127.") ||
    isPrivateIpv4(host);
}

function endpointScope(hostname) {
  const host = String(hostname ?? "").toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.startsWith("127.")
  ) {
    return "loopback";
  }
  if (isPrivateIpv4(host)) return "private";
  return "blocked";
}

function isPrivateIpv4(host) {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  return parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168);
}
