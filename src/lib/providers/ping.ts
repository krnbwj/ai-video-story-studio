import { PROVIDER_DEFINITIONS } from "./config";

export interface PingResult {
  ok: boolean;
  status: "live" | "unverified" | "error";
  message: string;
  latencyMs?: number;
}

/**
 * Tests an API key for a provider. For OpenAI-compatible endpoints we hit the
 * `/models` endpoint (cheap, no generation cost). For providers without a
 * verifiable REST surface yet, we validate the key shape and mark it
 * "unverified" (it will be used once the media adapter is wired).
 */
export async function pingProvider(
  providerId: string,
  apiKey: string,
): Promise<PingResult> {
  const def = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);
  if (!def) {
    return { ok: false, status: "error", message: "Unknown provider" };
  }
  if (!apiKey || apiKey.trim().length < 8) {
    return { ok: false, status: "error", message: "API key looks too short" };
  }

  if (def.baseUrl) {
    const started = Date.now();
    const base = def.baseUrl.replace(/\/$/, "");
    try {
      const res = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Date.now() - started;
      if (res.ok) {
        return {
          ok: true,
          status: "live",
          message: `Connected (${latencyMs}ms)`,
          latencyMs,
        };
      }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, status: "error", message: "Invalid API key (unauthorized)" };
      }
      // DeepSeek and others may not expose /models — try a tiny chat ping.
      if (def.kind === "text" && def.model) {
        const chatRes = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: def.model,
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const chatLatency = Date.now() - started;
        if (chatRes.ok) {
          return {
            ok: true,
            status: "live",
            message: `Connected via chat (${chatLatency}ms)`,
            latencyMs: chatLatency,
          };
        }
        if (chatRes.status === 401 || chatRes.status === 403) {
          return { ok: false, status: "error", message: "Invalid API key (unauthorized)" };
        }
      }
      return {
        ok: true,
        status: "unverified",
        message: `Key accepted; endpoint returned ${res.status} on /models`,
        latencyMs,
      };
    } catch (err) {
      return {
        ok: false,
        status: "error",
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  return {
    ok: true,
    status: "unverified",
    message: "Key saved. This provider's media API is not yet wired for live calls.",
  };
}
