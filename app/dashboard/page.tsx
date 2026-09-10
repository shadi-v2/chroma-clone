import { redirect } from "next/navigation";
import { connectDB, queryOne } from "@/lib/db";
import { getUserAllArticles, findArticles } from "@/lib/db/articles";
import { countUsers } from "@/lib/db/users";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { isAdminRole } from "@/lib/roles";

export default async function DashboardPage() {
  await connectDB();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const userId = user.id || user._id;

  // PARALLEL FETCHING
  const [
    userArticles,
    pendingReviewsResult,
    totalUsers,
    totalArticlesResult,
    pendingArticlesResult,
    publishedArticlesResult,
  ] = await Promise.all([
    getUserAllArticles(userId),
    isAdminRole(user.role)
      ? findArticles({
          status: "Pending",
          limit: 100,
        })
      : Promise.resolve({ articles: [] }),
    isAdminRole(user.role) ? countUsers() : Promise.resolve(0),
    isAdminRole(user.role)
      ? queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE deleted_at IS NULL`)
      : Promise.resolve({ count: 0 }),
    isAdminRole(user.role)
      ? queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE status IN ('Pending', 'Editing', 'Edited') AND deleted_at IS NULL`)
      : Promise.resolve({ count: 0 }),
    isAdminRole(user.role)
      ? queryOne<{ count: string | number }>(`SELECT COUNT(*) as count FROM articles WHERE status IN ('Published', 'Paused') AND deleted_at IS NULL`)
      : Promise.resolve({ count: 0 }),
  ]);

  const serializedUser = JSON.parse(JSON.stringify(user));
  const serializedArticles = JSON.parse(JSON.stringify(userArticles));
  const serializedPending = JSON.parse(JSON.stringify(pendingReviewsResult.articles));

  const stats = {
    totalUsers,
    totalArticles: Number(totalArticlesResult?.count || 0),
    pendingArticles: Number(pendingArticlesResult?.count || 0),
    publishedArticles: Number(publishedArticlesResult?.count || 0),
  };

  return (
    <DashboardTabs
      user={serializedUser}
      userArticles={serializedArticles}
      pendingReviews={serializedPending}
      adminStats={stats}
    />
  );
}
