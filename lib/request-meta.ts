import "server-only";
import { randomBytes } from "node:crypto";
import { env, hasEnv } from "@/lib/env";
import { sha256 } from "@/lib/fingerprint";

export const CLAIM_COOKIE = "lens_claim";
export const CLAIM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Random token stored in the visitor's cookie; only its hash is saved. */
export function newClaimToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashClaimToken(token) };
}

export function hashClaimToken(token: string): string {
  return sha256(token);
}

/** Client IP as reported by Vercel's edge. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}

/** Salted hash so raw IP addresses are never stored. */
export function hashIp(ip: string | null): string {
  const salt = hasEnv("app") || process.env.NODE_ENV === "production" ? env("app").IP_HASH_SALT : "dev-only-salt";
  return sha256(`${salt}:${ip ?? "unknown"}`);
}
