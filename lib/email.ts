import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail({ to, subject, text, html }: Email) {
  const { RESEND_API_KEY, EMAIL_FROM } = env("email");
  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  if (error) throw new Error(`Email to ${to} failed: ${error.message}`);
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Used for both admin invites and password resets. */
export function passwordLinkEmail(name: string, url: string) {
  const subject = "Set your Lens admin password";
  const text = [
    `Hi ${name},`,
    "",
    "Use this link to set a new password for your Lens admin account:",
    url,
    "",
    "The link expires in 24 hours. If you did not expect this email, you can ignore it.",
  ].join("\n");
  const html = `
    <div style="font-family: Manrope, Arial, sans-serif; color: #111928; font-size: 16px; line-height: 1.5; max-width: 520px;">
      <p>Hi ${escape(name)},</p>
      <p>Use this link to set a new password for your Lens admin account:</p>
      <p><a href="${escape(url)}" style="display: inline-block; background: #0D519B; color: #ffffff; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: 600;">Set password</a></p>
      <p style="color: #44546A; font-size: 14px;">The link expires in 24 hours. If you did not expect this email, you can ignore it.</p>
    </div>`;
  return { subject, text, html };
}
