import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { findUserByEmail, comparePassword, toPublicUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;
    const user = await findUserByEmail(email);

    if (!user || !user.password || !password || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        {
          message: "Invalid email or password",
        },
        {
          status: 401,
        },
      );
    }

    if (user.isFrozen) {
      return NextResponse.json(
        {
          message: "This account has been frozen (restricted for accounts exceeding 18 years of age). Please contact administration.",
        },
        {
          status: 403,
        },
      );
    }

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
      token,
      user: toPublicUser(user),
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
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      {
        message: "Login failed",
      },
      {
        status: 500,
      },
    );
  }
}
