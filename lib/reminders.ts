import { query, queryOne } from "@/lib/db";
import { createDbNotification } from "@/lib/db/notifications";
import { sendInactivityReminderEmail } from "@/lib/email";

export interface ReminderResult {
  checkedCount: number;
  remindersSent: number;
  authorsReminded: Array<{
    id: string;
    name: string;
    email: string;
    lastSubmission: string | null;
  }>;
}

export async function checkAndSendSubmissionReminders(): Promise<ReminderResult> {
  // 1. Find the system admin or owner to act as the notification creator
  const systemUser = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE role = 'Owner' OR role = 'Admin' ORDER BY created_at ASC LIMIT 1`,
  );
  const creatorId = systemUser?.id || "00000000-0000-0000-0000-000000000000";

  // 2. Query users who haven't submitted an article in the last 30 days (or ever, if registered > 30 days ago)
  // and who haven't received a reminder in the last 30 days
  const inactiveAuthors = await query<{
    id: string;
    name: string;
    email: string;
    latest_article_date: string | Date | null;
    user_created_at: string | Date;
  }>(
    `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.created_at as user_created_at,
      MAX(a.created_at) as latest_article_date
    FROM users u
    LEFT JOIN articles a ON a.author_id = u.id
    WHERE u.is_active = TRUE 
      AND (u.is_frozen IS FALSE OR u.is_frozen IS NULL)
      AND (
        u.last_submission_reminder_at IS NULL 
        OR u.last_submission_reminder_at < NOW() - INTERVAL '30 days'
      )
    GROUP BY u.id, u.name, u.email, u.created_at, u.last_submission_reminder_at
    HAVING (
      -- Has at least one article and last article was > 30 days ago
      (MAX(a.created_at) IS NOT NULL AND MAX(a.created_at) < NOW() - INTERVAL '30 days')
      OR
      -- Has no articles and registered > 30 days ago
      (MAX(a.created_at) IS NULL AND u.created_at < NOW() - INTERVAL '30 days')
    )
    LIMIT 100
    `,
  );

  const authorsReminded: Array<{
    id: string;
    name: string;
    email: string;
    lastSubmission: string | null;
  }> = [];

  for (const author of inactiveAuthors) {
    try {
      // 1. In-app notification
      await createDbNotification({
        title: "We miss your words! ✍️",
        message: "It's been a month since your last writing submission. Your readers and our community miss your stories. Share what's on your mind today!",
        type: "Article",
        createdBy: creatorId,
        recipients: [author.id],
        isGlobal: false,
      });

      // 2. Send email reminder if email exists
      if (author.email) {
        await sendInactivityReminderEmail(author.email, author.name || "Storyteller");
      }

      // 3. Mark last_submission_reminder_at to avoid spamming for another 30 days
      await query(
        `UPDATE users SET last_submission_reminder_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [author.id],
      );

      authorsReminded.push({
        id: author.id,
        name: author.name,
        email: author.email,
        lastSubmission: author.latest_article_date
          ? new Date(author.latest_article_date).toISOString()
          : null,
      });
    } catch (err) {
      console.error(`Failed to dispatch reminder to user ${author.id}:`, err);
    }
  }

  return {
    checkedCount: inactiveAuthors.length,
    remindersSent: authorsReminded.length,
    authorsReminded,
  };
}
