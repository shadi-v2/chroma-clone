import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { findUserById, toPublicUser } from "@/lib/db/users";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    console.error("GET PUBLIC USER ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
