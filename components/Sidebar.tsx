"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Plus, ChevronRight, Sparkles, BookOpen } from "lucide-react";

import type { PublicArticle } from "@/types/article";
import AgeBadge from "@/components/AgeBadge";
import NewsletterCard from "@/components/NewsletterCard";

interface SidebarProps {
  trendingArticles: PublicArticle[];
}

const Sidebar: React.FC<SidebarProps> = ({ trendingArticles }) => {
  const router = useRouter();

  const categories = [
    { name: "Stories", slug: "Story" },
    { name: "Poetry", slug: "Poetry" },
    { name: "Essays", slug: "Essays" },
    { name: "Reviews", slug: "Reviews" },
    { name: "Letters", slug: "Letters" },
    { name: "Translations", slug: "Translations" },
    { name: "Travelogues", slug: "Travelogues" },
  ];

  return (
    <aside className="space-y-10 lg:sticky lg:top-24">
      {/* NEWSLETTER CARD */}
      <NewsletterCard />

      {/* TRENDING NOW */}
      <section className="bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-emerald-950/8 shadow-xl shadow-emerald-950/5 relative overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-8 pb-4 border-b border-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-950/5 rounded-full flex items-center justify-center text-emerald-900">
              <TrendingUp className="w-4 h-4" />
            </div>

            <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.2em]">
              Trending Pieces
            </h2>
          </div>

          <Sparkles className="w-4 h-4 text-emerald-800" />
        </div>

        <div className="space-y-6">
          {trendingArticles.length > 0 ? (
            trendingArticles.map((article, index) => (
              <Link
                key={article._id || article.id}
                href={`/article/${article._id || article.id}`}
                className="group cursor-pointer flex gap-4 items-start"
              >
                <span className="text-3xl font-serif font-bold text-emerald-950/20 group-hover:text-emerald-800 transition-colors leading-none pt-0.5 shrink-0 w-8">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-800 transition-colors leading-snug mb-1.5 line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-emerald-950/50 uppercase tracking-wider font-semibold flex-wrap">
                    <span className="truncate max-w-[120px]">
                      {article.author.firstName} {article.author.surname}
                    </span>

                    {article.author?.dateOfBirth && (
                      <AgeBadge
                        dateOfBirth={article.author.dateOfBirth}
                        age={article.author.age}
                      />
                    )}

                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-emerald-950/40">
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <span>Stories are being curated</span>
            </div>
          )}
        </div>
      </section>

      {/* CREATIVE REALMS / CATEGORIES */}
      <section className="bg-emerald-950 p-8 rounded-3xl sm:rounded-[2.5rem] text-cream-50 overflow-hidden relative group shadow-2xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />

        <h2 className="text-xl font-serif font-bold mb-6 relative z-10">
          Creative Realms
        </h2>

        <ul className="space-y-3 relative z-10">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() =>
                  router.push(`/?category=${encodeURIComponent(cat.slug)}`)
                }
                className="flex items-center justify-between w-full px-2.5 py-1 rounded-xl text-sm font-medium hover:text-white transition-all cursor-pointer group/item text-left"
              >
                <span className="text-cream-50/70 group-hover/item:text-white group-hover/item:translate-x-1 transition-all duration-300">
                  {cat.name}
                </span>

                <ChevronRight className="w-4 h-4 text-cream-50/30 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* SHARE YOUR STORY CTA */}
      <section className="bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-emerald-950/8 shadow-xl shadow-emerald-950/5 relative overflow-hidden flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-emerald-950 text-cream-50 rounded-2xl flex items-center justify-center mb-6 shadow-md transform rotate-3 group-hover:rotate-0 transition-transform">
          <Plus className="w-6 h-6" />
        </div>

        <h3 className="text-2xl font-serif font-bold text-emerald-950 mb-3">
          Share Your Story
        </h3>

        <p className="text-emerald-950/60 text-xs sm:text-sm mb-6 leading-relaxed font-normal">
          Join our sanctuary of writers under 18. Have your words read, reviewed, and celebrated.
        </p>

        <Link
          href="/submit-piece"
          className="w-full py-3.5 bg-emerald-950 text-cream-50 flex items-center justify-center rounded-full font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all active:scale-95 shadow-md mb-3"
        >
          Submit Work
        </Link>

        <Link
          href="/submit"
          className="text-[10px] text-emerald-950/50 uppercase tracking-widest font-bold hover:text-emerald-950 transition-colors"
        >
          Guidelines & Rules
        </Link>
      </section>
    </aside>
  );
};

export default Sidebar;
