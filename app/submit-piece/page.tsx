import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { listCategories } from "@/lib/db/categories";
import { listUsers } from "@/lib/db/users";
import ArticleEditorForm from "@/components/editor/ArticleEditorForm";
import { isEditorialRole } from "@/lib/roles";

export default async function SubmitPiecePage() {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const [categories, users] = await Promise.all([
    listCategories(),
    isEditorialRole(user.role) ? listUsers() : Promise.resolve([]),
  ]);

  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedUsers = JSON.parse(JSON.stringify(users));

  return (
    <ArticleEditorForm
      categories={serializedCategories}
      users={serializedUsers}
      isEdit={false}
    />
  );
}
