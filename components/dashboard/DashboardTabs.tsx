"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Shield,
  Tag,
  Users,
  Plus,
  CheckCircle2,
  Clock,
  Heart,
  User,
  Trash2,
  Bell,
  Mail,
  Send,
  Menu,
  X,
  Globe,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { DashboardTab, AdminStats } from "@/types/dashboard";
import type { PublicArticle } from "@/types/article";
import type { UserRole } from "@/types/user";
import { isAdminRole, isEditorialRole } from "@/lib/roles";
import SearchBar from "./SearchBar";
import ModerationActions from "./ModerationActions";
import { useAuth } from "@/contexts/AuthContext";

const getStatusChipClass = (status: PublicArticle["status"]) => {
  if (status === "Published") return "bg-emerald-100 text-emerald-700";
  if (status === "Paused") return "bg-blue-100 text-blue-700";
  if (status === "Editing") return "bg-purple-100 text-purple-700";
  if (status === "Edited") return "bg-pink-100 text-pink-700";
  return "bg-amber-100 text-amber-700";
};

const TabLoadingFallback = () => (
  <div className="space-y-6 p-6 sm:p-8 bg-white rounded-[2.5rem] border border-emerald-950/5 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-6 w-48 bg-emerald-950/10 rounded-xl" />
      <div className="h-9 w-28 bg-emerald-950/5 rounded-full" />
    </div>
    <div className="h-4 w-72 bg-emerald-950/5 rounded-lg" />
    <div className="space-y-4 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-emerald-950/[0.04] rounded-2xl" />
      ))}
    </div>
  </div>
);

const AdminArticleManagement = dynamic(
  () => import("@/components/dashboard/AdminArticleManagment"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminCategoryManagement = dynamic(
  () => import("@/components/dashboard/AdminCategoryManagment"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminUserManagement = dynamic(
  () => import("@/components/dashboard/AdminUserManagment"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminArticleRecover = dynamic(
  () => import("@/components/dashboard/AdminArticleRecover"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminNotificationManager = dynamic(
  () => import("@/components/dashboard/AdminNotificationManager"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminNewsletterManager = dynamic(
  () => import("@/components/dashboard/AdminNewsletterManager"),
  { loading: () => <TabLoadingFallback /> },
);
const AdminEmailCenter = dynamic(
  () => import("@/components/dashboard/AdminEmailCenter"),
  { loading: () => <TabLoadingFallback /> },
);

interface DashboardTabsProps {
  user: {
    _id: string;
    firstName: string;
    surname: string;
    role: UserRole;
    avatar?: string;
    email?: string;
  };
  userArticles: PublicArticle[];
  pendingReviews: PublicArticle[];
  adminStats: AdminStats;
}

export default function DashboardTabs({
  user,
  userArticles,
  pendingReviews,
  adminStats,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("my-studio");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const published = userArticles.filter(
    (article) => article.status === "Published" || article.status === "Paused",
  );
  const pending = userArticles.filter(
    (article) =>
      article.status === "Pending" ||
      article.status === "Editing" ||
      article.status === "Edited",
  );
  const totalLikes = userArticles.reduce(
    (acc, curr) => acc + (curr.likes || 0),
    0,
  );
  const totalReads = userArticles.reduce(
    (acc, curr) => acc + (curr.reads || 0),
    0,
  );

  // Grouped Navigation Items
  const navSections = [
    {
      title: "Workspace",
      items: [
        {
          id: "my-studio" as DashboardTab,
          label: "My Studio",
          icon: LayoutDashboard,
          badge: pending.length > 0 ? `${pending.length} Pending` : undefined,
        },
      ],
    },
    ...(isEditorialRole(user.role)
      ? [
          {
            title: "Editorial & Content",
            items: [
              {
                id: "all-articles" as DashboardTab,
                label: "Article Control",
                icon: Shield,
                badge:
                  pendingReviews.length > 0
                    ? `${pendingReviews.length} Queue`
                    : undefined,
              },
              ...(isAdminRole(user.role)
                ? [
                    {
                      id: "category-management" as DashboardTab,
                      label: "Categories & Tags",
                      icon: Tag,
                    },
                    {
                      id: "deleted-articles" as DashboardTab,
                      label: "Recover Deleted",
                      icon: Trash2,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(isAdminRole(user.role)
      ? [
          {
            title: "Operations & Community",
            items: [
              {
                id: "user-management" as DashboardTab,
                label: "User Management",
                icon: Users,
              },
              {
                id: "notifications" as DashboardTab,
                label: "Notification Desk",
                icon: Bell,
              },
            ],
          },
          {
            title: "Outreach & Dispatch",
            items: [
              {
                id: "newsletter" as DashboardTab,
                label: "Newsletter Circulation",
                icon: Mail,
              },
              {
                id: "email-center" as DashboardTab,
                label: "Official Email Desk",
                icon: Send,
              },
            ],
          },
        ]
      : []),
  ];

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "my-studio":
        return "Author Studio & Submissions";
      case "all-articles":
        return "Global Article Control & Moderation";
      case "category-management":
        return "Category & Tag Architecture";
      case "deleted-articles":
        return "Article Recovery & Trash";
      case "user-management":
        return "User & Role Management";
      case "notifications":
        return "System Notification Center";
      case "newsletter":
        return "Newsletter & Subscriber Management";
      case "email-center":
        return "Official Email Dispatch Desk";
      default:
        return "Control Panel";
    }
  };

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] font-sans flex text-emerald-950">
      {/* MOBILE SIDEBAR BACKDROP */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-emerald-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-emerald-950 text-cream-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* SIDEBAR BRAND HEADER */}
          <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-cream-50 font-serif font-bold text-base shadow-sm group-hover:bg-white group-hover:text-emerald-950 transition-all">
                CD
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm tracking-wide text-white">
                  CHROMA DIARIES
                </h2>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-emerald-400">
                  {user.role} Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* USER CARD */}
          <div className="p-4 mx-4 my-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 overflow-hidden relative shrink-0">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.firstName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                    {user.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif font-bold text-xs text-white truncate">
                  {user.firstName} {user.surname}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-semibold">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="px-3 text-[9px] uppercase tracking-[0.25em] font-bold text-white/40">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer group ${
                          isActive
                            ? "bg-white text-emerald-950 font-bold shadow-md shadow-black/20"
                            : "text-cream-50/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                              isActive ? "text-emerald-900" : "text-emerald-400"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              isActive
                                ? "bg-emerald-950 text-cream-50"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isActive
                                ? "text-emerald-950 translate-x-0.5"
                                : "text-white/20 opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR FOOTER */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Link
              href="/submit-piece"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Writing</span>
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-cream-50/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                title="Return to home page"
              >
                <Globe className="w-3 h-3" />
                <span>Magazine</span>
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-cream-50/70 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDEBAR INSET */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* INSET TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-30 bg-[#fcfbf7]/90 backdrop-blur-md border-b border-emerald-950/10 px-6 sm:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 lg:hidden cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Section Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-950/40">
                <span>Admin Console</span>
                <span>/</span>
                <span className="text-emerald-800">{activeTab}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-emerald-950 truncate">
                {getActiveTabTitle()}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user._id}`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>

            <Link
              href="/submit-piece"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-emerald-950 text-cream-50 hover:bg-emerald-900 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-950/15"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write</span>
            </Link>
          </div>
        </header>

        {/* INSET MAIN CONTENT CONTAINER */}
        <main className="flex-1 p-6 sm:p-10 w-full w-full mx-auto">
          {/* TAB 1: MY STUDIO */}
          {activeTab === "my-studio" && (
            <div className="space-y-12 animate-fade-in">
              {/* STUDIO HERO BANNER */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-[#033b2e] to-emerald-900 text-cream-50 p-8 sm:p-10 shadow-2xl border border-emerald-800/40">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[10px] uppercase font-bold tracking-widest border border-white/10">
                    <Sparkles className="w-3 h-3" />
                    <span>Creative Sanctuary</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                    Welcome to your studio, {user.firstName}.
                  </h2>
                  <p className="text-cream-50/70 text-sm leading-relaxed italic">
                    &quot;Every secret of a writer&apos;s soul, every experience of his life, every quality of his mind, is written large in his works.&quot;
                  </p>
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(isAdminRole(user.role)
                  ? [
                      {
                        label: "Total Creators",
                        value: adminStats.totalUsers,
                        icon: Users,
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                      },
                      {
                        label: "Global Submissions",
                        value: adminStats.totalArticles,
                        icon: CheckCircle2,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                      {
                        label: "Pending Reviews",
                        value: adminStats.pendingArticles,
                        icon: Clock,
                        color: "text-amber-600",
                        bg: "bg-amber-50",
                      },
                      {
                        label: "Published Works",
                        value: adminStats.publishedArticles,
                        icon: LayoutDashboard,
                        color: "text-emerald-950",
                        bg: "bg-emerald-950/5",
                      },
                    ]
                  : [
                      {
                        label: "Published Works",
                        value: published.length,
                        icon: CheckCircle2,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                      {
                        label: "Pending Review",
                        value: pending.length,
                        icon: Clock,
                        color: "text-amber-600",
                        bg: "bg-amber-50",
                      },
                      {
                        label: "Total Admirers",
                        value: totalLikes,
                        icon: Heart,
                        color: "text-rose-600",
                        bg: "bg-rose-50",
                      },
                      {
                        label: "Total Reads",
                        value: totalReads,
                        icon: LayoutDashboard,
                        color: "text-emerald-950",
                        bg: "bg-emerald-950/5",
                      },
                    ]
                ).map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-3xl border border-emerald-950/5 shadow-xl shadow-emerald-950/5 group hover:-translate-y-1 transition-all"
                  >
                    <div
                      className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-serif font-bold text-emerald-950 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* MODERATION QUEUE (IF PENDING) */}
              {pendingReviews.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                      Moderation Queue
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-emerald-950">
                      Pending Approval
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingReviews.map((article) => (
                      <ModerationActions key={article._id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT SUBMISSIONS TABLE */}
              <div className="bg-white rounded-[2.5rem] border border-emerald-950/5 shadow-2xl shadow-emerald-950/5 overflow-hidden">
                <div className="p-8 border-b border-emerald-950/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-emerald-950">
                      Your Submissions
                    </h3>
                    <p className="text-xs text-emerald-950/60 mt-1">
                      Track the review stage, readership, and status of your written pieces.
                    </p>
                  </div>
                  <div className="w-full md:w-72">
                    <SearchBar
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                        <th className="w-[40%] px-8 py-5">Article Title</th>
                        <th className="w-[20%] px-8 py-5 text-center">Category</th>
                        <th className="w-[15%] px-8 py-5 text-center">Status</th>
                        <th className="w-[15%] px-8 py-5 text-center">Created Date</th>
                        <th className="w-[10%] px-8 py-5 text-center">Likes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/5">
                      {userArticles
                        .filter(
                          (article) =>
                            article.title
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            article.category?.name
                              ?.toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                        )
                        .map((article) => (
                          <tr
                            key={article._id}
                            className="group hover:bg-emerald-950/2 transition-colors cursor-pointer"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-950/5 overflow-hidden relative shrink-0 shadow-xs">
                                  <Image
                                    src={article.thumbnail as string}
                                    alt={article.title as string}
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    fill
                                    sizes="56px"
                                  />
                                </div>
                                <Link
                                  href={`/article/${article._id}`}
                                  className="group-hover:text-emerald-700 transition-colors"
                                >
                                  <span className="font-serif font-bold text-base text-emerald-950 group-hover:text-emerald-700 line-clamp-1 transition-colors">
                                    {article.title}
                                  </span>
                                </Link>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="px-3 py-1 bg-emerald-950/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-950">
                                {article.category?.name}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusChipClass(
                                  article.status,
                                )}`}
                              >
                                {article.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center text-xs text-emerald-950/50">
                              {article.createdAt
                                ? new Date(article.createdAt).toLocaleDateString()
                                : "Unknown"}
                            </td>
                            <td className="px-8 py-6 text-center font-serif font-bold text-emerald-950">
                              {article.likes}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === "user-management" && (
            <div className="animate-fade-in">
              <AdminUserManagement currentUser={user} />
            </div>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT */}
          {activeTab === "category-management" && (
            <div className="animate-fade-in">
              <AdminCategoryManagement />
            </div>
          )}

          {/* TAB 4: ARTICLE CONTROL */}
          {activeTab === "all-articles" && (
            <div className="animate-fade-in">
              <AdminArticleManagement currentUser={user} />
            </div>
          )}

          {/* TAB 5: DELETED ARTICLES RECOVERY */}
          {activeTab === "deleted-articles" && (
            <div className="animate-fade-in">
              <AdminArticleRecover />
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="animate-fade-in">
              <AdminNotificationManager />
            </div>
          )}

          {/* TAB 7: NEWSLETTER DESK */}
          {activeTab === "newsletter" && (
            <div className="animate-fade-in">
              <AdminNewsletterManager />
            </div>
          )}

          {/* TAB 8: EMAIL DISPATCH DESK */}
          {activeTab === "email-center" && (
            <div className="animate-fade-in">
              <AdminEmailCenter />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
