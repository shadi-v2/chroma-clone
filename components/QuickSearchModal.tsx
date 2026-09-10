"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Loader2,
  Tag,
} from "lucide-react";
import type { PublicArticle } from "@/types/article";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
}: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const quickCategories = [
    { name: "Stories", slug: "Story" },
    { name: "Poetry", slug: "Poetry" },
    { name: "Essays", slug: "Essays" },
    { name: "Reviews", slug: "Reviews" },
    { name: "Letters", slug: "Letters" },
    { name: "Translations", slug: "Translations" },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCloseModal = useCallback(() => {
    setQuery("");
    setResults([]);
    onClose();
  }, [onClose]);

  const searchArticles = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/articles/search?query=${encodeURIComponent(q.trim())}&limit=6`,
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.articles || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(0);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!val.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchArticles(val);
    }, 280);
  };

  const handleSelectArticle = (articleId: string) => {
    handleCloseModal();
    router.push(`/article/${articleId}`);
  };

  const handleSelectCategory = (catSlug: string) => {
    handleCloseModal();
    router.push(`/?category=${encodeURIComponent(catSlug)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseModal();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectArticle(results[selectedIndex]._id || results[selectedIndex].id || "");
      } else if (query.trim()) {
        handleCloseModal();
        router.push(`/?category=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-950/10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-emerald-950/10 bg-cream-50/50">
          <Search className="w-5 h-5 text-emerald-950/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search stories, poems, essays, authors, or topics..."
            className="w-full bg-transparent text-emerald-950 text-base sm:text-lg font-medium placeholder-emerald-950/40 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-emerald-800 animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-emerald-950/40 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/5 text-emerald-950/40 border border-emerald-950/10 hidden sm:inline-block">
              ESC
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Active Search Results */}
          {results.length > 0 ? (
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 block">
                Found Pieces ({results.length})
              </span>
              <div className="space-y-2">
                {results.map((art, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={art._id || art.id}
                      onClick={() => handleSelectArticle(art._id || art.id || "")}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-950 text-cream-50 shadow-md"
                          : "hover:bg-emerald-950/5 text-emerald-950"
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-emerald-950/10">
                        <Image
                          src={art.thumbnail || "/placeholder.jpg"}
                          alt={art.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white/20 text-cream-50"
                                : "bg-emerald-950/10 text-emerald-950"
                            }`}
                          >
                            {typeof art.category === "string"
                              ? art.category
                              : art.category?.name}
                          </span>
                          <span
                            className={`text-[10px] flex items-center gap-1 ${
                              isSelected ? "text-cream-50/60" : "text-emerald-950/40"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {art.readTime}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm sm:text-base leading-snug line-clamp-1 truncate">
                          {art.title}
                        </h4>

                        <p
                          className={`text-xs truncate ${
                            isSelected ? "text-cream-50/70" : "text-emerald-950/60"
                          }`}
                        >
                          By {art.author.firstName} {art.author.surname}
                        </p>
                      </div>

                      <ArrowRight
                        className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform shrink-0 ${
                          isSelected ? "text-amber-400" : "text-emerald-950/30"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="py-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-emerald-950/20 mx-auto" />
              <h4 className="text-lg font-serif font-bold text-emerald-950">
                No matching articles found
              </h4>
              <p className="text-xs text-emerald-950/50 max-w-sm mx-auto">
                We couldn&apos;t find any published piece matching &quot;{query}&quot;. Try searching for a different keyword or category.
              </p>
            </div>
          ) : null}

          {/* Quick Categories & Topics */}
          {!query && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Explore Creative Realms</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {quickCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleSelectCategory(cat.slug)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950 border border-emerald-950/5 transition-all text-xs font-bold group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 opacity-60" />
                      <span>{cat.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-emerald-950/5 bg-cream-50/50 flex items-center justify-between text-[11px] text-emerald-950/50">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-emerald-950/5 border border-emerald-950/10 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-emerald-950/5 border border-emerald-950/10 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              to select
            </span>
          </div>
          <span>Chroma Diaries Search</span>
        </div>
      </div>
    </div>
  );
}
