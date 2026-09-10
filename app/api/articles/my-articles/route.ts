import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import { getUserAllArticles } from "@/lib/db/articles";

export async function GET(req: Request) {
  try {
    await connectDB();

    const auth = await requireAuth(req);

    if (auth.error) {
      return auth.error;
    }

    const articles = await getUserAllArticles(auth.user.id);

    const processedArticles = articles.map((article) => ({
      ...article,
      category:
        typeof article.category === "object" && article.category !== null
          ? article.category.name
          : "Uncategorized",
    }));

    return NextResponse.json({ articles: processedArticles });
  } catch (error) {
    console.error("MY ARTICLES ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch articles",
      },
      {
        status: 500,
      },
    );
  }
}
