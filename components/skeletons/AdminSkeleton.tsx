"use client";

import React from "react";

export default function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex overflow-hidden font-sans select-none">
      <style jsx global>{`
        @keyframes admin-skeleton-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .sk-admin {
          position: relative;
          overflow: hidden;
          background-color: rgba(2, 44, 34, 0.06);
        }
        .sk-admin::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 40%,
            rgba(255, 255, 255, 0.6) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: admin-skeleton-shimmer 2s infinite ease-in-out;
        }

        .sk-admin-dark {
          position: relative;
          overflow: hidden;
          background-color: rgba(2, 44, 34, 0.12);
        }
        .sk-admin-dark::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 40%,
            rgba(255, 255, 255, 0.2) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: admin-skeleton-shimmer 2s infinite ease-in-out;
        }

        .sk-card-stagger:nth-child(1) .sk-admin::after {
          animation-delay: 0ms;
        }
        .sk-card-stagger:nth-child(2) .sk-admin::after {
          animation-delay: 150ms;
        }
        .sk-card-stagger:nth-child(3) .sk-admin::after {
          animation-delay: 300ms;
        }
        .sk-card-stagger:nth-child(4) .sk-admin::after {
          animation-delay: 450ms;
        }
      `}</style>

      {/* ── DESKTOP SIDEBAR SKELETON ── */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-emerald-950/5 p-6 h-screen sticky top-0 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo / Magazine title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl sk-admin-dark shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 rounded-md sk-admin" />
              <div className="h-2.5 w-1/2 rounded-md sk-admin" />
            </div>
          </div>

          {/* User mini profile plate */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-950/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl sk-admin-dark shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 rounded-md sk-admin" />
              <div className="h-2.5 w-16 rounded-md sk-admin" />
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded-md sk-admin mb-3" />
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-11 w-full rounded-2xl sk-admin flex items-center px-4 gap-3"
              >
                <div className="w-4 h-4 rounded-lg bg-emerald-950/10 shrink-0" />
                <div className="h-3 rounded-md bg-emerald-950/10 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-6 border-t border-emerald-950/5">
          <div className="h-10 w-full rounded-2xl sk-admin flex items-center px-4 gap-3">
            <div className="w-4 h-4 rounded-md bg-emerald-950/10" />
            <div className="h-3 w-32 rounded-md bg-emerald-950/10" />
          </div>
          <div className="h-10 w-full rounded-2xl sk-admin flex items-center px-4 gap-3">
            <div className="w-4 h-4 rounded-md bg-emerald-950/10" />
            <div className="h-3 w-20 rounded-md bg-emerald-950/10" />
          </div>
        </div>
      </aside>

      {/* ── MAIN INSET CONTENT SKELETON ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="h-20 bg-white/80 border-b border-emerald-950/5 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 rounded-2xl sk-admin shrink-0" />
            <div className="space-y-1.5">
              <div className="h-5 w-40 rounded-lg sk-admin" />
              <div className="h-3 w-56 rounded-md sk-admin hidden sm:block" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl sk-admin hidden sm:block" />
            <div className="h-11 w-36 rounded-full sk-admin-dark" />
          </div>
        </header>

        {/* Inset Body */}
        <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
          {/* Studio Banner / Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="sk-card-stagger p-6 rounded-[2rem] bg-white border border-emerald-950/5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl sk-admin" />
                  <div className="h-4 w-12 rounded-full sk-admin" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-7 w-20 rounded-lg sk-admin-dark" />
                  <div className="h-3.5 w-28 rounded-md sk-admin" />
                </div>
              </div>
            ))}
          </div>

          {/* Search bar & Filter bar */}
          <div className="bg-white rounded-3xl p-4 border border-emerald-950/5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="h-12 w-full sm:w-96 rounded-2xl sk-admin" />
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="h-11 w-28 rounded-2xl sk-admin" />
              <div className="h-11 w-32 rounded-2xl sk-admin" />
            </div>
          </div>

          {/* Table / List Records */}
          <div className="bg-white rounded-[2.5rem] border border-emerald-950/5 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-48 rounded-lg sk-admin" />
              <div className="h-4 w-24 rounded-md sk-admin" />
            </div>

            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-emerald-950/[0.02] border border-emerald-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl sk-admin shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 sm:w-72 rounded-md sk-admin" />
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-20 rounded-md sk-admin" />
                      <div className="h-3 w-16 rounded-md sk-admin" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="h-7 w-20 rounded-full sk-admin" />
                  <div className="w-8 h-8 rounded-xl sk-admin" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
