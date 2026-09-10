import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import {
  listCategories,
  createCategory,
  findCategoryByName,
  findCategoryBySlug,
} from "@/lib/db/categories";

export async function GET() {
  try {
    await connectDB();

    const categories = await listCategories();

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("CATEGORIES GET ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch categories",
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
    let { slug } = body;

    if (!name) {
      return NextResponse.json(
        {
          message: "Name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }

    const existingName = await findCategoryByName(name);
    const existingSlug = await findCategoryBySlug(slug);

    if (existingName || existingSlug) {
      return NextResponse.json(
        {
          message: "Category already exists",
        },
        {
          status: 400,
        },
      );
    }

    const category = await createCategory({
      name,
      slug,
    });

    return NextResponse.json(category, {
      status: 201,
    });
  } catch (error) {
    console.error("CATEGORIES POST ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create category",
      },
      {
        status: 500,
      },
    );
  }
}
