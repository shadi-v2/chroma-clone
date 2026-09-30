const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
const { neon } = require('@neondatabase/serverless');

// Load environment variables
loadEnvConfig(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const backupDir = path.join(__dirname, '..', 'mongo_backup');

function loadJson(filename) {
  const p = path.join(backupDir, filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    console.error(`Error loading ${filename}:`, err);
    return [];
  }
}

async function runSeed() {
  console.log('🚀 Starting MongoDB Backup Seed to PostgreSQL/Neon Database...\n');

  // 1. Ensure Schema
  console.log('📦 Step 1: Ensuring Schema and Tables...');
  const schemaFile = fs.readFileSync(path.join(__dirname, '..', 'lib', 'schema.ts'), 'utf8');
  const match = schemaFile.match(/export const SCHEMA_SQL = `([\s\S]*?)`;/);
  if (match) {
    const statements = match[1]
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await sql.query(stmt);
      } catch (err) {
        if (!err.message?.includes('already exists') && !err.message?.includes('duplicate key')) {
          console.warn('Schema statement notice:', err.message);
        }
      }
    }
  }
  console.log('✅ Schema verified.\n');

  // 2. Seed Categories
  const categories = loadJson('categories.json');
  console.log(`📁 Step 2: Seeding ${categories.length} Categories...`);
  for (const c of categories) {
    await sql.query(
      `INSERT INTO categories (id, name, slug, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         updated_at = EXCLUDED.updated_at`,
      [
        c._id,
        c.name,
        c.slug,
        c.createdAt ? new Date(c.createdAt) : new Date(),
        c.updatedAt ? new Date(c.updatedAt) : new Date(),
      ]
    );
  }
  console.log('✅ Categories seeded.\n');

  // 3. Seed Users
  const users = loadJson('users.json');
  console.log(`👥 Step 3: Seeding ${users.length} Users with new features...`);
  const validUserIds = new Set();

  for (const u of users) {
    const email = u.email ? u.email.toLowerCase().trim() : '';
    if (!email) continue;

    validUserIds.add(u._id);

    // Shahin is Owner
    let role = u.role || 'Author';
    if (email === 'shahinshadi1122@gmail.com') {
      role = 'Owner';
    }

    // New features:
    // is_email_verified = true (all migrated users can log in immediately)
    // onboarding_completed = true if has firstName & school
    const isEmailVerified = true;
    const onboardingCompleted = Boolean(u.firstName && u.school);
    const genres = u.genres && Array.isArray(u.genres) && u.genres.length > 0
      ? u.genres
      : ['Story', 'Article', 'Poetry', 'Essays'];

    await sql.query(
      `INSERT INTO users (
         id, first_name, surname, email, password, role, school, bio, phone,
         date_of_birth, avatar, avatar_public_id, is_frozen, is_email_verified,
         onboarding_completed, genres, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
         is_frozen = EXCLUDED.is_frozen,
         is_email_verified = EXCLUDED.is_email_verified,
         onboarding_completed = EXCLUDED.onboarding_completed,
         genres = EXCLUDED.genres,
         updated_at = EXCLUDED.updated_at`,
      [
        u._id,
        u.firstName || '',
        u.surname || '',
        email,
        u.password,
        role,
        u.school || '',
        u.bio || '',
        u.phone || null,
        u.dateOfBirth ? new Date(u.dateOfBirth) : null,
        u.avatar || null,
        u.avatarPublicId || null,
        Boolean(u.isFrozen),
        isEmailVerified,
        onboardingCompleted,
        genres,
        u.createdAt ? new Date(u.createdAt) : new Date(),
        u.updatedAt ? new Date(u.updatedAt) : new Date(),
      ]
    );
  }
  console.log('✅ Users seeded.\n');

  // 4. Seed Articles
  const articles = loadJson('articles.json');
  console.log(`📝 Step 4: Seeding ${articles.length} Articles with Public Positions...`);
  const validArticleIds = new Set();

  // Sort published articles to assign sequential public positions 1..N
  let publishedCounter = 1;
  const publishedArticles = articles
    .filter((a) => a.status === 'Published')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  const positionMap = new Map();
  publishedArticles.forEach((a) => {
    positionMap.set(a._id, publishedCounter++);
  });

  for (const a of articles) {
    if (!validUserIds.has(a.author)) {
      console.warn(`Skipping article "${a.title}" - author ${a.author} not found`);
      continue;
    }

    validArticleIds.add(a._id);

    const position = positionMap.get(a._id) || null;
    const content = typeof a.content === 'object' ? JSON.stringify(a.content) : a.content;
    const tags = Array.isArray(a.tags) ? a.tags : [];

    await sql.query(
      `INSERT INTO articles (
         id, title, excerpt, content, author_id, category_id, status,
         thumbnail, featured_image, tags, read_time, likes, comments_count,
         bookmarks_count, reads, position, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
         position = EXCLUDED.position,
         updated_at = EXCLUDED.updated_at`,
      [
        a._id,
        a.title,
        a.excerpt || null,
        content,
        a.author,
        a.category,
        a.status || 'Pending',
        a.thumbnail || a.featuredImage || null,
        a.featuredImage || a.thumbnail || null,
        tags,
        a.readTime || '5 min read',
        Number(a.likes || 0),
        Number(a.commentsCount || 0),
        Number(a.bookmarksCount || 0),
        Number(a.reads || 0),
        position,
        a.createdAt ? new Date(a.createdAt) : new Date(),
        a.updatedAt ? new Date(a.updatedAt) : new Date(),
      ]
    );

    // Enrollments
    const enrolledUsers = new Set([a.author, ...(Array.isArray(a.enrolledBy) ? a.enrolledBy : [])]);
    for (const uId of enrolledUsers) {
      if (validUserIds.has(uId)) {
        await sql.query(
          `INSERT INTO article_enrollments (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [a._id, uId]
        );
      }
    }

    // Likes
    if (Array.isArray(a.likedBy)) {
      for (const uId of a.likedBy) {
        if (validUserIds.has(uId)) {
          await sql.query(
            `INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [a._id, uId]
          );
        }
      }
    }

    // Bookmarks
    if (Array.isArray(a.bookmarkedBy)) {
      for (const uId of a.bookmarkedBy) {
        if (validUserIds.has(uId)) {
          await sql.query(
            `INSERT INTO article_bookmarks (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [a._id, uId]
          );
        }
      }
    }
  }

  // Also check users.bookmarks & users.likedArticles
  for (const u of users) {
    if (Array.isArray(u.bookmarks)) {
      for (const artId of u.bookmarks) {
        if (validArticleIds.has(artId) && validUserIds.has(u._id)) {
          await sql.query(
            `INSERT INTO article_bookmarks (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [artId, u._id]
          );
        }
      }
    }
    if (Array.isArray(u.likedArticles)) {
      for (const artId of u.likedArticles) {
        if (validArticleIds.has(artId) && validUserIds.has(u._id)) {
          await sql.query(
            `INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [artId, u._id]
          );
        }
      }
    }
  }
  console.log('✅ Articles, enrollments, likes, and bookmarks seeded.\n');

  // 5. Seed Comments
  const comments = loadJson('comments.json');
  console.log(`💬 Step 5: Seeding ${comments.length} Comments...`);
  for (const c of comments) {
    if (!validArticleIds.has(c.article) || !validUserIds.has(c.author)) {
      continue;
    }

    await sql.query(
      `INSERT INTO comments (id, article_id, author_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         content = EXCLUDED.content,
         updated_at = EXCLUDED.updated_at`,
      [
        c._id,
        c.article,
        c.author,
        c.content,
        c.createdAt ? new Date(c.createdAt) : new Date(),
        c.updatedAt ? new Date(c.updatedAt) : new Date(),
      ]
    );
  }

  // Sync comments_count on articles
  await sql.query(`
    UPDATE articles a
    SET comments_count = (
      SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id
    )
  `);
  console.log('✅ Comments seeded and counts synchronized.\n');

  // 6. Seed Notifications
  const notifications = loadJson('notifications.json');
  console.log(`🔔 Step 6: Seeding ${notifications.length} Notifications...`);
  for (const n of notifications) {
    if (!validUserIds.has(n.createdBy)) {
      continue;
    }

    await sql.query(
      `INSERT INTO notifications (id, title, message, type, created_by_id, is_global, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         message = EXCLUDED.message,
         type = EXCLUDED.type,
         is_global = EXCLUDED.is_global,
         updated_at = EXCLUDED.updated_at`,
      [
        n._id,
        n.title,
        n.message,
        n.type || 'General',
        n.createdBy,
        n.isGlobal !== undefined ? Boolean(n.isGlobal) : true,
        n.createdAt ? new Date(n.createdAt) : new Date(),
        n.updatedAt ? new Date(n.updatedAt) : new Date(),
      ]
    );

    // Recipients
    if (Array.isArray(n.recipients)) {
      for (const rId of n.recipients) {
        if (validUserIds.has(rId)) {
          await sql.query(
            `INSERT INTO notification_recipients (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [n._id, rId]
          );
        }
      }
    }

    // Read by
    if (Array.isArray(n.readBy)) {
      for (const rId of n.readBy) {
        if (validUserIds.has(rId)) {
          await sql.query(
            `INSERT INTO notification_reads (notification_id, user_id, read_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
            [n._id, rId]
          );
        }
      }
    }
  }
  console.log('✅ Notifications seeded.\n');

  // 7. Verify Counts in Postgres
  console.log('📊 Verification of Records in Database:');
  const [usersCount] = await sql.query('SELECT COUNT(*) FROM users');
  const [categoriesCount] = await sql.query('SELECT COUNT(*) FROM categories');
  const [articlesCount] = await sql.query('SELECT COUNT(*) FROM articles');
  const [commentsCount] = await sql.query('SELECT COUNT(*) FROM comments');
  const [notifsCount] = await sql.query('SELECT COUNT(*) FROM notifications');
  const [likesCount] = await sql.query('SELECT COUNT(*) FROM article_likes');
  const [bookmarksCount] = await sql.query('SELECT COUNT(*) FROM article_bookmarks');
  const [enrollmentsCount] = await sql.query('SELECT COUNT(*) FROM article_enrollments');

  console.log(`- Users in DB: ${usersCount.count}`);
  console.log(`- Categories in DB: ${categoriesCount.count}`);
  console.log(`- Articles in DB: ${articlesCount.count}`);
  console.log(`- Comments in DB: ${commentsCount.count}`);
  console.log(`- Notifications in DB: ${notifsCount.count}`);
  console.log(`- Article Likes in DB: ${likesCount.count}`);
  console.log(`- Bookmarks in DB: ${bookmarksCount.count}`);
  console.log(`- Enrollments in DB: ${enrollmentsCount.count}`);

  console.log('\n🎉 ALL DATA FROM MONGO_BACKUP SUCCESSFULLY SEEDED TO DATABASE!');
}

runSeed().catch((err) => {
  console.error('❌ Migration / Seed failed:', err);
  process.exit(1);
});
