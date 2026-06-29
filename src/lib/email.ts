import nodemailer from "nodemailer";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";

const resendKey = process.env.RESEND_API_KEY;
const brevoKey = process.env.BREVO_API_KEY;
const from = process.env.EMAIL_FROM ?? "AI Story Studio <onboarding@resend.dev>";

function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim() || "AI Story Studio", email: match[2].trim() };
  }
  return { name: "AI Story Studio", email: value.trim() };
}

async function sendViaBrevo(to: string, subject: string, html: string) {
  const sender = parseFrom(from);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey!,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error ${res.status}: ${body}`);
  }
}

async function sendViaResend(to: string, subject: string, html: string) {
  const resend = new Resend(resendKey);
  await resend.emails.send({ from, to, subject, html });
}

async function sendViaDev(to: string, subject: string, html: string) {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  await transport.sendMail({ from, to, subject, html });
  console.log("\n📧 DEV EMAIL (no provider configured)");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", html);
  console.log("---\n");
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (brevoKey) return await sendViaBrevo(to, subject, html);
    if (resendKey) return await sendViaResend(to, subject, html);
  } catch (err) {
    console.error("Email provider failed, falling back to console:", err);
  }
  await sendViaDev(to, subject, html);
}

function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/**
 * Sends an email using a template stored in the DB. Falls back to a minimal
 * inline template if the key is missing so flows never break.
 */
export async function sendTemplateEmail(
  to: string,
  key: string,
  vars: Record<string, string>,
) {
  let subject = "AI Story Studio";
  let html = `<p><a href="${vars.link ?? "#"}">Continue</a></p>`;

  try {
    const [tpl] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.key, key))
      .limit(1);
    if (tpl) {
      subject = applyVars(tpl.subject, vars);
      html = applyVars(tpl.html, vars);
    }
  } catch {
    // table may not exist yet; use fallback
  }

  await sendEmail(to, subject, html);
}

// Kept for backward compatibility.
export function verificationEmailHtml(link: string) {
  return `<p>Welcome! <a href="${link}">Verify your email</a></p>`;
}
export function resetPasswordEmailHtml(link: string) {
  return `<p>Reset your password: <a href="${link}">Click here</a></p>`;
}
