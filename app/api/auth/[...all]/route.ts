import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { hasEnv } from "@/lib/env";

/**
 * Before auth is configured, answer quietly instead of throwing: the header
 * polls get-session on every page, and "nobody is signed in" is accurate.
 */
function notConfigured(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/get-session")) return NextResponse.json(null);
  return NextResponse.json({ message: "Sign-in is not set up yet." }, { status: 503 });
}

const ready = () => hasEnv("auth") && hasEnv("db");

export function GET(request: NextRequest) {
  if (!ready()) return notConfigured(request);
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: NextRequest) {
  if (!ready()) return notConfigured(request);
  return toNextJsHandler(getAuth()).POST(request);
}
