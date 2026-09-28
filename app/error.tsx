"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, Sparkles } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-cream-50 flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-950/5 border border-emerald-950/10 flex items-center justify-center mx-auto text-emerald-950 shadow-inner">
          <Sparkles className="w-8 h-8 text-emerald-800" />
        </div>

        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-950/40">
            A Momentary Pause in the Narrative
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-emerald-950 tracking-tight">
            Something went unexpectedly off-page
          </h1>
          <p className="text-emerald-950/60 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            We encountered a temporary disruption while loading this page. You can retry the action or return to the main library.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-950 text-cream-50 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all cursor-pointer shadow-lg shadow-emerald-950/10 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-emerald-950/15 text-emerald-950 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-950/5 transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Library</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
