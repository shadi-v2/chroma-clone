import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import { findArticleById, toggleEnrollArticle } from "@/lib/db/articles";

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

    const auth = await requireAuth(req);

    if (auth.error) {
      return auth.error;
    }

    const { id } = await context.params;
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

    const result = await toggleEnrollArticle(id, auth.user.id);

    return NextResponse.json({
      enrolled: result.enrolled,
    });
  } catch (error) {
    console.error("ENROLL ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update enrollment",
      },
      {
        status: 500,
      },
    );
  }
}
