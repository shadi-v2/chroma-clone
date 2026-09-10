import { NextResponse } from "next/server";

import { getUserFromToken } from "@/lib/auth";

export async function requireAuth(req: Request) {
  const user = await getUserFromToken(req);

  if (!user) {
    return {
      error: NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (user.isFrozen) {
    return {
      error: NextResponse.json(
        {
          message: "Your account has been frozen (restricted for users up to 18 years of age).",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return { user };
}
