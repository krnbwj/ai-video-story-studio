import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email")?.toLowerCase();

  if (!token || !email) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
      ),
    )
    .limit(1);

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
      ),
    );

  return NextResponse.json({ ok: true });
}
