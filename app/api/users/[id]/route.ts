import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { isAdminRole } from "@/lib/roles";
import { deleteUser, updateUser, toPublicUser } from "@/lib/db/users";

export async function DELETE(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await connectDB();

    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdminRole(currentUser.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (String(currentUser.id || currentUser._id) === String(id)) {
      return NextResponse.json(
        {
          message: "You cannot delete your own account",
        },
        {
          status: 400,
        },
      );
    }

    await deleteUser(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to delete user",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await connectDB();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(currentUser.role)) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const user = await updateUser(id, body);

    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    console.error("PATCH USER ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
