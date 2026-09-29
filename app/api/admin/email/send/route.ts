import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { sendOfficialEmail } from "@/lib/email";
import { logSentEmail } from "@/lib/db/emails";

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { toEmail, subject, htmlContent, senderName, fromEmail, wrapTemplate, wrapperConfig } = body;

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json(
        { message: "A valid recipient email address is required." },
        { status: 400 },
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { message: "Email subject line is required." },
        { status: 400 },
      );
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json(
        { message: "Email message content is required." },
        { status: 400 },
      );
    }

    const cleanSenderName = (senderName && typeof senderName === "string" && senderName.trim())
      ? senderName.trim()
      : "Chroma Diaries Editorial";

    // Dispatch official email
    const result = await sendOfficialEmail({
      to: toEmail.trim(),
      subject: subject.trim(),
      htmlContent: htmlContent.trim(),
      senderName: cleanSenderName,
      fromEmail: (fromEmail && typeof fromEmail === "string") ? fromEmail.trim() : undefined,
      wrapInOfficialTemplate: wrapTemplate !== false,
      wrapperConfig: wrapperConfig || undefined,
    });

    // Log to sent_emails database
    await logSentEmail({
      to_email: toEmail.trim(),
      subject: subject.trim(),
      content_html: htmlContent.trim(),
      sent_by_id: auth.user?._id || null,
      sender_name: cleanSenderName,
      status: result.success ? "Sent" : "Failed",
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || "Failed to dispatch email via provider." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Official email successfully dispatched to ${toEmail.trim()}! 📨`,
    });
  } catch (error) {
    console.error("ADMIN SEND EMAIL ERROR:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while sending email." },
      { status: 500 },
    );
  }
}
