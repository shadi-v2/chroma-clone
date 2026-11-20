"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

export default function UnverifiedAccountGuard() {
  const { user, login, logout } = useAuth();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only active when a user is loaded and isEmailVerified is explicitly false
  const isUnverified = Boolean(user && user.isEmailVerified === false);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isUnverified || !user) {
    return null;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.auth.verifyCode(user.email, code.trim());
      setSuccess(res.message || "Email verified successfully!");

      if (res.token && res.user) {
        login(res.token, res.user);
      } else {
        login(localStorage.getItem("token") || "", {
          ...user,
          isEmailVerified: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code. Please check and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.auth.sendVerificationCode(user.email);
      setSuccess(res.message || "A fresh 6-digit verification code has been dispatched to your email!");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-emerald-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
    >
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-emerald-950/15 relative overflow-hidden text-center space-y-6">
        {/* BACKGROUND AMBIENT GLOW */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* LOGO & SHIELD BADGE */}
        <div>
          <div className="relative inline-block mb-3">
            <Image
              src="/icon.png"
              alt="Chroma Diaries"
              width={54}
              height={54}
              className="mx-auto drop-shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-md">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>Security Wall Active</span>
          </div>

          <h2 className="text-2xl font-serif font-bold text-emerald-950">
            Verify Your Email
          </h2>
          <p className="text-xs text-emerald-950/70 mt-1 leading-relaxed">
            Chroma Diaries security policy strictly prohibits staying on the platform with an unverified account.
          </p>
        </div>

        {/* USER EMAIL CARD */}
        <div className="p-3.5 bg-emerald-950/[0.03] border border-emerald-950/10 rounded-2xl text-left flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/50">
              Account Email
            </div>
            <div className="text-xs font-semibold text-emerald-950 truncate">
              {user.email}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
            Unverified
          </span>
        </div>

        {/* ERROR / SUCCESS NOTICES */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* VERIFICATION FORM */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-950/70 mb-2">
              Enter 6-Digit Code from Email
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              required
              autoFocus
              className="w-full text-center font-mono font-bold text-2xl tracking-[0.3em] px-4 py-3 rounded-2xl border-2 border-emerald-950/15 focus:border-emerald-950 focus:outline-none bg-emerald-950/[0.02]"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full py-4 px-6 bg-emerald-950 text-cream-50 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-950/15 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying Security Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Verify & Unlock Studio</span>
              </>
            )}
          </button>
        </form>

        {/* RESEND & LOGOUT CONTROLS */}
        <div className="pt-2 border-t border-emerald-950/10 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="text-emerald-950 font-bold hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isResending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend Verification Code"}
            </span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
