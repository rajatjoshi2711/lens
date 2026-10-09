import "server-only";
import { hasEnv } from "@/lib/env";

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "missing_token" | "rejected" | "unreachable"; codes?: string[] };

/**
 * Verifies a Cloudflare Turnstile token. Outside production, a missing
 * Turnstile config is allowed so the upload flow works before keys exist.
 * Failures are logged with Cloudflare's error codes so they can be diagnosed
 * from the Vercel function logs.
 */
export async function verifyTurnstile(token: string | null, ip: string | null): Promise<TurnstileResult> {
  if (!hasEnv("turnstile")) {
    if (process.env.NODE_ENV !== "production") return { ok: true };
    console.error(
      "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY and/or TURNSTILE_SECRET_KEY are not set. " +
        "Uploads are refused in production until both are added in Vercel and the app is redeployed.",
    );
    return { ok: false, reason: "not_configured" };
  }
  if (!token) {
    console.warn("[turnstile] Upload arrived without a token (widget did not load or did not finish).");
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success: boolean; "error-codes"?: string[]; hostname?: string };
    if (json.success) return { ok: true };
    const codes = json["error-codes"] ?? [];
    console.warn(`[turnstile] Token rejected: ${codes.join(", ") || "no error code"} (hostname: ${json.hostname ?? "?"})`);
    return { ok: false, reason: "rejected", codes };
  } catch (err) {
    console.error("[turnstile] Could not reach Cloudflare siteverify", err);
    return { ok: false, reason: "unreachable" };
  }
}

/** Candidate-facing message and HTTP status for each failure. */
export function turnstileFailure(result: Exclude<TurnstileResult, { ok: true }>): { status: number; message: string } {
  switch (result.reason) {
    case "not_configured":
      return { status: 503, message: "Uploads are paused for a moment while we finish setting up. Try again later." };
    case "missing_token":
      return { status: 400, message: "Your browser check didn't finish. Wait a few seconds and try again." };
    case "unreachable":
      return { status: 503, message: "We couldn't check your browser just now. Try again in a minute." };
    case "rejected":
      // Expired or already-used tokens are the usual cause; a fresh token fixes them.
      return result.codes?.some((c) => c === "timeout-or-duplicate")
        ? { status: 400, message: "Your browser check expired. Try again." }
        : { status: 403, message: "We couldn't confirm you're not a bot. Refresh the page and try again." };
  }
}
