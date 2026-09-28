"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  Heart,
  Share2,
  Check,
  Globe,
  MessageCircle,
  Copy,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { PublicArticle } from "@/types/article";

interface ArticleActionsProps {
  article: PublicArticle;
}

const ArticleActions = ({ article }: ArticleActionsProps) => {
  const { user, loading, openAuthModal } = useAuth();
  const { success, info } = useToast();
  const [likes, setLikes] = useState(article.likes || 0);
  const [reads, setReads] = useState(article.reads || 0);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const serverLiked =
    article.likedBy?.some((id) => String(id) === String(user?._id)) || false;
  const serverEnrolled =
    article.enrolledBy?.some((id) => String(id) === String(user?._id)) || false;

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticEnrolled, setOptimisticEnrolled] = useState<boolean | null>(
    null,
  );

  const isLiked = optimisticLiked === null ? serverLiked : optimisticLiked;
  const isEnrolled =
    optimisticEnrolled === null ? serverEnrolled : optimisticEnrolled;
  const [isLiking, setIsLiking] = useState(false);
  const [isTogglingEnrollment, setIsTogglingEnrollment] = useState(false);

  // Increment read count when viewing article
  useEffect(() => {
    let cancelled = false;

    const incrementViews = async () => {
      try {
        const updated = await api.articles.incrementViews(article._id);
        if (!cancelled && updated?.reads !== undefined) {
          setReads(updated.reads);
        }
      } catch (error) {
        console.error("Failed to update views:", error);
      }
    };

    void incrementViews();

    return () => {
      cancelled = true;
    };
  }, [article._id]);

  const handleLike = async () => {
    if (isLiking) return;
    if (!user) {
      openAuthModal({
        title: "Sign in to Like",
        message:
          "Log in or create an account to like articles and support your favorite writers.",
      });
      return;
    }

    try {
      setIsLiking(true);
      const previousLiked = isLiked;

      // optimistic update
      setOptimisticLiked(!previousLiked);
      setLikes((prev) => (previousLiked ? Math.max(prev - 1, 0) : prev + 1));
      const updated = await api.articles.like(article._id);
      setOptimisticLiked(updated.liked);
      if (updated?.likes !== undefined) {
        setLikes(updated.likes);
      }
      if (updated.liked) {
        success("Added to your liked pieces!");
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEnroll = async () => {
    if (isTogglingEnrollment) return;

    if (!user) {
      openAuthModal({
        title: "Sign in to Subscribe",
        message:
          "Log in or create an account to subscribe and receive updates when this article is edited or updated.",
      });
      return;
    }

    try {
      setIsTogglingEnrollment(true);
      const previousEnrolled = isEnrolled;

      setOptimisticEnrolled(!previousEnrolled);
      const updated = await api.articles.enroll(article._id);
      setOptimisticEnrolled(updated.enrolled);
      if (updated.enrolled) {
        success("Subscribed to article updates!");
      } else {
        info("Unsubscribed from article updates.");
      }
    } catch (error) {
      console.error("Failed to update enrollment:", error);
    } finally {
      setIsTogglingEnrollment(false);
    }
  };

  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success("Article link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
      setShareMenuOpen(false);
    } catch {
      info("Could not copy link automatically.");
    }
  };

  const shareNativeOrModal = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      setShareMenuOpen((prev) => !prev);
    }
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Read "${article.title}" on Chroma Diaries: ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareMenuOpen(false);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `"${article.title}" on Chroma Diaries web magazine:`,
    );
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
    );
    setShareMenuOpen(false);
  };

  return (
    <div className="mt-16 pt-8 border-t border-emerald-950/10 flex flex-wrap items-center justify-between gap-4">
      {/* Interaction buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* LIKE BUTTON */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer shadow-xs active:scale-95 ${
            isLiked
              ? "bg-red-500 text-white border-red-500 shadow-red-500/20"
              : "bg-white text-emerald-950 border-emerald-950/10 hover:border-red-300 hover:text-red-500"
          }`}
          title="Like piece"
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{likes}</span>
        </button>

        {/* SUBSCRIBE / ENROLL */}
        <button
          onClick={handleEnroll}
          disabled={isTogglingEnrollment}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer shadow-xs active:scale-95 ${
            isEnrolled
              ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-emerald-950/20"
              : "bg-white text-emerald-950 border-emerald-950/10 hover:bg-emerald-950/5"
          }`}
          title="Subscribe to revisions & notifications"
        >
          <Bell className={`w-4 h-4 ${isEnrolled ? "fill-current" : ""}`} />
          <span>{isEnrolled ? "Subscribed" : "Follow Updates"}</span>
        </button>

        {/* TOTAL READS */}
        <div className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider border bg-white text-emerald-950/70 border-emerald-950/10 select-none shadow-xs">
          <Eye className="w-4 h-4 text-emerald-950/40" />
          <span>{reads} reads</span>
        </div>
      </div>

      {/* SHARE ACTIONS */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            onClick={copyArticleLink}
            className="flex items-center gap-2 px-4 py-3 rounded-full border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-950 hover:text-cream-50 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
            title="Copy article link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <button
            onClick={shareNativeOrModal}
            className="w-11 h-11 rounded-full border border-emerald-950/10 bg-white flex items-center justify-center text-emerald-950 hover:bg-emerald-950 hover:text-cream-50 transition-all shadow-xs cursor-pointer"
            title="Share options"
            aria-label="Share article"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Share Dropdown */}
        {shareMenuOpen && (
          <div className="absolute right-0 bottom-full mb-3 w-48 bg-white rounded-2xl border border-emerald-950/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={shareOnWhatsApp}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-950 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Share to WhatsApp</span>
            </button>
            <button
              onClick={shareOnTwitter}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-950 hover:bg-sky-50 transition-colors text-left cursor-pointer"
            >
              <Globe className="w-4 h-4 text-sky-500" />
              <span>Share to X / Social</span>
            </button>
            <button
              onClick={copyArticleLink}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-950 hover:bg-emerald-950/5 transition-colors text-left cursor-pointer"
            >
              <Copy className="w-4 h-4 text-emerald-800" />
              <span>Copy URL</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleActions;
