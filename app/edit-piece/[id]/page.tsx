import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findArticleById } from "@/lib/db/articles";
import { listCategories } from "@/lib/db/categories";
import { listUsers } from "@/lib/db/users";
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
  const isAdmin = isEditorialRole(user.role);

  const [article, categories, users] = await Promise.all([
    findArticleById(id),
    listCategories(),
    isAdmin ? listUsers() : Promise.resolve([]),
  ]);

  if (!article) {
    redirect("/dashboard");
  }

  const authorId = typeof article.author === "object" ? article.author.id || article.author._id : article.author;
  const currentUserId = user.id || user._id;

  const isAuthor = String(authorId) === String(currentUserId);
  if (!isAuthor && !isAdmin) {
    redirect("/dashboard");
  }

  const serializedArticle = JSON.parse(JSON.stringify(article));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedUsers = JSON.parse(JSON.stringify(users));

  return (
    <ArticleEditorForm
      article={serializedArticle}
      categories={serializedCategories}
      users={serializedUsers}
      isEdit
    />
  );
}
