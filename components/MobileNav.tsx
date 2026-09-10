"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  PenTool,
  Sparkles,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  HelpCircle,
  Mail,
  Search,
} from "lucide-react";
import { logout } from "@/lib/logout";
import type { PublicUser } from "@/types/user";

interface MobileNavProps {
  user: PublicUser | null;
  onOpenSearch: () => void;
}

export default function MobileNav({ user, onOpenSearch }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const categories = [
    { name: "Feature Articles", path: "/?category=Feature" },
    { name: "Essays", path: "/?category=Essays" },
    { name: "Stories", path: "/?category=Story" },
    { name: "Poems", path: "/?category=Poetry" },
    { name: "Translations", path: "/?category=Translations" },
    { name: "Reviews", path: "/?category=Reviews" },
    { name: "Travelogues", path: "/?category=Travelogues" },
    { name: "Letters", path: "/?category=Letters" },
  ];

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden flex items-center gap-2">
      {/* Quick Search Icon on Mobile */}
      <button
        onClick={onOpenSearch}
        className="p-2.5 rounded-full text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
        aria-label="Open Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-full text-emerald-950/80 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
        aria-label="Open mobile navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-100 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={handleClose}
        />
      )}

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-101 w-full max-w-sm bg-cream-50 text-emerald-950 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-950/10 bg-white/60 backdrop-blur-md">
          <Link href="/" onClick={handleClose} className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Chroma Diaries"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-emerald-950/60 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card inside mobile menu */}
        {user ? (
          <div className="p-6 bg-white/80 border-b border-emerald-950/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.firstName}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover border border-emerald-950/10"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-950 text-cream-50 flex items-center justify-center font-bold text-sm">
                  {user.firstName[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-emerald-950 text-sm truncate">
                  {user.firstName} {user.surname}
                </p>
                <p className="text-xs text-emerald-950/50 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/10 text-emerald-950 shrink-0">
              {user.role}
            </span>
          </div>
        ) : (
          <div className="p-6 bg-white/80 border-b border-emerald-950/5">
            <Link
              href="/auth"
              onClick={handleClose}
              className="w-full py-3 bg-emerald-950 text-cream-50 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-md"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In / Join</span>
            </Link>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={handleClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-800" />
              <span>Home</span>
            </Link>

            {/* Categories Accordion */}
            <div>
              <button
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Categories</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-950/50 transition-transform duration-200 ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="pl-11 pr-4 py-2 space-y-1">
                  {categories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.path}
                      onClick={handleClose}
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* About & Guidelines Accordion */}
            <div>
              <button
                onClick={() => setAboutOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>About & Guidelines</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-950/50 transition-transform duration-200 ${
                    aboutOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {aboutOpen && (
                <div className="pl-11 pr-4 py-2 space-y-1">
                  <Link
                    href="/about"
                    onClick={handleClose}
                    className="block px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors"
                  >
                    Our Story & Vision
                  </Link>
                  <Link
                    href="/submit"
                    onClick={handleClose}
                    className="block px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors"
                  >
                    Submission Guidelines
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              onClick={handleClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>Contact Editorial</span>
            </Link>
          </div>

          {/* User Logged In Actions */}
          {user && (
            <div className="pt-4 border-t border-emerald-950/10 space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 px-4 block mb-2">
                Workspace
              </span>
              <Link
                href={`/profile/${user._id}`}
                onClick={handleClose}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-emerald-800" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm text-emerald-950 hover:bg-emerald-950/5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-800" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  handleClose();
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Drawer Bottom CTA */}
        <div className="p-6 border-t border-emerald-950/10 bg-white/60 backdrop-blur-md">
          <Link
            href="/submit-piece"
            onClick={handleClose}
            className="w-full py-3.5 bg-emerald-950 text-cream-50 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-lg active:scale-95"
          >
            <PenTool className="w-4 h-4" />
            <span>Submit Writing</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
