import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { listCategories } from "@/lib/db/categories";
import ArticleEditorForm from "@/components/editor/ArticleEditorForm";

export default async function SubmitPiecePage() {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }
  const categories = await listCategories();
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  return <ArticleEditorForm categories={serializedCategories} isEdit={false} />;
}
