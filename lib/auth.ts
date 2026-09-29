import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { findUserById } from "@/lib/db/users";

interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
}

export async function getUserFromToken(req: Request) {
  let token: string | undefined;

  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.split(" ")[1];
    if (raw && raw !== "null" && raw !== "undefined") {
      token = raw;
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get("token")?.value;
      if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined") {
        token = cookieToken;
      }
    } catch {
      // Ignore
    }
  }

  if (!token) {
    return null;
  }


  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
    ) as JwtPayload;

    await connectDB();

    const user = await findUserById(decoded.id);

    if (!user) {
      return null;
    }

    return {
      id: user.id || decoded.id,
      _id: user.id || decoded.id,
      email: user.email || decoded.email || "",
      role: user.role,
      isFrozen: user.isFrozen,
      dateOfBirth: user.dateOfBirth,
      age: user.age,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || token === "null" || token === "undefined") {
      return null;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
    ) as JwtPayload;
    if (!decoded?.id) return null;
    await connectDB();
    return await findUserById(decoded.id);
  } catch {
    return null;
  }
}

