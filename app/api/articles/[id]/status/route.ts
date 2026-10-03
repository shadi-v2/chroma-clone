import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import type { ArticleStatus } from "@/types/article";
import { findArticleById, updateArticle } from "@/lib/db/articles";
import { createNotification } from "@/lib/createNotification";
import { sendNewArticlePublishedBroadcast } from "@/lib/email";

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

    // When an article is marked as Published, dispatch in-app notification & email broadcast to all users!
    if (newStatus === "Published" && originalArticle.status !== "Published") {
      const authorName = typeof article.author === "object"
        ? `${article.author?.firstName || ""} ${article.author?.surname || ""}`.trim()
        : "Chroma Author";

      // 1. Create global in-app notification (which also triggers notification emails)
      createNotification({
        title: `New Article: ${article.title}`,
        message: `"${article.title}" by ${authorName} is now published and live on Chroma Diaries.`,
        createdBy: auth.user.id,
        isGlobal: true,
        type: "Article",
      }).catch((notifErr) => {
        console.error("Failed to create publish notification:", notifErr);
      });

      // 2. Broadcast bespoke publication email card to all registered users and newsletter subscribers
      sendNewArticlePublishedBroadcast(article).catch((mailErr) => {
        console.error("Failed to broadcast new article publication email:", mailErr);
      });
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
