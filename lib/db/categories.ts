import { query, queryOne } from "@/lib/db";
import type { Category, Tag } from "@/types/category";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface DbTag {
  id: string;
  name: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export function formatCategory(row: DbCategory | null): (Category & { _id: string; id: string }) | null {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

export function formatTag(row: DbTag | null): (Tag & { _id: string; id: string }) | null {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

export async function listCategories(): Promise<Category[]> {
  const rows = await query<DbCategory>(
    `SELECT * FROM categories ORDER BY created_at DESC`,
  );
  return rows.map(formatCategory).filter(Boolean) as Category[];
}

export async function findCategoryById(id: string): Promise<(Category & { _id: string; id: string }) | null> {
  const row = await queryOne<DbCategory>(
    `SELECT * FROM categories WHERE id = $1`,
    [id],
  );
  return formatCategory(row);
}

export async function findCategoryBySlug(slug: string): Promise<(Category & { _id: string; id: string }) | null> {
  const row = await queryOne<DbCategory>(
    `SELECT * FROM categories WHERE LOWER(slug) = LOWER($1)`,
    [slug],
  );
  return formatCategory(row);
}

export async function findCategoryByName(name: string): Promise<(Category & { _id: string; id: string }) | null> {
  const row = await queryOne<DbCategory>(
    `SELECT * FROM categories WHERE LOWER(name) = LOWER($1)`,
    [name],
  );
  return formatCategory(row);
}

export async function findCategoryByIdOrSlug(idOrSlug: string): Promise<(Category & { _id: string; id: string }) | null> {
  if (!idOrSlug) return null;
  const byId = await findCategoryById(idOrSlug);
  if (byId) return byId;
  return findCategoryBySlug(idOrSlug);
}

export async function createCategory(data: { name: string; slug: string }): Promise<Category & { _id: string; id: string }> {
  const row = await queryOne<DbCategory>(
    `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *`,
    [data.name, data.slug],
  );
  return formatCategory(row)!;
}

export async function updateCategory(id: string, data: { name?: string; slug?: string }): Promise<(Category & { _id: string; id: string }) | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    fields.push(`slug = $${idx++}`);
    values.push(data.slug);
  }

  if (fields.length === 0) return findCategoryById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const row = await queryOne<DbCategory>(
    `UPDATE categories SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return formatCategory(row);
}

export async function deleteCategory(id: string): Promise<boolean> {
  await query(`DELETE FROM categories WHERE id = $1`, [id]);
  return true;
}

export async function resolveCategoryId(categoryInput: string): Promise<string | null> {
  if (!categoryInput) return null;

  const trimmed = categoryInput.trim();
  if (!trimmed) return null;

  // 1. Direct ID match (checks by id: UUID, ObjectId, or text ID)
  const byId = await findCategoryById(trimmed);
  if (byId) return byId.id || byId._id;

  // 2. Direct Name match (case-insensitive)
  let existing = await findCategoryByName(trimmed);
  if (existing) return existing.id || existing._id;

  // 3. Direct Slug match (case-insensitive)
  existing = await findCategoryBySlug(trimmed);
  if (existing) return existing.id || existing._id;

  // 4. Fuzzy / partial match against all existing categories
  const all = await listCategories();
  const lower = trimmed.toLowerCase();
  const matched = all.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.slug.toLowerCase() === lower ||
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase()) ||
      c._id === trimmed ||
      c.id === trimmed
  );
  if (matched) return (matched._id || matched.id) ?? null;

  // 5. Fallback to existing default category - NEVER create a new category automatically
  if (all.length > 0) {
    const defaultCat =
      all.find(
        (c) =>
          c.name.toLowerCase() === "article" ||
          c.name.toLowerCase() === "general" ||
          c.slug.toLowerCase() === "article" ||
          c.slug.toLowerCase() === "general"
      ) || all[0];
    return (defaultCat._id || defaultCat.id) ?? null;
  }

  return null;
}

// TAGS
export async function listTags(): Promise<Tag[]> {
  const rows = await query<DbTag>(
    `SELECT * FROM tags ORDER BY created_at DESC`,
  );
  return rows.map(formatTag).filter(Boolean) as Tag[];
}

export async function findTagByName(name: string): Promise<(Tag & { _id: string; id: string }) | null> {
  const row = await queryOne<DbTag>(
    `SELECT * FROM tags WHERE LOWER(name) = LOWER($1)`,
    [name],
  );
  return formatTag(row);
}

export async function createTag(name: string): Promise<Tag & { _id: string; id: string }> {
  const row = await queryOne<DbTag>(
    `INSERT INTO tags (name) VALUES ($1) RETURNING *`,
    [name],
  );
  return formatTag(row)!;
}
