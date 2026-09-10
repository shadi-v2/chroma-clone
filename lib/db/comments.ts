import { query, queryOne } from "@/lib/db";
import type { ArticleComment } from "@/types/article";
import type { PublicUser } from "@/types/user";

export interface DbCommentRow {
  id: string;
  article_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  author_first_name?: string;
  author_surname?: string;
  author_avatar?: string;
  author_role?: string;
  author_school?: string;
}

export function formatComment(row: DbCommentRow | null): ArticleComment | null {
  if (!row) return null;

  const author: PublicUser = {
    _id: row.author_id,
    id: row.author_id,
    firstName: row.author_first_name || "Community",
    surname: row.author_surname || "Reader",
    email: "",
    role: (row.author_role as PublicUser["role"]) || "Author",
    school: row.author_school || "",
    avatar: row.author_avatar || "",
  };

  return {
    _id: row.id,
    id: row.id,
    content: row.content,
    article: row.article_id,
    author,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

export async function findCommentsByArticleId(articleId: string): Promise<ArticleComment[]> {
  const rows = await query<DbCommentRow>(
    `
    SELECT 
      c.*,
      u.first_name as author_first_name,
      u.surname as author_surname,
      u.avatar as author_avatar,
      u.role as author_role,
      u.school as author_school
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.article_id = $1
    ORDER BY c.created_at DESC
    `,
    [articleId],
  );

  return rows.map(formatComment).filter(Boolean) as ArticleComment[];
}

export async function findCommentById(id: string): Promise<ArticleComment | null> {
  const row = await queryOne<DbCommentRow>(
    `
    SELECT 
      c.*,
      u.first_name as author_first_name,
      u.surname as author_surname,
      u.avatar as author_avatar,
      u.role as author_role,
      u.school as author_school
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = $1
    `,
    [id],
  );

  return formatComment(row);
}

export async function createComment(data: {
  articleId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}): Promise<ArticleComment> {
  const row = await queryOne<DbCommentRow>(
    `
    INSERT INTO comments (article_id, author_id, content, parent_comment_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [data.articleId, data.authorId, data.content, data.parentCommentId || null],
  );

  await query(
    `UPDATE articles SET comments_count = (SELECT COUNT(*) FROM comments WHERE article_id = $1), updated_at = NOW() WHERE id = $1`,
    [data.articleId],
  );

  if (row?.id) {
    const created = await findCommentById(row.id);
    if (created) return created;
  }

  throw new Error("Failed to create comment");
}

export async function deleteComment(id: string): Promise<boolean> {
  const comment = await queryOne<{ article_id: string }>(
    `SELECT article_id FROM comments WHERE id = $1`,
    [id],
  );

  await query(`DELETE FROM comments WHERE id = $1`, [id]);

  if (comment?.article_id) {
    await query(
      `UPDATE articles SET comments_count = (SELECT COUNT(*) FROM comments WHERE article_id = $1), updated_at = NOW() WHERE id = $1`,
      [comment.article_id],
    );
  }

  return true;
}

export async function countComments(): Promise<number> {
  const result = await queryOne<{ count: string | number }>(
    `SELECT COUNT(*) as count FROM comments`,
  );
  return Number(result?.count || 0);
}
