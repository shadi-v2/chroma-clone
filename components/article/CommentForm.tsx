"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader, Send, MessageSquare, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

interface CommentFormProps {
  articleId: string;
}

const CommentForm = ({ articleId }: CommentFormProps) => {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!user) {
      openAuthModal({
        title: "Sign in to Comment",
        message:
          "Join the conversation! Please log in or create an account to share your thoughts.",
      });
      return;
    }

    if (!content.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.articles.addComment(articleId, {
        content: content.trim(),
      });

      if (res && res.message && !res.id && !res._id) {
        throw new Error(res.message);
      }

      setContent("");
      router.refresh();
    } catch (error) {
      console.error("Failed to post comment:", error);
      const msg = error instanceof Error ? error.message : "Failed to post comment. Please try again.";
      setErrorMessage(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        openAuthModal({
          title: "Session Expired",
          message: "Please log in again to post your comment.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-emerald-950/5 shadow-xl space-y-4"
    >
      {/* Active User Indicator */}
      {user ? (
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950/5">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.firstName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-emerald-950/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-950 text-cream-50 font-bold text-xs flex items-center justify-center">
                {user.firstName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="text-xs">
              <span className="text-emerald-950/40">Commenting as </span>
              <span className="font-bold text-emerald-950">
                {user.firstName} {user.surname}
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-950/5 px-2.5 py-1 rounded-full">
            {user.role}
          </span>
        </div>
      ) : (
        <div
          onClick={() =>
            openAuthModal({
              title: "Sign in to Comment",
              message:
                "Join the conversation! Please log in or create an account to share your thoughts.",
            })
          }
          className="flex items-center gap-2 text-xs text-emerald-950/60 pb-3 border-b border-emerald-950/5 cursor-pointer hover:text-emerald-950 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-emerald-800" />
          <span>Click to sign in and join the discussion</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          user
            ? `Share your thoughts on this piece, ${user.firstName}...`
            : "Write your thoughts... (Sign in to post)"
        }
        className="w-full bg-transparent border-none outline-none min-h-28 resize-none placeholder:text-emerald-950/30 text-emerald-950 text-sm leading-relaxed"
      />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex items-center gap-3 px-8 py-3.5 bg-emerald-950 text-cream-50 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-900 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/15"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Post Comment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
