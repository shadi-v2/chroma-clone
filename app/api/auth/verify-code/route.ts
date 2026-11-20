import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, query, queryOne } from "@/lib/db";
import { findUserByEmail, updateUser, toPublicUser } from "@/lib/db/users";
import { getClientIp, checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await connectDB();
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and verification code are required." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    // Security Rate Limit: max 5 attempts per 5 minutes per email/IP
    const rateLimit = checkRateLimit(`verify:${ip}:${cleanEmail}`, 5, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: `Too many invalid verification attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 },
      );
    }

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
        { message: "Invalid or expired verification code. Please check your email or request a new code." },
        { status: 400 },
      );
    }

    // Mark as verified in email_verifications
    await query(
      `UPDATE email_verifications SET verified = TRUE WHERE id = $1`,
      [verification.id],
    );

    // If user already exists in DB, update is_email_verified and last_login_at
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      const now = new Date();
      const updatedUser = await updateUser(existingUser.id || existingUser._id, {
        isEmailVerified: true,
        lastLoginAt: now,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      // Issue JWT session token
      const token = jwt.sign(
        {
          id: existingUser.id || existingUser._id,
          role: existingUser.role,
          isEmailVerified: true,
        },
        process.env.JWT_SECRET || "secret",
        {
          expiresIn: "30d",
        },
      );

      const response = NextResponse.json({
        success: true,
        verified: true,
        token,
        user: toPublicUser(updatedUser || existingUser),
        message: "Email verified successfully! You are now logged in.",
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Email address verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY CODE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to verify code. Please try again." },
      { status: 500 },
    );
  }
}
