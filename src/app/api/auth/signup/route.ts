import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { sendEmail, verificationEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const normalized = String(email).toLowerCase();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const id = generateId();
  const passwordHash = await bcrypt.hash(String(password), 10);
  const token = generateId();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.insert(users).values({
    id,
    name: name ?? null,
    email: normalized,
    passwordHash,
  });

  await db.insert(verificationTokens).values({
    identifier: normalized,
    token,
    expires,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(normalized)}`;
  await sendEmail(normalized, "Verify your AI Story Studio account", verificationEmailHtml(link));

  return NextResponse.json({ ok: true });
}
