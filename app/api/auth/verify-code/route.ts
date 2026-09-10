import { NextResponse } from "next/server";
import { connectDB, query, queryOne } from "@/lib/db";
import { findUserByEmail, updateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and verification code are required" },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    // Check verification record in DB
    const verification = await queryOne<{
      id: string;
      email: string;
      code: string;
      expires_at: string | Date;
      verified: boolean;
    }>(
      `SELECT * FROM email_verifications 
       WHERE LOWER(email) = LOWER($1) AND code = $2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanCode],
    );

    if (!verification) {
      return NextResponse.json(
        { message: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Mark as verified
    await query(
      `UPDATE email_verifications SET verified = TRUE WHERE id = $1`,
      [verification.id],
    );

    // If user already exists in DB, update is_email_verified
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      await updateUser(existingUser.id || existingUser._id, {
        isEmailVerified: true,
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Email address verified successfully",
    });
  } catch (error) {
    console.error("VERIFY CODE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to verify code. Please try again." },
      { status: 500 },
    );
  }
}
