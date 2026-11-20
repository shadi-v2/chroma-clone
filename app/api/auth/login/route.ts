import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connectDB, query } from "@/lib/db";
import { findUserByEmail, comparePassword, updateUser, toPublicUser } from "@/lib/db/users";
import { sendVerificationEmail } from "@/lib/email";
import {
  getClientIp,
  checkRateLimit,
  isOverThreeMonths,
} from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate Limiting Security Wall: max 15 attempts per 5 minutes per IP
    const ipLimit = checkRateLimit(`login_ip:${ip}`, 15, 300);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          message: `Too many login attempts from this network. Please wait ${ipLimit.resetSeconds} seconds.`,
        },
        { status: 429 },
      );
    }

    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    // Rate Limiting per account: max 5 attempts per 5 minutes
    const accountLimit = checkRateLimit(`login_acc:${cleanEmail}`, 5, 300);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        {
          message: `Too many login attempts for this account. Please wait ${accountLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 },
      );
    }

    const user = await findUserByEmail(cleanEmail);

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    // Account Lockout Security Wall
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      );
      return NextResponse.json(
        {
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s) or reset your password.`,
        },
        { status: 423 },
      );
    }

    // Check password
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      const currentAttempts = Number(user.failedLoginAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;

      if (currentAttempts >= MAX_ATTEMPTS) {
        // Lock account for 15 minutes
        const lockTime = new Date(Date.now() + 15 * 60 * 1000);
        await updateUser(user.id || user._id, {
          failedLoginAttempts: currentAttempts,
          lockedUntil: lockTime,
        });

        return NextResponse.json(
          {
            message: "Too many consecutive failed login attempts. This account is locked for 15 minutes for your protection.",
          },
          { status: 423 },
        );
      } else {
        await updateUser(user.id || user._id, {
          failedLoginAttempts: currentAttempts,
        });

        const remaining = MAX_ATTEMPTS - currentAttempts;
        return NextResponse.json(
          {
            message: `Invalid email or password. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before temporary account lockout)`,
          },
          { status: 401 },
        );
      }
    }

    // Reset failed attempts upon successful password match
    if ((user.failedLoginAttempts || 0) > 0 || user.lockedUntil) {
      await updateUser(user.id || user._id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    }

    // Frozen account check
    if (user.isFrozen) {
      return NextResponse.json(
        {
          message: "This account has been frozen (restricted for accounts exceeding 18 years of age). Please contact administration.",
        },
        { status: 403 },
      );
    }

    // Security Gate 1: Check if account is unverified ("never allow to stay in the site with an unverified account")
    if (!user.isEmailVerified) {
      const code = crypto.randomInt(100000, 999999).toString();
      await query(`DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
      await query(
        `INSERT INTO email_verifications (email, code, expires_at, verified)
         VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', FALSE)`,
        [cleanEmail, code],
      );

      await sendVerificationEmail(cleanEmail, code);

      return NextResponse.json({
        requiresVerification: true,
        email: cleanEmail,
        reason: "unverified",
        message: "Your account email is not yet verified. A 6-digit verification code has been sent to your email. Please enter it to verify and access your account.",
      });
    }

    // Security Gate 2: Sign-in verification after 3 months
    // "and sign in after 3 months (never ask for a verification if the last sign in is under 3 months)"
    const needsThreeMonthVerification = isOverThreeMonths(user.lastLoginAt);

    if (needsThreeMonthVerification) {
      const code = crypto.randomInt(100000, 999999).toString();
      await query(`DELETE FROM email_verifications WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
      await query(
        `INSERT INTO email_verifications (email, code, expires_at, verified)
         VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', FALSE)`,
        [cleanEmail, code],
      );

      await sendVerificationEmail(cleanEmail, code);

      return NextResponse.json({
        requiresVerification: true,
        email: cleanEmail,
        reason: "three_months",
        message: "For your security, because your last sign-in was over 3 months ago (or this is your first verified login), a 6-digit verification code has been sent to your email.",
      });
    }

    // If last sign in is UNDER 3 months: NEVER ask for verification! Proceed immediately.
    const now = new Date();
    await updateUser(user.id || user._id, {
      lastLoginAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const token = jwt.sign(
      {
        id: user.id || user._id,
        role: user.role,
        isEmailVerified: true,
      },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "30d",
      },
    );

    const response = NextResponse.json({
      token,
      user: toPublicUser({ ...user, lastLoginAt: now.toISOString() }),
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { message: "Login failed due to a server error. Please try again." },
      { status: 500 },
    );
  }
}
