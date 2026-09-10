import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import type { ArticleStatus } from "@/types/article";
import { findArticleById, updateArticle } from "@/lib/db/articles";

const allowedStatuses: ArticleStatus[] = [
  "Draft",
  "Pending",
  "Editing",
  "Edited",
  "Published",
  "Paused",
];

export async function PATCH(
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

    const auth = await requireRole(req, ["Admin", "Editor"]);

    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();

    const { status, assignedEditor } = body as {
      status?: ArticleStatus;
      assignedEditor?: string | null;
    };

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: "Invalid article status",
        },
        {
          status: 400,
        },
      );
    }

    const originalArticle = await findArticleById(id);

    if (!originalArticle) {
      return NextResponse.json(
        {
          message: "Article not found",
        },
        {
          status: 404,
        },
      );
    }

    let newStatus = status;
    if (assignedEditor && status === undefined) {
      newStatus = "Editing";
    }

    const article = await updateArticle(id, {
      status: newStatus,
      assignedEditorId: assignedEditor !== undefined ? (assignedEditor || null) : undefined,
    });

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

    return NextResponse.json(article);
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update status",
      },
      {
        status: 500,
      },
    );
  }
}
