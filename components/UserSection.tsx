"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, PenTool, LayoutDashboard, User as UserIcon, LogOut } from "lucide-react";

import NotificationBell from "./notifications/NotificationBell";
import MobileNav from "./MobileNav";
import QuickSearchModal from "./QuickSearchModal";
import { logout } from "@/lib/logout";

import type { PublicUser } from "@/types/user";

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  readBy?: string[];
}

interface Props {
  user: PublicUser | null;
  notifications: Notification[];
}

export default function UserSection({ user, notifications }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut for search (⌘K or Ctrl+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (document.activeElement as HTMLElement)?.tagName || "",
        )
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Desktop Quick Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-emerald-950/10 bg-white/70 hover:bg-white text-emerald-950/70 hover:text-emerald-950 hover:border-emerald-950/20 shadow-xs transition-all cursor-pointer text-xs font-semibold"
          aria-label="Search articles"
        >
          <Search className="w-3.5 h-3.5 text-emerald-800" />
          <span>Search...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/5 text-emerald-950/40 border border-emerald-950/10">
            ⌘K
          </kbd>
        </button>

        {/* Desktop Write Piece Quick Link */}
        <Link
          href="/submit-piece"
          className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-950/5 hover:bg-emerald-950 text-emerald-950 hover:text-cream-50 transition-all text-xs font-bold uppercase tracking-wider active:scale-95"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Write</span>
        </Link>

        {/* Notifications & Profile / Sign In */}
        {user ? (
          <>
            <NotificationBell userId={user._id} notifications={notifications} />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 hover:bg-emerald-950/5 p-1 cursor-pointer pr-2 rounded-full transition-colors focus:outline-none"
                aria-label="User menu"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.firstName}
                    width={34}
                    height={34}
                    className="w-8.5 h-8.5 rounded-full object-cover border border-emerald-950/10 shadow-sm"
                  />
                ) : (
                  <div className="w-8.5 h-8.5 rounded-full bg-emerald-950 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.firstName[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-emerald-950/60 transition-transform duration-300 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-emerald-950/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-emerald-950/5 mb-1">
                    <p className="font-bold text-emerald-950 text-xs truncate">
                      {user.firstName} {user.surname}
                    </p>
                    <span className="text-[10px] text-emerald-950/50 font-medium uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href={`/profile/${user._id}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all focus:outline-none cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/auth"
            className="hidden sm:flex items-center gap-2 px-5 py-2 bg-emerald-950 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all shadow-sm active:scale-95"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Navigation Drawer Trigger */}
        <MobileNav user={user} onOpenSearch={() => setSearchOpen(true)} />
      </div>

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
