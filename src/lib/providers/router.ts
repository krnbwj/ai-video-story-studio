import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerConnections, usageEvents } from "@/db/schema";
import { simpleDecrypt } from "@/lib/crypto";
import { generateId } from "@/lib/utils";
import { PROVIDER_DEFINITIONS } from "./config";
import { getProvider } from "./registry";
import type { GenerationResult, ProviderKind } from "./types";

export interface RouteRequest {
  userId: string;
  projectId?: string;
  kind: ProviderKind;
  prompt: string;
  characterContext?: string;
  memoryContext?: string;
  preferredProviderId?: string;
}

export interface RouteOutcome extends GenerationResult {
  providerId: string;
  mode: "live" | "mock";
  attempts: string[];
  routedFrom?: string;
}

interface ResolvedKey {
  providerId: string;
  apiKey?: string;
  live: boolean;
}

/**
 * Resolves which providers are "live" for this user (have a usable key, either
 * from the per-user connections table or from a server env var) and orders
 * candidates: preferred -> live Chinese-first -> live global -> mock fallbacks.
 */
async function resolveCandidates(
  req: RouteRequest,
): Promise<ResolvedKey[]> {
  const conns = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, req.userId));

  const keyByProvider = new Map<string, string>();
  for (const c of conns) {
    if (!c.apiKey) continue;
    try {
      keyByProvider.set(c.providerId, simpleDecrypt(c.apiKey));
    } catch {
      // ignore malformed key
    }
  }

  const forKind = PROVIDER_DEFINITIONS.filter((p) => p.kind === req.kind);

  const scored = forKind.map((p) => {
    const userKey = keyByProvider.get(p.id);
    const envKey = p.envKey ? process.env[p.envKey] : undefined;
    const apiKey = userKey ?? envKey;
    const live = !!apiKey && !!p.baseUrl; // only OpenAI-compatible text can truly run live today
    let score = 0;
    if (p.id === req.preferredProviderId) score += 1000;
    if (live) score += 500;
    if (p.origin === "cn") score += 50; // Chinese-first preference
    if (p.free) score += 10;
    return { providerId: p.id, apiKey, live, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(({ providerId, apiKey, live }) => ({
    providerId,
    apiKey,
    live,
  }));
}

async function recordUsage(
  req: RouteRequest,
  providerId: string,
  mode: "live" | "mock",
) {
  await db.insert(usageEvents).values({
    id: generateId(),
    userId: req.userId,
    projectId: req.projectId,
    providerId,
    kind: req.kind,
    units: 1,
    billable: mode === "live",
    mode,
  });
}

function composePrompt(req: RouteRequest): string {
  const parts: string[] = [];
  if (req.memoryContext) parts.push(req.memoryContext);
  if (req.characterContext)
    parts.push(`CHARACTERS (frozen profiles):\n${req.characterContext}`);
  parts.push(`SHOT PROMPT:\n${req.prompt}`);
  return parts.join("\n\n");
}

/**
 * Routes a generation request across providers with automatic fallback.
 * Tries live providers first (Chinese-first), then falls back through the
 * candidate list, and finally to deterministic mock output so the flow never
 * hard-fails. Every attempt that produces output records a usage event.
 */
export async function routeGeneration(
  req: RouteRequest,
): Promise<RouteOutcome> {
  const candidates = await resolveCandidates(req);
  const attempts: string[] = [];
  const composedPrompt = composePrompt(req);

  for (const candidate of candidates) {
    if (!candidate.live) continue;
    const provider = getProvider(candidate.providerId);
    if (!provider) continue;
    attempts.push(candidate.providerId);
    try {
      const result = await provider.generate({
        prompt: composedPrompt,
        kind: req.kind,
        characterContext: req.characterContext,
        apiKey: candidate.apiKey,
      });
      await recordUsage(req, candidate.providerId, "live");
      return {
        ...result,
        providerId: candidate.providerId,
        mode: "live",
        attempts,
        routedFrom:
          req.preferredProviderId &&
          req.preferredProviderId !== candidate.providerId
            ? req.preferredProviderId
            : undefined,
      };
    } catch {
      // fall through to next candidate
    }
  }

  // Mock fallback: prefer the requested provider's identity for clarity.
  const fallbackId =
    req.preferredProviderId ?? candidates[0]?.providerId ?? "mock";
  const provider = getProvider(fallbackId);
  attempts.push(fallbackId);
  const result = provider
    ? await provider.generate({
        prompt: composedPrompt,
        kind: req.kind,
        characterContext: req.characterContext,
      })
    : { status: "completed" as const, assets: [] };

  await recordUsage(req, fallbackId, "mock");
  return {
    ...result,
    providerId: fallbackId,
    mode: "mock",
    attempts,
  };
}

export async function getUsageSummary(userId: string) {
  const events = await db
    .select()
    .from(usageEvents)
    .where(eq(usageEvents.userId, userId));

  const summary = {
    total: events.length,
    live: events.filter((e) => e.mode === "live").length,
    mock: events.filter((e) => e.mode === "mock").length,
    billableUnits: events
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.units ?? 1), 0),
    byProvider: {} as Record<string, number>,
    byKind: {} as Record<string, number>,
  };

  for (const e of events) {
    summary.byProvider[e.providerId] =
      (summary.byProvider[e.providerId] ?? 0) + (e.units ?? 1);
    summary.byKind[e.kind] = (summary.byKind[e.kind] ?? 0) + (e.units ?? 1);
  }

  return summary;
}
