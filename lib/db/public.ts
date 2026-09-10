import { queryOne } from "@/lib/db";

export interface DbNewsletter {
  id: string;
  email: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface DbContact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export async function findNewsletterSubscription(email: string): Promise<DbNewsletter | null> {
  return queryOne<DbNewsletter>(
    `SELECT * FROM newsletters WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
}

export async function createNewsletterSubscription(email: string): Promise<DbNewsletter | null> {
  return queryOne<DbNewsletter>(
    `INSERT INTO newsletters (email) VALUES (LOWER($1)) RETURNING *`,
    [email],
  );
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<DbContact | null> {
  return queryOne<DbContact>(
    `INSERT INTO contacts (name, email, subject, message) VALUES ($1, LOWER($2), $3, $4) RETURNING *`,
    [data.name, data.email, data.subject, data.message],
  );
}
