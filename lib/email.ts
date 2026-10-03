import { Resend } from "resend";
import { query } from "@/lib/db";
import { renderEmailWithWrapper, type EmailWrapperConfig } from "./emailWrapper";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://chromadiaries.in";

/**
 * Resolves the sender email address.
 * Always defaults to the working, verified address in environment (editorial@chromadiaries.in).
 */
export function resolveFromEmail(custom?: string, defaultPrefix = "editorial"): string {
  const verifiedDefault = process.env.RESEND_FROM_EMAIL || "editorial@chromadiaries.in";

  if (custom && custom.trim()) {
    const trimmed = custom.trim();
    if (trimmed.includes("@")) {
      return trimmed;
    }
    return `${trimmed}@chromadiaries.in`;
  }

  return verifiedDefault;
}

export async function sendVerificationEmail(
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_FROM_EMAIL, "editorial");

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Verification code for ${email}: ${code}`);
      console.log(`From: Chroma Diaries <${fromEmail}>`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `Chroma Diaries <${fromEmail}>`,
      to: [email],
      subject: `Your Chroma Diaries Verification Code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05); text-align: center;">
            <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 12px; margin-bottom: 24px;">
              CHROMA DIARIES
            </div>
            
            <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 26px; margin: 0 0 12px 0; font-weight: 700;">
              Verify Your Email Address
            </h1>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              Welcome to our circle of storytellers and literary enthusiasts. Please enter the following 6-digit verification code to confirm your email:
            </p>
            
            <div style="background-color: #f7f9f8; border: 2px dashed #022c22; border-radius: 16px; padding: 20px; margin: 0 0 28px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #022c22; display: inline-block;">
                ${code}
              </span>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 20px 0;">
              This code will expire in <strong>10 minutes</strong>. If you did not request this email, you can safely ignore it.
            </p>
            
            <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 20px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px;">
              Chroma Diaries • Literary Collective
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error sending email:", error);
      console.log(`📧 [RESEND FALLBACK LOG] Verification code for ${email}: ${code}`);
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendVerificationEmail:", err);
    console.log(`📧 [RESEND FALLBACK LOG] Verification code for ${email}: ${code}`);
    return { success: true, error: message };
  }
}

export async function sendPasswordResetOtpEmail(
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_FROM_EMAIL, "editorial");

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Password reset OTP for ${email}: ${code}`);
      console.log(`From: Chroma Diaries Security <${fromEmail}>`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `Chroma Diaries Security <${fromEmail}>`,
      to: [email],
      subject: `Your Chroma Diaries Password Reset Code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05); text-align: center;">
            <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 12px; margin-bottom: 24px;">
              CHROMA DIARIES
            </div>
            
            <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 26px; margin: 0 0 12px 0; font-weight: 700;">
              Reset Your Password
            </h1>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
              We received a request to reset your Chroma Diaries account password. Please enter the following 6-digit verification code:
            </p>
            
            <div style="background-color: #f7f9f8; border: 2px dashed #022c22; border-radius: 16px; padding: 20px; margin: 0 0 28px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #022c22; display: inline-block;">
                ${code}
              </span>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 20px 0;">
              This code will expire in <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email and your account remains safe.
            </p>
            
            <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 20px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px;">
              Chroma Diaries • Security & Authentication
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error sending password reset OTP:", error);
      console.log(`📧 [RESEND FALLBACK LOG] Password reset OTP for ${email}: ${code}`);
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendPasswordResetOtpEmail:", err);
    console.log(`📧 [RESEND FALLBACK LOG] Password reset OTP for ${email}: ${code}`);
    return { success: true, error: message };
  }
}

export async function sendNewsletterWelcomeEmail(
  email: string,
  unsubscribeToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_FROM_EMAIL, "editorial");
    const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Welcome to Newsletter for ${email}`);
      console.log(`From: Chroma Diaries Dispatch <${fromEmail}>`);
      console.log(`🔗 Unsubscribe Link: ${unsubscribeUrl}`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `Chroma Diaries Dispatch <${fromEmail}>`,
      to: [email],
      subject: `Welcome to Chroma Diaries — Fresh Stories & Literary Curation ✨`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Chroma Diaries</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 12px;">
                CHROMA DIARIES
              </div>
            </div>
            
            <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 26px; margin: 0 0 16px 0; font-weight: 700; text-align: center;">
              Welcome to the Literary Circle
            </h1>
            
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
              Thank you for subscribing to <strong>Chroma Diaries Dispatch</strong>. You are now part of an intimate sanctuary for essays, philosophical musings, captivating stories, and creative explorations.
            </p>
            
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
              Here is what you can look forward to receiving in your inbox:
            </p>
            
            <div style="background-color: #f7f9f8; border-left: 4px solid #059669; border-radius: 8px; padding: 16px 20px; margin: 0 0 28px 0;">
              <ul style="margin: 0; padding-left: 20px; color: #064e3b; font-size: 14px; line-height: 1.8;">
                <li>Weekly editor-curated articles and literary essays</li>
                <li>Exclusive interviews with emerging and established authors</li>
                <li>Prompt challenges and community writing spotlights</li>
              </ul>
            </div>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${siteUrl}" style="display: inline-block; background-color: #022c22; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(2, 44, 34, 0.2);">
                Explore Latest Articles ↗
              </a>
            </div>
            
            <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 24px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">You received this email because you subscribed to Chroma Diaries newsletter.</p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #059669; text-decoration: underline;">Unsubscribe from newsletter</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error sending welcome newsletter:", error);
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendNewsletterWelcomeEmail:", err);
    return { success: true, error: message };
  }
}

export async function sendNewsletterBroadcast(
  toEmail: string,
  subject: string,
  contentHtml: string,
  unsubscribeToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_FROM_EMAIL, "editorial");
    const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Newsletter Broadcast to ${toEmail}`);
      console.log(`From: Chroma Diaries Dispatch <${fromEmail}>`);
      console.log(`Subject: ${subject}`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `Chroma Diaries Dispatch <${fromEmail}>`,
      to: [toEmail],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 12px;">
                CHROMA DIARIES DISPATCH
              </div>
            </div>
            
            <div style="color: #1f2937; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">
              ${contentHtml}
            </div>

            <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 24px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">You received this edition because you are subscribed to Chroma Diaries.</p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #059669; text-decoration: underline;">Unsubscribe from newsletter</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend broadcast error for:", toEmail, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendNewsletterBroadcast:", err);
    return { success: false, error: message };
  }
}

export async function sendInactivityReminderEmail(
  authorEmail: string,
  authorName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_FROM_EMAIL, "editorial");
    const writeUrl = `${siteUrl}/write`;

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] 30-Day Inactivity Reminder to ${authorEmail} (${authorName})`);
      console.log(`From: Chroma Diaries Editorial <${fromEmail}>`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `Chroma Diaries Editorial <${fromEmail}>`,
      to: [authorEmail],
      subject: `We miss your words at Chroma Diaries! ✍️`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>We miss your words!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05); text-align: center;">
            <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 12px; margin-bottom: 24px;">
              CHROMA DIARIES
            </div>
            
            <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 26px; margin: 0 0 16px 0; font-weight: 700;">
              Hello ${authorName}, your pen is missed.
            </h1>
            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
              It has been over a month since your last contribution to Chroma Diaries. Your readers and our community miss your distinctive perspective and storytelling flair.
            </p>
            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
              Whenever inspiration strikes next, our cozy digital editor is ready for your fresh draft.
            </p>
            
            <div style="margin-bottom: 32px;">
              <a href="${writeUrl}" style="display: inline-block; background-color: #022c22; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(2, 44, 34, 0.25);">
                Start Writing Now ✍️
              </a>
            </div>
            
            <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 20px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px;">
              Chroma Diaries • Editorial Desk
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend reminder error:", error);
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendInactivityReminderEmail:", err);
    return { success: true, error: message };
  }
}

export async function sendOfficialEmail({
  to,
  subject,
  htmlContent,
  senderName = "Chroma Diaries Editorial",
  fromEmail,
  wrapInOfficialTemplate = true,
  wrapperConfig,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
  fromEmail?: string;
  wrapInOfficialTemplate?: boolean;
  wrapperConfig?: Partial<EmailWrapperConfig>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resolvedFromEmail = resolveFromEmail(fromEmail || process.env.RESEND_FROM_EMAIL, "editorial");

    const finalHtml = renderEmailWithWrapper(subject, htmlContent, {
      ...wrapperConfig,
      enabled: wrapInOfficialTemplate !== false && (wrapperConfig?.enabled !== false),
    });

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Official Email Sent`);
      console.log(`From: ${senderName} <${resolvedFromEmail}>`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${htmlContent.slice(0, 300)}...`);
      console.log(`=======================================================\n`);
      return { success: true };
    }

    const { error } = await resend.emails.send({
      from: `${senderName} <${resolvedFromEmail}>`,
      to: [to],
      subject: subject,
      html: finalHtml,
    });

    if (error) {
      console.error("Resend official email error for:", to, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Error in sendOfficialEmail:", err);
    return { success: false, error: message };
  }
}

/**
 * Sends in-app notifications directly to the recipient users' email inboxes.
 */
export async function sendNotificationEmailToRecipients(data: {
  title: string;
  message: string;
  type?: string;
  recipients?: string[];
  isGlobal?: boolean;
}): Promise<void> {
  try {
    const fromEmail = resolveFromEmail(undefined, "editorial");
    let targetUsers: { email: string; first_name: string; surname: string }[] = [];

    if (data.isGlobal) {
      targetUsers = await query<{ email: string; first_name: string; surname: string }>(
        `SELECT email, first_name, surname FROM users WHERE email IS NOT NULL AND email != '' AND is_frozen = false`,
      );
    } else if (data.recipients && data.recipients.length > 0) {
      targetUsers = await query<{ email: string; first_name: string; surname: string }>(
        `SELECT email, first_name, surname FROM users WHERE id = ANY($1::text[]) AND email IS NOT NULL AND email != ''`,
        [data.recipients],
      );
    }

    if (!targetUsers || targetUsers.length === 0) return;

    // Filter unique emails
    const seenEmails = new Set<string>();
    const uniqueUsers = targetUsers.filter((u) => {
      const email = u.email?.trim().toLowerCase();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] Notification sent to ${uniqueUsers.length} user(s)`);
      console.log(`Title: ${data.title}`);
      console.log(`Message: ${data.message}`);
      console.log(`=======================================================\n`);
      return;
    }

    // Send in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < uniqueUsers.length; i += batchSize) {
      const batch = uniqueUsers.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (u) => {
          const userName = `${u.first_name || ""} ${u.surname || ""}`.trim() || "Chroma Member";
          return resend.emails.send({
            from: `Chroma Diaries <${fromEmail}>`,
            to: [u.email],
            subject: `🔔 ${data.title} — Chroma Diaries`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${data.title}</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
                <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05);">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 16px; padding: 8px 18px; border-radius: 12px;">
                      CHROMA DIARIES
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; border: 1px solid #a7f3d0;">
                      ${data.type || "Notification"}
                    </span>
                  </div>

                  <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 22px; margin: 0 0 16px 0; font-weight: 700; text-align: center;">
                    ${data.title}
                  </h1>

                  <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                    Hello <strong>${userName}</strong>,
                  </p>

                  <div style="background-color: #f7f9f8; border-left: 4px solid #022c22; border-radius: 8px; padding: 18px 20px; margin: 0 0 28px 0; color: #1f2937; font-size: 15px; line-height: 1.7;">
                    ${data.message}
                  </div>

                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${siteUrl}/notifications" style="display: inline-block; background-color: #022c22; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(2, 44, 34, 0.2);">
                      View in Chroma Diaries ↗
                    </a>
                  </div>

                  <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px;">
                    Chroma Diaries • Literary Platform
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        })
      );
    }
  } catch (err) {
    console.error("Failed to send notification emails:", err);
  }
}

/**
 * Broadcasts an announcement email to ALL registered users and active newsletter subscribers
 * whenever a new article is published.
 */
export async function sendNewArticlePublishedBroadcast(article: {
  id?: string;
  _id?: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  readTime?: string;
  category?: { name?: string } | string;
  author?: { firstName?: string; surname?: string } | string;
}): Promise<void> {
  try {
    const articleId = article._id || article.id;
    if (!articleId || !article.title) return;

    const fromEmail = resolveFromEmail(undefined, "editorial");
    const articleUrl = `${siteUrl}/article/${articleId}`;

    // Get author name
    let authorName = "Chroma Author";
    if (typeof article.author === "object" && article.author) {
      authorName = `${article.author.firstName || ""} ${article.author.surname || ""}`.trim() || "Chroma Author";
    }

    // Get category name
    let categoryName = "Featured Piece";
    if (typeof article.category === "object" && article.category?.name) {
      categoryName = article.category.name;
    } else if (typeof article.category === "string" && article.category) {
      categoryName = article.category;
    }

    // Fetch all active registered users
    const users = await query<{ email: string; first_name: string; surname: string }>(
      `SELECT email, first_name, surname FROM users WHERE email IS NOT NULL AND email != '' AND is_frozen = false`,
    );

    // Fetch all active newsletter subscribers
    const subscribers = await query<{ email: string }>(
      `SELECT email FROM newsletters WHERE is_active = true`,
    );

    const emailSet = new Set<string>();
    const recipients: { email: string; name?: string }[] = [];

    users.forEach((u) => {
      const email = u.email?.trim().toLowerCase();
      if (email && !emailSet.has(email)) {
        emailSet.add(email);
        recipients.push({
          email,
          name: `${u.first_name || ""} ${u.surname || ""}`.trim() || undefined,
        });
      }
    });

    subscribers.forEach((s) => {
      const email = s.email?.trim().toLowerCase();
      if (email && !emailSet.has(email)) {
        emailSet.add(email);
        recipients.push({ email });
      }
    });

    if (recipients.length === 0) return;

    if (!resend) {
      console.log(`\n=======================================================`);
      console.log(`📧 [DEV / MOCK RESEND EMAIL] New Article Broadcast for "${article.title}" sent to ${recipients.length} readers`);
      console.log(`From: Chroma Diaries Dispatch <${fromEmail}>`);
      console.log(`URL: ${articleUrl}`);
      console.log(`=======================================================\n`);
      return;
    }

    const excerptText = article.excerpt?.trim() || "A captivating new piece has just been published on Chroma Diaries.";
    const readTimeText = article.readTime || "5 min read";

    // Send in batches of 10
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (r) => {
          return resend.emails.send({
            from: `Chroma Diaries Dispatch <${fromEmail}>`,
            to: [r.email],
            subject: `✨ New Story Published: "${article.title}" by ${authorName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${article.title}</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf7; margin: 0; padding: 40px 20px;">
                <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(2, 44, 34, 0.05);">
                  
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background-color: #022c22; color: #fcfbf7; font-family: Georgia, serif; font-weight: bold; font-size: 16px; padding: 8px 20px; border-radius: 12px; letter-spacing: 1px;">
                      CHROMA DIARIES
                    </div>
                  </div>

                  <div style="text-align: center; margin-bottom: 16px;">
                    <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; border: 1px solid #a7f3d0;">
                      ${categoryName}
                    </span>
                  </div>

                  <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 26px; line-height: 1.3; margin: 0 0 12px 0; font-weight: 700; text-align: center;">
                    ${article.title}
                  </h1>

                  <p style="text-align: center; color: #6b7280; font-size: 13px; font-style: italic; margin: 0 0 24px 0;">
                    Written by <strong style="color: #022c22; font-style: normal;">${authorName}</strong> • <span>${readTimeText}</span>
                  </p>

                  ${
                    article.thumbnail
                      ? `
                    <div style="margin: 0 0 24px 0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(2, 44, 34, 0.08);">
                      <img src="${article.thumbnail}" alt="${article.title}" style="width: 100%; height: auto; max-height: 280px; object-fit: cover; display: block;" />
                    </div>
                  `
                      : ""
                  }

                  <div style="background-color: #f7f9f8; border-left: 4px solid #059669; border-radius: 12px; padding: 20px 24px; margin: 0 0 32px 0;">
                    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; font-style: italic;">
                      &ldquo;${excerptText}&rdquo;
                    </p>
                  </div>

                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="${articleUrl}" style="display: inline-block; background-color: #022c22; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(2, 44, 34, 0.25);">
                      Read Full Masterpiece ↗
                    </a>
                  </div>

                  <div style="border-top: 1px solid rgba(2, 44, 34, 0.08); padding-top: 24px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                    <p style="margin: 0 0 6px 0;">You received this publication dispatch as a member of Chroma Diaries.</p>
                    <p style="margin: 0;">
                      <a href="${siteUrl}" style="color: #059669; text-decoration: underline;">Visit Chroma Diaries Homepage</a>
                    </p>
                  </div>

                </div>
              </body>
              </html>
            `,
          });
        })
      );
    }
  } catch (err) {
    console.error("Failed to broadcast new article publication email:", err);
  }
}
