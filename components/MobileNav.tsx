"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Feather,
  Compass,
} from "lucide-react";
import { logout } from "@/lib/logout";
import type { PublicUser } from "@/types/user";

interface MobileNavProps {
  user: PublicUser | null;
  onOpenSearch: () => void;
}

export default function MobileNav({ user, onOpenSearch }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  const categories = [
    { name: "Feature Articles", path: "/?category=feature" },
    { name: "Essays", path: "/?category=essays" },
    { name: "Stories", path: "/?category=story" },
    { name: "Poetry", path: "/?category=poetry" },
    { name: "Philosophy", path: "/?category=philosophy" },
    { name: "Travelogues", path: "/?category=travelogues" },
    { name: "Letters", path: "/?category=letters" },
    { name: "Translations", path: "/?category=translations" },
    { name: "Reviews", path: "/?category=reviews" },
  ];

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const drawerContent = (
    <div className="lg:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-emerald-950/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[340px] sm:max-w-sm bg-cream-50 text-emerald-950 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-950/10 bg-white/80 backdrop-blur-md shrink-0">
          <Link href="/" onClick={handleClose} className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Chroma Diaries"
              width={130}
              height={45}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 rounded-full bg-emerald-950/5 hover:bg-emerald-950 hover:text-white text-emerald-950/70 transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user ? (
          <div className="p-4 bg-white border-b border-emerald-950/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.firstName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-950/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-950 text-cream-50 flex items-center justify-center font-bold text-sm">
                  {user.firstName[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-emerald-950 text-sm truncate">
                  {user.firstName} {user.surname}
                </p>
                <p className="text-[11px] text-emerald-950/50 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 text-cream-50 shrink-0">
              {user.role}
            </span>
          </div>
        ) : (
          <div className="p-4 bg-white border-b border-emerald-950/10 shrink-0">
            <Link
              href="/auth"
              onClick={handleClose}
              className="w-full py-2.5 bg-emerald-950 text-cream-50 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-sm active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Join</span>
            </Link>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search Trigger inside Mobile Drawer */}
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenSearch();
            }}
            className="w-full flex items-center gap-3 bg-white border border-emerald-950/10 rounded-2xl py-3 px-4 text-xs font-semibold text-emerald-950/60 hover:text-emerald-950 hover:border-emerald-950/30 transition-all shadow-xs cursor-pointer text-left"
          >
            <Search className="w-4 h-4 text-emerald-950/40" />
            <span>Search articles, topics, authors...</span>
          </button>

          {/* Primary Nav Links */}
          <div className="space-y-1 bg-white p-2 rounded-2xl border border-emerald-950/5 shadow-xs">
            <Link
              href="/"
              onClick={handleClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-800" />
              <span>Home</span>
            </Link>

            <Link
              href="/?category=essays"
              onClick={handleClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <Feather className="w-4 h-4 text-emerald-800" />
              <span>Essays</span>
            </Link>

            <Link
              href="/?category=letters"
              onClick={handleClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <Mail className="w-4 h-4 text-emerald-800" />
              <span>Letters</span>
            </Link>
          </div>

          {/* Categories Accordion */}
          <div className="bg-white p-2 rounded-2xl border border-emerald-950/5 shadow-xs">
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-emerald-800" />
                <span>Categories</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-emerald-950/50 transition-transform duration-200 ${
                  categoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {categoriesOpen && (
              <div className="grid grid-cols-2 gap-1.5 pt-2 pb-1 px-1 border-t border-emerald-950/5 mt-1">
                {categories.map((c) => (
                  <Link
                    key={c.name}
                    href={c.path}
                    onClick={handleClose}
                    className="block px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors truncate"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* About & Guidelines Accordion */}
          <div className="bg-white p-2 rounded-2xl border border-emerald-950/5 shadow-xs">
            <button
              type="button"
              onClick={() => setAboutOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-emerald-800" />
                <span>About & Guidelines</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-emerald-950/50 transition-transform duration-200 ${
                  aboutOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {aboutOpen && (
              <div className="space-y-1 pt-2 pb-1 px-1 border-t border-emerald-950/5 mt-1">
                <Link
                  href="/about"
                  onClick={handleClose}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors"
                >
                  Our Story & Vision
                </Link>
                <Link
                  href="/submit"
                  onClick={handleClose}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors"
                >
                  Submission Guidelines
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white p-2 rounded-2xl border border-emerald-950/5 shadow-xs">
            <Link
              href="/contact"
              onClick={handleClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-800" />
              <span>Contact Editorial</span>
            </Link>
          </div>

          {/* User Workspace Actions */}
          {user && (
            <div className="bg-white p-2 rounded-2xl border border-emerald-950/5 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 px-3.5 pt-1.5 block">
                Workspace
              </span>
              <Link
                href={`/profile/${user._id || user.id}`}
                onClick={handleClose}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-emerald-800" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 hover:bg-emerald-950/5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-800" />
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Drawer Bottom CTA */}
        <div className="p-4 border-t border-emerald-950/10 bg-white/80 backdrop-blur-md shrink-0">
          <Link
            href="/submit-piece"
            onClick={handleClose}
            className="w-full py-3 bg-emerald-950 text-cream-50 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-md active:scale-95"
          >
            <PenTool className="w-4 h-4" />
            <span>Submit Writing</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden flex items-center gap-1.5">
      {/* Quick Search Icon on Mobile Header */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="p-2 rounded-full text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer"
        aria-label="Open Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Hamburger 3-Line Menu Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 rounded-xl text-emerald-950 hover:bg-emerald-950/5 transition-colors cursor-pointer flex items-center justify-center"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Mount Portal to Document Body */}
      {mounted && createPortal(drawerContent, document.body)}
    </div>
  );
}
