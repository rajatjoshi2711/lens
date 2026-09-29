import { type NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, hashClaimToken } from "@/lib/request-meta";
import { getSessionUser } from "@/lib/session";
import { claimUpload } from "@/lib/uploads";

/**
 * Landing point after Google sign-in. Links the anonymous upload (from the
 * claim cookie) to the signed-in candidate, then opens their report.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/teaser?signin=failed", request.url));

  const token = request.cookies.get(CLAIM_COOKIE)?.value;
  if (token) await claimUpload(hashClaimToken(token), user);

  const response = NextResponse.redirect(new URL("/report", request.url));
  // The upload now belongs to the account; the cookie has done its job.
  response.cookies.delete(CLAIM_COOKIE);
  return response;
}
