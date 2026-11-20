"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2, Pause, Play } from "lucide-react";
import type { ArticleStatus } from "@/types/article";
import { api } from "@/services/api";
import { useConfirm } from "@/contexts/ConfirmationContext";
import { gooeyToast } from "@/components/ui/goey-toaster";

interface Props {
  articleId: string;
  status?: ArticleStatus;
  onUpdated?: () => void;
  onStatusChange?: (newStatus: ArticleStatus) => void;
}

export default function AdminArticleActions({ articleId, status, onUpdated, onStatusChange }: Props) {
  const router = useRouter();
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Archive Article",
      message: "Are you sure you want to archive this article? It can be recovered from the recovery bin for 7 days.",
      confirmText: "Archive Article",
      variant: "destructive",
    });
    if (!confirmed) {
      return;
    }
    try {
      await api.articles.delete(articleId);
      gooeyToast.success("Article archived successfully.");
      onUpdated?.();
    } catch (error) {
      console.error("Failed to archive article:", error);
      gooeyToast.error("Failed to archive article.");
    }
  };

  const handleTogglePause = async () => {
    const newStatus = status === "Paused" ? "Published" : "Paused";
    try {
      await api.articles.updateStatus(articleId, newStatus);
      gooeyToast.success(`Article ${newStatus.toLowerCase()} successfully.`);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error("Failed to toggle pause status:", error);
      gooeyToast.error("Failed to toggle article status.");
    }
  };

  return (
    <div className="flex gap-4">
      {/* EDIT */}
      <button
        onClick={() => router.push(`/edit-piece/${articleId}`)}
        className="p-2 hover:bg-emerald-50 text-emerald-950/40 hover:text-emerald-950 rounded-lg transition-colors cursor-pointer"
        title="Edit Submission"
      >
        <Edit className="w-5 h-5" />
      </button>

      {/* DELETE */}
      <button
        onClick={handleDelete}
        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
        title="Archive Piece"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* PAUSE / UNPAUSE */}
      {status === "Published" && (
        <button
          onClick={handleTogglePause}
          className="p-2 hover:bg-amber-50 text-amber-500 rounded-lg transition-colors cursor-pointer"
          title="Pause Piece"
        >
          <Pause className="w-5 h-5" />
        </button>
      )}
      {status === "Paused" && (
        <button
          onClick={handleTogglePause}
          className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors cursor-pointer"
          title="Publish Piece"
        >
          <Play className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
