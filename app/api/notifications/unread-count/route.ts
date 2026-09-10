import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getUnreadNotificationCount } from "@/lib/db/notifications";

export async function GET() {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const unreadCount = await getUnreadNotificationCount(user.id || user._id);

    return NextResponse.json({
      count: unreadCount,
    });
  } catch (error) {
    console.error("UNREAD COUNT ERROR:", error);

    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
