import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { listUsers } from "@/lib/db/users";
import type { UserRole } from "@/types/user";

export async function GET(req: Request) {
  try {
    await connectDB();

    const admin = await getUserFromToken(req);

    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") as UserRole | null;

    const users = await listUsers(role || undefined);

    return NextResponse.json(users);
  } catch (error) {
    console.error("USERS GET ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
