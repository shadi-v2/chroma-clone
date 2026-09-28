"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Loader,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api } from "@/services/api";
import type { Category } from "@/types/category";

type CategorySort = "name-asc" | "name-desc" | "created-desc" | "created-asc";

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CategorySort>("name-asc");

  const fetchCategories = async () => {
    try {
      const data = await api.categories.list();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newCategoryName.trim()) return;
    try {
      setCreating(true);
      setError("");
      await api.categories.create({
        name: newCategoryName,
      });

      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) return;

    try {
      await api.categories.delete(id);
      setCategories((prev) => prev.filter((category) => category._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category._id);
    setEditName(category.name);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await api.categories.update(id, {
        name: editName,
      });

      setCategories((prev) =>
        prev.map((category) => (category._id === id ? updated : category)),
      );

      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAndSortedCategories = useMemo(() => {
    const result = categories.filter((cat) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          cat.name.toLowerCase().includes(query) ||
          cat.slug.toLowerCase().includes(query)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-asc": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateA - dateB;
        }
        case "created-desc": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [categories, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-950/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CREATE CATEGORY FORM */}
      <div className="bg-white p-10 rounded-[3rem] border border-emerald-950/5 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-emerald-950">
            Create Realm / Category
          </h2>
          <p className="text-emerald-950/40 text-sm mt-1">
            Add a new genre or literary section to categorize published stories.
          </p>
        </div>

        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. Science Fiction, Classical Poetry, Essays..."
            className="flex-1 bg-cream-50 border border-emerald-950/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-950/10 text-sm font-medium text-emerald-950"
          />

          <button
            type="submit"
            disabled={creating || !newCategoryName.trim()}
            className="px-8 py-4 bg-emerald-950 text-cream-50 rounded-2xl cursor-pointer font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shrink-0"
          >
            {creating ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Category
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {/* CATEGORIES LIST & CONTROLS */}
      <div className="bg-white rounded-[3rem] border border-emerald-950/5 shadow-2xl overflow-hidden">
        {/* HEADER & FILTERS */}
        <div className="p-8 md:p-10 border-b border-emerald-950/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-3xl font-serif font-bold text-emerald-950">
                Categories
              </h3>
              <p className="text-emerald-950/40 text-sm mt-1">
                Manage, edit slugs, or remove active categories.
              </p>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-950/40 bg-emerald-950/5 px-4 py-2 rounded-full self-start sm:self-auto">
              {filteredAndSortedCategories.length} of {categories.length} realms
            </span>
          </div>

          {/* SEARCH & SORT BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
              <input
                type="text"
                placeholder="Search category by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
              />
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CategorySort)}
                className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
              >
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="created-desc">Sort: Newest First</option>
                <option value="created-asc">Sort: Oldest First</option>
              </select>
            </div>
          </div>

          {/* SUGGESTIONS PILLS */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/40 mr-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Sort Suggestions:</span>
            </div>

            <button
              onClick={() => setSortBy("name-asc")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                sortBy === "name-asc"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              Alphabetical (A-Z)
            </button>

            <button
              onClick={() => setSortBy("name-desc")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                sortBy === "name-desc"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              Reverse (Z-A)
            </button>

            <button
              onClick={() => setSortBy("created-desc")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                sortBy === "created-desc"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              Recently Created
            </button>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 hover:text-red-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY TILES */}
        <div className="p-8">
          {filteredAndSortedCategories.length === 0 ? (
            <div className="py-16 text-center text-emerald-950/40">
              <p className="font-serif text-lg font-medium text-emerald-950/60 mb-1">
                No categories match your search
              </p>
              <p className="text-xs">Try searching for a different keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCategories.map((category) => (
                <div
                  key={category._id}
                  className="p-8 rounded-4xl border border-emerald-950/5 bg-cream-50/50 hover:bg-cream-50 transition-all hover:shadow-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-950/5 flex items-center justify-center text-emerald-950">
                      <Tag className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      {editingId === category._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(category._id)}
                            className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 cursor-pointer transition-colors"
                            title="Save Changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 rounded-xl hover:bg-emerald-950/5 text-emerald-950/60 hover:text-emerald-950 cursor-pointer transition-colors"
                            title="Edit Name"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 rounded-xl hover:bg-red-100 text-red-500 cursor-pointer transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === category._id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white rounded-xl px-4 py-2.5 outline-none border border-emerald-950/20 text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-950/10"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xl font-serif font-bold text-emerald-950">
                        {category.name}
                      </h4>

                      <p className="text-xs uppercase tracking-widest text-emerald-950/40 mt-1 font-mono">
                        /{category.slug}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryManagement;
