/**
 * Applies db/migrations/*.sql in filename order, once each.
 * Usage: npm run db:migrate   (reads .env.local)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run `npx vercel env pull .env.local` first.");
  process.exit(1);
}

const dir = path.join(process.cwd(), "db", "migrations");
const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
    const { rows } = await client.query<{ name: string }>("select name from schema_migrations");
    const applied = new Set(rows.map((r) => r.name));
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      process.stdout.write(`Applying ${file} ... `);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log("done");
        count++;
      } catch (err) {
        await client.query("rollback");
        console.log("failed");
        throw err;
      }
    }
    console.log(count ? `Applied ${count} migration(s).` : "Database is up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
