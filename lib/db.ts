import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { env } from "@/lib/env";

let pool: Pool | undefined;

/**
 * Shared Postgres pool. Uses Neon's pooled connection string over TCP, which
 * is the recommended setup on Vercel Fluid compute.
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env("db").DATABASE_URL, max: 5 });
    // Lets Vercel close idle connections before a function instance suspends.
    attachDatabasePool(pool);
  }
  return pool;
}
