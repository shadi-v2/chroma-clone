import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, query } from "@/lib/db";
import { findUserByEmail, createUser } from "@/lib/db/users";
import { sendVerificationEmail } from "@/lib/email";
import {
  getClientIp,
  checkRateLimit,
  validatePasswordStrength,
} from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate Limiting Security Wall: max 5 registrations per 10 minutes per IP
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: `Too many registration attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 },
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      firstName,
      surname,
      email,
      password,
      school,
      bio,
      dateOfBirth,
      phone,
    } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 },
      );
    }

    if (!firstName?.trim() || !surname?.trim()) {
      return NextResponse.json(
        { message: "First name and surname are required." },
        { status: 400 },
      );
    }

    // Password Security Wall: validate minimum requirements
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { message: pwdCheck.error || "Password does not meet security criteria." },
        { status: 400 },
      );
    }

    const userExists = await findUserByEmail(cleanEmail);

    if (userExists) {
      if (userExists.isEmailVerified) {
        return NextResponse.json(
          { message: "An account already exists with this email address. Please sign in." },
          { status: 400 },
        );
      }

      // If user exists but is unverified, resend verification code and prompt verification
      const code = crypto.randomInt(100000, 999999).toString();
      await query(`DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
      await query(
        `INSERT INTO email_verifications (email, code, expires_at, verified)
         VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', FALSE)`,
        [cleanEmail, code],
      );

      await sendVerificationEmail(cleanEmail, code);

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: cleanEmail,
        message: "An unverified account already exists with this email. A fresh 6-digit verification code has been sent to your email. Please enter it to verify.",
      });
    }

    // Create user with isEmailVerified = false (never verified on creation)
    const user = await createUser({
      firstName: firstName.trim(),
      surname: surname.trim(),
      email: cleanEmail,
      password,
      role: "Author",
      school: school || "Pending Onboarding",
      bio: bio || null,
      dateOfBirth: dateOfBirth || null,
      phone: phone || null,
      isEmailVerified: false,
      onboardingCompleted: false,
    });

    if (!user) {
      return NextResponse.json(
        { message: "Failed to create user account. Please try again." },
        { status: 500 },
      );
    }

    // Generate 6-digit OTP verification code
    const code = crypto.randomInt(100000, 999999).toString();
    await query(`DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
    await query(
      `INSERT INTO email_verifications (email, code, expires_at, verified)
       VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', FALSE)`,
      [cleanEmail, code],
    );

    // Send verification email via Resend
    await sendVerificationEmail(cleanEmail, code);

    // DO NOT issue a session token. An unverified account can never access or stay on the site.
    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        email: cleanEmail,
        message: "Account created successfully! A 6-digit verification code has been sent to your email. Please verify your email to access your account.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "Registration failed due to a server error. Please try again." },
      { status: 500 },
    );
  }
}
