import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { isAdminRole } from "@/lib/roles";
import {
  findNotificationsForUser,
  createDbNotification,
} from "@/lib/db/notifications";

export async function GET() {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notifications = await findNotificationsForUser(user.id || user._id);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("NOTIFICATIONS GET ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const body = await req.json();

    const notification = await createDbNotification({
      title: body.title,
      message: body.message,
      type: body.type || "General",
      recipients: body.recipients || [],
      isGlobal: body.isGlobal ?? true,
      createdBy: user.id || user._id,
    });

    return NextResponse.json(notification, {
      status: 201,
    });
  } catch (error) {
    console.error("NOTIFICATIONS POST ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create notification" },
      { status: 500 },
    );
  }
}
