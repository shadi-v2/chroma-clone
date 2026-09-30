"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  Check,
  Search,
  BookOpen,
} from "lucide-react";
import { DashboardArticle } from "@/types/dashboard";
import { api } from "@/services/api";

interface AdminPublicOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: DashboardArticle[];
  onOrderSaved: (updatedArticles: DashboardArticle[]) => void;
}

export default function AdminPublicOrderModal({
  isOpen,
  onClose,
  articles,
  onOrderSaved,
}: AdminPublicOrderModalProps) {
  // Ordered articles list (only articles with explicit position, sorted by position)
  const [orderedArticles, setOrderedArticles] = useState<DashboardArticle[]>([]);
  const [unpinnedSearch, setUnpinnedSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Filter articles with positions
      const positioned = articles
        .filter((a) => a.position !== null && a.position !== undefined && a.position > 0)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      setOrderedArticles(positioned);
      setSaveSuccess(false);
    }
  }, [isOpen, articles]);

  if (!isOpen) return null;

  // Published articles that are NOT currently in the ordered list
  const orderedIds = new Set(orderedArticles.map((a) => a._id));
  const availablePublished = articles.filter(
    (a) =>
      a.status === "Published" &&
      !orderedIds.has(a._id) &&
      (unpinnedSearch.trim() === "" ||
        a.title.toLowerCase().includes(unpinnedSearch.toLowerCase()) ||
        `${a.author?.firstName || ""} ${a.author?.surname || ""}`
          .toLowerCase()
          .includes(unpinnedSearch.toLowerCase())),
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOrderedArticles((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === orderedArticles.length - 1) return;
    setOrderedArticles((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const removePosition = (index: number) => {
    setOrderedArticles((prev) => prev.filter((_, i) => i !== index));
  };

  const addArticleToOrder = (article: DashboardArticle) => {
    setOrderedArticles((prev) => [...prev, article]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Create positions array
      // 1. Articles in orderedArticles get position: 1, 2, 3...
      const updates: { id: string; position: number | null }[] = orderedArticles.map(
        (article, index) => ({
          id: article._id,
          position: index + 1,
        }),
      );

      // 2. Articles that previously had position but were removed now get position: null
      articles.forEach((a) => {
        if (
          a.position !== null &&
          a.position !== undefined &&
          !orderedArticles.some((oa) => oa._id === a._id)
        ) {
          updates.push({ id: a._id, position: null });
        }
      });

      await api.articles.reorder(updates);

      // Update local copy
      const updatedMap = new Map<string, number | null>();
      updates.forEach((u) => updatedMap.set(u.id, u.position));

      const updatedList = articles.map((a) => {
        if (updatedMap.has(a._id)) {
          return { ...a, position: updatedMap.get(a._id) };
        }
        return a;
      });

      onOrderSaved(updatedList);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      console.error("Failed to save public article order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] border border-emerald-950/10 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-6 sm:p-8 bg-emerald-950 text-cream-50 flex items-center justify-between border-b border-emerald-900">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cream-50/80" />
              <h2 className="text-2xl font-serif font-bold text-cream-50">
                Public Page Order & Showcase
              </h2>
            </div>
            <p className="text-cream-50/70 text-xs sm:text-sm mt-1">
              Arrange the exact sequence of articles showcased on the public home page and hero carousel.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-emerald-900 text-cream-50/70 hover:text-cream-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: ORDERED SHOWCASE LIST (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-emerald-950">
                Positioned Feed ({orderedArticles.length})
              </h3>
              <span className="text-[11px] font-bold text-emerald-950/50 uppercase tracking-wider">
                Position 1 = Frontpage Hero
              </span>
            </div>

            {orderedArticles.length === 0 ? (
              <div className="p-8 text-center bg-cream-50 rounded-2xl border border-dashed border-emerald-950/15">
                <BookOpen className="w-8 h-8 text-emerald-800 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-emerald-950/60">
                  No articles explicitly positioned.
                </p>
                <p className="text-[11px] text-emerald-950/40 mt-1">
                  Articles on the public page currently appear in default latest order. Select articles from the right to pin specific positions.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orderedArticles.map((article, index) => (
                  <div
                    key={article._id}
                    className="flex items-center gap-3 p-3 bg-cream-50 border border-emerald-950/10 rounded-2xl hover:border-emerald-950/20 transition-all"
                  >
                    {/* POSITION BADGE */}
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 text-cream-50 font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      #{index + 1}
                    </div>

                    {/* THUMBNAIL */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-950/10 relative shrink-0 border border-emerald-950/10">
                      <Image
                        src={article.thumbnail || "/placeholder.jpg"}
                        alt={article.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    {/* TITLE & AUTHOR */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-950 truncate">
                        {article.title}
                      </p>
                      <p className="text-[10px] text-emerald-950/50 truncate">
                        {article.author?.firstName} {article.author?.surname} • {article.category?.name || "General"}
                      </p>
                    </div>

                    {/* CONTROLS */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white border border-emerald-950/10 text-emerald-950 hover:bg-emerald-950 hover:text-cream-50 transition-colors disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === orderedArticles.length - 1}
                        className="p-1.5 rounded-lg bg-white border border-emerald-950/10 text-emerald-950 hover:bg-emerald-950 hover:text-cream-50 transition-colors disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePosition(index)}
                        className="p-1.5 rounded-lg bg-white border border-emerald-950/10 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer ml-1"
                        title="Remove Position (Auto Order)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: AVAILABLE PUBLISHED ARTICLES (5 COLS) */}
          <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-emerald-950/10 lg:pl-8 pt-6 lg:pt-0">
            <h3 className="font-serif font-bold text-lg text-emerald-950">
              Add Published Piece
            </h3>

            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-950/30" />
              <input
                type="text"
                placeholder="Search published pieces..."
                value={unpinnedSearch}
                onChange={(e) => setUnpinnedSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-emerald-950/10 rounded-xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-1 focus:ring-emerald-950/20"
              />
            </div>

            {/* LIST */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {availablePublished.length === 0 ? (
                <p className="text-xs text-center text-emerald-950/40 py-6">
                  {unpinnedSearch ? "No matching published articles" : "All published articles are in the ordered list."}
                </p>
              ) : (
                availablePublished.map((article) => (
                  <div
                    key={article._id}
                    className="flex items-center justify-between gap-2 p-2.5 bg-white border border-emerald-950/5 hover:border-emerald-950/15 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-emerald-950/5 relative shrink-0">
                        <Image
                          src={article.thumbnail || "/placeholder.jpg"}
                          alt={article.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-950 truncate max-w-[150px]">
                          {article.title}
                        </p>
                        <p className="text-[10px] text-emerald-950/40 truncate">
                          {article.author?.firstName} {article.author?.surname}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addArticleToOrder(article)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-cream-50 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Pin</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 bg-cream-50 border-t border-emerald-950/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOrderedArticles([])}
            disabled={orderedArticles.length === 0 || isSaving}
            className="text-xs font-bold text-red-700 hover:underline disabled:opacity-30 cursor-pointer"
          >
            Clear All Positions
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-emerald-950/10 text-emerald-950 text-xs font-bold hover:bg-emerald-950/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-cream-50 text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Order...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cream-50" />
                  <span>Order Saved!</span>
                </>
              ) : (
                <span>Save Public Order</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
