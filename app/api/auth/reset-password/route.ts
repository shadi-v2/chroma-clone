import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { findUserByEmail, updateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, newPassword, phone, dateOfBirth } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { message: "Email and new password are required." },
        { status: 400 },
      );
    }

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    const user = await findUserByEmail(email.trim());

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email address." },
        { status: 404 },
      );
    }

    // Optional verification if provided
    if (phone && user.phone && user.phone.trim() !== phone.trim()) {
      return NextResponse.json(
        { message: "Phone number does not match our records." },
        { status: 400 },
      );
    }

    if (dateOfBirth && user.dateOfBirth) {
      const inputDob = new Date(dateOfBirth).toISOString().split("T")[0];
      const userDob = new Date(user.dateOfBirth).toISOString().split("T")[0];
      if (inputDob !== userDob) {
        return NextResponse.json(
          { message: "Date of birth does not match our records." },
          { status: 400 },
        );
      }
    }

    const updated = await updateUser(user.id || user._id, {
      password: newPassword.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Failed to reset password." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to process password reset request." },
      { status: 500 },
    );
  }
}
