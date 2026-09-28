"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardArticle } from "@/types/dashboard";
import type { ArticleStatus } from "@/types/article";
import { api } from "@/services/api";

import AdminArticleActions from "./AdminArticleActions";
import {
  Edit,
  Loader,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PublicUser } from "@/types/user";

export const allStatusOptions: ArticleStatus[] = [
  "Draft",
  "Pending",
  "Editing",
  "Edited",
  "Published",
  "Paused",
];

const editorStatusOptions: ArticleStatus[] = ["Editing", "Edited"];

export const statusBadgeClass = (status: ArticleStatus) => {
  switch (status) {
    case "Published":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Paused":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Editing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Edited":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "Pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Draft":
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
};

type SortField =
  | "updatedAt"
  | "createdAt"
  | "title"
  | "author"
  | "status"
  | "reads"
  | "likes";

type SortDirection = "asc" | "desc";

interface AdminArticleManagementProps {
  search?: string;
  currentUser?: {
    _id: string;
    firstName: string;
    surname: string;
    role: string;
  };
}

export default function AdminArticleManagement({
  search: initialSearch = "",
  currentUser,
}: AdminArticleManagementProps) {
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [editors, setEditors] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingArticleId, setUpdatingArticleId] = useState<string | null>(
    null,
  );

  // Filters state
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEditor, setSelectedEditor] = useState<string>("all");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const isEditor = currentUser?.role === "Editor";

  useEffect(() => {
    const fetchArticlesAndEditors = async () => {
      try {
        const articlesPromise = api.articles.list({ status: "all" });
        const usersPromise = isEditor
          ? Promise.resolve([])
          : api.users.listByRole("Editor");

        const [articlesData, usersData] = await Promise.all([
          articlesPromise,
          usersPromise,
        ]);

        const fetchedArticles = Array.isArray(articlesData)
          ? articlesData
          : articlesData.articles || [];

        setArticles(fetchedArticles);

        setEditors(
          usersData.filter(
            (u) => u.email?.toLowerCase() !== "shahinshadi1122@gmail.com",
          ),
        );
      } catch (error) {
        console.error("Failed to fetch articles and editors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticlesAndEditors();
  }, [isEditor]);

  // Extract unique categories from loaded articles
  const availableCategories = useMemo(() => {
    const categoriesMap = new Map<string, string>();
    articles.forEach((a) => {
      if (a.category?.name) {
        categoriesMap.set(a.category.name, a.category.name);
      }
    });
    return Array.from(categoriesMap.values());
  }, [articles]);

  const updateArticle = async (
    articleId: string,
    payload: { status?: ArticleStatus; assignedEditor?: string | null },
  ) => {
    setUpdatingArticleId(articleId);

    try {
      const updatedArticle = await api.articles.updateStatus(
        articleId,
        payload,
      );

      setArticles((prev) =>
        prev.map((article) =>
          article._id === articleId
            ? { ...article, ...updatedArticle }
            : article,
        ),
      );
    } catch (error) {
      console.error("Failed to update article:", error);
    } finally {
      setUpdatingArticleId(null);
    }
  };

  const handleAssignEditor = async (articleId: string, editorId: string) => {
    await updateArticle(articleId, {
      assignedEditor: editorId || null,
      status: editorId ? "Editing" : "Pending",
    });
  };

  const handleStatusChange = async (
    articleId: string,
    status: ArticleStatus,
  ) => {
    await updateArticle(articleId, { status });
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "title" || field === "author" ? "asc" : "desc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSelectedEditor("all");
    setSortField("updatedAt");
    setSortDirection("desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedCategory !== "all" ||
    selectedEditor !== "all";

  // Filter and sort articles
  const filteredAndSortedArticles = useMemo(() => {
    const result = articles.filter((article) => {
      // Role editor view restriction
      if (isEditor) {
        const editorId =
          typeof article.assignedEditor === "string"
            ? article.assignedEditor
            : article.assignedEditor?._id;
        if (
          String(editorId) !== String(currentUser?._id) ||
          article.status === "Published"
        ) {
          return false;
        }
      }

      // Search keyword
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = article.title?.toLowerCase().includes(query);
        const authorMatch = `${article.author?.firstName || ""} ${article.author?.surname || ""}`
          .toLowerCase()
          .includes(query);
        const categoryMatch = article.category?.name?.toLowerCase().includes(query);
        const tagsMatch = article.tags?.some((t) => t.toLowerCase().includes(query));

        if (!titleMatch && !authorMatch && !categoryMatch && !tagsMatch) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "all") {
        if (article.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (article.category?.name?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Editor filter
      if (selectedEditor !== "all") {
        const currentEditorId =
          typeof article.assignedEditor === "string"
            ? article.assignedEditor
            : article.assignedEditor?._id;

        if (selectedEditor === "unassigned") {
          if (currentEditorId) return false;
        } else {
          if (String(currentEditorId) !== String(selectedEditor)) return false;
        }
      }

      return true;
    });

    // Sorting
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
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        case "reads":
          comparison = (a.reads || 0) - (b.reads || 0);
          break;
        case "likes":
          comparison = (a.likes || 0) - (b.likes || 0);
          break;
        case "createdAt": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
        case "updatedAt":
        default: {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    articles,
    isEditor,
    currentUser?._id,
    searchQuery,
    selectedStatus,
    selectedCategory,
    selectedEditor,
    sortField,
    sortDirection,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-950/20" />
      </div>
    );
  }

  // Filter suggestion options
  const filterSuggestions: Array<{
    label: string;
    type: "status" | "editor" | "category";
    value: string;
    count?: number;
  }> = [
    {
      label: "Status: Pending",
      type: "status",
      value: "Pending",
      count: articles.filter((a) => a.status === "Pending").length,
    },
    {
      label: "Status: Editing",
      type: "status",
      value: "Editing",
      count: articles.filter((a) => a.status === "Editing").length,
    },
    {
      label: "Status: Edited",
      type: "status",
      value: "Edited",
      count: articles.filter((a) => a.status === "Edited").length,
    },
    {
      label: "Status: Published",
      type: "status",
      value: "Published",
      count: articles.filter((a) => a.status === "Published").length,
    },
    {
      label: "Status: Paused",
      type: "status",
      value: "Paused",
      count: articles.filter((a) => a.status === "Paused").length,
    },
    {
      label: "Status: Draft",
      type: "status",
      value: "Draft",
      count: articles.filter((a) => a.status === "Draft").length,
    },
    {
      label: "Unassigned Editor",
      type: "editor",
      value: "unassigned",
      count: articles.filter((a) => !a.assignedEditor).length,
    },
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-emerald-950/5 shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="p-8 md:p-12 border-b border-emerald-950/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-emerald-950">
              {isEditor ? "My Assigned Edits" : "Article Control & Management"}
            </h2>
            <p className="text-emerald-950/40 text-sm mt-1">
              Filter, sort, assign editors, and edit article statuses across the publication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-950/40 bg-emerald-950/5 px-4 py-2 rounded-full">
              {filteredAndSortedArticles.length} of {articles.length} pieces
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* SEARCH INPUT */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
            <input
              type="text"
              placeholder="Search title, author, category, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
            />
          </div>

          {/* STATUS FILTER */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {allStatusOptions.map((status) => (
                <option key={status} value={status}>
                  Status: {status}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY FILTER */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* SORT SELECTOR */}
          <div>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-") as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
              }}
              className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
            >
              <option value="updatedAt-desc">Sort: Latest Updated</option>
              <option value="updatedAt-asc">Sort: Oldest Updated</option>
              <option value="createdAt-desc">Sort: Latest Created</option>
              <option value="createdAt-asc">Sort: Oldest Created</option>
              <option value="title-asc">Sort: Title (A-Z)</option>
              <option value="title-desc">Sort: Title (Z-A)</option>
              <option value="author-asc">Sort: Author (A-Z)</option>
              <option value="reads-desc">Sort: Most Reads</option>
              <option value="likes-desc">Sort: Most Likes</option>
            </select>
          </div>
        </div>

        {/* SUGGESTION FILTER PILLS */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/40">
              Filter Suggestions:
            </span>
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedStatus("all");
                setSelectedEditor("all");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                selectedStatus === "all" && selectedEditor === "all"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                  : "bg-emerald-950/5 text-emerald-950/60 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              All Pieces ({articles.length})
            </button>

            {filterSuggestions.map((suggestion) => {
              const isActive =
                suggestion.type === "status"
                  ? selectedStatus.toLowerCase() === suggestion.value.toLowerCase()
                  : selectedEditor.toLowerCase() === suggestion.value.toLowerCase();

              return (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    if (suggestion.type === "status") {
                      setSelectedStatus(isActive ? "all" : suggestion.value);
                    } else if (suggestion.type === "editor") {
                      setSelectedEditor(isActive ? "all" : suggestion.value);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                      : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
                  }`}
                >
                  <span>{suggestion.label}</span>
                  {suggestion.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-cream-50/20 text-cream-50"
                          : "bg-emerald-950/10 text-emerald-950"
                      }`}
                    >
                      {suggestion.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-emerald-950/5">
              <th
                onClick={() => handleSortToggle("title")}
                className="w-[32%] px-10 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Piece & Title</span>
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
                className="w-[18%] px-6 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
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

              <th
                onClick={() => handleSortToggle("status")}
                className="w-[18%] px-6 py-6 text-center cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Status (Editable)</span>
                  {sortField === "status" ? (
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

              {!isEditor && (
                <th className="w-[18%] px-6 py-6 text-center">
                  Assigned Editor
                </th>
              )}

              <th
                onClick={() => handleSortToggle("updatedAt")}
                className="w-[14%] px-6 py-6 text-center cursor-pointer select-none hover:text-emerald-950 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Updated</span>
                  {sortField === "updatedAt" ? (
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

              <th className="w-[12%] px-10 py-6 text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-emerald-950/5">
            {filteredAndSortedArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={isEditor ? 5 : 6}
                  className="px-10 py-16 text-center text-emerald-950/40"
                >
                  <p className="font-serif text-lg font-medium text-emerald-950/60 mb-2">
                    No articles found
                  </p>
                  <p className="text-xs">
                    Try adjusting your filters or search terms.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 px-4 py-2 bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 rounded-xl text-xs font-bold transition-all"
                    >
                      Reset all filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredAndSortedArticles.map((article) => (
                <tr
                  key={article._id}
                  className="group hover:bg-emerald-700/5 transition-colors"
                >
                  {/* TITLE & THUMBNAIL */}
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-950/5 relative shrink-0 border border-emerald-950/5">
                        <Image
                          src={article.thumbnail || "/placeholder.jpg"}
                          alt={article.title}
                          fill
                          sizes="56px"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/article/${article._id}`}
                          className="font-serif line-clamp-1 font-bold text-lg text-emerald-950 group-hover:text-emerald-700 transition-colors"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950/40 bg-emerald-950/5 px-2.5 py-0.5 rounded-full">
                            {article.category?.name || "Uncategorized"}
                          </span>
                          <span className="text-[10px] text-emerald-950/30">
                            {article.reads || 0} views • {article.likes || 0} likes
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* AUTHOR */}
                  <td className="px-6 py-6 text-xs text-emerald-950/70 font-medium">
                    <div className="font-bold text-emerald-950">
                      {article.author?.firstName} {article.author?.surname}
                    </div>
                    <div className="text-[10px] text-emerald-950/40 truncate max-w-[150px]">
                      {article.author?.email}
                    </div>
                  </td>

                  {/* STATUS SELECTOR (EDITABLE) */}
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center justify-center">
                      <select
                        value={article.status}
                        onChange={(e) =>
                          handleStatusChange(
                            article._id,
                            e.target.value as ArticleStatus,
                          )
                        }
                        disabled={updatingArticleId === article._id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase border focus:outline-none focus:ring-2 focus:ring-emerald-950/20 cursor-pointer transition-all ${statusBadgeClass(
                          article.status,
                        )}`}
                      >
                        {(isEditor ? editorStatusOptions : allStatusOptions).map(
                          (option) => (
                            <option
                              key={option}
                              value={option}
                              className="bg-white text-emerald-950 normal-case font-medium"
                            >
                              {option}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </td>

                  {/* ASSIGNED EDITOR */}
                  {!isEditor && (
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        <select
                          value={
                            typeof article.assignedEditor === "string"
                              ? article.assignedEditor
                              : article.assignedEditor?._id || ""
                          }
                          onChange={(e) =>
                            handleAssignEditor(article._id, e.target.value)
                          }
                          disabled={updatingArticleId === article._id}
                          className="bg-emerald-950/5 text-emerald-950 border border-emerald-950/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer max-w-[160px] truncate"
                        >
                          <option value="">Unassigned</option>
                          {editors.map((editor) => (
                            <option key={editor._id} value={editor._id}>
                              {editor.firstName} {editor.surname}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  )}

                  {/* UPDATED AT */}
                  <td className="px-6 py-6 text-center text-xs text-emerald-950/50 font-medium">
                    {article.updatedAt
                      ? new Date(article.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-10 py-6">
                    <div className="flex justify-center items-center gap-2">
                      <Link
                        href={`/edit-piece/${article._id}`}
                        className="p-2 hover:bg-emerald-950/5 text-emerald-950/60 hover:text-emerald-950 rounded-lg transition-colors cursor-pointer"
                        title="Edit Submission"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {!isEditor && (
                        <AdminArticleActions
                          articleId={article._id}
                          status={article.status}
                          onStatusChange={(newStatus) => {
                            setArticles((prev) =>
                              prev.map((a) =>
                                a._id === article._id
                                  ? { ...a, status: newStatus }
                                  : a,
                              ),
                            );
                          }}
                          onUpdated={() => {
                            setArticles((prev) =>
                              prev.filter((a) => a._id !== article._id),
                            );
                          }}
                        />
                      )}
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
          Showing {filteredAndSortedArticles.length} of {articles.length} total articles
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
