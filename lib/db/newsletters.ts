import { query, queryOne } from "@/lib/db";

export interface DbNewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  unsubscribe_token: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export async function findSubscriberByEmail(email: string): Promise<DbNewsletterSubscriber | null> {
  return queryOne<DbNewsletterSubscriber>(
    `SELECT * FROM newsletters WHERE LOWER(email) = LOWER($1)`,
    [email.trim().toLowerCase()],
  );
}

export async function findSubscriberByToken(token: string): Promise<DbNewsletterSubscriber | null> {
  return queryOne<DbNewsletterSubscriber>(
    `SELECT * FROM newsletters WHERE unsubscribe_token = $1`,
    [token],
  );
}

export async function subscribeNewsletter(email: string): Promise<{
  subscriber: DbNewsletterSubscriber;
  alreadySubscribed: boolean;
  reactivated: boolean;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const existing = await findSubscriberByEmail(cleanEmail);

  if (existing) {
    if (existing.is_active) {
      return { subscriber: existing, alreadySubscribed: true, reactivated: false };
    }

    // Re-activate subscription
    const reactivated = await queryOne<DbNewsletterSubscriber>(
      `UPDATE newsletters 
       SET is_active = TRUE, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [existing.id],
    );

    return {
      subscriber: reactivated || existing,
      alreadySubscribed: false,
      reactivated: true,
    };
  }

  // Create new subscription
  const created = await queryOne<DbNewsletterSubscriber>(
    `INSERT INTO newsletters (email, is_active) 
     VALUES (LOWER($1), TRUE) 
     RETURNING *`,
    [cleanEmail],
  );

  if (!created) {
    throw new Error("Failed to create newsletter subscription");
  }

  return { subscriber: created, alreadySubscribed: false, reactivated: false };
}

export async function unsubscribeNewsletter(tokenOrEmail: string): Promise<boolean> {
  const clean = tokenOrEmail.trim();
  const result = await query(
    `UPDATE newsletters 
     SET is_active = FALSE, updated_at = NOW() 
     WHERE unsubscribe_token = $1 OR LOWER(email) = LOWER($1)`,
    [clean],
  );
  return result.length > 0;
}

export async function listNewsletterSubscribers(activeOnly = false): Promise<DbNewsletterSubscriber[]> {
  if (activeOnly) {
    return query<DbNewsletterSubscriber>(
      `SELECT * FROM newsletters WHERE is_active = TRUE ORDER BY created_at DESC`,
    );
  }
  return query<DbNewsletterSubscriber>(
    `SELECT * FROM newsletters ORDER BY created_at DESC`,
  );
}

export async function countActiveSubscribers(): Promise<number> {
  const result = await queryOne<{ count: string | number }>(
    `SELECT COUNT(*) as count FROM newsletters WHERE is_active = TRUE`,
  );
  return Number(result?.count || 0);
}
