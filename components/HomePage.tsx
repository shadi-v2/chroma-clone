import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import LatestArticlesFeed from "@/components/LatestArticlesFeed";
import { connectDB } from "@/lib/db";
import { findArticles, getTrendingArticles } from "@/lib/db/articles";
import { PublicArticle } from "@/types/article";

interface HomePageProps {
  searchParams?: Promise<{
    category?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await connectDB();

  // If a specific category is requested in query params, searchParams might be passed
  const params = searchParams ? await searchParams : {};
  const categoryFilter = params.category || null;

  // FETCH LATEST 6 ARTICLES, HERO ARTICLES, AND TRENDING IN PARALLEL
  const [articlesResult, heroResult, trendingArticles] = await Promise.all([
    findArticles({
      category: categoryFilter,
      status: "Published",
      page: 1,
      limit: 6,
      sortBy: "latest",
    }),
    findArticles({
      status: "Published",
      page: 1,
      limit: 4,
      sortBy: "latest",
    }),
    getTrendingArticles(4),
  ]);

  const serializedArticles: PublicArticle[] = JSON.parse(
    JSON.stringify(articlesResult.articles),
  );

  const serializedHero: PublicArticle[] = JSON.parse(
    JSON.stringify(heroResult.articles),
  );

  const serializedTrending: PublicArticle[] = JSON.parse(
    JSON.stringify(trendingArticles),
  );

  return (
    <div className="font-sans min-h-screen">
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* HERO CAROUSEL */}
        {serializedHero.length > 0 && !categoryFilter && (
          <div className="mb-14 sm:mb-20">
            <Hero articles={serializedHero} />
          </div>
        )}

        {/* MAIN FEED & SIDEBAR LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
          {/* LATEST ARTICLES MAIN COLUMN */}
          <div className="lg:w-2/3 space-y-8">
            {/* SECTION HEADER */}
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-emerald-950">
                  {categoryFilter
                    ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Dispatches`
                    : "Latest Masterpieces"}
                </h1>
              </div>
            </div>

            {/* LATEST ARTICLES LIST WITH SHOW MORE BUTTON */}
            <LatestArticlesFeed
              initialArticles={serializedArticles}
              totalArticles={articlesResult.total}
            />
          </div>

          {/* SIDEBAR */}
          <div className="lg:w-1/3">
            <Sidebar trendingArticles={serializedTrending} />
          </div>
        </div>
      </main>
    </div>
  );
}
