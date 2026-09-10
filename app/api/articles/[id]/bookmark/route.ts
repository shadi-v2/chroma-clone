import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import { findArticleById, toggleBookmarkArticle } from "@/lib/db/articles";

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

    const result = await toggleBookmarkArticle(id, auth.user.id);

    if (result.bookmarked) {
      return NextResponse.json({
        message: "Article bookmarked",
        bookmarked: true,
      });
    }

    return NextResponse.json({
      message: "Bookmark removed",
      bookmarked: false,
    });
  } catch (error) {
    console.error("BOOKMARK ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to bookmark article",
      },
      {
        status: 500,
      },
    );
  }
}
