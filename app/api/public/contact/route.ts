import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createContactMessage } from "@/lib/db/public";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          message: "All fields are required",
        },
        {
          status: 400,
        },
      );
    }

    await createContactMessage({
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CONTACT POST ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to send message",
      },
      {
        status: 500,
      },
    );
  }
}
