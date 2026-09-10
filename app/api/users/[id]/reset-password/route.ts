import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { findUserById, updateUser } from "@/lib/db/users";

export async function POST(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await connectDB();

    const admin = await getUserFromToken(req);

    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const targetUser = await findUserById(id);

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Only Owner can reset passwords of Admins or Owners
    if (
      admin.role !== "Owner" &&
      (targetUser.role === "Admin" || targetUser.role === "Owner")
    ) {
      return NextResponse.json(
        { message: "Only the Owner can reset an Administrator's password" },
        { status: 403 },
      );
    }

    const updatedUser = await updateUser(id, {
      password: newPassword.trim(),
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to reset password" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password has been reset for ${targetUser.firstName} ${targetUser.surname}.`,
    });
  } catch (error) {
    console.error("ADMIN RESET PASSWORD ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
