import type { NextRequest } from "next/server";
import { pendingStorageIds, storeInSharePoint } from "@/lib/uploads";

export const maxDuration = 60;

/**
 * Retries SharePoint storage for uploads still in the retry buffer.
 * Called by Vercel Cron (see vercel.json) with the CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ids = await pendingStorageIds(25);
  let stored = 0;
  for (const id of ids) {
    if (await storeInSharePoint(id)) stored++;
  }
  return Response.json({ checked: ids.length, stored });
}
