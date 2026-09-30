import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { updateArticlePosition, reorderArticles, findArticleById } from "@/lib/db/articles";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const auth = await requireRole(req, ["Admin", "Owner"]);
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();

    // Support single article position update: { id: "...", position: 1 | null }
    if (body.id) {
      const parsedPos =
        body.position === null || body.position === "" || body.position === undefined
          ? null
          : Math.max(1, Number(body.position));

      const updated = await updateArticlePosition(body.id, parsedPos);
      return NextResponse.json(updated);
    }

    // Support bulk reorder: { positions: [{ id: "...", position: 1 | null }, ...] }
    if (Array.isArray(body.positions)) {
      const sanitized = body.positions.map((p: { id: string; position: number | null | string }) => ({
        id: p.id,
        position:
          p.position === null || p.position === "" || p.position === undefined
            ? null
            : Math.max(1, Number(p.position)),
      }));

      await reorderArticles(sanitized);
      return NextResponse.json({ success: true, count: sanitized.length });
    }

    return NextResponse.json(
      { message: "Missing id or positions array in request body" },
      { status: 400 },
    );
  } catch (error) {
    console.error("REORDER ARTICLES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update article position" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return PATCH(req);
}
