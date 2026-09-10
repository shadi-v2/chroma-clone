"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Root Error Boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#f8faff] text-[#1c2340] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#1e2f75]/10 p-8 text-center shadow-2xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1e2f75]/10 text-[#1e2f75] flex items-center justify-center mx-auto font-serif text-2xl font-bold">
            CD
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-[#1e2f75]">
              System Interruption
            </h1>
            <p className="text-xs text-[#1e2f75]/60 leading-relaxed">
              A critical application error occurred. We apologize for the inconvenience.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#1e2f75] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#2947a5] transition-all cursor-pointer"
          >
            Reload Chroma Diaries
          </button>
        </div>
      </body>
    </html>
  );
}
