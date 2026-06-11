import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createProject, getUserProjects } from "@/lib/project-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getUserProjects(session.user.id);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id = await createProject(session.user.id, body);
  return NextResponse.json({ id });
}
