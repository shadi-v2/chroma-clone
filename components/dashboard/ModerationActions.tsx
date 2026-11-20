"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import type { PublicArticle, ArticleStatus } from "@/types/article";
import { useConfirm } from "@/contexts/ConfirmationContext";
import { gooeyToast } from "@/components/ui/goey-toaster";

interface ModerationActionsProps {
  article: PublicArticle;
}

export default function ModerationActions({ article }: ModerationActionsProps) {
  const router = useRouter();
  const { confirm } = useConfirm();

  const handleStatusUpdate = async (status: ArticleStatus) => {
    try {
      await api.articles.updateStatus(article._id, status);
      gooeyToast.success(`Article marked as ${status.toLowerCase()}.`);
      router.refresh();
    } catch (error) {
      console.error("Failed to update article:", error);
      gooeyToast.error("Failed to update article status.");
    }
  };

  const handleArchive = async () => {
    const confirmed = await confirm({
      title: "Archive Article",
      message: `Are you sure you want to archive "${article.title}"?`,
      confirmText: "Archive",
      variant: "destructive",
    });

    if (!confirmed) {
      return;
    }
    try {
      await api.articles.delete(article._id);
      gooeyToast.success("Article archived.");
      router.refresh();
    } catch (error) {
      console.error("Failed to archive:", error);
      gooeyToast.error("Failed to archive article.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-4xl border border-emerald-950/5 shadow-xl hover:shadow-2xl transition-all group">
      <div className="h-48 rounded-2xl bg-emerald-950/5 mb-6 overflow-hidden relative">
        <Image
          src={article.thumbnail || "/placeholder.png"}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <h3 className="font-serif font-bold text-xl text-emerald-950 mb-2 truncate">
        {article.title}
      </h3>

      <p className="text-xs text-emerald-950/40 mb-6">
        by{" "}
        <span className="font-bold uppercase tracking-widest">
          {article.author.firstName} {article.author.surname}
        </span>
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleStatusUpdate("Published")}
          className="flex-1 min-w-25 py-3 bg-emerald-950 text-cream-50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-900 transition-all"
        >
          Approve
        </button>

        <button
          onClick={() => router.push(`/edit-piece/${article._id}`)}
          className="flex-1 min-w-25 py-3 bg-emerald-950/5 text-emerald-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-950/10 transition-all"
        >
          Edit
        </button>

        <button
          onClick={handleArchive}
          className="px-6 py-3 border border-emerald-950/10 text-emerald-950/40 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-500/20 transition-all"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
