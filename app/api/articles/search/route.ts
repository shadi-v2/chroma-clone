import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { searchArticles } from "@/lib/db/articles";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    if (!query) {
      return NextResponse.json(
        {
          message: "Search query is required",
        },
        {
          status: 400,
        },
      );
    }

    const result = await searchArticles(query, page, limit);

    return NextResponse.json({
      articles: result.articles,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      totalArticles: result.total,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);

    return NextResponse.json(
      {
        message: "Search failed",
      },
      {
        status: 500,
      },
    );
  }
}
