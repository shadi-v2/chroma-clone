"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface NewsletterCardProps {
  className?: string;
  variant?: "inline" | "card" | "floating";
}

export default function NewsletterCard({ className = "", variant = "card" }: NewsletterCardProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setFeedback("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setFeedback("");

    try {
      const res = await fetch("/api/public/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFeedback(data.message || "Thank you for subscribing! Check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setFeedback(data.message || "Failed to subscribe. Please try again.");
      }
    } catch {
      setStatus("error");
      setFeedback("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className={`w-full ${className}`}>
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            disabled={loading || status === "success"}
            className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-3 pr-28 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || status === "success"}
            className="absolute right-1 top-1 bottom-1 px-5 rounded-full bg-white text-emerald-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-cream-100 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <>
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
        {feedback && (
          <p
            className={`mt-2 text-xs font-medium ${
              status === "success" ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {feedback}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#033b2e] to-emerald-900 border border-emerald-800/40 p-8 sm:p-10 text-white shadow-2xl ${className}`}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-cream-100 mb-2">
          <Mail className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-emerald-400">
            Chroma Diaries Dispatch
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-cream-50 leading-tight">
            Stories, Essays & Literary Thoughts Delivered to Your Inbox
          </h3>
          <p className="text-cream-50/70 text-sm leading-relaxed max-w-md mx-auto font-light">
            Join our curated circle of readers. Receive weekly handpicked essays, author reflections, and creative highlights.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-900/60 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-semibold mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>You&apos;re in the circle!</span>
            </div>
            <p className="text-xs text-cream-50/80">{feedback}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              disabled={loading}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl sm:rounded-full px-5 py-3.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 rounded-xl sm:rounded-full bg-white text-emerald-950 font-bold text-sm hover:bg-cream-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-xs text-amber-300 font-medium">{feedback}</p>
        )}

        <div className="text-[11px] text-cream-50/40 uppercase tracking-widest pt-2">
          Zero Spam • Unsubscribe Anytime in 1-Click
        </div>
      </div>
    </div>
  );
}
