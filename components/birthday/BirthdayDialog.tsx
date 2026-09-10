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
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-emerald-600 to-amber-500" />

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
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-200 to-emerald-100 animate-pulse opacity-70" />
          <div className="relative w-20 h-20 rounded-full bg-cream-50 border-2 border-amber-300 flex items-center justify-center shadow-lg shadow-amber-200/50">
            <Cake className="w-10 h-10 text-amber-600 animate-bounce" />
          </div>

          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-500 animate-spin" />
          <PartyPopper className="absolute -bottom-1 -left-1 w-6 h-6 text-emerald-700" />
        </div>

        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-[0.25em] mb-4 border border-amber-300/60">
          <Gift className="w-3.5 h-3.5 text-amber-700" />
          <span>Special Celebration</span>
        </div>

        {/* HEADLINE */}
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-emerald-950 mb-4 leading-tight">
          Happy Birthday,{" "}
          <span className="text-amber-700 underline decoration-amber-300 underline-offset-4">
            {user.firstName}
          </span>
          ! 🎂
        </h2>

        {/* POETIC MESSAGE */}
        <p className="text-emerald-950/70 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8 font-medium">
          On this extraordinary day, the entire{" "}
          <span className="font-bold text-emerald-950">Chroma Diaries</span> family
          celebrates the wonderful author, reader, and creative soul that you are.
          May your new chapter be woven with boundless inspiration, joy, and unforgettable stories!
        </p>

        {/* DECORATIVE HEARTS / SPARKLES */}
        <div className="flex items-center justify-center gap-6 text-xs text-amber-700/80 font-bold uppercase tracking-widest mb-8">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Inspiring Journey
          </span>
          <span className="w-1 h-1 rounded-full bg-amber-400" />
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Endless Joy
          </span>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={handleClose}
          className="w-full py-4.5 px-8 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-cream-50 rounded-2xl font-bold text-xs tracking-[0.25em] uppercase hover:shadow-2xl hover:shadow-emerald-950/40 hover:scale-[1.02] transition-all cursor-pointer border border-emerald-800/30 active:scale-95"
        >
          Celebrate & Enter My Studio ✨
        </button>
      </div>
    </div>
  );
}
