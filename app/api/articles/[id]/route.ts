import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import {
  findArticleById,
  updateArticle,
  softDeleteArticle,
} from "@/lib/db/articles";
import { resolveCategoryId } from "@/lib/db/categories";
import { isAdminRole } from "@/lib/roles";

export async function GET(
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
    const article = await findArticleById(id);

    if (!article || article.deletedAt) {
      return NextResponse.json(
        {
          message: "Article not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET ARTICLE BY ID ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch article",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
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

    const assignedEditorId = typeof article.assignedEditor === "object"
      ? article.assignedEditor?.id || article.assignedEditor?._id
      : article.assignedEditor;
    const authorId = typeof article.author === "object"
      ? article.author.id || article.author._id
      : article.author;

    const isAssignedEditor = assignedEditorId && String(assignedEditorId) === String(auth.user.id);

    if (
      String(authorId) !== String(auth.user.id) &&
      !isAdminRole(auth.user.role) &&
      !isAssignedEditor
    ) {
      return NextResponse.json(
        {
          message: "Access denied",
        },
        {
          status: 403,
        },
      );
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

    const categoryId = categoryInput
      ? await resolveCategoryId(categoryInput)
      : article.category?.id || article.category?._id;

    const updatedArticle = await updateArticle(id, {
      title,
      excerpt,
      content,
      categoryId: categoryId || undefined,
      thumbnail: thumbnail || featuredImage,
      featuredImage: featuredImage || thumbnail,
      readTime,
      tags: Array.isArray(tags) ? tags : undefined,
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("PUT ARTICLE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update article",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
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

    const authorId = typeof article.author === "object"
      ? article.author.id || article.author._id
      : article.author;

    if (
      String(authorId) !== String(auth.user.id) &&
      !isAdminRole(auth.user.role)
    ) {
      return NextResponse.json(
        {
          message: "Access denied",
        },
        {
          status: 403,
        },
      );
    }

    await softDeleteArticle(id);

    return NextResponse.json({
      message: "Article archived successfully",
    });
  } catch (error) {
    console.error("DELETE ARTICLE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to delete article",
      },
      {
        status: 500,
      },
    );
  }
}
