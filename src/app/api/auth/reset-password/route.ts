import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, String(token)))
    .limit(1);

  if (!user?.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
