import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    getTrendingArticles(3),
  ]);

  const articles = articlesResult.articles;

  // EMPTY STATE
  if (articles.length === 0) {
    return (
      <div className="min-h-screen py-32 flex flex-col items-center justify-center bg-cream-50 text-center px-4">
        <h2 className="text-4xl font-serif font-bold text-emerald-950 mb-4">
          The Library is Quiet...
        </h2>

        <p className="text-emerald-950/60 font-bold mb-12 max-w-md italic uppercase tracking-widest text-xs">
          {category
            ? `No masterpieces have been published under "${category}" yet.`
            : "Currently, no masterpieces have been published."}
        </p>

        {category && (
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-950 text-cream-50 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all"
          >
            ← Back to All Categories
          </Link>
        )}
      </div>
    );
  }

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
          articles: catArticles.slice(0, 2), // Show 2 articles per category on default home page
        };
      })
      .filter((section) => section.articles.length > 0);
  }

  return (
    <div className="font-sans">
      <main className="container mx-auto px-4 py-12 md:py-8">
        {/* HERO */}
        {!category && serializedArticles.length > 0 && (
          <div className="mb-24 md:mb-32">
            <Hero articles={serializedArticles.slice(0, 3)} />
          </div>
        )}

        {/* CONTENT */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-15">
          {/* MAIN */}
          <div className="lg:w-2/3 space-y-20">
            {categorySections.map(({ category: cat, articles: catArticles }) => {
              const catSlug =
                cat.slug ||
                cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

              return (
                <section
                  key={cat._id || cat.id || cat.slug}
                  className="space-y-8"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-emerald-950">
                          {category ? `${cat.name} Collection` : cat.name}
                        </h2>
                      </div>
                      {category && (
                        <p className="text-xs text-emerald-950/60 uppercase tracking-widest font-semibold mt-1">
                          Showing all {catArticles.length} {catArticles.length === 1 ? "piece" : "pieces"}
                        </p>
                      )}
                      <div className="h-1 w-16 bg-emerald-950 rounded-full mt-2" />
                    </div>

                    {category ? (
                      <Link
                        href="/"
                        className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-900/70 hover:text-emerald-950 transition-colors"
                      >
                        <span>← All Categories</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/?category=${encodeURIComponent(catSlug)}`}
                        className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-900/70 hover:text-emerald-950 transition-colors"
                      >
                        <span>Explore {cat.name}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    {catArticles.map((article) => (
                      <ArticleCard
                        key={article._id || article.id}
                        article={article}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
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
