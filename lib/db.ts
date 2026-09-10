import { neon } from "@neondatabase/serverless";
import { SCHEMA_STATEMENTS } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

let isSchemaInitialized = false;

export function getDatabaseUrl(): string {
  if (!DATABASE_URL) {
    throw new Error(
      "Please define the DATABASE_URL (or NEON_DATABASE_URL / POSTGRES_URL) environment variable inside .env",
    );
  }
  return DATABASE_URL;
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
  try {
    const sql = getSql();
    for (const stmt of SCHEMA_STATEMENTS) {
      await sql.query(stmt);
    }
    isSchemaInitialized = true;
  } catch (error) {
    console.error("Schema initialization warning/error:", error);
  }
}

export async function connectDB() {
  await ensureSchema();
  return getSql();
}

export default getSql;
