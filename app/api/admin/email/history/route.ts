import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { listSentEmails } from "@/lib/db/emails";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 100;

    const history = await listSentEmails(limit);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET EMAIL HISTORY ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load sent email history." },
      { status: 500 },
    );
  }
}
