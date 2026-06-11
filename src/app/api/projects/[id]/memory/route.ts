import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectForUser } from "@/lib/project-service";
import {
  addMemory,
  deleteMemory,
  getMemory,
  updateMemory,
} from "@/lib/memory";

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
  const items = await getMemory(id);
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
  const memoryId = await addMemory(id, {
    kind: body.kind ?? "continuity",
    key: body.key,
    value: body.value,
    importance: body.importance,
    sceneId: body.sceneId,
    characterId: body.characterId,
  });
  return NextResponse.json({ id: memoryId });
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
  await updateMemory(body.memoryId, {
    key: body.key,
    value: body.value,
    importance: body.importance,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memoryId");
  if (memoryId) await deleteMemory(memoryId);
  return NextResponse.json({ ok: true });
}
