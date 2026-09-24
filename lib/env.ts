import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Each group is parsed lazily so a missing value
 * only breaks the feature that needs it, with a clear error message.
 */
const groups = {
  db: z.object({
    // Pooled connection string, added by the Vercel Neon integration.
    DATABASE_URL: z.string().min(1),
  }),
  auth: z.object({
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  }),
  email: z.object({
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1).default("Lens <no-reply@talentmuscle.com>"),
  }),
  groq: z.object({
    GROQ_API_KEY: z.string().min(1),
    GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
    GROQ_FALLBACK_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),
  }),
  sharepoint: z.object({
    MS_TENANT_ID: z.string().min(1),
    MS_CLIENT_ID: z.string().min(1),
    MS_CLIENT_SECRET: z.string().min(1),
    SHAREPOINT_SITE_ID: z.string().min(1),
    SHAREPOINT_ROOT_FOLDER: z.string().min(1).default("Resumes"),
  }),
  turnstile: z.object({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
  }),
  app: z.object({
    IP_HASH_SALT: z.string().min(16),
  }),
} as const;

type Groups = typeof groups;
const cache = new Map<keyof Groups, unknown>();

export function env<K extends keyof Groups>(group: K): z.infer<Groups[K]> {
  if (!cache.has(group)) {
    const result = groups[group].safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Missing or invalid ${group} environment variables: ${missing}. See .env.example.`);
    }
    cache.set(group, result.data);
  }
  return cache.get(group) as z.infer<Groups[K]>;
}

/** True when every variable in the group is set, without throwing. */
export function hasEnv(group: keyof Groups): boolean {
  return groups[group].safeParse(process.env).success;
}
