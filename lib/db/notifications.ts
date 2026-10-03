import { query, queryOne } from "@/lib/db";
import { sendNotificationEmailToRecipients } from "@/lib/email";

export type NotificationType =
  | "General"
  | "Approval"
  | "Rejection"
  | "Role"
  | "Profile"
  | "Article"
  | "System"
  | "Warning";

export interface DbNotificationRow {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  created_by_id: string;
  is_global: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  recipients?: string[];
  read_by?: string[];
}

export interface FormattedNotification {
  _id: string;
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdBy: string;
  isGlobal: boolean;
  recipients: string[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export function formatNotification(row: DbNotificationRow | null): FormattedNotification | null {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    createdBy: row.created_by_id,
    isGlobal: row.is_global,
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
    readBy: Array.isArray(row.read_by) ? row.read_by : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

const NOTIFICATION_SELECT = `
  SELECT 
    n.*,
    COALESCE(
      (SELECT array_agg(user_id::text) FROM notification_recipients WHERE notification_id = n.id),
      '{}'
    ) as recipients,
    COALESCE(
      (SELECT array_agg(user_id::text) FROM notification_reads WHERE notification_id = n.id),
      '{}'
    ) as read_by
  FROM notifications n
`;

export async function findNotificationsForUser(userId: string): Promise<FormattedNotification[]> {
  const rows = await query<DbNotificationRow>(
    `
    ${NOTIFICATION_SELECT}
    WHERE n.is_global = true OR EXISTS (
      SELECT 1 FROM notification_recipients nr WHERE nr.notification_id = n.id AND nr.user_id = $1
    )
    ORDER BY n.created_at DESC
    `,
    [userId],
  );

  return rows.map(formatNotification).filter(Boolean) as FormattedNotification[];
}

export async function findNotificationById(id: string): Promise<FormattedNotification | null> {
  const row = await queryOne<DbNotificationRow>(
    `${NOTIFICATION_SELECT} WHERE n.id = $1`,
    [id],
  );
  return formatNotification(row);
}

export async function createDbNotification(data: {
  title: string;
  message: string;
  createdBy: string;
  recipients?: string[];
  isGlobal?: boolean;
  type?: NotificationType;
}): Promise<FormattedNotification | null> {
  const isGlobal = data.isGlobal !== undefined ? data.isGlobal : (data.recipients && data.recipients.length > 0 ? false : true);
  const type = data.type || "General";

  const row = await queryOne<{ id: string }>(
    `
    INSERT INTO notifications (title, message, created_by_id, is_global, type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [data.title, data.message, data.createdBy, isGlobal, type],
  );

  if (row?.id) {
    if (data.recipients && data.recipients.length > 0) {
      for (const recipientId of data.recipients) {
        if (recipientId) {
          await query(
            `INSERT INTO notification_recipients (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [row.id, recipientId],
          );
        }
      }
    }
    // Trigger email delivery for the notification in the background
    sendNotificationEmailToRecipients({
      title: data.title,
      message: data.message,
      type,
      recipients: data.recipients,
      isGlobal,
    }).catch((emailErr) => {
      console.error("Failed to dispatch notification email:", emailErr);
    });

    return findNotificationById(row.id);
  }

  throw new Error("Failed to create notification");
}

export async function deleteNotification(id: string): Promise<boolean> {
  await query(`DELETE FROM notifications WHERE id = $1`, [id]);
  return true;
}

export async function markNotificationAsRead(id: string, userId: string): Promise<FormattedNotification | null> {
  await query(
    `INSERT INTO notification_reads (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [id, userId],
  );
  return findNotificationById(id);
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const userNotifications = await query<{ id: string }>(
    `
    SELECT n.id FROM notifications n
    WHERE n.is_global = true OR EXISTS (
      SELECT 1 FROM notification_recipients nr WHERE nr.notification_id = n.id AND nr.user_id = $1
    )
    `,
    [userId],
  );

  for (const item of userNotifications) {
    await query(
      `INSERT INTO notification_reads (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [item.id, userId],
    );
  }

  return true;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: string | number }>(
    `
    SELECT COUNT(*) as count
    FROM notifications n
    WHERE (n.is_global = true OR EXISTS (
      SELECT 1 FROM notification_recipients nr WHERE nr.notification_id = n.id AND nr.user_id = $1
    ))
    AND NOT EXISTS (
      SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = $1
    )
    `,
    [userId],
  );

  return Number(result?.count || 0);
}
