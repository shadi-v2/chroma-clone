"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { api } from "@/services/api";
import type { PublicArticle } from "@/types/article";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
}: QuickSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearching(false);
        setSearchQuery("");
        setSearchResults([]);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          setIsSearching(true);
          const data = await api.articles.search(searchQuery.trim());
          setSearchResults(data.articles || []);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col overflow-hidden bg-white animate-in fade-in duration-200">
      <div className="container mx-auto px-4 h-full flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center py-8">
          <Link href="/" onClick={handleClose} className="flex items-center">
            <Image
              src="/logo.png"
              alt="Chroma Diaries"
              width={120}
              height={40}
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>

          <button
            onClick={handleClose}
            className="group p-4 bg-emerald-950/5 hover:bg-emerald-950 rounded-full transition-all duration-300 cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-6 h-6 text-emerald-950 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="max-w-4xl mx-auto w-full pt-12 md:pt-16 flex-1 flex flex-col min-h-0">
          {/* INPUT */}
          <div className="relative group mb-12">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 text-emerald-950/20 group-focus-within:text-emerald-950 transition-colors" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Ask anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-emerald-950/10 focus:border-emerald-950 py-6 md:py-8 pl-14 md:pl-18 text-2xl md:text-5xl font-serif outline-none transition-all placeholder:text-emerald-950/10 text-emerald-950"
            />
          </div>

          {/* RESULTS */}
          <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
            {searchQuery.trim() === "" ? (
              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-950/40">
                    Suggested for you
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {[
                      "Literary Essays",
                      "Historical Fiction",
                      "Poetry",
                      "Travelogues",
                      "Book Reviews",
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-6 md:px-8 py-3 md:py-4 border border-emerald-950/10 hover:border-emerald-950 hover:bg-emerald-950 hover:text-cream-50 rounded-full text-xs md:text-sm font-bold transition-all text-emerald-950/60 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 border-4 border-emerald-950/10 border-t-emerald-950 rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-12">
                <div className="flex items-center justify-between border-b border-emerald-950/5 pb-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-950/40">
                    {searchResults.length}{" "}
                    {searchResults.length === 1 ? "Result" : "Results"} found
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {searchResults.map((article) => {
                    const catName =
                      typeof article.category === "string"
                        ? article.category
                        : article.category?.name || "General";
                    const authorName = article.author
                      ? `${article.author.firstName} ${article.author.surname}`
                      : "Chroma Author";
                    const artId = article._id || article.id;
                    return (
                      <Link
                        key={artId}
                        href={`/article/${artId}`}
                        onClick={handleClose}
                        className="group flex gap-8 md:gap-12 items-center justify-between border-b border-emerald-950/5 pb-12 last:border-0"
                      >
                        <div className="flex-1 space-y-5">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full">
                              {catName}
                            </span>

                            <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest">
                              {article.readTime || "5 min"} read
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-2xl md:text-4xl text-emerald-950 leading-[1.2] group-hover:text-emerald-700 transition-colors">
                            {article.title}
                          </h4>

                          <p className="text-sm text-emerald-950/50 flex items-center gap-2">
                            <span>written by</span>

                            <span className="font-bold text-emerald-950/80">
                              {authorName}
                            </span>
                          </p>
                        </div>

                        <div className="w-24 h-24 md:w-48 md:h-48 shrink-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-emerald-950/5 shadow-2xl group-hover:shadow-emerald-950/20 transition-all border border-emerald-950/5 relative">
                          <Image
                            src={article.thumbnail || "/placeholder.jpg"}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-32 space-y-6">
                <p className="text-emerald-950/20 font-serif italic text-3xl">
                  Searching for something else?
                </p>

                <p className="text-emerald-950/40 font-bold uppercase tracking-[0.2em] text-xs">
                  No matches found for {searchQuery}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
