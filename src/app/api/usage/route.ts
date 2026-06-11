import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsageSummary } from "@/lib/providers/router";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await getUsageSummary(session.user.id);
  return NextResponse.json(summary);
}
