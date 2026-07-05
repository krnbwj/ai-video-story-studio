import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getProjectBundle } from "@/lib/project-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const bundle = await getProjectBundle(id, session.user.id);
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(bundle);
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
  const body = await req.json();
  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (updates.wizardData && typeof updates.wizardData === "object") {
    updates.wizardData = JSON.stringify(updates.wizardData);
  }
  if (updates.editorData && typeof updates.editorData === "object") {
    updates.editorData = JSON.stringify(updates.editorData);
  }
  delete updates.id;
  delete updates.userId;
  await db.update(projects).set(updates).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
