import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingProvider } from "@/lib/providers/ping";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { providerId, apiKey } = await req.json();
  if (!providerId || !apiKey) {
    return NextResponse.json(
      { ok: false, status: "error", message: "Missing providerId or apiKey" },
      { status: 400 },
    );
  }
  const result = await pingProvider(providerId, apiKey);
  return NextResponse.json(result);
}
