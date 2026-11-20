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
    content_html: `<div style="background-color: #fcfbf7; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 10px; margin-bottom: 24px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="165" style="display: block; width: 165px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(2, 44, 34, 0.08);">
      <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; border: 1px solid #a7f3d0;">
        Official Acceptance Notice
      </span>
    </div>

    <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 24px; margin: 0 0 16px 0; font-weight: 700; line-height: 1.35; text-align: center;">
      Congratulations, {{name}}!
    </h1>

    <div style="color: #1f2937; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
      <p>We are delighted to inform you that your piece, <strong>"{{title}}"</strong>, has been reviewed and officially accepted by our editorial board for publication on Chroma Diaries.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #022c22; padding: 18px 22px; border-radius: 14px; margin: 20px 0;">
        <div style="font-weight: bold; font-size: 13px; color: #022c22; margin-bottom: 6px;">Editorial Commendation</div>
        <div style="font-size: 13px; color: #374151; line-height: 1.6;">Our board was deeply impressed by your creative craftsmanship, emotional resonance, and distinct narrative clarity. Your work will be featured on our front page and published in our upcoming literary dispatch.</div>
      </div>

      <p>Thank you for enriching Chroma Diaries with your artistry.</p>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(2, 44, 34, 0.08); text-align: center;">
      <div style="font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: #022c22;">The Editorial Board</div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Chroma Diaries Web Magazine</div>
      <div style="margin-top: 12px; font-size: 11px;">
        <a href="https://chromadiaries.in" style="color: #047857; text-decoration: none; font-weight: 600;">Visit Web Magazine</a> • 
        <a href="mailto:editorial@chromadiaries.in" style="color: #047857; text-decoration: none; font-weight: 600;">Contact Editorial Desk</a>
      </div>
    </div>
  </div>
</div>`,
  },

  {
    name: "Editorial Feedback & Revision Request",
    subject: "Editorial Feedback & Revision Suggestions for \"{{title}}\"",
    category: "Editorial",
    content_html: `<div style="background-color: #fffdf5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #fef3c7; border-left: 6px solid #d97706; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: left; margin-top: 6px; margin-bottom: 22px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="145" style="display: block; width: 145px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 8px;">
        Manuscript Advisory
      </span>
    </div>

    <h2 style="font-family: Georgia, serif; color: #78350f; font-size: 22px; margin: 0 0 16px 0; font-weight: 700;">
      Editorial Notes: "{{title}}"
    </h2>

    <div style="color: #374151; font-size: 15px; line-height: 1.75; margin-bottom: 24px;">
      <p>Dear {{name}},</p>
      <p>Thank you for submitting your manuscript to Chroma Diaries. Our editors see wonderful promise in your piece and would love to help refine it for publication.</p>
      
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
        <div style="font-weight: bold; font-size: 13px; color: #b45309; margin-bottom: 8px;">Recommended Polish:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f; line-height: 1.7;">
          <li>Refining tone continuity between the opening setting and climax</li>
          <li>Sharpening word choices for deeper emotional resonance</li>
        </ul>
      </div>

      <p>Whenever you are ready, you can update your draft directly in your Author Studio.</p>
    </div>

    <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af; text-align: left;">
      Chroma Diaries Editorial Board • <a href="https://chromadiaries.in/dashboard" style="color: #d97706; text-decoration: none; font-weight: 600;">Open Author Studio &rarr;</a>
    </div>
  </div>
</div>`,
  },

  {
    name: "Author Spotlight & Interview Invitation",
    subject: "Exclusive Invitation: Chroma Diaries Author Spotlight Feature",
    category: "Spotlight",
    content_html: `<div style="background-color: #fffdf5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; border: 1px solid #fef3c7; border-top: 6px solid #b45309; padding: 40px; box-shadow: 0 12px 36px rgba(180, 83, 9, 0.06);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 8px; margin-bottom: 20px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="160" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 6px 20px; border-radius: 9999px; border: 1px solid #fde68a;">
        ★ AUTHOR SPOTLIGHT INVITATION ★
      </span>
    </div>

    <h1 style="font-family: Georgia, serif; color: #78350f; font-size: 24px; text-align: center; margin: 0 0 18px 0; font-weight: 700; line-height: 1.35;">
      Special Feature Invitation
    </h1>

    <div style="color: #374151; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
      <p>Dear {{name}},</p>
      <p>We have been admiring your literary journey and distinctive perspectives on Chroma Diaries. On behalf of our editorial leadership, we would be honored to feature you in an upcoming <strong>Author Spotlight Feature</strong>.</p>
      <p>This feature will highlight your creative process, your philosophical thoughts on writing, and showcase your profile to our nationwide community.</p>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="mailto:editorial@chromadiaries.in?subject=RSVP%20Author%20Spotlight" style="display: inline-block; background-color: #b45309; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 34px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(180, 83, 9, 0.25);">
        RSVP & Schedule Interview &rarr;
      </a>
    </div>

    <div style="border-top: 1px solid #fef3c7; padding-top: 24px; margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center;">
      Chroma Diaries Spotlight Desk • Sabeelul Hidaya Islamic College
    </div>
  </div>
</div>`,
  },

  {
    name: "Official Formal Letterhead",
    subject: "Official Communication from Chroma Diaries",
    category: "Official",
    content_html: `<div style="background-color: #f7f4ec; padding: 40px 20px; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #fdfbf7; border: 3px double #1c1917; padding: 44px 36px; box-shadow: 0 6px 24px rgba(0,0,0,0.03);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 6px; margin-bottom: 20px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/icon.png" alt="Chroma Diaries" width="70" style="display: block; width: 70px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #1c1917; margin-bottom: 20px; font-weight: bold;">
      ❖ CHROMA DIARIES ❖
    </div>

    <h2 style="font-size: 22px; color: #1c1917; font-weight: 700; text-align: center; margin: 0 0 24px 0; line-height: 1.4;">
      Official Executive Communication
    </h2>

    <div style="color: #292524; font-size: 15px; line-height: 1.8; margin-bottom: 28px;">
      <p>Dear {{name}},</p>
      <p>This is an official communication from the executive administration of Chroma Diaries Web Magazine.</p>
      <p>[Please enter the detailed notice, resolution, or organizational dispatch here]</p>
      <p>If you have any questions or require additional information, please feel free to reach out to our administrative desk.</p>
    </div>

    <div style="border-top: 1px solid rgba(28, 25, 23, 0.15); padding-top: 20px; margin-top: 36px; font-size: 12px; color: #78716c; text-align: center; font-style: italic;">
      Chroma Diaries • Sabeelul Hidaya Islamic College, Kooriyad
    </div>
  </div>
</div>`,
  },

  {
    name: "Weekend Magazine Digest & Reading Dispatch",
    subject: "Chroma Diaries Weekend Dispatch: Stories, Reflections & New Voices ✨",
    category: "Dispatch",
    content_html: `<div style="background-color: #061713; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0b241e; border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.2); overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
    <div style="background-color: #022c22; padding: 32px 36px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
      <!-- CD_LOGO_START -->
      <div data-chromadiaries-logo="true" style="text-align: center; margin: 0; padding: 0;">
        <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
          <img src="https://chromadiaries.in/logo-white.png" alt="Chroma Diaries" width="170" style="display: block; width: 170px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
        </a>
      </div>
      <!-- CD_LOGO_END -->
    </div>

    <div style="padding: 36px;">
      <h1 style="font-family: Georgia, serif; color: #ecfdf5; font-size: 22px; margin: 0 0 18px 0; font-weight: 700;">
        Weekend Literary Dispatch
      </h1>

      <div style="color: #d1fae5; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
        <p>Dear {{name}},</p>
        <p>Welcome to this week's curated edition of Chroma Diaries. Inside, you'll discover fresh prose, thought-provoking essays, and captivating voices from across our community.</p>
      </div>

      <div style="text-align: center; margin: 28px 0 14px 0;">
        <a href="https://chromadiaries.in" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 30px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
          Read Weekend Edition &rarr;
        </a>
      </div>

      <div style="border-top: 1px solid rgba(16, 185, 129, 0.15); padding-top: 20px; margin-top: 32px; font-size: 11px; color: #6ee7b7; text-align: center;">
        Chroma Diaries • Midnight Editorial Collective
      </div>
    </div>
  </div>
</div>`,
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

  // Seed / update templates with rich HTML layouts
  console.log("Seeding / updating official email templates with full HTML layouts...");
  for (const t of DEFAULT_TEMPLATES) {
    const existing = await sql.query("SELECT id FROM email_templates WHERE name = $1", [t.name]);
    if (existing && existing.length > 0) {
      await sql.query(
        "UPDATE email_templates SET subject = $1, content_html = $2, category = $3, updated_at = NOW() WHERE id = $4",
        [t.subject, t.content_html, t.category, existing[0].id]
      );
      console.log(`  ✓ Updated template layout: "${t.name}"`);
    } else {
      await sql.query(
        "INSERT INTO email_templates (name, subject, content_html, category) VALUES ($1, $2, $3, $4)",
        [t.name, t.subject, t.content_html, t.category]
      );
      console.log(`  ✓ Created template layout: "${t.name}"`);
    }
  }

  console.log("Migration complete!");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
