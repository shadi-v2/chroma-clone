import { neon } from "@neondatabase/serverless";
import { SCHEMA_STATEMENTS } from "./schema";

let isSchemaInitialized = false;

export function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!url) {
    throw new Error(
      "Please define the DATABASE_URL (or NEON_DATABASE_URL / POSTGRES_URL) environment variable inside .env",
    );
  }
  return url;
}

export function getSql() {
  const url = getDatabaseUrl();
  return neon(url);
}

export async function query<T = Record<string, unknown>>(
  sqlQuery: string,
  params: unknown[] = [],
): Promise<T[]> {
  const sql = getSql();
  const result = await sql.query(sqlQuery, params);
  return result as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sqlQuery: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sqlQuery, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function ensureSchema() {
  if (isSchemaInitialized) return;
  const url =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    return;
  }
  try {
    const sql = neon(url);
    for (const stmt of SCHEMA_STATEMENTS) {
      await sql.query(stmt);
    }
    isSchemaInitialized = true;
  } catch (error) {
    console.error("Schema initialization warning/error:", error);
  }
}

export async function connectDB() {
  const url =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    return null;
  }
  await ensureSchema();
  return getSql();
}

export default getSql;
