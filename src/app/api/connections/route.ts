import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { providerConnections } from "@/db/schema";
import { listProviders } from "@/lib/providers/registry";
import { pingProvider } from "@/lib/providers/ping";
import { simpleEncrypt } from "@/lib/crypto";
import { generateId } from "@/lib/utils";

function mergeProviderStatus(
  providers: ReturnType<typeof listProviders>,
  connections: Array<{ providerId: string; status: string | null }>,
) {
  const connected = new Set(
    connections.filter((c) => c.status === "live").map((c) => c.providerId),
  );
  return providers.map((p) => ({
    ...p,
    status:
      connected.has(p.id) || p.status === "live" ? "live" : p.status,
    connected: connected.has(p.id),
  }));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = listProviders();
  const connections = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, session.user.id));

  return NextResponse.json({
    providers: mergeProviderStatus(providers, connections),
    connections: connections.map((c) => ({
      providerId: c.providerId,
      status: c.status,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providerId, apiKey, skipPing } = await req.json();
  if (!providerId || !apiKey) {
    return NextResponse.json(
      { ok: false, error: "providerId and apiKey required" },
      { status: 400 },
    );
  }

  if (!skipPing) {
    const ping = await pingProvider(providerId, String(apiKey));
    if (!ping.ok) {
      return NextResponse.json(
        { ok: false, error: ping.message, ping },
        { status: 400 },
      );
    }
  }

  const encrypted = simpleEncrypt(String(apiKey));
  const existing = await db
    .select()
    .from(providerConnections)
    .where(
      and(
        eq(providerConnections.userId, session.user.id),
        eq(providerConnections.providerId, providerId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(providerConnections)
      .set({ apiKey: encrypted, status: "live" })
      .where(eq(providerConnections.id, existing[0].id));
  } else {
    await db.insert(providerConnections).values({
      id: generateId(),
      userId: session.user.id,
      providerId,
      apiKey: encrypted,
      status: "live",
    });
  }

  const connections = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, session.user.id));

  return NextResponse.json({
    ok: true,
    message: `${providerId} connected and saved`,
    providers: mergeProviderStatus(listProviders(), connections),
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  if (!providerId) {
    return NextResponse.json({ error: "providerId required" }, { status: 400 });
  }
  await db
    .delete(providerConnections)
    .where(
      and(
        eq(providerConnections.userId, session.user.id),
        eq(providerConnections.providerId, providerId),
      ),
    );
  return NextResponse.json({ ok: true });
}
