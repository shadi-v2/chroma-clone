import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";
import type { PublicUser, UserRole } from "@/types/user";
import { calculateAge, isUserFrozen } from "@/lib/utils/age";

export interface DbUser {
  id: string;
  first_name: string;
  surname: string;
  email: string;
  password?: string | null;
  role: UserRole;
  school: string;
  bio?: string | null;
  phone?: string | null;
  date_of_birth?: string | Date | null;
  avatar?: string | null;
  avatar_public_id?: string | null;
  is_frozen?: boolean;
  is_email_verified?: boolean;
  last_login_at?: string | Date | null;
  failed_login_attempts?: number;
  locked_until?: string | Date | null;
  google_id?: string | null;
  onboarding_completed?: boolean;
  genres?: string[] | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export type FormattedUser = PublicUser & {
  _id: string;
  id: string;
  password?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
};

export function formatUser(row: DbUser | null): FormattedUser | null {
  if (!row) return null;
  const age = row.date_of_birth ? calculateAge(row.date_of_birth) : null;
  const isFrozen = isUserFrozen({
    is_frozen: row.is_frozen,
    date_of_birth: row.date_of_birth || undefined,
    role: row.role,
    email: row.email,
  });

  return {
    _id: row.id,
    id: row.id,
    firstName: row.first_name || "",
    surname: row.surname || "",
    email: row.email,
    password: row.password || "",
    role: row.role,
    school: row.school || "",
    bio: row.bio || "",
    phone: row.phone || "",
    dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString() : "",
    isFrozen,
    isEmailVerified: Boolean(row.is_email_verified),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined,
    failedLoginAttempts: Number(row.failed_login_attempts || 0),
    lockedUntil: row.locked_until ? new Date(row.locked_until).toISOString() : undefined,
    googleId: row.google_id || undefined,
    onboardingCompleted: Boolean(row.onboarding_completed),
    genres: Array.isArray(row.genres) ? row.genres : [],
    age: age ?? undefined,
    avatar: row.avatar || "",
    avatarPublicId: row.avatar_public_id || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

export function toPublicUser(user: DbUser | FormattedUser | null): PublicUser {
  if (!user) return {} as PublicUser;
  const formatted = "first_name" in user ? formatUser(user as DbUser) : (user as FormattedUser);
  const rest: Partial<FormattedUser> = { ...formatted };
  delete rest.password;
  delete rest.failedLoginAttempts;
  delete rest.lockedUntil;
  return rest as PublicUser;
}

export async function findUserById(id: string): Promise<FormattedUser | null> {
  const row = await queryOne<DbUser>(
    `SELECT * FROM users WHERE id = $1`,
    [id],
  );
  return formatUser(row);
}

export async function findUserByEmail(email: string): Promise<FormattedUser | null> {
  const row = await queryOne<DbUser>(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return formatUser(row);
}

export async function findUserByGoogleId(googleId: string): Promise<FormattedUser | null> {
  const row = await queryOne<DbUser>(
    `SELECT * FROM users WHERE google_id = $1`,
    [googleId],
  );
  return formatUser(row);
}

export async function createUser(data: {
  firstName: string;
  surname: string;
  email: string;
  password?: string;
  role?: UserRole;
  school?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string | Date | null;
  avatar?: string;
  avatarPublicId?: string;
  isEmailVerified?: boolean;
  googleId?: string;
  onboardingCompleted?: boolean;
  genres?: string[];
}): Promise<FormattedUser | null> {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : "";
  const role = data.role || "Author";

  const row = await queryOne<DbUser>(
    `INSERT INTO users (
      first_name, surname, email, password, role, school, bio, phone, 
      date_of_birth, avatar, avatar_public_id, is_email_verified, google_id, onboarding_completed, genres
    )
    VALUES ($1, $2, LOWER($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      data.firstName,
      data.surname,
      data.email,
      hashedPassword,
      role,
      data.school || "",
      data.bio || null,
      data.phone || null,
      data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      data.avatar || null,
      data.avatarPublicId || null,
      Boolean(data.isEmailVerified),
      data.googleId || null,
      Boolean(data.onboardingCompleted),
      data.genres || [],
    ],
  );

  return formatUser(row);
}

export async function updateUser(id: string, data: Partial<{
  firstName: string;
  surname: string;
  school: string;
  bio: string;
  phone: string;
  avatar: string;
  avatarPublicId: string;
  role: UserRole;
  dateOfBirth?: string | Date | null;
  genres?: string[];
  isFrozen?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string | Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | Date | null;
  googleId?: string;
  onboardingCompleted?: boolean;
  password?: string;
}>): Promise<FormattedUser | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (data.firstName !== undefined) {
    fields.push(`first_name = $${index++}`);
    values.push(data.firstName);
  }
  if (data.surname !== undefined) {
    fields.push(`surname = $${index++}`);
    values.push(data.surname);
  }
  if (data.school !== undefined) {
    fields.push(`school = $${index++}`);
    values.push(data.school);
  }
  if (data.bio !== undefined) {
    fields.push(`bio = $${index++}`);
    values.push(data.bio);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${index++}`);
    values.push(data.phone);
  }
  if (data.avatar !== undefined) {
    fields.push(`avatar = $${index++}`);
    values.push(data.avatar);
  }
  if (data.avatarPublicId !== undefined) {
    fields.push(`avatar_public_id = $${index++}`);
    values.push(data.avatarPublicId);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${index++}`);
    values.push(data.role);
  }
  if (data.dateOfBirth !== undefined) {
    fields.push(`date_of_birth = $${index++}`);
    values.push(data.dateOfBirth ? new Date(data.dateOfBirth) : null);
  }
  if (data.genres !== undefined) {
    fields.push(`genres = $${index++}`);
    values.push(Array.isArray(data.genres) ? data.genres : []);
  }
  if (data.isFrozen !== undefined) {
    fields.push(`is_frozen = $${index++}`);
    values.push(Boolean(data.isFrozen));
  }
  if (data.isEmailVerified !== undefined) {
    fields.push(`is_email_verified = $${index++}`);
    values.push(Boolean(data.isEmailVerified));
  }
  if (data.lastLoginAt !== undefined) {
    fields.push(`last_login_at = $${index++}`);
    values.push(data.lastLoginAt ? new Date(data.lastLoginAt) : null);
  }
  if (data.failedLoginAttempts !== undefined) {
    fields.push(`failed_login_attempts = $${index++}`);
    values.push(Number(data.failedLoginAttempts));
  }
  if (data.lockedUntil !== undefined) {
    fields.push(`locked_until = $${index++}`);
    values.push(data.lockedUntil ? new Date(data.lockedUntil) : null);
  }
  if (data.googleId !== undefined) {
    fields.push(`google_id = $${index++}`);
    values.push(data.googleId);
  }
  if (data.onboardingCompleted !== undefined) {
    fields.push(`onboarding_completed = $${index++}`);
    values.push(Boolean(data.onboardingCompleted));
  }
  if (data.password !== undefined) {
    const hashed = await bcrypt.hash(data.password, 10);
    fields.push(`password = $${index++}`);
    values.push(hashed);
  }


  if (fields.length === 0) {
    return findUserById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const queryText = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;

  const row = await queryOne<DbUser>(queryText, values);
  return formatUser(row);
}

export async function deleteUser(id: string): Promise<boolean> {
  await query(`DELETE FROM users WHERE id = $1`, [id]);
  return true;
}

export const HIDDEN_USER_EMAIL = "shahinshadi1122@gmail.com";

export async function listUsers(role?: string): Promise<PublicUser[]> {
  let rows: DbUser[];
  if (role) {
    rows = await query<DbUser>(
      `SELECT * FROM users WHERE role = $1 AND LOWER(email) != LOWER($2) ORDER BY created_at DESC`,
      [role, HIDDEN_USER_EMAIL],
    );
  } else {
    rows = await query<DbUser>(
      `SELECT * FROM users WHERE LOWER(email) != LOWER($1) ORDER BY created_at DESC`,
      [HIDDEN_USER_EMAIL],
    );
  }
  return rows.map(toPublicUser);
}

export async function countUsers(): Promise<number> {
  const result = await queryOne<{ count: string | number }>(
    `SELECT COUNT(*) as count FROM users`,
  );
  return Number(result?.count || 0);
}

export async function findUsersByRoles(roles: string[]): Promise<FormattedUser[]> {
  const rows = await query<DbUser>(
    `SELECT * FROM users WHERE role = ANY($1::text[])`,
    [roles],
  );
  return rows.map(formatUser).filter(Boolean) as FormattedUser[];
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
