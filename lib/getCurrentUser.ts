import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { findUserById, toPublicUser } from "@/lib/db/users";

interface JwtPayload {
  id: string;
  role: string;
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
    ) as JwtPayload;

    await connectDB();
    const user = await findUserById(decoded.id);

    if (!user) {
      return null;
    }

    return toPublicUser(user);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("GET CURRENT USER ERROR:", error);
    return null;
  }
}
