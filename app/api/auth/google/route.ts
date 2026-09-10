import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  updateUser,
  toPublicUser,
} from "@/lib/db/users";

function getOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
}

// 1. GET /api/auth/google: Redirects to Google's official OAuth consent page
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const redirectParam = searchParams.get("redirect") || "/dashboard";

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        {
          message:
            "Google OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
        },
        { status: 500 },
      );
    }

    const origin = getOrigin(req);
    const redirectUri = `${origin}/api/auth/google/callback`;

    const statePayload = Buffer.from(
      JSON.stringify({ redirect: redirectParam, ts: Date.now() }),
    ).toString("base64url");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("state", statePayload);

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error("GOOGLE OAUTH INITIATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to initiate Google OAuth" },
      { status: 500 },
    );
  }
}

// 2. POST /api/auth/google: Handles Google Identity Services ID token or direct verification
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    let email = body.email;
    let firstName = body.firstName;
    let surname = body.surname;
    let avatar = body.avatar || body.picture;
    let googleId = body.googleId || body.sub;

    // If a Google ID token credential was sent, verify it with Google's tokeninfo API
    if (body.credential && typeof body.credential === "string") {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`,
        );

        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email;
          googleId = payload.sub;
          avatar = payload.picture;
          firstName = payload.given_name || payload.name?.split(" ")[0] || "Google";
          surname =
            payload.family_name ||
            payload.name?.split(" ").slice(1).join(" ") ||
            "User";
        } else {
          // Fallback decode if offline
          const decoded = jwt.decode(body.credential) as Record<string, unknown>;
          if (decoded) {
            if (decoded.email) email = decoded.email as string;
            if (decoded.sub) googleId = decoded.sub as string;
            if (decoded.picture) avatar = decoded.picture as string;
            if (decoded.given_name) firstName = decoded.given_name as string;
            if (decoded.family_name) surname = decoded.family_name as string;
          }
        }
      } catch (err) {
        console.warn("Token verification error:", err);
      }
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid Google account email is required" },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    firstName = (firstName || "Google").trim();
    surname = (surname || "User").trim();

    // Look for existing user by googleId or email
    let user = googleId ? await findUserByGoogleId(googleId) : null;
    if (!user) {
      user = await findUserByEmail(cleanEmail);
    }

    let isNewUser = false;

    if (user) {
      if (user.isFrozen) {
        return NextResponse.json(
          {
            message:
              "Your account is currently frozen under the age verification policy. Please contact an administrator.",
          },
          { status: 403 },
        );
      }

      const updates: Parameters<typeof updateUser>[1] = {
        isEmailVerified: true,
      };
      if (googleId && !user.googleId) updates.googleId = googleId;
      if (avatar && !user.avatar) updates.avatar = avatar;

      const updated = await updateUser(user.id || user._id, updates);
      if (updated) user = updated;
    } else {
      isNewUser = true;
      user = await createUser({
        firstName,
        surname,
        email: cleanEmail,
        role: "Author",
        school: "",
        bio: "Literary storyteller at Chroma Diaries",
        dateOfBirth: null,
        avatar: avatar || "",
        isEmailVerified: true,
        googleId: googleId || undefined,
        onboardingCompleted: false,
      });

      if (!user) {
        return NextResponse.json(
          { message: "Failed to create user account with Google" },
          { status: 500 },
        );
      }
    }

    const token = jwt.sign(
      {
        id: user.id || user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "30d",
      },
    );

    const needsOnboarding =
      isNewUser ||
      !user.onboardingCompleted ||
      !user.school ||
      !user.dateOfBirth;

    const publicUser = toPublicUser(user);

    const response = NextResponse.json({
      token,
      user: publicUser,
      isNewUser,
      needsOnboarding,
      message: isNewUser
        ? "Account created successfully with Google"
        : "Signed in successfully with Google",
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
    console.error("GOOGLE AUTH ERROR:", error);
    return NextResponse.json(
      { message: "Google authentication failed. Please try again." },
      { status: 500 },
    );
  }
}
