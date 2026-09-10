import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { findArticles, createArticle } from "@/lib/db/articles";
import { resolveCategoryId } from "@/lib/db/categories";
import { findUsersByRoles, findUserById } from "@/lib/db/users";
import { createNotification } from "@/lib/createNotification";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const author = searchParams.get("author");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") as "likes" | "latest" | null;

    const result = await findArticles({
      category,
      page,
      limit,
      author,
      status,
      sortBy,
    });

    return NextResponse.json({
      articles: result.articles,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      totalArticles: result.total,
    });
  } catch (error) {
    console.error("ARTICLES API ERROR:", error);

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

export async function POST(req: Request) {
  try {
    await connectDB();

    const auth = await requireRole(req, ["Author", "Admin", "Editor"]);

    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();

    const {
      title,
      excerpt,
      content,
      category: categoryInput,
      thumbnail,
      featuredImage,
      readTime,
      tags,
    } = body;

    const categoryId = await resolveCategoryId(categoryInput);

    if (!categoryId) {
      return NextResponse.json(
        {
          message: "Category is required",
        },
        {
          status: 400,
        },
      );
    }

    const article = await createArticle({
      title,
      excerpt,
      content,
      categoryId,
      thumbnail: thumbnail || featuredImage,
      featuredImage: featuredImage || thumbnail,
      readTime,
      authorId: auth.user.id,
      status: "Pending",
      tags: Array.isArray(tags) ? tags : [],
    });

    try {
      const owners = await findUsersByRoles(["Owner"]);
      const ownerIds = owners.map((u) => u.id || u._id);

      if (ownerIds.length > 0) {
        const authorUser = await findUserById(auth.user.id);
        const authorName = authorUser
          ? `${authorUser.firstName} ${authorUser.surname}`.trim()
          : auth.user.email;

        await createNotification({
          title: "New Article Submission",
          message: `A new article "${title}" was submitted by ${authorName || "an author"} and is pending review.`,
          createdBy: auth.user.id,
          recipients: ownerIds,
          type: "Approval",
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify owner of new article:", notifErr);
    }

    return NextResponse.json(article, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE ARTICLE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create article",
      },
      {
        status: 500,
      },
    );
  }
}
