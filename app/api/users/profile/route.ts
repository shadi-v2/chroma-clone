import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findUserById, updateUser, toPublicUser } from "@/lib/db/users";

export async function GET() {
  try {
    await connectDB();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(currentUser.id || currentUser._id);
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    console.error("USERS PROFILE GET ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updatedUser = await updateUser(currentUser.id || currentUser._id, body);

    return NextResponse.json(toPublicUser(updatedUser));
  } catch (error) {
    console.error("USERS PROFILE PATCH ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return PATCH(req);
}
