import { Resend } from "resend";
import { renderEmailWithWrapper, type EmailWrapperConfig } from "./emailWrapper";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function resolveFromEmail(custom?: string, defaultPrefix = "editorial"): string {
  if (custom && custom.trim()) {
    const trimmed = custom.trim();
    if (trimmed.includes("@")) {
      return trimmed;
    }
    return `${trimmed}@chromadiaries.in`;
  }
  return process.env.RESEND_FROM_EMAIL || `${defaultPrefix}@chromadiaries.in`;
}

export async function sendVerificationEmail(
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = resolveFromEmail(process.env.RESEND_AUTH_FROM, "verify");

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
    const fromEmail = resolveFromEmail(process.env.RESEND_AUTH_FROM, "verify");

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
    const fromEmail = resolveFromEmail(process.env.RESEND_NEWSLETTER_FROM, "newsletter");
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
    const fromEmail = resolveFromEmail(process.env.RESEND_NEWSLETTER_FROM, "newsletter");
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
    const fromEmail = resolveFromEmail(process.env.RESEND_EDITORIAL_FROM, "editorial");
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

