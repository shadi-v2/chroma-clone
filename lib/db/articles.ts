import { query, queryOne } from "@/lib/db";
import type { PublicArticle, ArticleStatus, ArticleCategory } from "@/types/article";
import type { PublicUser, UserRole } from "@/types/user";

export interface DbArticleRow {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_id: string;
  category_id: string;
  status: ArticleStatus;
  thumbnail: string | null;
  featured_image: string | null;
  tags: string[] | null;
  read_time: string | null;
  likes: number;
  comments_count: number;
  bookmarks_count: number;
  reads: number;
  assigned_editor_id: string | null;
  deleted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  author_first_name?: string;
  author_surname?: string;
  author_email?: string;
  author_role?: string;
  author_school?: string;
  author_bio?: string;
  author_avatar?: string;
  author_date_of_birth?: string | Date;
  author_is_frozen?: boolean;
  category_name?: string;
  category_slug?: string;
  editor_first_name?: string;
  editor_surname?: string;
  editor_email?: string;
  editor_avatar?: string;
  editor_role?: string;
  enrolled_by?: string[];
  liked_by?: string[];
  bookmarked_by?: string[];
}

export function formatArticle(row: DbArticleRow | null): PublicArticle | null {
  if (!row) return null;

  const author: PublicUser = {
    _id: row.author_id,
    id: row.author_id,
    firstName: row.author_first_name || "",
    surname: row.author_surname || "",
    email: row.author_email || "",
    role: (row.author_role as UserRole) || "Author",
    school: row.author_school || "",
    bio: row.author_bio || "",
    avatar: row.author_avatar || "",
    dateOfBirth: row.author_date_of_birth
      ? new Date(row.author_date_of_birth).toISOString()
      : undefined,
    isFrozen: row.author_is_frozen,
  };

  const category: ArticleCategory = {
    _id: row.category_id,
    id: row.category_id,
    name: row.category_name || "",
    slug: row.category_slug || "",
  };

  let assignedEditor: PublicUser | undefined = undefined;
  if (row.assigned_editor_id) {
    assignedEditor = {
      _id: row.assigned_editor_id,
      id: row.assigned_editor_id,
      firstName: row.editor_first_name || "",
      surname: row.editor_surname || "",
      email: row.editor_email || "",
      avatar: row.editor_avatar || "",
      school: "",
      role: (row.editor_role as UserRole) || "Editor",
    };
  }

  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || "",
    content: row.content,
    author,
    category,
    status: row.status,
    thumbnail: row.thumbnail || row.featured_image || "",
    featuredImage: row.featured_image || row.thumbnail || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    readTime: row.read_time || "5 min read",
    likes: Number(row.likes || 0),
    commentsCount: Number(row.comments_count || 0),
    bookmarksCount: Number(row.bookmarks_count || 0),
    reads: Number(row.reads || 0),
    assignedEditor,
    enrolledBy: Array.isArray(row.enrolled_by) ? row.enrolled_by : [],
    likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
    bookmarkedBy: Array.isArray(row.bookmarked_by) ? row.bookmarked_by : [],
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

const ARTICLE_SELECT = `
  SELECT 
    a.*,
    u.first_name as author_first_name,
    u.surname as author_surname,
    u.email as author_email,
    u.role as author_role,
    u.school as author_school,
    u.bio as author_bio,
    u.avatar as author_avatar,
    u.date_of_birth as author_date_of_birth,
    u.is_frozen as author_is_frozen,
    c.name as category_name,
    c.slug as category_slug,
    e.first_name as editor_first_name,
    e.surname as editor_surname,
    e.email as editor_email,
    e.avatar as editor_avatar,
    e.role as editor_role,
    COALESCE(
      (SELECT array_agg(user_id::text) FROM article_enrollments WHERE article_id = a.id),
      '{}'
    ) as enrolled_by,
    COALESCE(
      (SELECT array_agg(user_id::text) FROM article_likes WHERE article_id = a.id),
      '{}'
    ) as liked_by,
    COALESCE(
      (SELECT array_agg(user_id::text) FROM article_bookmarks WHERE article_id = a.id),
      '{}'
    ) as bookmarked_by
  FROM articles a
  LEFT JOIN users u ON a.author_id = u.id
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN users e ON a.assigned_editor_id = e.id
`;

export async function findArticleById(id: string): Promise<PublicArticle | null> {
  const row = await queryOne<DbArticleRow>(
    `${ARTICLE_SELECT} WHERE a.id = $1`,
    [id],
  );
  return formatArticle(row);
}

export async function findArticles(options: {
  category?: string | null;
  author?: string | null;
  status?: string | null;
  sortBy?: "likes" | "latest" | null;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}): Promise<{
  articles: PublicArticle[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 10;
  const offset = (page - 1) * limit;

  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (!options.includeDeleted) {
    whereConditions.push(`a.deleted_at IS NULL`);
  }

  if (options.status === "all") {
    // do not filter by status
  } else if (options.status) {
    whereConditions.push(`a.status = $${paramIdx++}`);
    params.push(options.status);
  } else {
    whereConditions.push(`a.status = 'Published'`);
  }

  if (options.author) {
    whereConditions.push(`a.author_id = $${paramIdx++}`);
    params.push(options.author);
  }

  if (options.category) {
    const isId = /^[0-9a-f-]{24,36}$/i.test(options.category);
    if (isId) {
      whereConditions.push(`(a.category_id = $${paramIdx} OR LOWER(c.name) = LOWER($${paramIdx}) OR LOWER(c.slug) = LOWER($${paramIdx}))`);
      paramIdx++;
      params.push(options.category);
    } else {
      whereConditions.push(`(
        LOWER(c.name) = LOWER($${paramIdx})
        OR LOWER(c.slug) = LOWER($${paramIdx})
        OR LOWER(c.name) LIKE LOWER($${paramIdx} || '%')
        OR LOWER(c.slug) LIKE LOWER($${paramIdx} || '%')
        OR LOWER($${paramIdx}) LIKE (LOWER(c.name) || '%')
        OR LOWER($${paramIdx}) LIKE (LOWER(c.slug) || '%')
      )`);
      paramIdx++;
      params.push(options.category);
    }
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  let orderClause = `ORDER BY a.updated_at DESC`;
  if (options.sortBy === "likes") {
    orderClause = `ORDER BY a.likes DESC, a.updated_at DESC`;
  }

  const countQuery = `
    SELECT COUNT(*) as count
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereClause}
  `;

  const dataQuery = `
    ${ARTICLE_SELECT}
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const [countResult, rows] = await Promise.all([
    queryOne<{ count: string | number }>(countQuery, params),
    query<DbArticleRow>(dataQuery, [...params, limit, offset]),
  ]);

  const total = Number(countResult?.count || 0);
  const articles = rows.map(formatArticle).filter(Boolean) as PublicArticle[];

  return {
    articles,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function createArticle(data: {
  title: string;
  excerpt?: string;
  content: string;
  authorId: string;
  categoryId: string;
  thumbnail?: string;
  featuredImage?: string;
  readTime?: string;
  status?: ArticleStatus;
  tags?: string[];
}): Promise<PublicArticle> {
  const status = data.status || "Pending";
  const thumbnail = data.thumbnail || data.featuredImage || null;
  const featuredImage = data.featuredImage || data.thumbnail || null;
  const readTime = data.readTime || "5 min read";
  const tags = data.tags || [];

  const created = await queryOne<DbArticleRow>(
    `INSERT INTO articles (
       title, excerpt, content, author_id, category_id,
       thumbnail, featured_image, read_time, status, tags
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      data.title,
      data.excerpt || null,
      data.content,
      data.authorId,
      data.categoryId,
      thumbnail,
      featuredImage,
      readTime,
      status,
      tags,
    ],
  );

  if (created?.id) {
    // automatically enroll author
    await query(
      `INSERT INTO article_enrollments (article_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [created.id, data.authorId],
    );
    return (await findArticleById(created.id))!;
  }

  throw new Error("Failed to create article");
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  thumbnail: string;
  featuredImage: string;
  readTime: string;
  status: ArticleStatus;
  assignedEditorId: string | null;
  deletedAt: Date | null;
  tags: string[];
  authorId: string;
}>): Promise<PublicArticle | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.excerpt !== undefined) {
    fields.push(`excerpt = $${idx++}`);
    values.push(data.excerpt);
  }
  if (data.content !== undefined) {
    fields.push(`content = $${idx++}`);
    values.push(data.content);
  }
  if (data.categoryId !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(data.categoryId);
  }
  if (data.thumbnail !== undefined || data.featuredImage !== undefined) {
    const thumb = data.thumbnail || data.featuredImage || null;
    const feat = data.featuredImage || data.thumbnail || null;
    fields.push(`thumbnail = $${idx++}`);
    values.push(thumb);
    fields.push(`featured_image = $${idx++}`);
    values.push(feat);
  }
  if (data.readTime !== undefined) {
    fields.push(`read_time = $${idx++}`);
    values.push(data.readTime);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.assignedEditorId !== undefined) {
    fields.push(`assigned_editor_id = $${idx++}`);
    values.push(data.assignedEditorId);
  }
  if (data.deletedAt !== undefined) {
    fields.push(`deleted_at = $${idx++}`);
    values.push(data.deletedAt);
  }
  if (data.tags !== undefined) {
    fields.push(`tags = $${idx++}`);
    values.push(data.tags);
  }
  if (data.authorId !== undefined) {
    fields.push(`author_id = $${idx++}`);
    values.push(data.authorId);
  }

  if (fields.length === 0) return findArticleById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  await query(
    `UPDATE articles SET ${fields.join(", ")} WHERE id = $${idx}`,
    values,
  );

  return findArticleById(id);
}

export async function softDeleteArticle(id: string): Promise<boolean> {
  await query(
    `UPDATE articles SET deleted_at = NOW(), status = 'Draft', updated_at = NOW() WHERE id = $1`,
    [id],
  );
  return true;
}

export async function recoverArticle(id: string): Promise<PublicArticle | null> {
  await query(
    `UPDATE articles SET deleted_at = NULL, status = 'Pending', updated_at = NOW() WHERE id = $1`,
    [id],
  );
  return findArticleById(id);
}

export async function hardDeleteArticle(id: string): Promise<boolean> {
  await query(`DELETE FROM articles WHERE id = $1`, [id]);
  return true;
}

export async function toggleLikeArticle(articleId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  const existing = await queryOne(
    `SELECT 1 FROM article_likes WHERE article_id = $1 AND user_id = $2`,
    [articleId, userId],
  );

  if (existing) {
    await query(`DELETE FROM article_likes WHERE article_id = $1 AND user_id = $2`, [articleId, userId]);
    const updated = await queryOne<{ likes: number }>(
      `UPDATE articles SET likes = GREATEST(likes - 1, 0), updated_at = NOW() WHERE id = $1 RETURNING likes`,
      [articleId],
    );
    return { liked: false, likes: Number(updated?.likes || 0) };
  } else {
    await query(`INSERT INTO article_likes (article_id, user_id) VALUES ($1, $2)`, [articleId, userId]);
    const updated = await queryOne<{ likes: number }>(
      `UPDATE articles SET likes = likes + 1, updated_at = NOW() WHERE id = $1 RETURNING likes`,
      [articleId],
    );
    return { liked: true, likes: Number(updated?.likes || 0) };
  }
}

export async function toggleBookmarkArticle(articleId: string, userId: string): Promise<{ bookmarked: boolean }> {
  const existing = await queryOne(
    `SELECT 1 FROM article_bookmarks WHERE article_id = $1 AND user_id = $2`,
    [articleId, userId],
  );

  if (existing) {
    await query(`DELETE FROM article_bookmarks WHERE article_id = $1 AND user_id = $2`, [articleId, userId]);
    await query(
      `UPDATE articles SET bookmarks_count = GREATEST(bookmarks_count - 1, 0), updated_at = NOW() WHERE id = $1`,
      [articleId],
    );
    return { bookmarked: false };
  } else {
    await query(`INSERT INTO article_bookmarks (article_id, user_id) VALUES ($1, $2)`, [articleId, userId]);
    await query(
      `UPDATE articles SET bookmarks_count = bookmarks_count + 1, updated_at = NOW() WHERE id = $1`,
      [articleId],
    );
    return { bookmarked: true };
  }
}

export async function toggleEnrollArticle(articleId: string, userId: string): Promise<{ enrolled: boolean }> {
  const existing = await queryOne(
    `SELECT 1 FROM article_enrollments WHERE article_id = $1 AND user_id = $2`,
    [articleId, userId],
  );

  if (existing) {
    await query(`DELETE FROM article_enrollments WHERE article_id = $1 AND user_id = $2`, [articleId, userId]);
    return { enrolled: false };
  } else {
    await query(`INSERT INTO article_enrollments (article_id, user_id) VALUES ($1, $2)`, [articleId, userId]);
    return { enrolled: true };
  }
}

export async function incrementArticleViews(
  id: string,
  userId?: string | null,
): Promise<{ reads: number; incremented: boolean }> {
  if (!userId) {
    const updated = await queryOne<{ reads: number }>(
      `UPDATE articles SET reads = reads + 1, updated_at = NOW() WHERE id = $1 RETURNING reads`,
      [id],
    );
    return { reads: Number(updated?.reads || 0), incremented: true };
  }

  const existing = await queryOne<{ article_id: string }>(
    `SELECT article_id FROM article_views WHERE article_id = $1 AND user_id = $2`,
    [id, userId],
  );

  if (existing) {
    const current = await queryOne<{ reads: number }>(
      `SELECT reads FROM articles WHERE id = $1`,
      [id],
    );
    return { reads: Number(current?.reads || 0), incremented: false };
  }

  await query(
    `INSERT INTO article_views (article_id, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
    [id, userId],
  );

  const updated = await queryOne<{ reads: number }>(
    `UPDATE articles SET reads = reads + 1, updated_at = NOW() WHERE id = $1 RETURNING reads`,
    [id],
  );

  return { reads: Number(updated?.reads || 0), incremented: true };
}

export async function getTrendingArticles(limit: number = 3): Promise<PublicArticle[]> {
  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    WHERE a.status = 'Published' AND a.deleted_at IS NULL
    ORDER BY a.likes DESC, a.updated_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return rows.map(formatArticle).filter(Boolean) as PublicArticle[];
}

export async function getRelatedArticles(articleId: string, categoryId: string, limit: number = 3): Promise<PublicArticle[]> {
  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    WHERE a.id != $1 AND a.category_id = $2 AND a.status = 'Published' AND a.deleted_at IS NULL
    ORDER BY a.updated_at DESC
    LIMIT $3
    `,
    [articleId, categoryId, limit],
  );
  return rows.map(formatArticle).filter(Boolean) as PublicArticle[];
}

export async function getUserPublishedArticles(userId: string): Promise<PublicArticle[]> {
  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    WHERE a.author_id = $1 AND a.status = 'Published' AND a.deleted_at IS NULL
    ORDER BY a.updated_at DESC
    `,
    [userId],
  );
  return rows.map(formatArticle).filter(Boolean) as PublicArticle[];
}

export async function getUserAllArticles(userId: string): Promise<PublicArticle[]> {
  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    WHERE a.author_id = $1 AND a.deleted_at IS NULL
    ORDER BY a.updated_at DESC
    `,
    [userId],
  );
  return rows.map(formatArticle).filter(Boolean) as PublicArticle[];
}

export async function getRecoveryArticles(): Promise<PublicArticle[]> {
  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    WHERE a.deleted_at IS NOT NULL OR a.status = 'Draft'
    ORDER BY a.updated_at DESC
    `,
  );
  return rows.map(formatArticle).filter(Boolean) as PublicArticle[];
}

export async function searchArticles(queryText: string, page: number = 1, limit: number = 10): Promise<{
  articles: PublicArticle[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const offset = (page - 1) * limit;
  const searchPattern = `%${queryText.toLowerCase()}%`;

  const whereClause = `
    WHERE a.status = 'Published' AND a.deleted_at IS NULL
    AND (
      LOWER(a.title) LIKE $1 OR
      LOWER(COALESCE(a.excerpt, '')) LIKE $1 OR
      LOWER(a.content) LIKE $1 OR
      LOWER(u.first_name) LIKE $1 OR
      LOWER(u.surname) LIKE $1 OR
      LOWER(u.school) LIKE $1 OR
      LOWER(u.email) LIKE $1 OR
      LOWER(c.name) LIKE $1
    )
  `;

  const countResult = await queryOne<{ count: string | number }>(
    `
    SELECT COUNT(*) as count
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereClause}
    `,
    [searchPattern],
  );

  const rows = await query<DbArticleRow>(
    `
    ${ARTICLE_SELECT}
    ${whereClause}
    ORDER BY a.updated_at DESC
    LIMIT $2 OFFSET $3
    `,
    [searchPattern, limit, offset],
  );

  const total = Number(countResult?.count || 0);
  const articles = rows.map(formatArticle).filter(Boolean) as PublicArticle[];

  return {
    articles,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
