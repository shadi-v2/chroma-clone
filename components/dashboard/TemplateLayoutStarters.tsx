"use client";

import React, { useState } from "react";
import {
  Layout,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Palette,
  FileCode,
} from "lucide-react";
import { EMAIL_LAYOUT_STARTERS, type LayoutStarter } from "@/lib/emailWrapper";
import { useConfirm } from "@/contexts/ConfirmationContext";

interface TemplateLayoutStartersProps {
  onSelectLayout: (layoutHtml: string, layoutName: string) => void;
  currentHtmlLength?: number;
}

export default function TemplateLayoutStarters({
  onSelectLayout,
  currentHtmlLength = 0,
}: TemplateLayoutStartersProps) {
  const { confirm } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  const handleApply = async (starter: LayoutStarter) => {
    if (currentHtmlLength > 50) {
      const ok = await confirm({
        title: "Replace Template Layout?",
        message: `Apply "${starter.name}" layout starter? This will replace your current template HTML layout with this starter.`,
        confirmText: "Apply Layout",
        cancelText: "Keep Current",
        variant: "warning",
      });
      if (!ok) return;
    }

    setSelectedId(starter.id);
    onSelectLayout(starter.html, starter.name);
  };

  return (
    <div className="rounded-2xl border border-emerald-950/15 bg-white shadow-sm overflow-hidden">
      {/* ── HEADER ACCORDION ── */}
      <div className="p-4 bg-emerald-950/[0.03] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950 text-cream-50 shrink-0">
            <Layout className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-emerald-950">
                HTML Layout Starters
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Full HTML Layouts
              </span>
            </div>
            <p className="text-[11px] text-emerald-950/60 mt-0.5">
              1-click pre-designed full HTML layouts with borders, branding, and Chromadiaries logo already arranged
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-950/15 text-xs font-bold text-emerald-950 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
        >
          <Palette className="w-3.5 h-3.5 text-emerald-800" />
          <span>{isOpen ? "Hide Starters" : "Browse HTML Layouts"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── EXPANDABLE STARTERS GRID ── */}
      {isOpen && (
        <div className="p-6 border-t border-emerald-950/5 bg-[#fdfbf7]/60 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-emerald-950/70">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-800" />
              <span>Select an HTML template layout to load directly into the editor</span>
            </span>
            <span className="text-[11px] font-medium text-gray-500">
              Never constant • 100% editable HTML
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(EMAIL_LAYOUT_STARTERS).map((starter) => {
              const isActive = selectedId === starter.id;
              return (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => handleApply(starter)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between group ${
                    isActive
                      ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-md scale-[1.01]"
                      : "bg-white text-emerald-950 border-emerald-950/10 hover:border-emerald-950/30 hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-950/5 text-emerald-900 group-hover:bg-emerald-100">
                        {starter.category}
                      </span>
                      {isActive ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-800" />
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-sm mb-1">{starter.name}</h4>
                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 ${
                        isActive ? "text-cream-100/70" : "text-gray-500"
                      }`}
                    >
                      {starter.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-emerald-950/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="opacity-70">Click to apply HTML</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
