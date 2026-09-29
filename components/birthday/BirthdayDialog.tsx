"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Heart, Gift, Cake, X, PartyPopper } from "lucide-react";

export default function BirthdayDialog() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading || !user || !user.dateOfBirth) return;

    try {
      const dob = new Date(user.dateOfBirth);
      if (isNaN(dob.getTime())) return;

      const today = new Date();
      const isBirthday =
        dob.getDate() === today.getDate() &&
        dob.getMonth() === today.getMonth();

      if (isBirthday) {
        const currentYear = today.getFullYear();
        const storageKey = `chroma_birthday_wished_${user._id || user.id}_${currentYear}`;
        const alreadyWished = localStorage.getItem(storageKey);

        if (!alreadyWished) {
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1200);

          return () => clearTimeout(timer);
        }
      }
    } catch (err) {
      console.error("Birthday check error:", err);
    }
  }, [user, loading]);

  const handleClose = () => {
    if (user) {
      const currentYear = new Date().getFullYear();
      const storageKey = `chroma_birthday_wished_${user._id || user.id}_${currentYear}`;
      localStorage.setItem(storageKey, "true");
    }
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-lg overflow-hidden bg-white border border-amber-200/50 rounded-[3rem] shadow-2xl shadow-emerald-950/30 text-center p-8 md:p-12 animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP DECORATIVE BANNER */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-950" />

        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full text-emerald-950/40 hover:text-emerald-950 hover:bg-emerald-950/5 transition-all cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CELEBRATION ICON CLUSTER */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-950/5 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-white border-2 border-emerald-950/20 flex items-center justify-center shadow-lg shadow-emerald-950/10">
            <Cake className="w-10 h-10 text-emerald-800 animate-bounce" />
          </div>

          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-emerald-800 animate-spin" />
          <PartyPopper className="absolute -bottom-1 -left-1 w-6 h-6 text-emerald-800" />
        </div>

        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/5 text-emerald-950 text-[10px] font-bold uppercase tracking-[0.25em] mb-4 border border-emerald-950/10">
          <Gift className="w-3.5 h-3.5 text-emerald-800" />
          <span>Special Celebration</span>
        </div>

        {/* HEADLINE */}
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-emerald-950 mb-4 leading-tight">
          Happy Birthday,{" "}
          <span className="text-emerald-800 underline decoration-emerald-800/30 underline-offset-4">
            {user.firstName}
          </span>
          ! 🎂
        </h2>

        {/* CONCISE BIRTHDAY MESSAGE */}
        <p className="text-emerald-950/70 text-sm md:text-base leading-relaxed max-w-sm mx-auto mb-8 font-medium">
          Wishing you a wonderful birthday! May your new chapter be filled with boundless inspiration, joy, and unforgettable stories.
        </p>

        {/* DECORATIVE HEARTS / SPARKLES */}
        <div className="flex items-center justify-center gap-6 text-xs text-emerald-950/70 font-bold uppercase tracking-widest mb-8">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-800" /> Inspiring Journey
          </span>
          <span className="w-1 h-1 rounded-full bg-emerald-950/30" />
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Endless Joy
          </span>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={handleClose}
          className="w-full py-4.5 px-8 bg-emerald-950 text-cream-50 rounded-2xl font-bold text-xs tracking-[0.25em] uppercase hover:bg-emerald-900 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all cursor-pointer border border-emerald-950 active:scale-95"
        >
          Celebrate & Enter My Studio ✨
        </button>
      </div>
    </div>
  );
}
