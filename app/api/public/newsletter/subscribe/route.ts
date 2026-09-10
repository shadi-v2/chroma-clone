import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/db/newsletters";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const { subscriber, alreadySubscribed, reactivated } = await subscribeNewsletter(email);

    if (alreadySubscribed) {
      return NextResponse.json(
        { message: "You are already subscribed to our newsletter! ✨" },
        { status: 200 },
      );
    }

    // Send welcome email with 1-click unsubscribe token
    await sendNewsletterWelcomeEmail(subscriber.email, subscriber.unsubscribe_token);

    const message = reactivated
      ? "Welcome back! Your subscription has been reactivated. 💌"
      : "Thank you for subscribing! A welcome note has been sent to your inbox. 💌";

    return NextResponse.json(
      { message, subscriber },
      { status: 201 },
    );
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIBE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to process subscription. Please try again later." },
      { status: 500 },
    );
  }
}
