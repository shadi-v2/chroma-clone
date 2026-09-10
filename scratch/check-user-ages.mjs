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
  const users = await sql`
    SELECT id, first_name, surname, email, role, date_of_birth, is_frozen, 
           EXTRACT(YEAR FROM age(NOW(), date_of_birth)) as calculated_age
    FROM users 
    ORDER BY created_at ASC
  `;
  console.table(users);
}

main().catch(console.error);
