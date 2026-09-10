import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findArticleById } from "@/lib/db/articles";
import { listCategories } from "@/lib/db/categories";
import ArticleEditorForm from "@/components/editor/ArticleEditorForm";
import { isEditorialRole } from "@/lib/roles";

interface EditPiecePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPiecePage({ params }: EditPiecePageProps) {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const { id } = await params;
  const [article, categories] = await Promise.all([
    findArticleById(id),
    listCategories(),
  ]);

  if (!article) {
    redirect("/dashboard");
  }

  const authorId = typeof article.author === "object" ? article.author.id || article.author._id : article.author;
  const currentUserId = user.id || user._id;

  const isAuthor = String(authorId) === String(currentUserId);
  const isAdmin = isEditorialRole(user.role);
  if (!isAuthor && !isAdmin) {
    redirect("/dashboard");
  }

  const serializedArticle = JSON.parse(JSON.stringify(article));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <ArticleEditorForm
      article={serializedArticle}
      categories={serializedCategories}
      isEdit
    />
  );
}
