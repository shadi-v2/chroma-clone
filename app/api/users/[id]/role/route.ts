import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import { isAdminRole, isAssignableRole } from "@/lib/roles";
import { findUserById, updateUser, toPublicUser } from "@/lib/db/users";

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await connectDB();

    const admin = await getUserFromToken(req);

    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = await context.params;

    if (!isAssignableRole(body.role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (
      admin.role !== "Owner" &&
      (user.role === "Admin" || user.role === "Owner" || body.role === "Admin")
    ) {
      return NextResponse.json(
        { message: "Only the owner can manage admin roles" },
        { status: 403 },
      );
    }

    const updatedUser = await updateUser(id, {
      role: body.role,
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(toPublicUser(updatedUser));
  } catch (error) {
    console.error("ROLE UPDATE ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
