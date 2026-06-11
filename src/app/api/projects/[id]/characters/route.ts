import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getProjectForUser } from "@/lib/project-service";
import { generateId } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await getProjectForUser(id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await db.select().from(characters).where(eq(characters.projectId, id));
  return NextResponse.json(items);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await getProjectForUser(id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const charId = generateId();
  await db.insert(characters).values({
    id: charId,
    projectId: id,
    name: body.name,
    description: body.description,
    traits: body.traits,
    gender: body.gender,
    age: body.age,
    voiceId: body.voiceId,
    seed: body.seed ?? generateId().slice(0, 8),
    frozen: !!body.frozen,
    referenceImages: JSON.stringify(body.referenceImages ?? []),
    referenceVideos: JSON.stringify(body.referenceVideos ?? []),
  });
  return NextResponse.json({ id: charId });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await getProjectForUser(id, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { characterId, ...updates } = body;
  await db
    .update(characters)
    .set({
      ...updates,
      referenceImages: updates.referenceImages
        ? JSON.stringify(updates.referenceImages)
        : undefined,
      referenceVideos: updates.referenceVideos
        ? JSON.stringify(updates.referenceVideos)
        : undefined,
    })
    .where(eq(characters.id, characterId));
  return NextResponse.json({ ok: true });
}
