"use client";

import React, { useState } from "react";
import { ChevronDown, Loader2, Sparkles, BookOpen } from "lucide-react";
import type { PublicArticle } from "@/types/article";
import ArticleCard from "@/components/ArticleCard";

interface LatestArticlesFeedProps {
  initialArticles: PublicArticle[];
  totalArticles: number;
}

export default function LatestArticlesFeed({
  initialArticles,
  totalArticles,
}: LatestArticlesFeedProps) {
  const [articles, setArticles] = useState<PublicArticle[]>(initialArticles);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = articles.length < totalArticles;

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/articles?status=Published&page=${nextPage}&limit=6`,
      );
      if (!res.ok) {
        throw new Error("Failed to load more articles.");
      }

      const data = await res.json();
      const newArticles: PublicArticle[] = data.articles || [];

      if (newArticles.length > 0) {
        setArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a._id || a.id));
          const uniqueNew = newArticles.filter(
            (a) => !existingIds.has(a._id || a.id),
          );
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error("LOAD MORE ARTICLES ERROR:", err);
      setError("Unable to load more articles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-[2.5rem] border border-emerald-950/10 p-10 shadow-sm max-w-lg mx-auto">
        <BookOpen className="w-10 h-10 text-emerald-800 mx-auto mb-4 opacity-40" />
        <h3 className="text-xl font-serif font-bold text-emerald-950 mb-2">
          No Published Articles Yet
        </h3>
        <p className="text-xs text-emerald-950/60 leading-relaxed">
          Fresh literary works are currently being prepared by our authors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ARTICLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
        {articles.map((article) => (
          <div
            key={article._id || article.id}
            className="animate-in fade-in duration-300"
          >
            <ArticleCard article={article} />
          </div>
        ))}
      </div>

      {/* ERROR NOTICE IF ANY */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl text-center border border-red-200">
          {error}
        </div>
      )}

      {/* LOAD MORE BUTTON / END OF FEED */}
      {hasMore ? (
        <div className="pt-6 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="group px-8 py-4 bg-emerald-950 text-cream-50 hover:bg-emerald-900 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/15 flex items-center gap-3 cursor-pointer disabled:opacity-60 hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cream-50" />
                <span>Fetching Next Stories...</span>
              </>
            ) : (
              <>
                <span>Show More Articles</span>
                <ChevronDown className="w-4 h-4 text-cream-50 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
          <p className="text-[11px] text-emerald-950/40 uppercase tracking-widest font-semibold mt-3">
            Showing {articles.length} of {totalArticles} published pieces
          </p>
        </div>
      ) : (
        <div className="pt-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-950/5 text-emerald-950/70 text-[11px] font-bold uppercase tracking-widest border border-emerald-950/10">
            <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
            <span>You have reached the end of the current edition archives</span>
          </div>
        </div>
      )}
    </div>
  );
}
