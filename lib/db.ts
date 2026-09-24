import "server-only";
import { Pool } from "@neondatabase/serverless";
import { env } from "@/lib/env";

let pool: Pool | undefined;

/** Shared Neon connection pool (WebSocket-based, pg-compatible). */
export function getPool(): Pool {
  pool ??= new Pool({ connectionString: env("db").DATABASE_URL });
  return pool;
}
