import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  updateUser,
} from "@/lib/db/users";

function getOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
}

export async function GET(req: Request) {
  const origin = getOrigin(req);

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const oauthError = searchParams.get("error");

    let redirectTarget = "/dashboard";
    if (stateParam) {
      try {
        const decodedState = JSON.parse(
          Buffer.from(stateParam, "base64url").toString("utf-8"),
        );
        if (decodedState.redirect) {
          redirectTarget = decodedState.redirect;
        }
      } catch {
        // ignore invalid state
      }
    }

    if (oauthError) {
      console.error("Google OAuth error parameter:", oauthError);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(`Google sign-in error: ${oauthError}`)}`,
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("Authorization code missing from Google")}`,
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Google OAuth client ID or secret is missing in .env");
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("Google OAuth is not configured on the server")}`,
      );
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange authorization code for access & ID tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Failed to exchange code with Google:", errorText);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("Failed to authenticate with Google")}`,
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google UserInfo endpoint
    const userinfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userinfoRes.ok) {
      console.error("Failed to fetch Google userinfo");
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("Failed to fetch Google profile")}`,
      );
    }

    const profile = await userinfoRes.json();
    const googleId = profile.sub;
    const email = (profile.email || "").trim().toLowerCase();
    const avatar = profile.picture || "";

    let firstName = profile.given_name || "";
    let surname = profile.family_name || "";

    if (!firstName && profile.name) {
      const parts = profile.name.trim().split(/\s+/);
      firstName = parts[0] || "Google";
      surname = parts.slice(1).join(" ") || "User";
    }

    if (!email) {
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent("No email returned by Google account")}`,
      );
    }

    await connectDB();

    // 3. Find or create user in Neon PostgreSQL
    let user = googleId ? await findUserByGoogleId(googleId) : null;
    if (!user) {
      user = await findUserByEmail(email);
    }

    let isNewUser = false;

    if (user) {
      if (user.isFrozen) {
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent("Account is frozen under age verification policy")}`,
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
        firstName: firstName || "Google",
        surname: surname || "User",
        email,
        role: "Author",
        school: "",
        bio: "Storyteller & literary author at Chroma Diaries",
        dateOfBirth: null,
        avatar,
        isEmailVerified: true,
        googleId,
        onboardingCompleted: false,
      });

      if (!user) {
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent("Failed to create user record")}`,
        );
      }
    }

    // 4. Generate JWT application session token
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

    // 5. Build response and set HTTP-only cookie
    const destination = needsOnboarding
      ? `${origin}/onboarding`
      : `${origin}${redirectTarget.startsWith("/") ? redirectTarget : `/${redirectTarget}`}`;

    const response = NextResponse.redirect(destination);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("GOOGLE OAUTH CALLBACK ERROR:", err);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("An unexpected error occurred during Google sign in")}`,
    );
  }
}
