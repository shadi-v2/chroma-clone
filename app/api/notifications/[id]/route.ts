import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { isAdminRole } from "@/lib/roles";
import { deleteNotification } from "@/lib/db/notifications";

export async function DELETE(
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

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { id } = await context.params;

    await deleteNotification(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("NOTIFICATION DELETE ERROR:", error);

    return NextResponse.json(
      { message: "Failed to delete notification" },
      { status: 500 },
    );
  }
}
