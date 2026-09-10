import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import { findUserById, updateUser, toPublicUser } from "@/lib/db/users";

export async function GET(req: Request) {
  try {
    await connectDB();

    const authUser = await getUserFromToken(req);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(authUser.id || authUser._id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const publicUser = toPublicUser(user);

    // Generate fresh session token to ensure frontend & cookies stay in sync
    const token = jwt.sign(
      {
        id: user.id || user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "30d",
      },
    );

    const response = NextResponse.json({
      ...publicUser,
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("USERS ME GET ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const authUser = await getUserFromToken(req);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updatedUser = await updateUser(authUser.id || authUser._id, body);

    if (!updatedUser) {
      return NextResponse.json({ message: "Failed to update user" }, { status: 400 });
    }

    return NextResponse.json(toPublicUser(updatedUser));
  } catch (error) {
    console.error("USERS ME PATCH ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
