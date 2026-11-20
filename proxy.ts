import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface TokenPayload {
  id: string;
  role?: string;
  isEmailVerified?: boolean;
  exp?: number;
}

/**
 * Safely decodes JWT payload without external heavy dependencies in edge/proxy runtime.
 */
function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Next.js 16 Proxy
 * Enforces:
 * 1. Comprehensive HTTP Security Walls (Headers, HSTS, X-Content-Type-Options, Frame Protection)
 * 2. Unverified Account Security Gate: Never allow unverified accounts to stay on the site
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets, internal next.js files, and public images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.includes(".") || // static files like logo.png, favicon.ico, etc.
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check token cookie
  const token = req.cookies.get("token")?.value;

  // 2. Unverified Account Security Wall:
  // "never allow to stay in the site with an unverified account"
  if (token && token !== "null" && token !== "undefined") {
    const payload = decodeJwtPayload(token);

    // If token exists and isEmailVerified is explicitly false:
    // Block from staying anywhere on the site, redirect to verification
    if (payload && payload.isEmailVerified === false) {
      // Allow auth API routes (to allow verifying code or logging out)
      const isAuthRoute =
        pathname === "/auth" ||
        pathname.startsWith("/api/auth");

      if (!isAuthRoute) {
        const verifyUrl = new URL("/auth", req.url);
        verifyUrl.searchParams.set("mode", "verify");
        verifyUrl.searchParams.set("unverified", "true");
        return NextResponse.redirect(verifyUrl);
      }
    }
  }

  // 3. Security Headers Wall: Apply to all web requests
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
