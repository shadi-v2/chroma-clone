"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Sun,
  Moon,
  ArrowUpToLine,
  ArrowDownToLine,
  MousePointer,
} from "lucide-react";
import {
  type LogoArrangementConfig,
  type LogoVariant,
  type LogoAlignment,
  type LogoPlacement,
  DEFAULT_LOGO_CONFIG,
  LOGO_VARIANTS_INFO,
  detectLogoInHtml,
  arrangeLogoInHtml,
  removeLogoFromHtml,
  generateLogoHtml,
} from "@/lib/emailWrapper";
import { gooeyToast } from "@/components/ui/goey-toaster";

interface ChromadiariesLogoArrangerProps {
  htmlContent: string;
  onChangeHtml: (newHtml: string) => void;
  onInsertAtCursor?: (logoHtml: string) => void;
  label?: string;
  defaultExpanded?: boolean;
}

export default function ChromadiariesLogoArranger({
  htmlContent,
  onChangeHtml,
  onInsertAtCursor,
  label = "Arrange Chromadiaries Logo in Template",
  defaultExpanded = true,
}: ChromadiariesLogoArrangerProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [config, setConfig] = useState<LogoArrangementConfig>(DEFAULT_LOGO_CONFIG);
  const [hasExistingLogo, setHasExistingLogo] = useState(false);
  const [previewDarkBg, setPreviewDarkBg] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Sync detected logo state when htmlContent changes
  useEffect(() => {
    const detected = detectLogoInHtml(htmlContent);
    if (detected) {
      setHasExistingLogo(true);
      setConfig((prev) => ({
        ...prev,
        variant: detected.variant,
        alignment: detected.alignment,
        placement: detected.placement,
        width: detected.width,
      }));
      if (detected.variant === "logo-white" || detected.variant === "icon-white") {
        setPreviewDarkBg(true);
      }
    } else {
      setHasExistingLogo(false);
    }
  }, [htmlContent]);

  const updateConfig = <K extends keyof LogoArrangementConfig>(
    key: K,
    val: LogoArrangementConfig[K],
  ) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "variant") {
        if (val === "logo-white" || val === "icon-white") {
          setPreviewDarkBg(true);
        } else {
          setPreviewDarkBg(false);
        }
      }
      return next;
    });
  };

  const handleApplyLogo = () => {
    if (config.placement === "cursor" && onInsertAtCursor) {
      const logoHtml = generateLogoHtml(config);
      onInsertAtCursor(logoHtml);
    } else {
      const updated = arrangeLogoInHtml(htmlContent, config);
      onChangeHtml(updated);
    }

    setJustApplied(true);
    gooeyToast.success("Chromadiaries logo arranged in template!");
    setTimeout(() => setJustApplied(false), 2400);
  };

  const handleRemoveLogo = () => {
    const updated = removeLogoFromHtml(htmlContent);
    onChangeHtml(updated);
    setHasExistingLogo(false);
    gooeyToast.info("Chromadiaries logo removed from template.");
  };

  return (
    <div className="rounded-2xl border border-emerald-950/15 bg-white shadow-sm overflow-hidden transition-all">
      {/* ── ACCORDION HEADER ── */}
      <div className="p-4 bg-emerald-950/[0.03] border-b border-emerald-950/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950 text-cream-50 shrink-0">
            <ImageIcon className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-emerald-950">{label}</span>
              {hasExistingLogo ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Logo Active in Template</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                  No Logo in Template
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-950/60 mt-0.5">
              Position, align, resize, and style the official Chromadiaries logo directly inside the template HTML
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasExistingLogo && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
              title="Remove Chromadiaries logo from template"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Remove Logo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-950/15 text-xs font-bold text-emerald-950 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-800" />
            <span>{isOpen ? "Hide Arranger" : "Open Logo Arranger"}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── EXPANDABLE DRAWER ── */}
      {isOpen && (
        <div className="p-6 space-y-6 bg-[#fdfbf7]/60 border-t border-emerald-950/5 animate-in fade-in duration-200">
          {/* TOP CONTROLS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: VARIANT & PLACEMENT (7 COLS) */}
            <div className="lg:col-span-7 space-y-5">
              {/* LOGO VARIANT SELECTOR */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-800" />
                  <span>1. Choose Chromadiaries Logo Variant</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(LOGO_VARIANTS_INFO) as LogoVariant[]).map((vKey) => {
                    const info = LOGO_VARIANTS_INFO[vKey];
                    const isSelected = config.variant === vKey;
                    return (
                      <button
                        key={vKey}
                        type="button"
                        onClick={() => updateConfig("variant", vKey)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-md scale-[1.01]"
                            : "bg-white text-emerald-950 border-emerald-950/10 hover:border-emerald-950/30"
                        }`}
                      >
                        <div
                          className={`w-12 h-10 rounded-xl flex items-center justify-center p-1.5 shrink-0 ${
                            info.darkBg ? "bg-emerald-950" : "bg-emerald-950/5 border border-emerald-950/10"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={info.path}
                            alt={info.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-xs truncate">{info.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </div>
                          <p
                            className={`text-[10px] leading-tight line-clamp-1 mt-0.5 ${
                              isSelected ? "text-cream-100/70" : "text-gray-500"
                            }`}
                          >
                            {info.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ALIGNMENT & PLACEMENT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-emerald-950/10">
                {/* Horizontal Alignment */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-1.5 flex items-center gap-1.5">
                    <AlignLeft className="w-3 h-3 text-emerald-800" />
                    <span>2. Alignment</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-emerald-950/10">
                    {[
                      { id: "left", label: "Left", icon: AlignLeft },
                      { id: "center", label: "Center", icon: AlignCenter },
                      { id: "right", label: "Right", icon: AlignRight },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = config.alignment === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateConfig("alignment", item.id as LogoAlignment)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-950 text-cream-50 shadow-xs"
                              : "text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-50"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Placement in Template */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 mb-1.5 flex items-center gap-1.5">
                    <ArrowUpToLine className="w-3 h-3 text-emerald-800" />
                    <span>3. Placement Target</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-emerald-950/10">
                    {[
                      { id: "top", label: "Header Top", icon: ArrowUpToLine },
                      { id: "cursor", label: "At Cursor", icon: MousePointer },
                      { id: "bottom", label: "Footer", icon: ArrowDownToLine },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = config.placement === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateConfig("placement", item.id as LogoPlacement)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-950 text-cream-50 shadow-xs"
                              : "text-emerald-950/70 hover:text-emerald-950 hover:bg-emerald-50"
                          }`}
                          title={
                            item.id === "top"
                              ? "Place at top of the email card"
                              : item.id === "cursor"
                              ? "Insert at active cursor in visual editor"
                              : "Place at the bottom of the template"
                          }
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SIZE & MARGIN SPACING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-emerald-950/10">
                {/* Size / Width */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3 text-emerald-800" />
                      <span>Logo Width</span>
                    </label>
                    <span className="text-xs font-bold text-emerald-950">{config.width}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="60"
                      max="320"
                      step="5"
                      value={config.width}
                      onChange={(e) => updateConfig("width", parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-900 cursor-pointer"
                    />
                    <div className="flex gap-1 shrink-0">
                      {[
                        { label: "S", w: 110 },
                        { label: "M", w: 165 },
                        { label: "L", w: 220 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateConfig("width", preset.w)}
                          className={`w-6 h-6 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                            config.width === preset.w
                              ? "bg-emerald-950 text-cream-50 border-emerald-950"
                              : "bg-white text-emerald-950 border-emerald-950/15 hover:bg-emerald-50"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vertical Spacing Margin */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/60">
                      Vertical Margin
                    </label>
                    <span className="text-xs font-bold text-emerald-950">{config.spacing}px</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Compact", val: 12 },
                      { label: "Normal", val: 24 },
                      { label: "Spacious", val: 36 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => updateConfig("spacing", item.val)}
                        className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.spacing === item.val
                            ? "bg-emerald-950 text-cream-50 border-emerald-950"
                            : "bg-white text-emerald-950 border-emerald-950/15 hover:bg-emerald-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE LOGO PREVIEW & ACTION BOX (5 COLS) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/60">
                    Live Logo Arrangement Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewDarkBg(!previewDarkBg)}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-950/15 text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Toggle light / dark background for preview"
                  >
                    {previewDarkBg ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-emerald-800" />}
                    <span>{previewDarkBg ? "Dark BG" : "Light BG"}</span>
                  </button>
                </div>

                {/* PREVIEW CANVAS */}
                <div
                  className={`rounded-xl border p-6 flex flex-col justify-center min-h-[140px] transition-all overflow-hidden ${
                    previewDarkBg
                      ? "bg-[#061713] border-emerald-800/40"
                      : "bg-[#fcfbf7] border-emerald-950/10"
                  }`}
                  style={{
                    alignItems:
                      config.alignment === "left"
                        ? "flex-start"
                        : config.alignment === "right"
                        ? "flex-end"
                        : "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={LOGO_VARIANTS_INFO[config.variant]?.path || "https://chromadiaries.in/logo.png"}
                    alt={config.altText}
                    style={{
                      width: `${config.width}px`,
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>

                <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>
                    Alignment: <strong>{config.alignment}</strong> • Width: <strong>{config.width}px</strong>
                  </span>
                  <a
                    href="https://chromadiaries.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-semibold flex items-center gap-0.5"
                  >
                    <span>chromadiaries.in</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-3 border-t border-emerald-950/5 space-y-2">
                <button
                  type="button"
                  onClick={handleApplyLogo}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    justApplied
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-950 text-cream-50 hover:bg-emerald-900 shadow-emerald-950/15"
                  }`}
                >
                  {justApplied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Arranged Logo in Template!</span>
                    </>
                  ) : hasExistingLogo ? (
                    <>
                      <Sliders className="w-4 h-4 text-emerald-300" />
                      <span>Update / Re-arrange Logo in Template</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>Arrange Logo into Template</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-emerald-950/50">
                  {hasExistingLogo
                    ? "Modifications update the existing logo in the HTML template directly."
                    : `Will insert the logo at the ${config.placement === "top" ? "top header" : config.placement === "bottom" ? "footer" : "editor cursor"} of your template.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
