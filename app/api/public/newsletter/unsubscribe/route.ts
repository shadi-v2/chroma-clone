import { NextResponse } from "next/server";
import { unsubscribeNewsletter } from "@/lib/db/newsletters";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, email } = body;

    const identifier = token || email;
    if (!identifier) {
      return NextResponse.json(
        { message: "Unsubscribe token or email is required." },
        { status: 400 },
      );
    }

    const success = await unsubscribeNewsletter(identifier);
    if (!success) {
      return NextResponse.json(
        { message: "Subscription not found or already inactive." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "You have been successfully unsubscribed from Chroma Diaries." },
      { status: 200 },
    );
  } catch (error) {
    console.error("NEWSLETTER UNSUBSCRIBE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to process unsubscribe request." },
      { status: 500 },
    );
  }
}
