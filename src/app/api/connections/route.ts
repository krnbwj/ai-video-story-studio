import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerConnections } from "@/db/schema";
import { listProviders } from "@/lib/providers/registry";
import { simpleEncrypt } from "@/lib/crypto";
import { generateId } from "@/lib/utils";

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
    providers,
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

  const { providerId, apiKey } = await req.json();
  const encrypted = simpleEncrypt(String(apiKey));
  const existing = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, session.user.id));

  const match = existing.find((c) => c.providerId === providerId);
  if (match) {
    await db
      .update(providerConnections)
      .set({ apiKey: encrypted, status: "live" })
      .where(eq(providerConnections.id, match.id));
  } else {
    await db.insert(providerConnections).values({
      id: generateId(),
      userId: session.user.id,
      providerId,
      apiKey: encrypted,
      status: "live",
    });
  }

  return NextResponse.json({ ok: true });
}
