import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^DATABASE_URL\s*=\s*['"]?(.*?)['"]?$/);
    if (match) dbUrl = match[1];
  }
}
const sql = neon(dbUrl);
const comments = await sql`
  SELECT c.id, c.article_id, c.author_id, c.content, c.created_at, u.first_name, u.surname, u.email
  FROM comments c
  LEFT JOIN users u ON c.author_id = u.id
  ORDER BY c.created_at DESC
  LIMIT 10
`;
console.log("Recent comments in DB:");
console.table(comments);

const users = await sql`
  SELECT id, first_name, surname, email, role FROM users LIMIT 10
`;
console.log("Users in DB:");
console.table(users);
