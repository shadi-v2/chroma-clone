import { NextResponse } from "next/server";
import { connectDB, query, queryOne } from "@/lib/db";
import { findUserByEmail, updateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, code, newPassword } = body;

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

    const cleanEmail = email.trim().toLowerCase();

    // Verify 6-digit OTP code
    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { message: "Please enter the 6-digit verification code sent to your email." },
        { status: 400 },
      );
    }

    const cleanCode = code.trim();

    const verification = await queryOne<{
      id: string;
      email: string;
      code: string;
      expires_at: string | Date;
    }>(
      `SELECT * FROM email_verifications 
       WHERE LOWER(email) = LOWER($1) AND code = $2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanCode],
    );

    if (!verification) {
      return NextResponse.json(
        { message: "Invalid or expired verification code. Please request a new code." },
        { status: 400 },
      );
    }

    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email address." },
        { status: 404 },
      );
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

    // Clean up verification record
    await query(
      `DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail],
    );

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to process password reset request." },
      { status: 500 },
    );
  }
}

