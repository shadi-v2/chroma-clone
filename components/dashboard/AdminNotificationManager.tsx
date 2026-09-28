"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Send,
  Trash2,
  Search,
  Sparkles,
  RotateCcw,
  Bell,
  Globe,
  Users,
} from "lucide-react";
import Image from "next/image";

import { api } from "@/services/api";
import type { PublicUser } from "@/types/user";

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  readBy?: string[];
  isGlobal?: boolean;
  recipients?: string[];
}

type NotifSort = "newest" | "oldest" | "title-asc";

export default function AdminNotificationManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  // History filtering & sorting
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [historySort, setHistorySort] = useState<NotifSort>("newest");

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.users.listAll();
      setUsers(
        data.filter(
          (u) => u.email?.toLowerCase() !== "shahinshadi1122@gmail.com",
        ),
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    fetchUsers();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      return;
    }

    if (!isGlobal && selectedRecipients.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    try {
      setLoading(true);

      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          isGlobal,
          recipients: isGlobal ? [] : selectedRecipients,
        }),
      });

      setTitle("");
      setMessage("");
      setSelectedRecipients([]);

      await fetchNotifications();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      await fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.surname}`.toLowerCase();
      const email = u.email.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [users, searchQuery]);

  const filteredAndSortedNotifications = useMemo(() => {
    const result = notifications.filter((notif) => {
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const matchTitle = notif.title?.toLowerCase().includes(query);
        const matchMsg = notif.message?.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg) return false;
      }

      if (historyFilter === "global") {
        if (notif.isGlobal === false) return false;
      } else if (historyFilter === "targeted") {
        if (notif.isGlobal !== false) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      switch (historySort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [notifications, historySearch, historyFilter, historySort]);

  return (
    <div className="space-y-8">
      {/* COMPOSE NOTIFICATION CARD */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-emerald-950/5 overflow-hidden">
        <div className="p-8 md:p-10 border-b border-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/5 flex items-center justify-center text-emerald-950">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-emerald-950">
                Compose Announcement
              </h2>
              <p className="text-emerald-950/40 text-xs mt-0.5">
                Send manual announcements or targeted updates to users.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title..."
            className="w-full bg-cream-50 border border-emerald-950/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-950/10 transition-all placeholder:text-emerald-950/30 text-sm font-medium text-emerald-950"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write announcement message content..."
            rows={4}
            className="w-full bg-cream-50 border border-emerald-950/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-950/10 transition-all placeholder:text-emerald-950/30 text-sm font-medium text-emerald-950 resize-none"
          />

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-emerald-950/50">
              Target Audience
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsGlobal(true)}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer border flex items-center justify-center gap-2 ${
                  isGlobal
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-md"
                    : "bg-emerald-950/5 text-emerald-950/60 border-transparent hover:bg-emerald-950/10"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                All Users (Global Broadcast)
              </button>
              <button
                type="button"
                onClick={() => setIsGlobal(false)}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer border flex items-center justify-center gap-2 ${
                  !isGlobal
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-md"
                    : "bg-emerald-950/5 text-emerald-950/60 border-transparent hover:bg-emerald-950/10"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Specific Recipients
              </button>
            </div>
          </div>

          {!isGlobal && (
            <div className="space-y-4 border border-emerald-950/5 rounded-3xl p-6 bg-cream-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
                  <input
                    type="text"
                    placeholder="Filter users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white rounded-xl border border-emerald-950/10 pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-950/10 text-xs font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecipients(users.map((u) => u._id))}
                    className="px-3.5 py-2 rounded-xl border border-emerald-950/10 bg-white hover:bg-emerald-950/5 text-[10px] font-bold tracking-wider uppercase text-emerald-950 cursor-pointer transition-all"
                  >
                    Select All ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipients([])}
                    className="px-3.5 py-2 rounded-xl border border-emerald-950/10 bg-white hover:bg-red-50 text-[10px] font-bold tracking-wider uppercase text-red-600 cursor-pointer transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-emerald-950/5 bg-white border border-emerald-950/10 rounded-2xl shadow-inner">
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-950/40 font-medium">
                    No matching users found
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedRecipients.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-emerald-700/5 cursor-pointer transition-all select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedRecipients((prev) =>
                                prev.filter((id) => id !== u._id),
                              );
                            } else {
                              setSelectedRecipients((prev) => [...prev, u._id]);
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-950 border-emerald-950/20 focus:ring-emerald-950/20 cursor-pointer"
                        />
                        {u.avatar ? (
                          <Image
                            src={u.avatar}
                            alt={u.firstName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-emerald-950/10"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-950 text-white flex items-center justify-center font-bold text-xs">
                            {u.firstName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-emerald-950 truncate">
                            {u.firstName} {u.surname}
                          </p>
                          <p className="text-[10px] text-emerald-950/40 truncate">
                            {u.email}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-950/50 bg-emerald-950/5 px-2 py-1 rounded-md">
                          {u.role}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="text-xs text-emerald-950/60 font-bold tracking-wider">
                {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? "s" : ""} selected
              </div>
            </div>
          )}

          <button
            onClick={sendNotification}
            disabled={loading || !title.trim() || !message.trim()}
            className="px-8 py-4 bg-emerald-950 text-cream-50 rounded-2xl cursor-pointer font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
          >
            <Send className="w-4 h-4" />
            {loading ? "Broadcasting..." : "Send Announcement"}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS HISTORY & FILTERING */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-emerald-950/5 overflow-hidden">
        <div className="p-8 md:p-10 border-b border-emerald-950/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-emerald-950">
                Announcements History
              </h2>
              <p className="text-emerald-950/40 text-xs mt-0.5">
                Review and manage previously dispatched announcements.
              </p>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-950/40 bg-emerald-950/5 px-4 py-2 rounded-full self-start sm:self-auto">
              {filteredAndSortedNotifications.length} of {notifications.length} logged
            </span>
          </div>

          {/* SEARCH & SORT CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
              <input
                type="text"
                placeholder="Search history by title or text..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
              />
            </div>

            <div>
              <select
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as NotifSort)}
                className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
              >
                <option value="newest">Sort: Dispatched Recently</option>
                <option value="oldest">Sort: Dispatched Oldest</option>
                <option value="title-asc">Sort: Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* SUGGESTION FILTER PILLS */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/40 mr-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Filter Suggestions:</span>
            </div>

            <button
              onClick={() => setHistoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                historyFilter === "all"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              All Broadcasts ({notifications.length})
            </button>

            <button
              onClick={() => setHistoryFilter(historyFilter === "global" ? "all" : "global")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                historyFilter === "global"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              Global Only ({notifications.filter((n) => n.isGlobal !== false).length})
            </button>

            <button
              onClick={() => setHistoryFilter(historyFilter === "targeted" ? "all" : "targeted")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                historyFilter === "targeted"
                  ? "bg-emerald-950 text-cream-50 border-emerald-950"
                  : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
              }`}
            >
              Targeted ({notifications.filter((n) => n.isGlobal === false).length})
            </button>

            {historySearch && (
              <button
                onClick={() => setHistorySearch("")}
                className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 hover:text-red-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="divide-y divide-emerald-950/5">
          {filteredAndSortedNotifications.length === 0 ? (
            <div className="p-12 text-center text-emerald-950/40">
              <p className="font-serif text-lg font-medium text-emerald-950/60 mb-1">
                No notifications match criteria
              </p>
              <p className="text-xs">Try clearing search or filters.</p>
            </div>
          ) : (
            filteredAndSortedNotifications.map((notification) => (
              <div
                key={notification._id}
                className="px-8 md:px-10 py-6 flex justify-between items-start md:items-center gap-4 group hover:bg-emerald-700/5 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-base font-serif font-bold text-emerald-950 truncate max-w-md">
                      {notification.title}
                    </h4>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        notification.isGlobal ?? true
                          ? "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/10"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {notification.isGlobal ?? true
                        ? "Global Broadcast"
                        : `Targeted (${notification.recipients?.length || 0})`}
                    </span>
                    <span className="text-[10px] text-emerald-950/40">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-950/70 leading-relaxed max-w-2xl line-clamp-2">
                    {notification.message}
                  </p>
                </div>

                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all cursor-pointer shrink-0"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
