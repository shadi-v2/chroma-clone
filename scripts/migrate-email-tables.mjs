import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL && !process.env.POSTGRES_URL) {
  try {
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
  } catch (e) {
    console.warn("Could not load .env file:", e);
  }
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL is not defined.");
  process.exit(1);
}

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Editorial',
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sent_emails (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  sent_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  status TEXT NOT NULL DEFAULT 'Sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON sent_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to_email ON sent_emails(to_email);
`;

const DEFAULT_TEMPLATES = [
  {
    name: "Article Acceptance & Publication Notice",
    subject: "Congratulations! Your piece has been accepted for publication ✨",
    category: "Editorial",
    content_html: `<p>Dear {{name}},</p>
<p>We are delighted to inform you that your piece, <strong>"{{title}}"</strong>, has been reviewed and officially accepted by our editorial board for publication on Chroma Diaries.</p>
<p>Our team was deeply impressed by your creative voice, artistic depth, and literary craftsmanship. Your work will be showcased on our main magazine showcase and distributed in our next literary dispatch.</p>
<p>Thank you for enriching Chroma Diaries with your storytelling.</p>
<p>Warm regards,<br /><strong>The Editorial Desk</strong><br />Chroma Diaries</p>`,
  },
  {
    name: "Editorial Feedback & Revision Request",
    subject: "Editorial Feedback & Revision Suggestions for \"{{title}}\"",
    category: "Editorial",
    content_html: `<p>Dear {{name}},</p>
<p>Thank you for submitting your piece, <strong>"{{title}}"</strong>, to Chroma Diaries.</p>
<p>Our editors have reviewed your draft and see remarkable potential in your work. To help prepare it for publication, we would appreciate a few refinements:</p>
<ul>
  <li>Pacing and tone balance in the central development section</li>
  <li>Refining stylistic consistency and character resonance</li>
</ul>
<p>Please feel free to update your draft directly inside your Author Studio whenever you are ready.</p>
<p>Warmly,<br /><strong>Editorial Board</strong><br />Chroma Diaries</p>`,
  },
  {
    name: "Author Spotlight & Interview Invitation",
    subject: "Exclusive Invitation: Chroma Diaries Author Spotlight Feature",
    category: "Spotlight",
    content_html: `<p>Dear {{name}},</p>
<p>We have been closely following your creative journey and artistic contributions. On behalf of the Chroma Diaries Editorial Board, we would love to formally invite you for an exclusive <strong>Author Spotlight Feature</strong> in our upcoming edition.</p>
<p>We want to highlight your creative process, your philosophical thoughts on writing, and share your unique voice with our nationwide readership.</p>
<p>Please reply to this email at your convenience so we can schedule our discussion.</p>
<p>With best regards,<br /><strong>Managing Editor</strong><br />Chroma Diaries</p>`,
  },
  {
    name: "Official Formal Letterhead",
    subject: "Official Communication from Chroma Diaries",
    category: "Official",
    content_html: `<p>Dear {{name}},</p>
<p>This is an official communication from the executive administration of Chroma Diaries Web Magazine.</p>
<p>[Please enter the detailed notice or announcement here]</p>
<p>If you have any questions or require additional information, please feel free to reach out to us directly.</p>
<p>Sincerely,<br /><strong>Administration & Operations</strong><br />Chroma Diaries</p>`,
  },
];

async function run() {
  console.log("Running email tables migration...");
  const sql = neon(DATABASE_URL);

  const statements = MIGRATION_SQL.split(";").map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log("✓ email_templates and sent_emails tables verified.");

  // Check if default templates exist
  const existing = await sql.query("SELECT COUNT(*) as count FROM email_templates");
  const count = Number(existing[0]?.count || 0);

  if (count === 0) {
    console.log("Seeding default official templates...");
    for (const t of DEFAULT_TEMPLATES) {
      await sql.query(
        "INSERT INTO email_templates (name, subject, content_html, category) VALUES ($1, $2, $3, $4)",
        [t.name, t.subject, t.content_html, t.category]
      );
    }
    console.log(`✓ Seeded ${DEFAULT_TEMPLATES.length} default official templates.`);
  } else {
    console.log(`✓ Found ${count} existing email templates.`);
  }

  console.log("Migration complete!");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
