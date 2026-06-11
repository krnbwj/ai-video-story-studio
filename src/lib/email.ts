import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "AI Story Studio <onboarding@resend.dev>";

async function sendViaResend(to: string, subject: string, html: string) {
  const resend = new Resend(resendKey);
  await resend.emails.send({ from, to, subject, html });
}

async function sendViaDev(to: string, subject: string, html: string) {
  const transport = nodemailer.createTransport({
    jsonTransport: true,
  });
  const info = await transport.sendMail({ from, to, subject, html });
  console.log("\n📧 DEV EMAIL");
  console.log("To:", to);
  console.log("Subject:", subject);
  const parsed = JSON.parse(info.message as string);
  console.log("Body:", parsed.html ?? html);
  console.log("---\n");
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (resendKey) {
    await sendViaResend(to, subject, html);
    return;
  }
  await sendViaDev(to, subject, html);
}

export function verificationEmailHtml(link: string) {
  return `<p>Welcome to AI Video & Story Studio!</p><p><a href="${link}">Verify your email</a></p>`;
}

export function resetPasswordEmailHtml(link: string) {
  return `<p>Reset your password:</p><p><a href="${link}">Click here to reset</a></p>`;
}
