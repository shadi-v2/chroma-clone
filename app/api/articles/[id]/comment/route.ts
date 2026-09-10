import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";
import {
  findCommentsByArticleId,
  createComment,
  findCommentById,
  deleteComment,
} from "@/lib/db/comments";
import { isAdminRole } from "@/lib/roles";

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

    const body = await req.json();
    const { content, parentComment } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        {
          message: "Comment content is required",
        },
        {
          status: 400,
        },
      );
    }

    const authorId = auth.user.id || auth.user._id;

    const comment = await createComment({
      articleId: id,
      authorId,
      content: content.trim(),
      parentCommentId: parentComment || undefined,
    });

    return NextResponse.json(comment, {
      status: 201,
    });
  } catch (error) {
    console.error("COMMENT POST ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to add comment",
      },
      {
        status: 500,
      },
    );
  }
}

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
    const comments = await findCommentsByArticleId(id);

    return NextResponse.json(comments);
  } catch (error) {
    console.error("COMMENTS GET ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch comments",
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
    await context.params;
    const auth = await requireAuth(req);

    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const commentId = url.searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ message: "Comment ID is required" }, { status: 400 });
    }

    const comment = await findCommentById(commentId);
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    const authorId = auth.user.id || auth.user._id;
    const isOwnerOrAuthor = comment.author?.id === authorId || comment.author?._id === authorId;
    const isAdmin = isAdminRole(auth.user.role);

    if (!isOwnerOrAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await deleteComment(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("COMMENT DELETE ERROR:", error);
    return NextResponse.json({ message: "Failed to delete comment" }, { status: 500 });
  }
}
