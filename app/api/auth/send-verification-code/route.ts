import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, query } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";


export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "A valid email address is required" },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate 6-digit numeric OTP code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store in email_verifications table with 10 min expiration
    await query(
      `DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail],
    );

    await query(
      `INSERT INTO email_verifications (email, code, expires_at, verified)
       VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', FALSE)`,
      [cleanEmail, code],
    );

    // Send code using Resend
    await sendVerificationEmail(cleanEmail, code);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error("SEND VERIFICATION CODE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to send verification code. Please try again." },
      { status: 500 },
    );
  }
}
