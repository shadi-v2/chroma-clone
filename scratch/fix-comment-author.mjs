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
  console.log("Finding owner user...");
  const ownerUsers = await sql`SELECT id, first_name, surname, email FROM users WHERE role = 'Owner' OR email = 'shahinshadi1122@gmail.com' LIMIT 5`;
  console.table(ownerUsers);

  const shahin = (await sql`SELECT id FROM users WHERE email = 'shahinshadi1122@gmail.com'`)[0];

  if (shahin) {
    console.log(`Updating testowner comments to Shahin Shadi (${shahin.id})...`);
    await sql`
      UPDATE comments 
      SET author_id = ${shahin.id} 
      WHERE author_id = '6a3666d890698c56f367fad3'
    `;
    console.log("✓ Updated comments successfully!");
  }

  const updatedComments = await sql`
    SELECT c.id, c.article_id, c.author_id, c.content, u.first_name, u.surname, u.email
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 10
  `;
  console.table(updatedComments);
}

main().catch(console.error);
