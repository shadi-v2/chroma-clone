import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { findUserByEmail, createUser, toPublicUser } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      firstName,
      surname,
      email,
      password,
      school,
      bio,
      dateOfBirth,
      phone,
    } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const userExists = await findUserByEmail(cleanEmail);

    if (userExists) {
      return NextResponse.json(
        {
          message: "User already exists with this email address",
        },
        {
          status: 400,
        },
      );
    }

    const user = await createUser({
      firstName,
      surname,
      email: cleanEmail,
      password,
      role: "Author",
      school: school || "",
      bio: bio || null,
      dateOfBirth: dateOfBirth || null,
      phone: phone || null,
      isEmailVerified: true,
      onboardingCompleted: false,
    });


    if (!user) {
      return NextResponse.json(
        { message: "Failed to create user account" },
        { status: 500 },
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

    const response = NextResponse.json(
      {
        token,
        user: toPublicUser(user),
      },
      {
        status: 201,
      },
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        message: "Registration failed",
      },
      {
        status: 500,
      },
    );
  }
}
