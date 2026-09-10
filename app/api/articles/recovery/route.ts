import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getRecoveryArticles } from "@/lib/db/articles";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  try {
    await connectDB();

    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const articles = await getRecoveryArticles();

    return NextResponse.json({
      articles,
    });
  } catch (error) {
    console.error("RECOVERY GET ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch recovery articles",
      },
      {
        status: 500,
      },
    );
  }
}
