import { NextResponse } from "next/server";

import { getUserFromToken } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";

export async function requireRole(req: Request, roles: string[]) {
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
          message: "Account is frozen (restricted for accounts exceeding 18 years of age).",
        },
        {
          status: 403,
        },
      ),
    };
  }

  if (user.isEmailVerified === false) {
    return {
      error: NextResponse.json(
        {
          message: "Email verification required. Unverified accounts cannot perform this action.",
          requiresVerification: true,
        },
        {
          status: 403,
        },
      ),
    };
  }

  if (!roles.includes(user.role) && !(roles.includes("Admin") && isAdminRole(user.role))) {
    return {
      error: NextResponse.json(
        {
          message: "Access denied",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return { user };
}
