import { query, queryOne } from "@/lib/db";

export interface DbEmailTemplate {
  id: string;
  name: string;
  subject: string;
  content_html: string;
  category: string;
  created_by_id?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface DbSentEmail {
  id: string;
  to_email: string;
  subject: string;
  content_html: string;
  sent_by_id?: string | null;
  sender_name?: string | null;
  status: string;
  created_at: string | Date;
  sender_email?: string | null;
  sender_role?: string | null;
}

export async function listEmailTemplates(): Promise<DbEmailTemplate[]> {
  return query<DbEmailTemplate>(
    `SELECT * FROM email_templates ORDER BY category ASC, name ASC`,
  );
}

export async function getEmailTemplateById(id: string): Promise<DbEmailTemplate | null> {
  return queryOne<DbEmailTemplate>(
    `SELECT * FROM email_templates WHERE id = $1`,
    [id],
  );
}

export async function saveEmailTemplate(data: {
  id?: string;
  name: string;
  subject: string;
  content_html: string;
  category?: string;
  created_by_id?: string | null;
}): Promise<DbEmailTemplate | null> {
  if (data.id) {
    return queryOne<DbEmailTemplate>(
      `UPDATE email_templates 
       SET name = $1, subject = $2, content_html = $3, category = COALESCE($4, category), updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [data.name, data.subject, data.content_html, data.category || "Custom", data.id],
    );
  }

  return queryOne<DbEmailTemplate>(
    `INSERT INTO email_templates (name, subject, content_html, category, created_by_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.name,
      data.subject,
      data.content_html,
      data.category || "Custom",
      data.created_by_id || null,
    ],
  );
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM email_templates WHERE id = $1 RETURNING id`, [id]);
  return res.length > 0;
}

export async function logSentEmail(data: {
  to_email: string;
  subject: string;
  content_html: string;
  sent_by_id?: string | null;
  sender_name?: string | null;
  status?: string;
}): Promise<DbSentEmail | null> {
  return queryOne<DbSentEmail>(
    `INSERT INTO sent_emails (to_email, subject, content_html, sent_by_id, sender_name, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.to_email,
      data.subject,
      data.content_html,
      data.sent_by_id || null,
      data.sender_name || "Chroma Diaries Official",
      data.status || "Sent",
    ],
  );
}

export async function listSentEmails(limit = 100): Promise<DbSentEmail[]> {
  return query<DbSentEmail>(
    `SELECT 
      s.*, 
      u.first_name || ' ' || u.surname as sender_user_name,
      u.email as sender_email,
      u.role as sender_role
     FROM sent_emails s
     LEFT JOIN users u ON s.sent_by_id = u.id
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit],
  );
}
