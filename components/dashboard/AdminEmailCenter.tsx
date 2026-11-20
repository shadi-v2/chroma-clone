"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  UserCheck,
  History,
  Layers,
  Check,
  X,
} from "lucide-react";
import { api } from "@/services/api";
import type { PublicUser } from "@/types/user";
import VisualEmailBuilder from "@/components/dashboard/VisualEmailBuilder";
import ChromadiariesLogoArranger from "@/components/dashboard/ChromadiariesLogoArranger";
import TemplateLayoutStarters from "@/components/dashboard/TemplateLayoutStarters";
import { renderEmailTemplate } from "@/lib/emailWrapper";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content_html: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface SentEmailRecord {
  id: string;
  to_email: string;
  subject: string;
  content_html: string;
  sender_name: string;
  sender_user_name?: string;
  sender_email?: string;
  status: string;
  created_at: string;
}

export default function AdminEmailCenter() {
  const [activeSubTab, setActiveSubTab] = useState<"compose" | "templates" | "history">("compose");

  // Compose State
  const [toEmail, setToEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [senderName, setSenderName] = useState("Chroma Diaries Editorial");
  const [senderEmail, setSenderEmail] = useState("editorial@chromadiaries.in");
  const [customSenderPrefix, setCustomSenderPrefix] = useState("");
  const [sending, setSending] = useState(false);
  const [cursorInsertFn, setCursorInsertFn] = useState<((html: string) => void) | null>(null);
  const [templateCursorInsertFn, setTemplateCursorInsertFn] = useState<((html: string) => void) | null>(null);
  const [modalPreviewMode, setModalPreviewMode] = useState<"edit" | "preview">("edit");

  // Template Data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Template Creator/Editor Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Editorial");
  const [templateContent, setTemplateContent] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // History State
  const [history, setHistory] = useState<SentEmailRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [viewingHistoryEmail, setViewingHistoryEmail] = useState<SentEmailRecord | null>(null);

  // User Selection Dropdown
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hidden File Input for HTML Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);

  // Load Templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/email/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      console.error("Failed to load templates");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Load History
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/email/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      console.error("Failed to load email history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load Registered Users
  const fetchUsers = useCallback(async () => {
    try {
      const allUsers = await api.users.listAll();
      setUsers(allUsers.filter((u) => u.email?.toLowerCase() !== "shahinshadi1122@gmail.com"));
    } catch {
      console.error("Failed to load users");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
    fetchUsers();
  }, [fetchTemplates, fetchUsers]);

  useEffect(() => {
    if (activeSubTab === "history") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchHistory();
    }
  }, [activeSubTab, fetchHistory]);

  // Handle template selection in Composer
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = templates.find((item) => item.id === templateId);
    if (t) {
      let finalSub = t.subject;
      let finalContent = t.content_html;

      if (recipientName) {
        finalSub = finalSub.replace(/{{name}}/g, recipientName);
        finalContent = finalContent.replace(/{{name}}/g, recipientName);
      }
      setSubject(finalSub);
      setHtmlContent(finalContent);
      setFeedback({ type: "success", text: `Loaded template: "${t.name}"` });
    }
  };

  // Handle User selection from quick dropdown
  const handleSelectUser = (user: PublicUser) => {
    setToEmail(user.email);
    const fullName = `${user.firstName} ${user.surname}`.trim();
    setRecipientName(fullName);
    setShowUserDropdown(false);

    // If template is already populated with placeholders, replace {{name}}
    if (htmlContent.includes("{{name}}")) {
      setHtmlContent((prev) => prev.replace(/{{name}}/g, fullName));
    }
    if (subject.includes("{{name}}")) {
      setSubject((prev) => prev.replace(/{{name}}/g, fullName));
    }
  };

  // HTML File Import Handler for Composer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setHtmlContent(content);
        setFeedback({
          type: "success",
          text: `Imported HTML template: "${file.name}". You can now arrange the Chromadiaries logo in your template below!`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // HTML File Import Handler for Template Creator
  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTemplateContent(content);
        if (!templateName) {
          setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
        }
        setFeedback({
          type: "success",
          text: `Imported HTML template: "${file.name}". You can now arrange the Chromadiaries logo in your template!`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Send Email Handler
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !subject || !htmlContent) {
      setFeedback({ type: "error", text: "Please fill in recipient email, subject, and content." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const resolvedFromEmail = senderEmail === "custom"
        ? (customSenderPrefix.trim() ? (customSenderPrefix.includes("@") ? customSenderPrefix.trim() : `${customSenderPrefix.trim()}@chromadiaries.in`) : "editorial@chromadiaries.in")
        : senderEmail;

      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: toEmail.trim(),
          subject: subject.trim(),
          htmlContent: htmlContent.trim(),
          senderName: senderName.trim(),
          fromEmail: resolvedFromEmail,
          wrapTemplate: false,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: data.message || `Official email sent to ${toEmail}!` });
        setToEmail("");
        setRecipientName("");
        setSubject("");
        setHtmlContent("");
        setSelectedTemplateId("");
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to send email." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error sending email." });
    } finally {
      setSending(false);
    }
  };

  // Save Template Handler
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !templateSubject || !templateContent) {
      alert("Please fill in template name, subject, and content.");
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: templateName.trim(),
          subject: templateSubject.trim(),
          contentHtml: templateContent.trim(),
          category: templateCategory.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowTemplateModal(false);
        setEditingTemplate(null);
        setTemplateName("");
        setTemplateSubject("");
        setTemplateContent("");
        fetchTemplates();
        setFeedback({ type: "success", text: data.message || "Template saved successfully!" });
      } else {
        alert(data.message || "Failed to save template.");
      }
    } catch {
      alert("Network error saving template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Template Handler
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/email/templates?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTemplates();
        setFeedback({ type: "success", text: `Template "${name}" deleted.` });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to delete template." });
    }
  };

  // Use Template in Composer
  const handleUseInComposer = (template: EmailTemplate) => {
    setSubject(template.subject);
    setHtmlContent(template.content_html);
    setSelectedTemplateId(template.id);
    setActiveSubTab("compose");
    setFeedback({ type: "success", text: `Loaded template: "${template.name}" into composer.` });
  };

  // Filtered Users for Search
  const filteredUsers = users.filter((u) => {
    const search = userSearchQuery.toLowerCase();
    const fullName = `${u.firstName} ${u.surname}`.toLowerCase();
    return fullName.includes(search) || u.email.toLowerCase().includes(search);
  });

  // Filtered History
  const filteredHistory = history.filter((item) => {
    const search = historySearch.toLowerCase();
    return (
      item.to_email.toLowerCase().includes(search) ||
      item.subject.toLowerCase().includes(search) ||
      (item.sender_name && item.sender_name.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-10">
      {/* HIDDEN FILE INPUTS */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".html,.htm"
        className="hidden"
      />
      <input
        type="file"
        ref={templateFileInputRef}
        onChange={handleTemplateFileUpload}
        accept=".html,.htm"
        className="hidden"
      />

      {/* HEADER & SUB-NAV */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-950/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-950/5 text-emerald-950 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-950/10">
              Official Desk
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-emerald-950">
            Email Dispatch Center
          </h2>
          <p className="text-emerald-950/60 text-sm mt-1">
            Dispatch official letterheads, manage reusable templates, and import HTML designs directly from the web magazine.
          </p>
        </div>

        {/* SUB TABS SWITCHER */}
        <div className="flex items-center gap-2 bg-emerald-950/5 p-1.5 rounded-2xl border border-emerald-950/10 self-start lg:self-auto">
          <button
            onClick={() => setActiveSubTab("compose")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "compose"
                ? "bg-emerald-950 text-cream-50 shadow-md"
                : "text-emerald-950/60 hover:text-emerald-950"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose & Send</span>
          </button>

          <button
            onClick={() => setActiveSubTab("templates")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "templates"
                ? "bg-emerald-950 text-cream-50 shadow-md"
                : "text-emerald-950/60 hover:text-emerald-950"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Template Library</span>
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "history"
                ? "bg-emerald-950 text-cream-50 shadow-md"
                : "text-emerald-950/60 hover:text-emerald-950"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Dispatched Log</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm animate-fade-in ${
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

      {/* TAB 1: COMPOSE & SEND */}
      {activeSubTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COMPOSER FORM (7 COLS) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-emerald-950/5 shadow-2xl shadow-emerald-950/5 space-y-6">
            <form onSubmit={handleSendEmail} className="space-y-6">
              {/* SENDER & TEMPLATE SELECTION BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-emerald-950/5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/50 mb-2">
                    Sender Persona
                  </label>
                  <select
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-950/15 bg-emerald-950/2 text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-950"
                  >
                    <option value="Chroma Diaries Editorial">Chroma Diaries Editorial</option>
                    <option value="Chroma Diaries Administration">Chroma Diaries Administration</option>
                    <option value="Editor-in-Chief | Chroma Diaries">Editor-in-Chief | Chroma Diaries</option>
                    <option value="Author Relations Desk">Author Relations Desk</option>
                    <option value="Chroma Literary Collective">Chroma Literary Collective</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/50 mb-2">
                    From Address
                  </label>
                  <select
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-950/15 bg-emerald-950/2 text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-950 truncate"
                  >
                    <option value="editorial@chromadiaries.in">editorial@chromadiaries.in</option>
                    <option value="newsletter@chromadiaries.in">newsletter@chromadiaries.in</option>
                    <option value="dispatch@chromadiaries.in">dispatch@chromadiaries.in</option>
                    <option value="contact@chromadiaries.in">contact@chromadiaries.in</option>
                    <option value="curator@chromadiaries.in">curator@chromadiaries.in</option>
                    <option value="custom">Custom address...</option>
                  </select>
                  {senderEmail === "custom" && (
                    <div className="mt-2 flex items-center bg-emerald-950/5 rounded-xl border border-emerald-950/15 px-2.5 py-1">
                      <input
                        type="text"
                        placeholder="e.g. awards"
                        value={customSenderPrefix}
                        onChange={(e) => setCustomSenderPrefix(e.target.value)}
                        className="w-full bg-transparent text-xs font-medium text-emerald-950 outline-none placeholder:text-emerald-950/30"
                      />
                      <span className="text-[10px] font-bold text-emerald-950/60 ml-1 shrink-0">@chromadiaries.in</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/50 mb-2">
                    Apply Saved Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-950/15 bg-emerald-950/2 text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-950"
                  >
                    <option value="">-- Choose a template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RECIPIENT INPUT WITH USER PICKER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                    To Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Pick Registered Author</span>
                    </button>

                    {/* USER PICKER POPUP */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-8 z-30 w-80 bg-white rounded-2xl shadow-2xl border border-emerald-950/10 p-3 space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by author name or email..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-emerald-950"
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                          {filteredUsers.length === 0 ? (
                            <p className="text-xs text-gray-400 p-3 text-center">No users found</p>
                          ) : (
                            filteredUsers.slice(0, 20).map((u) => (
                              <button
                                key={u._id}
                                type="button"
                                onClick={() => handleSelectUser(u)}
                                className="w-full text-left p-2 hover:bg-emerald-50 rounded-lg text-xs transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <div className="font-semibold text-emerald-950">
                                    {u.firstName} {u.surname}
                                  </div>
                                  <div className="text-[10px] text-gray-500">{u.email}</div>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  {u.role}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm"
                  />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient Name (optional)"
                    className="w-48 px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm hidden sm:block"
                  />
                </div>
              </div>

              {/* SUBJECT LINE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Official Publication Notice from Chroma Diaries"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm font-serif font-semibold"
                />
              </div>

              {/* 1-CLICK HTML LAYOUT STARTERS */}
              <TemplateLayoutStarters
                onSelectLayout={(layoutHtml, layoutName) => {
                  setHtmlContent(layoutHtml);
                  setFeedback({
                    type: "success",
                    text: `Applied "${layoutName}" layout starter. The layout is 100% editable HTML!`,
                  });
                }}
                currentHtmlLength={htmlContent.length}
              />

              {/* MESSAGE CONTENT & TOOLBAR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Email Message Content & Layout HTML <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10 text-xs font-bold transition-all cursor-pointer"
                      title="Upload an .html file from your computer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import HTML File</span>
                    </button>
                  </div>
                </div>

                <VisualEmailBuilder
                  value={htmlContent}
                  onChange={setHtmlContent}
                  onRegisterInsertHtml={setCursorInsertFn}
                  placeholder="Click here to type your email message visually. Use the toolbar above to style text, or click 'Insert Shape / Design' to add buttons, badges, and cards with single clicks..."
                  minHeight="320px"
                />

                <div className="flex items-center justify-between mt-2 text-[11px] text-emerald-950/50">
                  <span>
                    Supported variables: <code className="bg-emerald-950/5 px-1 rounded font-bold">{"{{name}}"}</code>, <code className="bg-emerald-950/5 px-1 rounded font-bold">{"{{title}}"}</code>, <code className="bg-emerald-950/5 px-1 rounded font-bold">{"{{subject}}"}</code>
                  </span>
                  <span>{htmlContent.length} chars</span>
                </div>
              </div>

              {/* CHROMADIARIES LOGO ARRANGER */}
              <ChromadiariesLogoArranger
                htmlContent={htmlContent}
                onChangeHtml={setHtmlContent}
                onInsertAtCursor={cursorInsertFn || undefined}
                label="Arrange Chromadiaries Logo in Template"
                defaultExpanded={true}
              />

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setToEmail("");
                    setSubject("");
                    setHtmlContent("");
                    setSelectedTemplateId("");
                  }}
                  className="px-6 py-4 rounded-2xl bg-emerald-950/5 text-emerald-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-950/10 transition-all cursor-pointer"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-4 rounded-2xl bg-emerald-950 text-cream-50 font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 transition-all cursor-pointer shadow-xl shadow-emerald-950/15 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Official Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* LIVE PREVIEW (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-950/60">
                <Eye className="w-4 h-4 text-emerald-800" />
                <span>Live Client Email Preview</span>
              </div>
              <span className="text-[10px] text-emerald-950/60 uppercase font-bold bg-emerald-950/5 px-2.5 py-0.5 rounded-full border border-emerald-950/10">
                Pure HTML Template Layout
              </span>
            </div>

            {/* PREVIEW FRAME */}
            <div className="rounded-[2.5rem] border border-emerald-950/15 p-3 shadow-xl overflow-hidden bg-white">
              <iframe
                title="Live Email Preview"
                srcDoc={renderEmailTemplate(
                  subject || "Subject line will appear here...",
                  htmlContent ||
                    "<div style='text-align: center; padding: 60px 20px; color: #9ca3af; font-family: sans-serif;'><p style='font-size: 16px; margin-bottom: 8px;'>✨ Your email template layout will render here in real-time...</p><p style='font-size: 13px; color: #94a3b8;'>Select a template, apply an HTML layout starter, import an HTML file, or arrange the Chromadiaries logo.</p></div>",
                )}
                className="w-full h-[660px] rounded-2xl border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE LIBRARY & CREATOR */}
      {activeSubTab === "templates" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-emerald-950">
                Official & Custom Email Templates
              </h3>
              <p className="text-xs text-emerald-950/60 mt-0.5">
                Manage, edit, and create reusable templates for editorial and administrative correspondence.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => templateFileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-950/5 text-emerald-950 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-950/10 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import HTML Template</span>
              </button>

              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateName("");
                  setTemplateSubject("");
                  setTemplateCategory("Editorial");
                  setTemplateContent("");
                  setShowTemplateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-950 text-cream-50 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all cursor-pointer shadow-lg shadow-emerald-950/15"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Template</span>
              </button>
            </div>
          </div>

          {/* TEMPLATES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatesLoading ? (
              <div className="col-span-full py-16 text-center text-emerald-950/40">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full py-16 text-center text-emerald-950/40">
                No templates found. Create your first template above!
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white p-7 rounded-[2rem] border border-emerald-950/5 shadow-xl shadow-emerald-950/5 flex flex-col justify-between group hover:border-emerald-950/20 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                        {template.category}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateName(template.name);
                            setTemplateSubject(template.subject);
                            setTemplateCategory(template.category);
                            setTemplateContent(template.content_html);
                            setShowTemplateModal(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-950/60 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit template"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-emerald-950 group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {template.name}
                    </h4>

                    <p className="text-xs text-emerald-950/60 font-medium line-clamp-1">
                      <strong>Subject:</strong> {template.subject}
                    </p>

                    <div className="p-3.5 rounded-xl bg-emerald-950/2 border border-emerald-950/5 text-[11px] text-gray-600 line-clamp-4 leading-relaxed font-serif">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: template.content_html.replace(/<[^>]+>/g, " ").slice(0, 150) + "...",
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-emerald-950/5 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-950/40 uppercase font-bold tracking-widest">
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleUseInComposer(template)}
                      className="px-4 py-2 rounded-xl bg-emerald-950 text-cream-50 hover:bg-emerald-900 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Use in Compose</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCHED HISTORY LOG */}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-[2.5rem] border border-emerald-950/5 shadow-2xl shadow-emerald-950/5 overflow-hidden">
          <div className="p-8 border-b border-emerald-950/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-950/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search dispatched emails..."
                className="pl-11 pr-4 py-2.5 rounded-full border border-emerald-950/10 bg-emerald-950/2 text-xs text-emerald-950 placeholder-emerald-950/40 focus:outline-none focus:border-emerald-950/30 w-72"
              />
            </div>

            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="flex items-center gap-2 text-xs font-bold text-emerald-950/60 hover:text-emerald-950 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                  <th className="px-8 py-5">Recipient</th>
                  <th className="px-8 py-5">Subject</th>
                  <th className="px-8 py-5 text-center">Sender Persona</th>
                  <th className="px-8 py-5 text-center">Date Dispatched</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5">
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-emerald-950/40">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading dispatched email logs...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-emerald-950/40 font-medium">
                      No sent email records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-950/2 transition-colors">
                      <td className="px-8 py-5 font-semibold text-emerald-950">{item.to_email}</td>
                      <td className="px-8 py-5 font-serif font-medium text-emerald-950/90 max-w-xs truncate">
                        {item.subject}
                      </td>
                      <td className="px-8 py-5 text-center text-xs text-emerald-950/60 font-medium">
                        {item.sender_name || "Official Editorial"}
                      </td>
                      <td className="px-8 py-5 text-center text-xs text-emerald-950/50">
                        {new Date(item.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "Sent"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status === "Sent" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => setViewingHistoryEmail(item)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEMPLATE CREATOR / EDITOR MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-950/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  Template Studio
                </span>
                <h3 className="text-2xl font-serif font-bold text-emerald-950">
                  {editingTemplate ? "Edit Email Template" : "Create New Email Template"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-emerald-950/5 p-1 rounded-xl border border-emerald-950/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode("edit")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modalPreviewMode === "edit"
                        ? "bg-emerald-950 text-cream-50 shadow-xs"
                        : "text-emerald-950/60 hover:text-emerald-950"
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode("preview")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modalPreviewMode === "preview"
                        ? "bg-emerald-950 text-cream-50 shadow-xs"
                        : "text-emerald-950/60 hover:text-emerald-950"
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Special Interview Invite"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm bg-white"
                  >
                    <option value="Editorial">Editorial</option>
                    <option value="Spotlight">Spotlight</option>
                    <option value="Official">Official</option>
                    <option value="Dispatch">Dispatch</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                  Default Subject Line
                </label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="e.g. Notice regarding your submission '{{title}}'"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 focus:outline-none focus:border-emerald-950 text-sm font-serif"
                />
              </div>

              {modalPreviewMode === "preview" ? (
                <div className="rounded-2xl border border-emerald-950/15 p-2 bg-emerald-950/2">
                  <iframe
                    title="Template Live Preview"
                    srcDoc={renderEmailTemplate(
                      templateSubject || "Subject Preview",
                      templateContent || "<p style='text-align:center;color:#9ca3af;padding:40px;'>Template is empty. Switch back to Editor to design your layout.</p>",
                    )}
                    className="w-full h-[450px] rounded-xl border-none bg-white"
                  />
                </div>
              ) : (
                <>
                  {/* HTML LAYOUT STARTERS */}
                  <TemplateLayoutStarters
                    onSelectLayout={(layoutHtml, layoutName) => {
                      setTemplateContent(layoutHtml);
                      if (!templateName) setTemplateName(layoutName);
                    }}
                    currentHtmlLength={templateContent.length}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Template HTML & Visual Layout
                      </label>
                      <button
                        type="button"
                        onClick={() => templateFileInputRef.current?.click()}
                        className="text-xs text-emerald-700 font-bold underline cursor-pointer"
                      >
                        Import .html file
                      </button>
                    </div>

                    <VisualEmailBuilder
                      value={templateContent}
                      onChange={setTemplateContent}
                      onRegisterInsertHtml={setTemplateCursorInsertFn}
                      placeholder="Design your reusable template visually. Click 'Insert Shape / Design' to place badges, buttons, ribbons, or quote boxes with zero HTML typing..."
                      minHeight="280px"
                    />
                  </div>

                  {/* LOGO ARRANGER IN TEMPLATE STUDIO */}
                  <ChromadiariesLogoArranger
                    htmlContent={templateContent}
                    onChangeHtml={setTemplateContent}
                    onInsertAtCursor={templateCursorInsertFn || undefined}
                    label="Arrange Chromadiaries Logo in Template"
                    defaultExpanded={false}
                  />
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-emerald-950/5 text-emerald-950 font-semibold text-xs hover:bg-emerald-950/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="flex-1 py-3 rounded-xl bg-emerald-950 text-cream-50 font-semibold text-xs hover:bg-emerald-900 cursor-pointer disabled:opacity-50"
                >
                  {savingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* VIEW SENT EMAIL MODAL */}
      {viewingHistoryEmail && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-emerald-950/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/10 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  Dispatched Record
                </span>
                <h3 className="text-xl font-serif font-bold text-emerald-950">
                  {viewingHistoryEmail.subject}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  To: <strong>{viewingHistoryEmail.to_email}</strong> • From:{" "}
                  <strong>{viewingHistoryEmail.sender_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewingHistoryEmail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#fcfbf7] p-6 rounded-2xl border border-emerald-950/10 prose prose-sm max-w-none text-gray-800">
              <div dangerouslySetInnerHTML={{ __html: viewingHistoryEmail.content_html }} />
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setViewingHistoryEmail(null)}
                className="px-6 py-2.5 rounded-xl bg-emerald-950 text-cream-50 font-bold text-xs cursor-pointer hover:bg-emerald-900"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
