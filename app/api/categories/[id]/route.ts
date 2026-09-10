import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { updateCategory, deleteCategory } from "@/lib/db/categories";

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

    const {
      name,
      slug,
    }: {
      name?: string;
      slug?: string;
    } = body;

    const category = await updateCategory(id, { name, slug });

    if (!category) {
      return NextResponse.json(
        {
          message: "Category not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("CATEGORY PATCH ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to update category",
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

    const { id } = await context.params;

    const auth = await requireRole(req, ["Admin"]);

    if (auth.error) {
      return auth.error;
    }

    await deleteCategory(id);

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("CATEGORY DELETE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to delete category",
      },
      {
        status: 500,
      },
    );
  }
}
