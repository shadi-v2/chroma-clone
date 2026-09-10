import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { markNotificationAsRead } from "@/lib/db/notifications";

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const notification = await markNotificationAsRead(id, user.id || user._id);

    return NextResponse.json(notification);
  } catch (error) {
    console.error("NOTIFICATION READ ERROR:", error);

    return NextResponse.json(
      { message: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
