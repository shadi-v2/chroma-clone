import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { incrementArticleViews } from "@/lib/db/articles";
import { getUserFromToken } from "@/lib/auth";

export async function POST(
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
    const user = await getUserFromToken(req);

    const result = await incrementArticleViews(id, user?.id || null);

    return NextResponse.json(result);
  } catch (error) {
    console.error("VIEW ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to increment views",
      },
      {
        status: 500,
      },
    );
  }
}
