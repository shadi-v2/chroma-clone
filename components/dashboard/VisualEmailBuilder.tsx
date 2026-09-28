"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Sparkles,
  Layers,
  ChevronDown,
  Code,
  Eye,
  Type,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Tag,
  Circle,
  Square,
  Award,
  PenTool,
  Grid,
} from "lucide-react";

interface VisualEmailBuilderProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function VisualEmailBuilder({
  value,
  onChange,
  placeholder = "Click here to write your email visually or insert shapes and buttons...",
  minHeight = "360px",
}: VisualEmailBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "html">("visual");
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isUpdatingFromProps = useRef(false);

  // Sync editor content with prop if changed externally
  useEffect(() => {
    if (editorRef.current && activeTab === "visual") {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        isUpdatingFromProps.current = true;
        editorRef.current.innerHTML = value || "";
        isUpdatingFromProps.current = false;
      }
    }
  }, [value, activeTab]);

  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdatingFromProps.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  // Execute standard rich text command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (activeTab !== "visual") return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  // Insert custom HTML fragment at cursor position
  const insertHtmlAtCursor = (htmlString: string) => {
    if (activeTab === "html") {
      onChange(value + "\n" + htmlString);
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString;
      const frag = document.createDocumentFragment();
      let node: Node | null;
      while ((node = tempDiv.firstChild)) {
        frag.appendChild(node);
      }
      range.insertNode(frag);

      // Move cursor to end of inserted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += htmlString;
    }

    handleInput();
    setShowShapeMenu(false);
  };

  // Preset Design Elements & Shapes
  const designElements = [
    {
      category: "Shapes & Badges",
      items: [
        {
          name: "Emerald Pill Badge",
          icon: Circle,
          description: "Rounded emerald badge with uppercase label",
          html: `<div style="margin: 8px 0;"><span style="display: inline-block; background-color: #022c22; color: #fdfbf7; padding: 5px 16px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; font-family: sans-serif;">FEATURED WRITER</span></div>`,
        },
        {
          name: "Golden Milestone Ribbon",
          icon: Award,
          description: "Gold shimmer tag for achievements and awards",
          html: `<div style="margin: 8px 0;"><span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 6px 18px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; font-family: sans-serif;">★ OFFICIAL SELECTION ★</span></div>`,
        },
        {
          name: "Numbered Step Circle",
          icon: Circle,
          description: "Circular numbered badge for guidelines and instructions",
          html: `<div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;"><div style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background-color: #022c22; color: #ffffff; font-weight: bold; font-size: 14px; font-family: sans-serif;">1</div><span style="font-weight: bold; font-size: 14px; color: #022c22;">Step Title Goes Here</span></div>`,
        },
        {
          name: "Diamond Accent Line",
          icon: Square,
          description: "Geometric diamond literary ornament",
          html: `<div style="text-align: center; margin: 24px 0; color: #022c22; opacity: 0.35;"><span style="display: inline-block; transform: rotate(45deg); width: 8px; height: 8px; background-color: #022c22; margin: 0 4px;"></span><span style="display: inline-block; transform: rotate(45deg); width: 12px; height: 12px; background-color: #022c22; margin: 0 4px;"></span><span style="display: inline-block; transform: rotate(45deg); width: 8px; height: 8px; background-color: #022c22; margin: 0 4px;"></span></div>`,
        },
        {
          name: "Soft Tag Chip",
          icon: Tag,
          description: "Subtle outlined chip for genres and tags",
          html: `<span style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 3px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; margin: 4px; font-family: sans-serif;">Poetry & Prose</span>`,
        },
      ],
    },
    {
      category: "Buttons & Action Links",
      items: [
        {
          name: "Primary Emerald Button",
          icon: ExternalLink,
          description: "Bold dark emerald CTA button",
          html: `<div style="margin: 20px 0; text-align: center;"><a href="https://chromadiaries.in" style="display: inline-block; background-color: #022c22; color: #fdfbf7; padding: 14px 32px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(2,44,34,0.15);">Explore Chroma Diaries &rarr;</a></div>`,
        },
        {
          name: "Secondary Outline Button",
          icon: ExternalLink,
          description: "Clean bordered button for secondary actions",
          html: `<div style="margin: 16px 0; text-align: center;"><a href="https://chromadiaries.in/dashboard" style="display: inline-block; border: 2px solid #022c22; color: #022c22; padding: 12px 28px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Go to Author Studio</a></div>`,
        },
        {
          name: "Warm Gold CTA",
          icon: Sparkles,
          description: "Amber gold highlighted button",
          html: `<div style="margin: 20px 0; text-align: center;"><a href="https://chromadiaries.in/submit" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 14px 30px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-family: sans-serif;">Submit New Manuscript</a></div>`,
        },
      ],
    },
    {
      category: "Cards & Highlight Boxes",
      items: [
        {
          name: "Editorial Notice Box",
          icon: Info,
          description: "Soft emerald card with left accent border",
          html: `<div style="background-color: #f0fdf4; border-left: 4px solid #022c22; padding: 18px 22px; border-radius: 12px; margin: 18px 0; font-family: sans-serif;"><div style="font-weight: bold; font-size: 13px; color: #022c22; margin-bottom: 6px;">Editorial Update</div><div style="font-size: 13px; color: #374151; line-height: 1.6;">Your manuscript has advanced to the final stage of editorial layout. Please review the proofs by this Friday.</div></div>`,
        },
        {
          name: "Congratulations Card",
          icon: CheckCircle2,
          description: "Celebratory success box with green badge",
          html: `<div style="background-color: #ffffff; border: 1px solid #d1fae5; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border-radius: 18px; padding: 24px; margin: 20px 0; text-align: center; font-family: sans-serif;"><div style="font-size: 28px; margin-bottom: 8px;">🎉</div><div style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #022c22; margin-bottom: 8px;">Congratulations on Publication!</div><div style="font-size: 13px; color: #4b5563; line-height: 1.6; max-width: 480px; margin: 0 auto;">We are thrilled to present your work to our literary community. Your piece is now live across all Chroma Diaries editions.</div></div>`,
        },
        {
          name: "Editorial Pullquote",
          icon: Quote,
          description: "Large literary pullquote card with attribution",
          html: `<blockquote style="margin: 24px 0; padding: 20px 28px; background-color: #fdfbf7; border-left: 3px solid #022c22; font-family: Georgia, serif; font-style: italic; font-size: 16px; color: #022c22; line-height: 1.6;"><p style="margin: 0 0 10px 0;">"Words are, of course, the most powerful drug used by mankind."</p><footer style="font-family: sans-serif; font-style: normal; font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">— Rudyard Kipling</footer></blockquote>`,
        },
        {
          name: "Revision Advisory Box",
          icon: AlertTriangle,
          description: "Warm amber advisory box for manuscript notes",
          html: `<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px 22px; border-radius: 12px; margin: 18px 0; font-family: sans-serif;"><div style="font-weight: bold; font-size: 13px; color: #b45309; margin-bottom: 6px;">Editorial Notes & Suggestions</div><div style="font-size: 13px; color: #78350f; line-height: 1.6;">Our editors have provided a few line-edit suggestions to heighten the emotional resonance of the climax.</div></div>`,
        },
      ],
    },
    {
      category: "Layout Sections & Signatures",
      items: [
        {
          name: "2-Column Key Takeaway Cards",
          icon: Grid,
          description: "Side-by-side comparison or detail boxes",
          html: `<table width="100%" cellpadding="0" cellspacing="8" border="0" style="margin: 18px 0; font-family: sans-serif;"><tr><td width="50%" style="background-color: #f0fdf4; padding: 18px; border-radius: 14px; vertical-align: top;"><div style="font-weight: bold; font-size: 13px; color: #022c22; margin-bottom: 6px;">✨ What's Next</div><div style="font-size: 12px; color: #374151; line-height: 1.5;">Proofreading and typesetting will complete in 48 hours.</div></td><td width="50%" style="background-color: #fefce8; padding: 18px; border-radius: 14px; vertical-align: top;"><div style="font-weight: bold; font-size: 13px; color: #854d0e; margin-bottom: 6px;">📅 Release Date</div><div style="font-size: 12px; color: #713f12; line-height: 1.5;">Scheduled for Sunday's Weekend Chroma Edition.</div></td></tr></table>`,
        },
        {
          name: "Official Editorial Signature",
          icon: PenTool,
          description: "Formatted sign-off signature block with logo seal",
          html: `<div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-family: sans-serif;"><div style="font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: #022c22;">The Editorial Board</div><div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Chroma Diaries Web Magazine</div><div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">Sabeelul Hidaya Islamic College, Kooriyad</div></div>`,
        },
        {
          name: "Ornamental Literary Divider",
          icon: Minus,
          description: "Gentle styled emerald line divider",
          html: `<div style="margin: 28px 0; text-align: center;"><div style="height: 1px; background: linear-gradient(90deg, rgba(2,44,34,0) 0%, rgba(2,44,34,0.25) 50%, rgba(2,44,34,0) 100%);"></div></div>`,
        },
      ],
    },
  ];

  return (
    <div className="w-full border border-emerald-950/15 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
      {/* ── TOP CONTROL BAR ── */}
      <div className="p-2.5 bg-emerald-950/[0.03] border-b border-emerald-950/10 flex flex-wrap items-center justify-between gap-2">
        {/* FORMATTING TOOLS */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings Dropdown */}
          <div className="flex items-center bg-white rounded-lg border border-emerald-950/10 p-0.5">
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<h1>")}
              className="px-2 py-1 text-xs font-bold hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<h2>")}
              className="px-2 py-1 text-xs font-bold hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<h3>")}
              className="px-2 py-1 text-xs font-bold hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Heading 3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<p>")}
              className="px-2 py-1 text-xs font-bold hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Normal Paragraph"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Basic Inline Styles */}
          <div className="flex items-center bg-white rounded-lg border border-emerald-950/10 p-0.5">
            <button
              type="button"
              onClick={() => execCmd("bold")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("italic")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("underline")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("strikeThrough")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center bg-white rounded-lg border border-emerald-950/10 p-0.5">
            <button
              type="button"
              onClick={() => execCmd("justifyLeft")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyCenter")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyRight")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center bg-white rounded-lg border border-emerald-950/10 p-0.5">
            <button
              type="button"
              onClick={() => execCmd("insertUnorderedList")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertOrderedList")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("formatBlock", "<blockquote>")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertHorizontalRule")}
              className="p-1.5 hover:bg-emerald-50 rounded text-emerald-950 cursor-pointer"
              title="Horizontal Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colors */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg border border-emerald-950/10 text-xs font-bold text-emerald-950 hover:bg-emerald-50 cursor-pointer"
              title="Color palette"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-800" />
              <span>Color</span>
            </button>

            {showColorPicker && (
              <div className="absolute left-0 top-10 z-30 bg-white rounded-2xl shadow-xl border border-emerald-950/10 p-3 w-48 space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Text Color
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["#022c22", "#047857", "#d97706", "#dc2626", "#2563eb", "#4b5563"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          execCmd("foreColor", color);
                          setShowColorPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Highlight Color
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["#fef08a", "#bbf7d0", "#fed7aa", "#bfdbfe", "#f5d0fe", "#ffffff"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          execCmd("hiliteColor", color);
                          setShowColorPicker(false);
                        }}
                        className="w-5 h-5 rounded-md border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🌟 INSERT SHAPES & DESIGN ELEMENTS DROPDOWN 🌟 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShapeMenu(!showShapeMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-cream-50 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Insert Shape / Design</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showShapeMenu && (
              <div className="absolute right-0 top-10 z-40 bg-white rounded-2xl shadow-2xl border border-emerald-950/15 p-4 w-80 sm:w-96 max-h-[460px] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-950">
                    <Layers className="w-4 h-4 text-emerald-800" />
                    <span>Click to Insert Shape or Element</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShapeMenu(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {designElements.map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-950/50">
                      {cat.category}
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item, j) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={j}
                            type="button"
                            onClick={() => insertHtmlAtCursor(item.html)}
                            className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-950/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                          >
                            <div className="p-1.5 rounded-lg bg-emerald-950/5 text-emerald-950 group-hover:bg-emerald-950 group-hover:text-cream-50 transition-colors shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-900">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                                {item.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODE SWITCHER (VISUAL VS RAW HTML) */}
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-emerald-950/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === "visual"
                ? "bg-emerald-950 text-cream-50 shadow-xs"
                : "text-emerald-950/60 hover:text-emerald-950"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Visual Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === "html"
                ? "bg-emerald-950 text-cream-50 shadow-xs"
                : "text-emerald-950/60 hover:text-emerald-950"
            }`}
          >
            <Code className="w-3 h-3" />
            <span>HTML Code</span>
          </button>
        </div>
      </div>

      {/* ── EDITOR CANVAS ── */}
      {activeTab === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-6 focus:outline-none text-emerald-950 text-sm font-sans leading-relaxed overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic selection:bg-emerald-100"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<p>Enter or paste raw HTML here...</p>"
          style={{ minHeight }}
          className="p-6 w-full font-mono text-xs text-emerald-950 bg-emerald-950/[0.02] focus:outline-none leading-relaxed resize-y border-none"
        />
      )}

      {/* ── FOOTER HINT ── */}
      <div className="px-4 py-2 bg-emerald-950/[0.02] border-t border-emerald-950/5 flex items-center justify-between text-[11px] text-emerald-950/40">
        <span>
          💡 Click anywhere to type text, or use the <strong>Insert Shape / Design</strong> button to add buttons, badges, quotes, and cards.
        </span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
