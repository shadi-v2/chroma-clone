import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { listNewsletterSubscribers } from "@/lib/db/newsletters";
import { sendNewsletterBroadcast } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { subject, contentHtml } = body;

    if (!subject || !contentHtml) {
      return NextResponse.json(
        { message: "Subject and newsletter content are required." },
        { status: 400 },
      );
    }

    const subscribers = await listNewsletterSubscribers(true);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: "No active subscribers found to broadcast to." },
        { status: 400 },
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const result = await sendNewsletterBroadcast(
          subscriber.email,
          subject,
          contentHtml,
          subscriber.unsubscribe_token,
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Error sending broadcast to ${subscriber.email}:`, err);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast complete: ${sentCount} sent successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`,
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length,
    });
  } catch (error) {
    console.error("ADMIN NEWSLETTER BROADCAST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to broadcast newsletter." },
      { status: 500 },
    );
  }
}
