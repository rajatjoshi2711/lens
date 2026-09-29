import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { hasEnv } from "@/lib/env";

export type SessionUser = { id: string; name: string; email: string; image?: string | null };

/** The signed-in visitor, or null. Returns null (not an error) before auth is configured. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Read headers first so every caller renders per request, even before auth is configured.
  const requestHeaders = await headers();
  if (!hasEnv("auth") || !hasEnv("db")) return null;
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
