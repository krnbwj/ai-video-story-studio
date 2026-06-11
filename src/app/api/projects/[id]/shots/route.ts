import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shots } from "@/db/schema";
import { getProjectForUser } from "@/lib/project-service";
import { generateId } from "@/lib/utils";

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

  if (body.action === "create") {
    const shotId = generateId();
    await db.insert(shots).values({
      id: shotId,
      sceneId: body.sceneId,
      title: body.title ?? `Shot ${body.orderIndex + 1}`,
      prompt: body.prompt ?? "",
      providerId: body.providerId ?? "kling",
      orderIndex: body.orderIndex ?? 0,
      characterIds: JSON.stringify(body.characterIds ?? []),
    });
    return NextResponse.json({ id: shotId });
  }

  const { shotId, ...updates } = body;
  await db
    .update(shots)
    .set({
      ...updates,
      characterIds: updates.characterIds
        ? JSON.stringify(updates.characterIds)
        : undefined,
    })
    .where(eq(shots.id, shotId));
  return NextResponse.json({ ok: true });
}
