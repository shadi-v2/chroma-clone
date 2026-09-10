"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  Heart,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PublicArticle } from "@/types/article";
import AgeBadge from "@/components/AgeBadge";

interface HeroProps {
  articles: PublicArticle[];
}

const Hero: React.FC<HeroProps> = ({ articles }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleNext = useCallback(() => {
    if (articles.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const handlePrev = useCallback(() => {
    if (articles.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  // Autoplay with hover pause
  useEffect(() => {
    if (articles.length <= 1 || isPaused) return;
    const timer = setInterval(handleNext, 7000);
    return () => clearInterval(timer);
  }, [handleNext, articles.length, isPaused]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const article = articles[currentIndex];

  if (!article) {
    return null;
  }

  const isLiked =
    !!user && article.likedBy?.some((id) => id.toString() === user._id);

  const handleExplore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/article/${article._id || article.id}`);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full rounded-3xl md:rounded-[3rem] overflow-hidden bg-emerald-950 text-white shadow-2xl border border-emerald-900/30 group select-none"
    >
      <div
        onClick={() => router.push(`/article/${article._id || article.id}`)}
        className="relative cursor-pointer transition-all duration-700"
      >
        {/* Editorial Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-emerald-950/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-emerald-950/30 z-10" />

        {/* IMAGE CAROUSEL WITH SMOOTH CROSSFADE */}
        <div className="relative w-full h-[32rem] sm:h-[36rem] md:h-[40rem] overflow-hidden">
          {articles.map((art, index) => (
            <div
              key={art._id || art.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                index === currentIndex
                  ? "opacity-60 group-hover:opacity-75 scale-100"
                  : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <Image
                src={art.thumbnail || "/placeholder.jpg"}
                alt={art.title}
                fill
                priority={index === 0}
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* CONTENT CANVAS */}
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 md:p-16 z-20">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase border border-white/20 text-cream-50 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Featured{" "}
              {typeof article.category === "string"
                ? article.category
                : article.category?.name}
            </span>

            {article.author?.dateOfBirth && (
              <AgeBadge
                dateOfBirth={article.author.dateOfBirth}
                age={article.author.age}
                className="bg-white/20 text-white border-white/30 backdrop-blur-md"
                showCategoryName
              />
            )}

            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-cream-50/70 uppercase tracking-[0.2em] font-semibold">
              <Clock className="w-3.5 h-3.5 text-cream-50/60" />
              <span>{article.readTime} read</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 sm:mb-6 max-w-4xl leading-tight sm:leading-none tracking-tight text-white drop-shadow-md">
            {article.title}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-cream-50/80 mb-6 max-w-3xl line-clamp-2 font-light leading-relaxed drop-shadow-sm">
            &quot;{article.excerpt}&quot;
          </p>

          {/* AUTHOR & ACTIONS BAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/15 pt-6 sm:pt-8 gap-4 sm:gap-6">
            {/* Author details */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {article.author.avatar ? (
                  <Image
                    src={article.author.avatar}
                    alt={article.author.firstName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full border-2 border-white/30 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-emerald-800 flex items-center justify-center font-serif font-bold text-white shadow-md">
                    {article.author.firstName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-emerald-950 rounded-full" />
              </div>

              <div>
                <span className="block text-[9px] text-cream-50/50 uppercase tracking-[0.2em] font-bold">
                  Curated Writer
                </span>
                <span className="block font-medium text-base sm:text-lg font-serif text-white">
                  {article.author.firstName} {article.author.surname}
                </span>
              </div>
            </div>

            {/* Metrics & Explore CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
              <div className="flex items-center gap-5 text-cream-50/70">
                <div className="flex items-center gap-1.5">
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isLiked
                        ? "text-red-400 fill-red-400"
                        : "text-cream-50/50"
                    }`}
                  />
                  <span className="font-bold text-sm text-white">
                    {article.likes}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-cream-50/70">
                  <Eye className="w-5 h-5 text-cream-50/50" />
                  <span className="font-bold text-sm text-white">
                    {article.reads || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={handleExplore}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-white text-emerald-950 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-cream-100 hover:shadow-xl transition-all hover:translate-x-1 active:scale-95 shadow-md shrink-0 cursor-pointer"
              >
                <span>Read Story</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ARROW CONTROLS */}
      {articles.length > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 z-30 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="p-3 sm:p-3.5 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto cursor-pointer border border-white/10"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="p-3 sm:p-3.5 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto cursor-pointer border border-white/10"
            aria-label="Next story"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* PROGRESS / PAGINATION PILLS */}
      {articles.length > 1 && (
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30 flex gap-2">
          {articles.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-8 bg-amber-400"
                  : "w-2.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
