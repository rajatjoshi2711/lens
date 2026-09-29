import "server-only";
import { hasEnv } from "@/lib/env";

/**
 * Verifies a Cloudflare Turnstile token. Outside production, a missing
 * Turnstile config is allowed so the upload flow works before keys exist.
 */
export async function verifyTurnstile(token: string | null, ip: string | null): Promise<boolean> {
  if (!hasEnv("turnstile")) {
    if (process.env.NODE_ENV === "production") {
      console.error("Turnstile is not configured; rejecting upload in production.");
      return false;
    }
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean };
    return json.success === true;
  } catch (err) {
    console.error("Turnstile verification failed", err);
    return false;
  }
}
