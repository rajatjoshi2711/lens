import "server-only";
import { getPool } from "@/lib/db";
import { env, hasEnv } from "@/lib/env";
import { uploadToSharePoint } from "@/lib/sharepoint";
import { sharepointPath } from "@/lib/sharepoint-path";
import type { Teaser } from "@/lib/teaser";

export const DAILY_UPLOAD_LIMIT = 10;
const MAX_STORAGE_ATTEMPTS = 10;

export type NewUpload = {
  claimTokenHash: string;
  originalFilename: string;
  mimeType: string;
  bytes: Uint8Array;
  resumeText: string | null;
  resumeFingerprint: string | null;
  teaser: Teaser | null;
  targetRole: string | null;
  ipHash: string;
};

/** Increments today's upload count for this IP and reports whether it is over the limit. */
export async function isRateLimited(ipHash: string): Promise<boolean> {
  const { rows } = await getPool().query<{ c: number }>("select bump_upload_count($1) as c", [ipHash]);
  return rows[0].c > DAILY_UPLOAD_LIMIT;
}

/**
 * Saves the upload row and keeps the original bytes in the retry buffer
 * until SharePoint confirms. Returns the new upload id.
 */
export async function createUpload(u: NewUpload): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: string }>(
      `insert into uploads
         (claim_token_hash, original_filename, mime_type, size_bytes, resume_text,
          resume_fingerprint, teaser_json, target_role, ip_hash)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [
        u.claimTokenHash,
        u.originalFilename.slice(0, 255),
        u.mimeType,
        u.bytes.byteLength,
        u.resumeText,
        u.resumeFingerprint,
        u.teaser ? JSON.stringify(u.teaser) : null,
        u.targetRole,
        u.ipHash,
      ],
    );
    const id = rows[0].id;
    await client.query("insert into upload_retry_buffer (upload_id, file_bytes) values ($1, $2)", [
      id,
      Buffer.from(u.bytes),
    ]);
    await client.query("commit");
    return id;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

type BufferedUpload = {
  id: string;
  original_filename: string;
  mime_type: string;
  created_at: Date;
  file_bytes: Buffer;
};

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/**
 * Copies one buffered upload to SharePoint. On success the buffer is
 * deleted; on failure the attempt is counted for the retry job.
 * Returns false when SharePoint is not configured yet (the file stays buffered).
 */
export async function storeInSharePoint(uploadId: string): Promise<boolean> {
  if (!hasEnv("sharepoint")) return false;
  const pool = getPool();
  const { rows } = await pool.query<BufferedUpload>(
    `select u.id, u.original_filename, u.mime_type, u.created_at, b.file_bytes
       from uploads u join upload_retry_buffer b on b.upload_id = u.id
      where u.id = $1`,
    [uploadId],
  );
  const row = rows[0];
  if (!row) return true; // Already stored.

  const path = sharepointPath({
    root: env("sharepoint").SHAREPOINT_ROOT_FOLDER,
    uploadId: row.id,
    originalName: row.original_filename,
    ext: EXT_BY_MIME[row.mime_type] ?? "pdf",
    date: row.created_at,
  });

  try {
    const stored = await uploadToSharePoint(path, row.file_bytes, row.mime_type);
    await pool.query(
      `update uploads set storage_status = 'stored', sharepoint_item_id = $2, sharepoint_path = $3 where id = $1`,
      [row.id, stored.itemId, path],
    );
    await pool.query("delete from upload_retry_buffer where upload_id = $1", [row.id]);
    return true;
  } catch (err) {
    console.error(`SharePoint storage failed for upload ${row.id}`, err);
    await pool.query("update uploads set storage_status = 'failed' where id = $1", [row.id]);
    await pool.query("update upload_retry_buffer set attempts = attempts + 1 where upload_id = $1", [row.id]);
    return false;
  }
}

/** Upload ids still waiting for SharePoint, oldest first. */
export async function pendingStorageIds(limit: number): Promise<string[]> {
  const { rows } = await getPool().query<{ upload_id: string }>(
    `select upload_id from upload_retry_buffer
      where attempts < $1 and created_at < now() - interval '2 minutes'
      order by created_at
      limit $2`,
    [MAX_STORAGE_ATTEMPTS, limit],
  );
  return rows.map((r) => r.upload_id);
}

export type UploadSummary = {
  id: string;
  original_filename: string;
  teaser: Teaser | null;
  target_role: string | null;
  created_at: Date;
};

export async function findUploadByClaimHash(claimTokenHash: string): Promise<UploadSummary | null> {
  const { rows } = await getPool().query<UploadSummary & { teaser_json: Teaser | null }>(
    `select id, original_filename, teaser_json, target_role, created_at
       from uploads where claim_token_hash = $1`,
    [claimTokenHash],
  );
  const r = rows[0];
  return r ? { ...r, teaser: r.teaser_json } : null;
}
