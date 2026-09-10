import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { listTags, createTag, findTagByName } from "@/lib/db/categories";

export async function GET() {
  try {
    await connectDB();

    const tags = await listTags();

    return NextResponse.json({
      tags,
    });
  } catch (error) {
    console.error("TAGS GET ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch tags",
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

    const auth = await requireRole(req, ["Admin", "Editor"]);

    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        {
          message: "Tag name is required",
        },
        {
          status: 400,
        },
      );
    }

    const exists = await findTagByName(name);

    if (exists) {
      return NextResponse.json(
        {
          message: "Tag already exists",
        },
        {
          status: 400,
        },
      );
    }

    const tag = await createTag(name);

    return NextResponse.json(tag, {
      status: 201,
    });
  } catch (error) {
    console.error("TAGS POST ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create tag",
      },
      {
        status: 500,
      },
    );
  }
}
