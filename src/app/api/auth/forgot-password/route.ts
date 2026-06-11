import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { sendEmail, resetPasswordEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();
  const normalized = String(email).toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (user) {
    const token = generateId();
    const expiry = new Date(Date.now() + 1000 * 60 * 60);
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id));

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const link = `${baseUrl}/auth/reset-password?token=${token}`;
    await sendEmail(
      normalized,
      "Reset your AI Story Studio password",
      resetPasswordEmailHtml(link),
    );
  }

  return NextResponse.json({ ok: true });
}
