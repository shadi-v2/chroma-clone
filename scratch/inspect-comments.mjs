import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const idx = trimmed.indexOf("=");
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== ALL USERS ===");
  const users = await sql`SELECT id, first_name, surname, email, role, google_id FROM users ORDER BY created_at ASC`;
  console.table(users);

  console.log("=== ALL COMMENTS ===");
  const comments = await sql`
    SELECT c.id, c.article_id, c.author_id, c.content, c.created_at, u.first_name, u.surname, u.email
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    ORDER BY c.created_at DESC
  `;
  console.table(comments);
}

main().catch(console.error);
