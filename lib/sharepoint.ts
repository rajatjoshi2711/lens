import "server-only";
import { env } from "@/lib/env";

const GRAPH = "https://graph.microsoft.com/v1.0";

let cachedToken: { value: string; expiresAt: number } | undefined;

/** App-only Graph token via the client credentials flow, cached until near expiry. */
async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET } = env("sharepoint");
  const res = await fetch(`https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Graph token request failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export type StoredFile = { itemId: string; webUrl: string };

/**
 * Uploads a file to the site's default document library. Simple upload
 * handles files up to 250 MB, well above the 4 MB resume cap.
 */
export async function uploadToSharePoint(path: string, bytes: Uint8Array, mimeType: string): Promise<StoredFile> {
  const { SHAREPOINT_SITE_ID } = env("sharepoint");
  const url = `${GRAPH}/sites/${SHAREPOINT_SITE_ID}/drive/root:/${encodePath(path)}:/content?@microsoft.graph.conflictBehavior=rename`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { authorization: `Bearer ${await getToken()}`, "content-type": mimeType },
    body: Buffer.from(bytes),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SharePoint upload failed: ${res.status} ${await res.text()}`);
  const item = (await res.json()) as { id: string; webUrl: string };
  return { itemId: item.id, webUrl: item.webUrl };
}

/** Streams a stored file back (used by the admin download route). */
export async function downloadFromSharePoint(itemId: string): Promise<Response> {
  const { SHAREPOINT_SITE_ID } = env("sharepoint");
  const res = await fetch(`${GRAPH}/sites/${SHAREPOINT_SITE_ID}/drive/items/${encodeURIComponent(itemId)}/content`, {
    headers: { authorization: `Bearer ${await getToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SharePoint download failed: ${res.status}`);
  return res;
}
