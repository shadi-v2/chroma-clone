"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Loader,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import AdminArticleRecoverActions from "./AdminArticleRecoverActions";
import { DashboardArticle } from "@/types/dashboard";
import { useRouter } from "next/navigation";

type RecoverSortField = "deletedAt" | "title" | "author";
type SortDirection = "asc" | "desc";

interface Props {
  search?: string;
}

export default function AdminArticleRecover({ search: initialSearch = "" }: Props) {
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<RecoverSortField>("deletedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const router = useRouter();

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles/recovery");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchArticles();
  }, []);

  const handleRecover = async (id: string) => {
    try {
      await fetch(`/api/articles/recovery/${id}`, {
        method: "PATCH",
      });

      setArticles((prev) => prev.filter((article) => article._id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Permanently delete this article?");
    if (!confirmed) {
      return;
    }

    try {
      await fetch(`/api/articles/recovery/${id}`, {
        method: "DELETE",
      });

      setArticles((prev) => prev.filter((article) => article._id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSortToggle = (field: RecoverSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "deletedAt" ? "desc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSortField("deletedAt");
    setSortDirection("desc");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || typeFilter !== "all";

  const filteredAndSortedArticles = useMemo(() => {
    const result = articles.filter((article) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = article.title?.toLowerCase().includes(query);
        const authorMatch = `${article.author?.firstName || ""} ${article.author?.surname || ""}`
          .toLowerCase()
          .includes(query);
        if (!titleMatch && !authorMatch) return false;
      }

      // Type filter
      if (typeFilter === "deleted") {
        if (!article.deletedAt) return false;
      } else if (typeFilter === "draft") {
        if (article.deletedAt) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "author": {
          const nameA = `${a.author?.firstName || ""} ${a.author?.surname || ""}`;
          const nameB = `${b.author?.firstName || ""} ${b.author?.surname || ""}`;
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "deletedAt":
        default: {
          const dateA = new Date(a.deletedAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.deletedAt || b.updatedAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [articles, searchQuery, typeFilter, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-950/20" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border border-emerald-950/5 shadow-2xl overflow-hidden">
      {/* HEADER & FILTERS */}
      <div className="p-8 md:p-12 border-b border-emerald-950/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-emerald-950">
              Recovery Center
            </h2>
            <p className="text-emerald-950/40 text-sm mt-1">
              Recover soft-deleted pieces or permanently delete them from storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-950/40 bg-emerald-950/5 px-4 py-2 rounded-full">
              {filteredAndSortedArticles.length} of {articles.length} archived
            </span>
          </div>
        </div>

        {/* SEARCH & CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* SEARCH */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
            <input
              type="text"
              placeholder="Search archived articles by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
            />
          </div>

          {/* SORT SELECTOR */}
          <div>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-") as [RecoverSortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
              }}
              className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
            >
              <option value="deletedAt-desc">Sort: Deleted Recently</option>
              <option value="deletedAt-asc">Sort: Deleted Oldest</option>
              <option value="title-asc">Sort: Title (A-Z)</option>
              <option value="title-desc">Sort: Title (Z-A)</option>
              <option value="author-asc">Sort: Author (A-Z)</option>
            </select>
          </div>
        </div>

        {/* SUGGESTION FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/40 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Filter Suggestions:</span>
          </div>

          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              typeFilter === "all"
                ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
            }`}
          >
            All Archived ({articles.length})
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === "deleted" ? "all" : "deleted")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              typeFilter === "deleted"
                ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
            }`}
          >
            Deleted Items ({articles.filter((a) => a.deletedAt).length})
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === "draft" ? "all" : "draft")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              typeFilter === "draft"
                ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
            }`}
          >
            Draft Items ({articles.filter((a) => !a.deletedAt).length})
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 hover:text-red-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-emerald-950/5">
              <th
                onClick={() => handleSortToggle("title")}
                className="w-[40%] px-10 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Title</span>
                  {sortField === "title" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSortToggle("author")}
                className="w-[20%] px-6 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Author</span>
                  {sortField === "author" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                  )}
                </div>
              </th>

              <th className="w-[15%] px-6 py-6 text-center">
                Status
              </th>

              <th
                onClick={() => handleSortToggle("deletedAt")}
                className="w-[15%] px-6 py-6 text-center cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Deleted Date</span>
                  {sortField === "deletedAt" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                  )}
                </div>
              </th>

              <th className="w-[10%] px-10 py-6 text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-emerald-950/5">
            {filteredAndSortedArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-10 py-16 text-center text-emerald-950/40"
                >
                  <p className="font-serif text-lg font-medium text-emerald-950/60 mb-1">
                    No recovery pieces found
                  </p>
                  <p className="text-xs">No archived articles match your filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedArticles.map((article) => (
                <tr
                  key={article._id}
                  className="group hover:bg-emerald-700/5 transition-colors"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-950/5 relative shrink-0 border border-emerald-950/5">
                        <Image
                          src={article.thumbnail || "/placeholder.jpg"}
                          alt={article.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      <span className="font-serif font-bold text-lg text-emerald-950 truncate max-w-[300px]">
                        {article.title}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-xs text-emerald-950/70 font-medium">
                    {article.author.firstName} {article.author.surname}
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          article.deletedAt
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {article.deletedAt ? "Deleted" : "Draft"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-xs text-emerald-950/50 font-medium text-center">
                    {article.deletedAt
                      ? new Date(article.deletedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>

                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center">
                      <AdminArticleRecoverActions
                        articleId={article._id}
                        onRecover={handleRecover}
                        onDelete={handleDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="p-8 md:p-10 bg-emerald-950/2 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-emerald-950/5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-950/40">
          Showing {filteredAndSortedArticles.length} of {articles.length} archived articles
        </p>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-emerald-950 hover:underline cursor-pointer"
          >
            Clear applied filters
          </button>
        )}
      </div>
    </div>
  );
}
