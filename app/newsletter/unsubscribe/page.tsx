"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "No unsubscribe token was provided.",
  );

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function handleUnsubscribe() {
      try {
        const res = await fetch("/api/public/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (isMounted) {
          if (res.ok) {
            setStatus("success");
            setMessage(data.message || "You have been successfully unsubscribed.");
          } else {
            setStatus("error");
            setMessage(data.message || "Unable to unsubscribe at this time.");
          }
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setMessage("A network error occurred. Please try again later.");
        }
      }
    }

    handleUnsubscribe();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#022c22]/10 p-8 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#022c22]/5 flex items-center justify-center">
          {status === "loading" && <Loader2 className="w-8 h-8 text-[#022c22] animate-spin" />}
          {status === "success" && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
          {status === "error" && <AlertCircle className="w-8 h-8 text-amber-600" />}
        </div>

        <h1 className="text-2xl font-serif font-bold text-[#022c22] mb-3">
          {status === "loading" && "Processing your request..."}
          {status === "success" && "Unsubscribed"}
          {status === "error" && "Unsubscribe Request"}
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed mb-8">{message}</p>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-[#022c22] text-[#fcfbf7] font-medium text-sm hover:bg-[#022c22]/90 transition-all shadow-sm"
          >
            Return to Chroma Diaries
          </Link>
          <div className="pt-4 border-t border-[#022c22]/5 text-xs text-gray-400">
            Changed your mind? You can always resubscribe from our website footer anytime.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#022c22] animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
