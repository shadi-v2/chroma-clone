import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, query } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Security Rate Limit: max 3 requests per 5 minutes per email
    const rateLimit = checkRateLimit(`send_code:${cleanEmail}`, 3, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: `Please wait ${rateLimit.resetSeconds} seconds before requesting another verification code.`,
        },
        { status: 429 },
      );
    }

    // IP Rate Limit: max 10 requests per 10 minutes per IP
    const ipLimit = checkRateLimit(`send_code_ip:${ip}`, 10, 600);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          message: `Too many code requests from this network. Please wait ${ipLimit.resetSeconds} seconds.`,
        },
        { status: 429 },
      );
    }

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
