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
  console.error("Error: DATABASE_URL (or NEON_DATABASE_URL / POSTGRES_URL) is not defined.");
  process.exit(1);
}

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Author' CHECK (role IN ('Owner', 'Admin', 'Editor', 'Author')),
  school TEXT NOT NULL,
  bio TEXT,
  phone TEXT,
  date_of_birth TIMESTAMPTZ,
  avatar TEXT,
  avatar_public_id TEXT,
  is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  google_id TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Editing', 'Edited', 'Published', 'Paused')),
  thumbnail TEXT,
  featured_image TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  read_time TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  reads INTEGER NOT NULL DEFAULT 0,
  assigned_editor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_enrollments (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS article_likes (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS article_bookmarks (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'General',
  created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_global BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_recipients (
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT DEFAULT gen_random_uuid()::text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_reminder_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_is_active ON newsletters(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletters_token ON newsletters(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON sent_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to_email ON sent_emails(to_email);
`;

function parseJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content) return [];
  if (content.startsWith("[") && content.endsWith("]")) {
    try {
      return JSON.parse(content);
    } catch {
      // fallback
    }
  }
  const lines = content.split(/\r?\n/);
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      try {
        items.push(JSON.parse(trimmed));
      } catch (err) {
        console.warn("Skipping invalid JSON line:", trimmed.slice(0, 50), err);
      }
    }
  }
  return items;
}

function getId(val) {
  if (!val) return null;
  if (typeof val === "object" && val.$oid) return String(val.$oid);
  if (typeof val === "object" && val.id) return String(val.id);
  if (typeof val === "object" && val._id) return getId(val._id);
  return String(val);
}

function getDate(val) {
  if (!val) return null;
  if (typeof val === "object" && val.$date) return new Date(val.$date).toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

async function initDb() {
  console.log("Connecting to Neon PostgreSQL...");
  const sql = neon(DATABASE_URL);

  console.log("Resetting and recreating tables with TEXT IDs...");
  const DROP_TABLES = [
    "DROP TABLE IF EXISTS article_enrollments CASCADE;",
    "DROP TABLE IF EXISTS article_likes CASCADE;",
    "DROP TABLE IF EXISTS article_bookmarks CASCADE;",
    "DROP TABLE IF EXISTS comments CASCADE;",
    "DROP TABLE IF EXISTS notification_reads CASCADE;",
    "DROP TABLE IF EXISTS notification_recipients CASCADE;",
    "DROP TABLE IF EXISTS notifications CASCADE;",
    "DROP TABLE IF EXISTS articles CASCADE;",
    "DROP TABLE IF EXISTS tags CASCADE;",
    "DROP TABLE IF EXISTS categories CASCADE;",
    "DROP TABLE IF EXISTS users CASCADE;",
    "DROP TABLE IF EXISTS newsletters CASCADE;",
    "DROP TABLE IF EXISTS contacts CASCADE;"
  ];
  for (const dropStmt of DROP_TABLES) {
    await sql.query(dropStmt);
  }

  const statements = SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log("✓ Schema initialized successfully!");

  const backupDir = path.resolve(process.cwd(), "old_data_backup");
  if (!fs.existsSync(backupDir)) {
    console.log("No old_data_backup directory found, skipping seed.");
    return;
  }

  // 1. Seed Users
  console.log("Seeding Users...");
  const users = parseJsonFile(path.join(backupDir, "users_export.json"));
  const validUserIds = new Set();
  let userCount = 0;
  for (const u of users) {
    const id = getId(u._id);
    if (!id) continue;
    validUserIds.add(id);
    const firstName = u.firstName || "";
    const surname = u.surname || "";
    const email = (u.email || `user_${id}@chromadiaries.local`).toLowerCase().trim();
    const password = u.password || "";
    const role = u.role || "Author";
    const school = u.school || "";
    const bio = u.bio || "";
    const phone = u.phone || "";
    const dateOfBirth = getDate(u.dateOfBirth) || new Date().toISOString();
    const avatar = u.avatar || "";
    const avatarPublicId = u.avatarPublicId || "";
    const createdAt = getDate(u.createdAt) || new Date().toISOString();
    const updatedAt = getDate(u.updatedAt) || new Date().toISOString();

    await sql.query(`
      INSERT INTO users (id, first_name, surname, email, password, role, school, bio, phone, date_of_birth, avatar, avatar_public_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        surname = EXCLUDED.surname,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        school = EXCLUDED.school,
        bio = EXCLUDED.bio,
        phone = EXCLUDED.phone,
        date_of_birth = EXCLUDED.date_of_birth,
        avatar = EXCLUDED.avatar,
        avatar_public_id = EXCLUDED.avatar_public_id,
        updated_at = EXCLUDED.updated_at
    `, [id, firstName, surname, email, password, role, school, bio, phone, dateOfBirth, avatar, avatarPublicId, createdAt, updatedAt]);
    userCount++;
  }
  console.log(`✓ Seeded ${userCount} users.`);

  // 2. Seed Categories
  console.log("Seeding Categories...");
  const categories = parseJsonFile(path.join(backupDir, "categories_export.json"));
  const validCategoryIds = new Set();
  let catCount = 0;
  for (const c of categories) {
    const id = getId(c._id);
    if (!id) continue;
    validCategoryIds.add(id);
    const name = c.name;
    const slug = c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const createdAt = getDate(c.createdAt) || new Date().toISOString();
    const updatedAt = getDate(c.updatedAt) || new Date().toISOString();

    await sql.query(`
      INSERT INTO categories (id, name, slug, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        updated_at = EXCLUDED.updated_at
    `, [id, name, slug, createdAt, updatedAt]);
    catCount++;
  }
  console.log(`✓ Seeded ${catCount} categories.`);

  // 3. Seed Articles & Related Interactions
  console.log("Seeding Articles...");
  const articles = parseJsonFile(path.join(backupDir, "articles_export.json"));
  const validArticleIds = new Set();
  const firstUserId = Array.from(validUserIds)[0];
  const firstCategoryId = Array.from(validCategoryIds)[0];

  let artCount = 0;
  let enrollCount = 0;
  let likeCount = 0;
  let bookmarkCount = 0;

  for (const a of articles) {
    const id = getId(a._id);
    if (!id) continue;
    let authorId = getId(a.author);
    if (!authorId || !validUserIds.has(authorId)) {
      authorId = firstUserId;
    }
    let categoryId = getId(a.category);
    if (!categoryId || !validCategoryIds.has(categoryId)) {
      categoryId = firstCategoryId;
    }
    let assignedEditorId = getId(a.assignedEditor);
    if (assignedEditorId && !validUserIds.has(assignedEditorId)) {
      assignedEditorId = null;
    }

    const title = a.title || "Untitled";
    const excerpt = a.excerpt || "";
    const content = typeof a.content === "object" ? JSON.stringify(a.content) : String(a.content || "");
    const status = a.status || "Draft";
    const thumbnail = a.thumbnail || a.featuredImage || "";
    const featuredImage = a.featuredImage || a.thumbnail || "";
    const tags = Array.isArray(a.tags) ? a.tags : [];
    const readTime = a.readTime || "5 min read";
    const likes = Number(a.likes || (Array.isArray(a.likedBy) ? a.likedBy.length : 0));
    const commentsCount = Number(a.commentsCount || 0);
    const bookmarksCount = Number(a.bookmarksCount || (Array.isArray(a.bookmarkedBy) ? a.bookmarkedBy.length : 0));
    const reads = Number(a.reads || 0);
    const deletedAt = getDate(a.deletedAt);
    const createdAt = getDate(a.createdAt) || new Date().toISOString();
    const updatedAt = getDate(a.updatedAt) || new Date().toISOString();

    await sql.query(`
      INSERT INTO articles (id, title, excerpt, content, author_id, category_id, status, thumbnail, featured_image, tags, read_time, likes, comments_count, bookmarks_count, reads, assigned_editor_id, deleted_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content,
        author_id = EXCLUDED.author_id,
        category_id = EXCLUDED.category_id,
        status = EXCLUDED.status,
        thumbnail = EXCLUDED.thumbnail,
        featured_image = EXCLUDED.featured_image,
        tags = EXCLUDED.tags,
        read_time = EXCLUDED.read_time,
        likes = EXCLUDED.likes,
        comments_count = EXCLUDED.comments_count,
        bookmarks_count = EXCLUDED.bookmarks_count,
        reads = EXCLUDED.reads,
        assigned_editor_id = EXCLUDED.assigned_editor_id,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = EXCLUDED.updated_at
    `, [id, title, excerpt, content, authorId, categoryId, status, thumbnail, featuredImage, tags, readTime, likes, commentsCount, bookmarksCount, reads, assignedEditorId, deletedAt, createdAt, updatedAt]);
    
    validArticleIds.add(id);
    artCount++;

    if (Array.isArray(a.enrolledBy)) {
      for (const enr of a.enrolledBy) {
        const uId = getId(enr);
        if (uId && validUserIds.has(uId)) {
          await sql.query(`
            INSERT INTO article_enrollments (article_id, user_id, created_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT DO NOTHING
          `, [id, uId]);
          enrollCount++;
        }
      }
    }

    if (Array.isArray(a.likedBy)) {
      for (const lk of a.likedBy) {
        const uId = getId(lk);
        if (uId && validUserIds.has(uId)) {
          await sql.query(`
            INSERT INTO article_likes (article_id, user_id, created_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT DO NOTHING
          `, [id, uId]);
          likeCount++;
        }
      }
    }

    if (Array.isArray(a.bookmarkedBy)) {
      for (const bm of a.bookmarkedBy) {
        const uId = getId(bm);
        if (uId && validUserIds.has(uId)) {
          await sql.query(`
            INSERT INTO article_bookmarks (article_id, user_id, created_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT DO NOTHING
          `, [id, uId]);
          bookmarkCount++;
        }
      }
    }
  }
  console.log(`✓ Seeded ${artCount} articles (${enrollCount} enrollments, ${likeCount} likes, ${bookmarkCount} bookmarks).`);

  // 4. Seed Comments
  console.log("Seeding Comments...");
  const comments = parseJsonFile(path.join(backupDir, "comments_export.json"));
  let commentCount = 0;
  for (const com of comments) {
    const id = getId(com._id);
    const articleId = getId(com.article);
    let authorId = getId(com.author);
    const content = com.content || "";
    const parentCommentId = getId(com.parentComment);
    const createdAt = getDate(com.createdAt) || new Date().toISOString();
    const updatedAt = getDate(com.updatedAt) || new Date().toISOString();

    if (!id || !articleId || !validArticleIds.has(articleId)) {
      continue;
    }

    // If author user is not in users table, create a placeholder user account
    if (authorId && !validUserIds.has(authorId)) {
      await sql.query(`
        INSERT INTO users (id, first_name, surname, email, password, role, school, date_of_birth, created_at, updated_at)
        VALUES ($1, 'Guest', 'Reader', $2, 'disabled', 'Author', 'Reader Community', NOW(), NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [authorId, `reader_${authorId}@chromadiaries.local`]);
      validUserIds.add(authorId);
    } else if (!authorId) {
      authorId = firstUserId;
    }

    await sql.query(`
      INSERT INTO comments (id, article_id, author_id, content, parent_comment_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at
    `, [id, articleId, authorId, content, parentCommentId, createdAt, updatedAt]);
    commentCount++;
  }
  console.log(`✓ Seeded ${commentCount} comments.`);

  // Recalculate article comment counts
  await sql.query(`
    UPDATE articles
    SET comments_count = (
      SELECT count(*) FROM comments WHERE comments.article_id = articles.id
    )
  `);

  console.log("==========================================");
  console.log("All backup data seeded into Neon successfully!");
  console.log("==========================================");
}

initDb().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
