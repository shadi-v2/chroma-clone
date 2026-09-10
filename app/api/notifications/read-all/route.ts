import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { markAllNotificationsAsRead } from "@/lib/db/notifications";

export async function PATCH() {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await markAllNotificationsAsRead(user.id || user._id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("NOTIFICATION READ ALL ERROR:", error);

    return NextResponse.json(
      { message: "Failed to mark all as read" },
      { status: 500 },
    );
  }
}
