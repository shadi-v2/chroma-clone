import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findUserById, updateUser, comparePassword } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    const user = await findUserById(currentUser.id || currentUser._id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentPassword && user.password) {
      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 },
        );
      }
    }

    const updated = await updateUser(user.id || user._id, {
      password: newPassword.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Failed to update password." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to change password." },
      { status: 500 },
    );
  }
}
