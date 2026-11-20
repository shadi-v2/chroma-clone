"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  BellRing,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmationContext";
import { gooeyToast } from "@/components/ui/goey-toaster";

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

export default function AdminNewsletterManager() {
  const { confirm } = useConfirm();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Add subscriber modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Reminder runner state
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<{
    checkedCount: number;
    remindersSent: number;
  } | null>(null);

  // Notification / Alert message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setActiveCount(data.activeCount || 0);
      } else {
        setFeedback({ type: "error", text: "Failed to load newsletter subscribers." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading subscribers." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id }),
      });
      if (res.ok) {
        fetchSubscribers();
        setFeedback({ type: "success", text: "Subscriber status updated." });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to update subscriber." });
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const ok = await confirm({
      title: "Remove Subscriber",
      message: "Are you sure you want to delete this subscriber from the mailing list?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSubscribers();
        gooeyToast.success("Subscriber removed successfully.");
      }
    } catch {
      gooeyToast.error("Failed to delete subscriber.");
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;

    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", email: newEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewEmail("");
        setShowAddModal(false);
        fetchSubscribers();
        setFeedback({ type: "success", text: "Subscriber added successfully!" });
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to add subscriber." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error adding subscriber." });
    } finally {
      setAddLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastContent) return;

    setBroadcastLoading(true);
    setBroadcastResult(null);

    try {
      const res = await fetch("/api/admin/newsletter/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: broadcastSubject,
          contentHtml: broadcastContent.replace(/\n/g, "<br />"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastResult({
          success: true,
          message: data.message || "Broadcast successfully dispatched!",
        });
        setBroadcastSubject("");
        setBroadcastContent("");
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastResult(null);
        }, 2500);
      } else {
        setBroadcastResult({
          success: false,
          message: data.message || "Failed to broadcast newsletter.",
        });
      }
    } catch {
      setBroadcastResult({
        success: false,
        message: "Network error while broadcasting newsletter.",
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleTriggerReminders = async () => {
    setReminderLoading(true);
    setReminderResult(null);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.result) {
        setReminderResult({
          checkedCount: data.result.checkedCount,
          remindersSent: data.result.remindersSent,
        });
        setFeedback({
          type: "success",
          text: `Inactivity scan completed: ${data.result.remindersSent} authors notified.`,
        });
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to trigger reminders." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error executing reminder scan." });
    } finally {
      setReminderLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "active") return matchesSearch && sub.is_active;
    if (statusFilter === "inactive") return matchesSearch && !sub.is_active;
    return matchesSearch;
  });

  return (
    <div className="space-y-12">
      {/* HEADER & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-950/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-950/5 text-emerald-950 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-950/10">
              Circulation Desk
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-emerald-950">
            Newsletter & Subscriptions
          </h2>
          <p className="text-emerald-950/60 text-sm mt-1">
            Manage your audience, broadcast editions, and trigger automated writing reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerReminders}
            disabled={reminderLoading}
            className="flex items-center gap-2 px-5 py-3.5 bg-amber-500/10 text-amber-900 border border-amber-500/20 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Scan authors who have not submitted in 30 days and send gentle in-app & email reminders"
          >
            {reminderLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            ) : (
              <BellRing className="w-4 h-4 text-amber-700" />
            )}
            <span>Scan 30-Day Inactive Authors</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Subscriber</span>
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-950 text-cream-50 hover:bg-emerald-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/15 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast Edition</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* REMINDER SCAN BANNER */}
      {reminderResult && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold text-sm">30-Day Inactivity Scan Summary</p>
              <p className="text-xs text-amber-900/80">
                Checked {reminderResult.checkedCount} authors • Successfully pushed reminders to{" "}
                <strong>{reminderResult.remindersSent}</strong> authors.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReminderResult(null)}
            className="text-xs text-amber-800 underline font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-emerald-950/5 shadow-xl shadow-emerald-950/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-950">{activeCount}</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-950/40 mt-1">
            Active Subscribers
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-emerald-950/5 shadow-xl shadow-emerald-950/5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-700 mb-4">
            <Send className="w-5 h-5" />
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-950">{subscribers.length}</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-950/40 mt-1">
            Total All-Time Subscribers
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-emerald-950/5 shadow-xl shadow-emerald-950/5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-950">
            {subscribers.length > 0
              ? `${Math.round((activeCount / subscribers.length) * 100)}%`
              : "100%"}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-950/40 mt-1">
            Retention Rate
          </div>
        </div>
      </div>

      {/* SUBSCRIBERS TABLE & FILTERS */}
      <div className="bg-white rounded-[2.5rem] border border-emerald-950/5 shadow-2xl shadow-emerald-950/5 overflow-hidden">
        <div className="p-8 border-b border-emerald-950/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-950/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscriber email..."
                className="pl-11 pr-4 py-2.5 rounded-full border border-emerald-950/10 bg-emerald-950/2 text-xs text-emerald-950 placeholder-emerald-950/40 focus:outline-none focus:border-emerald-950/30 w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-emerald-950/5 p-1 rounded-full text-xs">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full capitalize font-semibold transition-all cursor-pointer ${
                    statusFilter === filter
                      ? "bg-white text-emerald-950 shadow-sm"
                      : "text-emerald-950/50 hover:text-emerald-950"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-emerald-950/60 hover:text-emerald-950 transition-colors cursor-pointer self-end md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-8 py-5">Email Address</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-center">Subscribed On</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-emerald-950/40">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading subscriber records...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-emerald-950/40 font-medium">
                    No subscribers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-emerald-950/2 transition-colors">
                    <td className="px-8 py-5 font-medium text-emerald-950 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-950/5 flex items-center justify-center text-emerald-950/60 font-bold text-xs">
                        {sub.email.charAt(0).toUpperCase()}
                      </div>
                      <span>{sub.email}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          sub.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sub.is_active ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-500" />
                            <span>Unsubscribed</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center text-xs text-emerald-950/50">
                      {new Date(sub.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(sub.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          sub.is_active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {sub.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUBSCRIBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-emerald-950/10">
            <h3 className="text-2xl font-serif font-bold text-emerald-950 mb-2">
              Add Subscriber Manually
            </h3>
            <p className="text-xs text-emerald-950/60 mb-6">
              Enter an email to manually register them for Chroma Diaries newsletter dispatches.
            </p>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950/60 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-emerald-950/5 text-emerald-950 font-semibold text-xs hover:bg-emerald-950/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-3 rounded-xl bg-emerald-950 text-cream-50 font-semibold text-xs hover:bg-emerald-900 cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? "Adding..." : "Add to List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-emerald-950/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  Broadcast Dispatch
                </span>
                <h3 className="text-2xl font-serif font-bold text-emerald-950">
                  Send Newsletter Edition
                </h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {activeCount} Active Recipients
              </div>
            </div>

            <p className="text-xs text-emerald-950/60 mb-6">
              This email will be dispatched to all {activeCount} active subscribers with a customized
              1-click unsubscribe footer.
            </p>

            {broadcastResult && (
              <div
                className={`p-4 rounded-2xl mb-6 text-sm flex items-center gap-3 ${
                  broadcastResult.success
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {broadcastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{broadcastResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950/60 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Chroma Diaries Edition #12: The Philosophy of Solitude"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950/60 mb-2">
                  Newsletter Content (HTML or Markdown text)
                </label>
                <textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Dear Readers,&#10;&#10;Welcome to this week's edition. We are thrilled to share our latest pieces..."
                  rows={8}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm font-sans leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowBroadcastModal(false);
                    setBroadcastResult(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-950/5 text-emerald-950 font-semibold text-xs hover:bg-emerald-950/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading || activeCount === 0}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-950 text-cream-50 font-semibold text-xs hover:bg-emerald-900 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-950/20"
                >
                  {broadcastLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to {activeCount} readers...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Broadcast Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
