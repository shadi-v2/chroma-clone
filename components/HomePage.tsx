import Link from "next/link";
import { ArrowRight, Sparkles, Filter, X } from "lucide-react";
import Hero from "@/components/Hero";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";

import { connectDB } from "@/lib/db";
import { findArticles, getTrendingArticles } from "@/lib/db/articles";
import { listCategories } from "@/lib/db/categories";
import { PublicArticle } from "@/types/article";
import { Category } from "@/types/category";

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await connectDB();

  const { category } = await searchParams;

  // FETCH ARTICLES, CATEGORIES, AND TRENDING IN PARALLEL
  const [articlesResult, allCategories, trendingArticles] = await Promise.all([
    findArticles({
      category: category || null,
      status: "Published",
      limit: 100,
    }),
    listCategories(),
    getTrendingArticles(4),
  ]);

  const articles = articlesResult.articles;

  const serializedArticles: PublicArticle[] = JSON.parse(
    JSON.stringify(articles),
  );

  const serializedTrending: PublicArticle[] = JSON.parse(
    JSON.stringify(trendingArticles),
  );

  const serializedCategories: Category[] = JSON.parse(
    JSON.stringify(allCategories),
  );

  // Group articles by category
  let categorySections: { category: Category; articles: PublicArticle[] }[] = [];

  if (category) {
    const normCat = category.toLowerCase().trim();
    const currentCategory = serializedCategories.find(
      (c) =>
        c.slug.toLowerCase() === normCat ||
        c.name.toLowerCase() === normCat ||
        c.slug.toLowerCase().startsWith(normCat) ||
        c.name.toLowerCase().startsWith(normCat) ||
        normCat.startsWith(c.slug.toLowerCase()) ||
        normCat.startsWith(c.name.toLowerCase()),
    ) || {
      id: category,
      _id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      slug: category.toLowerCase(),
      createdAt: "",
      updatedAt: "",
    };

    categorySections = [
      {
        category: currentCategory as Category,
        articles: serializedArticles, // Show ALL articles for this category!
      },
    ];
  } else {
    // Only include categories that actually have published articles
    categorySections = serializedCategories
      .map((cat) => {
        const catArticles = serializedArticles.filter((art) => {
          const artCat = art.category;
          if (!artCat) return false;
          return (
            artCat._id === cat._id ||
            artCat.id === cat.id ||
            artCat.slug?.toLowerCase() === cat.slug?.toLowerCase() ||
            artCat.name?.toLowerCase() === cat.name?.toLowerCase()
          );
        });

        return {
          category: cat,
          articles: catArticles.slice(0, 4), // Show up to 4 articles per category on home page
        };
      })
      .filter((section) => section.articles.length > 0);
  }

  return (
    <div className="font-sans min-h-screen">
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* HERO CAROUSEL */}
        {!category && serializedArticles.length > 0 && (
          <div className="mb-16 sm:mb-24">
            <Hero articles={serializedArticles.slice(0, 4)} />
          </div>
        )}

        {/* CATEGORY FILTER PILL STRIP */}
        <div className="mb-12 pb-4 border-b border-emerald-950/10">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-950/60">
              <Filter className="w-3.5 h-3.5 text-emerald-800" />
              <span>Explore by Category</span>
            </div>

            {category && (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-cream-50 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all"
              >
                <span>Clear Filter</span>
                <X className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                !category
                  ? "bg-emerald-950 text-cream-50 shadow-sm"
                  : "bg-white text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 border border-emerald-950/10"
              }`}
            >
              All Genres ({serializedArticles.length})
            </Link>

            {serializedCategories.map((cat) => {
              const catArticlesCount = serializedArticles.filter((a) => {
                const ac = a.category;
                return (
                  ac &&
                  (ac._id === cat._id ||
                    ac.id === cat.id ||
                    ac.slug?.toLowerCase() === cat.slug?.toLowerCase() ||
                    ac.name?.toLowerCase() === cat.name?.toLowerCase())
                );
              }).length;

              const isSelected =
                category?.toLowerCase() === cat.slug.toLowerCase() ||
                category?.toLowerCase() === cat.name.toLowerCase();

              return (
                <Link
                  key={cat._id || cat.id || cat.slug}
                  href={`/?category=${encodeURIComponent(cat.slug || cat.name)}`}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-950 text-cream-50 shadow-sm"
                      : "bg-white text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 border border-emerald-950/10"
                  }`}
                >
                  {cat.name}
                  {catArticlesCount > 0 && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-cream-50"
                          : "bg-emerald-950/10 text-emerald-950"
                      }`}
                    >
                      {catArticlesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* EMPTY STATE */}
        {categorySections.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-emerald-950/10 p-10 max-w-xl mx-auto shadow-sm">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 mb-3">
              The Library is Quiet...
            </h2>
            <p className="text-emerald-950/60 text-sm mb-8 leading-relaxed">
              {category
                ? `No published pieces currently found under "${category}". Explore other genres or submit your own story.`
                : "No published pieces currently available."}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 bg-emerald-950 text-cream-50 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all"
              >
                Browse All
              </Link>
              <Link
                href="/submit-piece"
                className="px-6 py-3 bg-white border border-emerald-950/15 text-emerald-950 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-950/5 transition-all"
              >
                + Write Piece
              </Link>
            </div>
          </div>
        ) : (
          /* MAIN CONTENT GRID & SIDEBAR */
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
            {/* MAIN ARTICLE SECTIONS */}
            <div className="lg:w-2/3 space-y-16">
              {categorySections.map(
                ({ category: cat, articles: catArticles }) => {
                  const catSlug =
                    cat.slug ||
                    cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

                  return (
                    <section
                      key={cat._id || cat.id || cat.slug}
                      className="space-y-6"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-emerald-950">
                              {category ? `${cat.name} Collection` : cat.name}
                            </h2>
                          </div>
                          {category && (
                            <p className="text-xs text-emerald-950/60 uppercase tracking-widest font-semibold mt-1">
                              Showing {catArticles.length}{" "}
                              {catArticles.length === 1 ? "piece" : "pieces"}
                            </p>
                          )}
                        </div>

                        {category ? (
                          <Link
                            href="/"
                            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-900/70 hover:text-emerald-950 transition-colors"
                          >
                            <span>← All Genres</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/?category=${encodeURIComponent(catSlug)}`}
                            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-900/70 hover:text-emerald-950 transition-colors"
                          >
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>

                      {/* Articles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {catArticles.map((article) => (
                          <ArticleCard
                            key={article._id || article.id}
                            article={article}
                          />
                        ))}
                      </div>
                    </section>
                  );
                },
              )}
            </div>

            {/* SIDEBAR */}
            <div className="lg:w-1/3">
              <Sidebar trendingArticles={serializedTrending} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
