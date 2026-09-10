import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import {
  listEmailTemplates,
  saveEmailTemplate,
  deleteEmailTemplate,
} from "@/lib/db/emails";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const templates = await listEmailTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET EMAIL TEMPLATES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load email templates." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, name, subject, contentHtml, category } = body;

    if (!name || !subject || !contentHtml) {
      return NextResponse.json(
        { message: "Name, subject, and content are required for templates." },
        { status: 400 },
      );
    }

    const template = await saveEmailTemplate({
      id,
      name: name.trim(),
      subject: subject.trim(),
      content_html: contentHtml.trim(),
      category: category ? category.trim() : "Custom",
      created_by_id: auth.user?._id,
    });

    return NextResponse.json({
      success: true,
      message: id ? "Template updated successfully!" : "Template created successfully!",
      template,
    });
  } catch (error) {
    console.error("POST EMAIL TEMPLATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save template." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireRole(req, ["Admin"]);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Template ID is required." }, { status: 400 });
    }

    const deleted = await deleteEmailTemplate(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("DELETE EMAIL TEMPLATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete template." },
      { status: 500 },
    );
  }
}
