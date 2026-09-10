import { NextResponse } from "next/server";
import { checkAndSendSubmissionReminders } from "@/lib/reminders";

export async function GET(req: Request) {
  try {
    // Optional cron secret protection if configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized cron request" }, { status: 401 });
    }

    const result = await checkAndSendSubmissionReminders();

    return NextResponse.json({
      success: true,
      message: `Inactivity reminder check finished. Dispatched ${result.remindersSent} reminders.`,
      result,
    });
  } catch (error) {
    console.error("CRON REMINDERS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to run submission reminder cron job" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
