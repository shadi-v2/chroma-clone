"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Search,
  Check,
  Loader2,
  Sparkles,
  RotateCcw,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { DashboardArticle } from "@/types/dashboard";
import { api } from "@/services/api";

export default function AdminArticleReorderDesk() {
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyPublished, setOnlyPublished] = useState(true);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Track if changes have been made since last save
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.articles.list({ status: "all" });
      const fetched: DashboardArticle[] = Array.isArray(data)
        ? data
        : data.articles || [];

      // Sort by position ASC (nulls last), then updatedAt DESC
      fetched.sort((a, b) => {
        const posA =
          a.position !== null && a.position !== undefined && a.position > 0
            ? a.position
            : 999999;
        const posB =
          b.position !== null && b.position !== undefined && b.position > 0
            ? b.position
            : 999999;

        if (posA !== posB) return posA - posB;
        return (
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
      });

      setArticles(fetched);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to load articles for reordering:", error);
      setErrorMessage("Failed to load articles. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // Categories list for filter
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => {
      if (a.category?.name) cats.add(a.category.name);
    });
    return Array.from(cats);
  }, [articles]);

  // Displayed articles list based on active filters
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (onlyPublished && article.status !== "Published") {
        return false;
      }

      if (selectedCategory !== "all") {
        if (
          article.category?.name?.toLowerCase() !==
          selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = article.title?.toLowerCase().includes(q);
        const authorMatch = `${article.author?.firstName || ""} ${article.author?.surname || ""}`
          .toLowerCase()
          .includes(q);
        const catMatch = article.category?.name?.toLowerCase().includes(q);
        if (!titleMatch && !authorMatch && !catMatch) return false;
      }

      return true;
    });
  }, [articles, onlyPublished, selectedCategory, searchQuery]);

  // Reorder in full array helper
  const reorderArray = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setArticles((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);

      // Re-index all articles with sequential positions
      return updated.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
    });
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Map filtered indices to main articles array
    const sourceArticle = filteredArticles[draggedIndex];
    const targetArticle = filteredArticles[targetIndex];

    if (!sourceArticle || !targetArticle) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const actualFrom = articles.findIndex((a) => a._id === sourceArticle._id);
    const actualTo = articles.findIndex((a) => a._id === targetArticle._id);

    if (actualFrom !== -1 && actualTo !== -1) {
      reorderArray(actualFrom, actualTo);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Button move actions
  const moveUp = (articleId: string) => {
    const idx = articles.findIndex((a) => a._id === articleId);
    if (idx <= 0) return;
    reorderArray(idx, idx - 1);
  };

  const moveDown = (articleId: string) => {
    const idx = articles.findIndex((a) => a._id === articleId);
    if (idx === -1 || idx >= articles.length - 1) return;
    reorderArray(idx, idx + 1);
  };

  const moveToTop = (articleId: string) => {
    const idx = articles.findIndex((a) => a._id === articleId);
    if (idx <= 0) return;
    reorderArray(idx, 0);
  };

  const moveToBottom = (articleId: string) => {
    const idx = articles.findIndex((a) => a._id === articleId);
    if (idx === -1 || idx === articles.length - 1) return;
    reorderArray(idx, articles.length - 1);
  };

  // Reset to default latest updated/created order
  const handleResetToLatest = () => {
    setArticles((prev) => {
      const sorted = [...prev].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      );
      return sorted.map((item) => ({
        ...item,
        position: null,
      }));
    });
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Auto sequence: 1, 2, 3...
  const handleAutoSequence = () => {
    setArticles((prev) =>
      prev.map((item, idx) => ({
        ...item,
        position: idx + 1,
      })),
    );
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Save changes to API
  const handleSaveOrder = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const positionsPayload = articles.map((article, index) => ({
        id: article._id,
        position: article.position !== null ? index + 1 : null,
      }));

      await api.articles.reorder(positionsPayload);

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save article ordering:", err);
      setErrorMessage("Failed to save article order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[3rem] border border-emerald-950/5">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-950/30 mb-3" />
        <p className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest">
          Loading articles for showcase ordering...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border border-emerald-950/5 shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="p-8 md:p-12 border-b border-emerald-950/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 rounded-xl bg-emerald-950 text-cream-50">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-3xl font-serif font-bold text-emerald-950">
                Public Showcase Order
              </h2>
            </div>
            <p className="text-emerald-950/50 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Drag & drop any article to set the exact visual hierarchy on the public frontpage.
              Positions #1 to #4 appear in the Hero showcase, followed by the latest article dispatches.
            </p>
          </div>

          {/* SAVE & ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAutoSequence}
              className="px-4 py-3 bg-cream-50 hover:bg-emerald-950/10 text-emerald-950 rounded-2xl text-xs font-bold transition-all border border-emerald-950/10 cursor-pointer shadow-xs active:scale-95"
              title="Number all articles sequentially 1..N"
            >
              Auto-Number 1..N
            </button>

            <button
              type="button"
              onClick={handleResetToLatest}
              className="px-4 py-3 bg-cream-50 hover:bg-emerald-950/10 text-emerald-950/70 hover:text-emerald-950 rounded-2xl text-xs font-bold transition-all border border-emerald-950/10 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              title="Reset order to latest publication dates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Latest</span>
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95 ${
                hasUnsavedChanges
                  ? "bg-emerald-950 hover:bg-emerald-900 text-cream-50 shadow-emerald-950/20"
                  : "bg-emerald-950/10 text-emerald-950/40 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cream-50" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Order Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{hasUnsavedChanges ? "Save Public Order" : "Order Synced"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {hasUnsavedChanges && (
          <div className="p-3 bg-emerald-950 text-cream-50 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>You have unsaved article order changes. Remember to click &quot;Save Public Order&quot; above.</span>
            </div>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="px-3 py-1 bg-white text-emerald-950 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-cream-50 transition-colors cursor-pointer"
            >
              Save Now
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* SEARCH */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
            <input
              type="text"
              placeholder="Search title, author, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* PUBLISHED ONLY TOGGLE */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOnlyPublished((prev) => !prev)}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                onlyPublished
                  ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                  : "bg-cream-50 text-emerald-950/70 border-emerald-950/10 hover:bg-emerald-950/5"
              }`}
            >
              {onlyPublished ? "Showing Published Works" : "Showing All Statuses"}
            </button>
          </div>
        </div>
      </div>

      {/* DRAGGABLE ARTICLES LIST */}
      <div className="p-6 md:p-10 space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="p-16 text-center bg-cream-50 rounded-[2rem] border border-emerald-950/10">
            <BookOpen className="w-10 h-10 text-emerald-800 mx-auto mb-3 opacity-40" />
            <h3 className="font-serif font-bold text-lg text-emerald-950 mb-1">
              No articles match current filters
            </h3>
            <p className="text-xs text-emerald-950/50">
              Try resetting your search or category filter.
            </p>
          </div>
        ) : (
          filteredArticles.map((article, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const positionNumber = index + 1;

            // Helper tag for prominent slots
            let showcaseTag = "";
            if (positionNumber === 1) showcaseTag = "Frontpage Hero Lead";
            else if (positionNumber === 2) showcaseTag = "Hero Featured #2";
            else if (positionNumber === 3) showcaseTag = "Hero Featured #3";
            else if (positionNumber === 4) showcaseTag = "Hero Featured #4";
            else if (positionNumber <= 6) showcaseTag = "Primary Feed";

            return (
              <div
                key={article._id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                  isDragging
                    ? "opacity-30 border-dashed border-emerald-950 bg-cream-50"
                    : isDragOver
                      ? "border-emerald-950 bg-emerald-50 scale-[1.01] shadow-lg ring-2 ring-emerald-950/20"
                      : "bg-white border-emerald-950/10 hover:border-emerald-950/30 hover:bg-cream-50/50 shadow-xs"
                }`}
              >
                {/* LEFT: DRAG HANDLE + POSITION BADGE + THUMBNAIL + DETAILS */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* DRAG HANDLE */}
                  <div
                    className="p-1.5 rounded-lg text-emerald-950/30 group-hover:text-emerald-950 transition-colors shrink-0"
                    title="Drag to reposition"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* POSITION BADGE */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div
                      className={`w-10 h-10 rounded-2xl font-serif font-bold text-sm flex items-center justify-center shadow-xs transition-colors ${
                        positionNumber <= 4
                          ? "bg-emerald-950 text-cream-50 ring-2 ring-emerald-950/20"
                          : "bg-emerald-950/5 text-emerald-950"
                      }`}
                    >
                      #{positionNumber}
                    </div>
                  </div>

                  {/* THUMBNAIL */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-950/5 relative shrink-0 border border-emerald-950/10 shadow-xs">
                    <Image
                      src={article.thumbnail || "/placeholder.jpg"}
                      alt={article.title}
                      fill
                      sizes="56px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* TITLE & META */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {showcaseTag && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            positionNumber <= 4
                              ? "bg-emerald-950 text-cream-50"
                              : "bg-emerald-950/10 text-emerald-950"
                          }`}
                        >
                          {showcaseTag}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950/50 bg-emerald-950/5 px-2.5 py-0.5 rounded-full">
                        {article.category?.name || "General"}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          article.status === "Published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {article.status}
                      </span>
                    </div>

                    <Link
                      href={`/article/${article._id}`}
                      target="_blank"
                      className="font-serif font-bold text-base text-emerald-950 hover:text-emerald-700 truncate block transition-colors group-hover:underline"
                    >
                      {article.title}
                    </Link>

                    <p className="text-[11px] text-emerald-950/50 truncate mt-0.5">
                      By {article.author?.firstName} {article.author?.surname} •{" "}
                      {article.reads || 0} reads • {article.likes || 0} likes
                    </p>
                  </div>
                </div>

                {/* RIGHT: POSITION SHIFT BUTTONS */}
                <div
                  className="flex items-center gap-1.5 self-end sm:self-center shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => moveToTop(article._id)}
                    disabled={index === 0}
                    className="p-2 rounded-xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950 border border-emerald-950/10 transition-colors disabled:opacity-20 cursor-pointer"
                    title="Move to Top (#1)"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveUp(article._id)}
                    disabled={index === 0}
                    className="p-2 rounded-xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950 border border-emerald-950/10 transition-colors disabled:opacity-20 cursor-pointer"
                    title="Move Up 1 Position"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveDown(article._id)}
                    disabled={index === filteredArticles.length - 1}
                    className="p-2 rounded-xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950 border border-emerald-950/10 transition-colors disabled:opacity-20 cursor-pointer"
                    title="Move Down 1 Position"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveToBottom(article._id)}
                    disabled={index === filteredArticles.length - 1}
                    className="p-2 rounded-xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950 border border-emerald-950/10 transition-colors disabled:opacity-20 cursor-pointer"
                    title="Move to Bottom"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href={`/article/${article._id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-cream-50 hover:bg-emerald-950 hover:text-cream-50 text-emerald-950/60 transition-colors border border-emerald-950/10"
                    title="View live article"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="p-8 md:p-10 bg-emerald-950/2 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-emerald-950/5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-950/40">
          Showing {filteredArticles.length} of {articles.length} articles • Grab and drag to re-order
        </p>

        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Save Public Order
          </button>
        )}
      </div>
    </div>
  );
}
