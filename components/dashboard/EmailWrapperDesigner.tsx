"use client";

import React, { useState } from "react";
import {
  Layout,
  Maximize2,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  CheckSquare,
  Square,
  Award,
} from "lucide-react";
import {
  type EmailWrapperConfig,
  WRAPPER_THEMES,
} from "@/lib/emailWrapper";

interface EmailWrapperDesignerProps {
  config: EmailWrapperConfig;
  onChange: (newConfig: EmailWrapperConfig) => void;
}

export default function EmailWrapperDesigner({
  config,
  onChange,
}: EmailWrapperDesignerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const applyTheme = (themeKey: string) => {
    const theme = WRAPPER_THEMES[themeKey];
    if (theme) {
      onChange({
        ...config,
        ...theme.config,
        theme: themeKey as EmailWrapperConfig["theme"],
      });
    }
  };

  const updateField = <K extends keyof EmailWrapperConfig>(
    key: K,
    value: EmailWrapperConfig[K],
  ) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-950/10 bg-white overflow-hidden shadow-sm">
      {/* ── HEADER ACCORDION ── */}
      <div className="p-4 bg-emerald-950/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateField("enabled", !config.enabled)}
            className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer"
          >
            {config.enabled ? (
              <CheckSquare className="w-4 h-4 text-emerald-800" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span>Wrap in Letterhead Frame</span>
          </button>

          {config.enabled && (
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              {WRAPPER_THEMES[config.theme]?.name || "Custom Theme"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-950/10 text-xs font-bold text-emerald-950 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-800" />
          <span>{isOpen ? "Hide Wrapper Designer" : "Customize Shapes & Design"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── EXPANDABLE DESIGNER DRAWER ── */}
      {isOpen && config.enabled && (
        <div className="p-6 space-y-6 border-t border-emerald-950/10 bg-[#fdfbf7]/60 animate-in fade-in duration-200">
          {/* PRESET THEMES */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>1-Click Theme Presets</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {Object.entries(WRAPPER_THEMES).map(([key, item]) => {
                const isActive = config.theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTheme(key)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-md scale-[1.02]"
                        : "bg-white text-emerald-950 border-emerald-950/10 hover:border-emerald-950/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif font-bold text-xs">{item.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <p className={`text-[10px] leading-tight ${isActive ? "text-cream-100/70" : "text-gray-500"}`}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GEOMETRIC SHAPES & CORNER ROUNDNESS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-emerald-950/10">
            {/* Corner Radius */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-2 flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3 text-emerald-800" />
                <span>Corner Roundness</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "sharp", label: "Sharp Box (0px)" },
                  { id: "subtle", label: "Soft (10px)" },
                  { id: "rounded", label: "Modern (24px)" },
                  { id: "extra", label: "Capsule (36px)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      updateField("borderRadius", item.id as EmailWrapperConfig["borderRadius"])
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      config.borderRadius === item.id
                        ? "bg-emerald-950 text-cream-50 border-emerald-950 font-bold"
                        : "bg-white text-emerald-950 border-emerald-950/10 hover:bg-emerald-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Header Badge Shape */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-2 flex items-center gap-1.5">
                <Award className="w-3 h-3 text-emerald-800" />
                <span>Header Badge Shape</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "plaque", label: "Plaque Badge" },
                  { id: "pill", label: "Capsule Pill" },
                  { id: "diamond", label: "❖ Diamond Frame" },
                  { id: "minimal", label: "Minimalist Text" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      updateField(
                        "headerBadgeShape",
                        item.id as EmailWrapperConfig["headerBadgeShape"],
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      config.headerBadgeShape === item.id
                        ? "bg-emerald-950 text-cream-50 border-emerald-950 font-bold"
                        : "bg-white text-emerald-950 border-emerald-950/10 hover:bg-emerald-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Style */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-2 flex items-center gap-1.5">
                <Layout className="w-3 h-3 text-emerald-800" />
                <span>Outer Border Style</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "subtle", label: "1px Subtle" },
                  { id: "accent-top", label: "Top Accent Bar" },
                  { id: "double", label: "Double Frame" },
                  { id: "none", label: "Shadow Only" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      updateField("borderStyle", item.id as EmailWrapperConfig["borderStyle"])
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      config.borderStyle === item.id
                        ? "bg-emerald-950 text-cream-50 border-emerald-950 font-bold"
                        : "bg-white text-emerald-950 border-emerald-950/10 hover:bg-emerald-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CUSTOM TITLES & COLOR PALETTE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-950/10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-1.5">
                Header Brand Title
              </label>
              <input
                type="text"
                value={config.headerTitle}
                onChange={(e) => updateField("headerTitle", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-950/15 bg-white text-xs font-serif font-bold text-emerald-950 focus:outline-none focus:border-emerald-950"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-1.5">
                Header Subtitle / Tagline
              </label>
              <input
                type="text"
                value={config.headerSubtitle}
                onChange={(e) => updateField("headerSubtitle", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-950/15 bg-white text-xs font-medium text-emerald-950 focus:outline-none focus:border-emerald-950"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-1.5">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="w-8 h-8 rounded-lg border border-emerald-950/20 cursor-pointer p-0.5 bg-white"
                />
                <div className="flex gap-1 flex-1">
                  {["#022c22", "#047857", "#b45309", "#1e293b", "#7c2d12"].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => updateField("accentColor", col)}
                      style={{ backgroundColor: col }}
                      className="w-6 h-6 rounded-md border border-black/10 hover:scale-110 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
