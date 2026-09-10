import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import { findArticleById, toggleLikeArticle } from "@/lib/db/articles";

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
    const auth = await requireAuth(req);

    if (auth.error) {
      return auth.error;
    }

    const article = await findArticleById(id);

    if (!article) {
      return NextResponse.json(
        {
          message: "Article not found",
        },
        {
          status: 404,
        },
      );
    }

    const result = await toggleLikeArticle(id, auth.user.id);

    return NextResponse.json({
      liked: result.liked,
      likes: result.likes,
    });
  } catch (error) {
    console.error("LIKE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update like",
      },
      {
        status: 500,
      },
    );
  }
}
