import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import {
  listNewsletterSubscribers,
  countActiveSubscribers,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from "@/lib/db/newsletters";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const [subscribers, activeCount] = await Promise.all([
      listNewsletterSubscribers(false),
      countActiveSubscribers(),
    ]);

    // Privacy filter for owner email in subscriber lists
    const filteredSubscribers = subscribers.filter(
      (s) => s.email.toLowerCase() !== "shahinshadi1122@gmail.com",
    );

    return NextResponse.json({
      subscribers: filteredSubscribers,
      totalCount: filteredSubscribers.length,
      activeCount,
    });
  } catch (error) {
    console.error("ADMIN GET NEWSLETTERS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch newsletter subscribers" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { action, email, id } = body;

    if (action === "add") {
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json({ message: "Valid email is required" }, { status: 400 });
      }
      const result = await subscribeNewsletter(email);
      return NextResponse.json({ success: true, subscriber: result.subscriber });
    }

    if (action === "toggle" && id) {
      const subscriber = (await query<{ id: string; is_active: boolean }>(
        `SELECT id, is_active FROM newsletters WHERE id = $1`,
        [id],
      ))[0];

      if (!subscriber) {
        return NextResponse.json({ message: "Subscriber not found" }, { status: 404 });
      }

      await query(
        `UPDATE newsletters SET is_active = $1, updated_at = NOW() WHERE id = $2`,
        [!subscriber.is_active, id],
      );

      return NextResponse.json({ success: true, is_active: !subscriber.is_active });
    }

    if (action === "unsubscribe" && (email || id)) {
      await unsubscribeNewsletter(email || id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("ADMIN NEWSLETTER ACTION ERROR:", error);
    return NextResponse.json({ message: "Failed to perform action" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Subscriber ID is required" }, { status: 400 });
    }

    await query(`DELETE FROM newsletters WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN DELETE NEWSLETTER ERROR:", error);
    return NextResponse.json({ message: "Failed to delete subscriber" }, { status: 500 });
  }
}
