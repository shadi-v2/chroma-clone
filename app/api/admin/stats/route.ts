import { NextResponse } from "next/server";
import { connectDB, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  try {
    await connectDB();

    const auth = await requireRole(req, ["Admin"]);

    if (auth.error) {
      return auth.error;
    }

    const [
      usersResult,
      articlesResult,
      commentsResult,
      publishedResult,
      pendingResult,
      draftResult,
      readsResult,
    ] = await Promise.all([
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM users`),
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE deleted_at IS NULL`),
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM comments`),
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE status IN ('Published', 'Paused') AND deleted_at IS NULL`),
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE status IN ('Pending', 'Editing', 'Edited') AND deleted_at IS NULL`),
      queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE status = 'Draft' AND deleted_at IS NULL`),
      queryOne<{ sum: string | number }>(`SELECT COALESCE(SUM(reads), 0) as sum FROM articles`),
    ]);

    return NextResponse.json({
      totalUsers: Number(usersResult?.count || 0),
      totalArticles: Number(articlesResult?.count || 0),
      totalComments: Number(commentsResult?.count || 0),
      publishedArticles: Number(publishedResult?.count || 0),
      pendingArticles: Number(pendingResult?.count || 0),
      draftArticles: Number(draftResult?.count || 0),
      totalReads: Number(readsResult?.sum || 0),
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch admin stats",
      },
      {
        status: 500,
      },
    );
  }
}
