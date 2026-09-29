import { createHash } from "node:crypto";

export function sha256(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Stable fingerprint of a resume's text: lowercased, punctuation and
 * whitespace collapsed, so re-exports of the same resume match.
 */
export function resumeFingerprint(text: string): string {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return sha256(normalized);
}

/**
 * Canonical email for the one-review-per-person rule: lowercase, drop
 * "+tag", and drop dots for Gmail (which ignores them).
 */
export function normalizeEmail(email: string): string {
  const [rawLocal, rawDomain = ""] = email.trim().toLowerCase().split("@");
  let local = rawLocal.split("+")[0];
  let domain = rawDomain;
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}
