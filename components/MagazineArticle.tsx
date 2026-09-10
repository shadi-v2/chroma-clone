"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Volume2, X, Loader2, Sparkles } from "lucide-react";

interface PopupData {
  word: string;
  definition: string;
  pronunciation?: string;
  found: boolean;
  x: number;
  y: number;
  placement: "top" | "bottom";
}

interface MagazineArticleProps {
  children: React.ReactNode;
  className?: string;
}

export default function MagazineArticle({
  children,
  className = "",
}: MagazineArticleProps) {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const dictCacheRef = useRef<
    Map<string, { definition: string; pronunciation?: string; found: boolean }>
  >(new Map());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLookupWordRef = useRef<string | null>(null);

  // Clean word string
  const cleanWordString = (raw: string): string => {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”—‘’\[\]\\]+/, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”—‘’\[\]\\]+$/, "")
      .trim();
  };

  // Fetch definition from client cache or API
  const lookupDefinition = useCallback(
    async (
      word: string,
      coords: { x: number; y: number; placement: "top" | "bottom" },
    ) => {
      const clean = cleanWordString(word);
      if (!clean || clean.length < 2 || clean.includes(" ")) return;

      lastLookupWordRef.current = clean;

      // Check cache first
      if (dictCacheRef.current.has(clean)) {
        const cached = dictCacheRef.current.get(clean)!;
        setPopup({
          word: clean,
          definition: cached.definition,
          pronunciation: cached.pronunciation,
          found: cached.found,
          x: coords.x,
          y: coords.y,
          placement: coords.placement,
        });
        setLoadingWord(null);
        return;
      }

      try {
        setLoadingWord(clean);
        setPopup({
          word: clean,
          definition: "Looking up meaning...",
          found: false,
          x: coords.x,
          y: coords.y,
          placement: coords.placement,
        });

        const res = await fetch(
          `/api/dictionary?word=${encodeURIComponent(clean)}`,
        );
        const data = await res.json();

        const result = {
          definition:
            data.meaning || data.definition || `No meaning found for "${clean}".`,
          pronunciation: data.pronunciation || undefined,
          found: Boolean(data.found),
        };

        dictCacheRef.current.set(clean, result);

        if (lastLookupWordRef.current === clean) {
          setPopup({
            word: clean,
            definition: result.definition,
            pronunciation: result.pronunciation,
            found: result.found,
            x: coords.x,
            y: coords.y,
            placement: coords.placement,
          });
        }
      } catch (err) {
        console.error("Dictionary lookup error:", err);
      } finally {
        setLoadingWord(null);
      }
    },
    [],
  );

  // Extract word under point or selection
  const getWordAtPoint = (
    clientX: number,
    clientY: number,
  ): { word: string; rect: DOMRect } | null => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selText = selection.toString().trim();
      if (selText && !selText.includes(" ")) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return { word: selText, rect };
      }
    }

    let range: Range | null = null;

    if (typeof document !== "undefined") {
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(clientX, clientY);
      } else if ("caretPositionFromPoint" in document) {
        const doc = document as unknown as {
          caretPositionFromPoint?: (
            x: number,
            y: number,
          ) => { offsetNode: Node; offset: number } | null;
        };
        const pos = doc.caretPositionFromPoint?.(clientX, clientY);
        if (pos && pos.offsetNode) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
    }

    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const textNode = range.startContainer as Text;
    const textContent = textNode.textContent || "";
    const offset = range.startOffset;

    if (offset < 0 || offset > textContent.length) return null;

    let start = offset;
    while (start > 0 && /\S/.test(textContent[start - 1])) {
      start--;
    }

    let end = offset;
    while (end < textContent.length && /\S/.test(textContent[end])) {
      end++;
    }

    const rawWord = textContent.slice(start, end);
    const clean = cleanWordString(rawWord);

    if (!clean) return null;

    try {
      const wordRange = document.createRange();
      wordRange.setStart(textNode, start);
      wordRange.setEnd(textNode, end);
      const rect = wordRange.getBoundingClientRect();
      return { word: clean, rect };
    } catch {
      return { word: clean, rect: new DOMRect(clientX, clientY, 1, 1) };
    }
  };

  // Calculate coordinates with screen clamp
  const calculateCoordinates = (
    rect: DOMRect,
  ): { x: number; y: number; placement: "top" | "bottom" } => {
    const margin = 16;
    const popupWidth = 300;
    const targetX = rect.left + rect.width / 2 + window.scrollX;

    const minX = window.scrollX + popupWidth / 2 + margin;
    const maxX = window.scrollX + window.innerWidth - popupWidth / 2 - margin;
    const clampedX = Math.max(minX, Math.min(maxX, targetX));

    const spaceAbove = rect.top;
    const isTooCloseToTop = spaceAbove < 160;
    const placement: "top" | "bottom" = isTooCloseToTop ? "bottom" : "top";

    const targetY = isTooCloseToTop
      ? rect.bottom + window.scrollY + 10
      : rect.top + window.scrollY - 10;

    return { x: clampedX, y: targetY, placement };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const wordInfo = getWordAtPoint(e.clientX, e.clientY);
    if (!wordInfo) return;

    const coords = calculateCoordinates(wordInfo.rect);
    lookupDefinition(wordInfo.word, coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      const wordInfo = getWordAtPoint(e.clientX, e.clientY);
      if (!wordInfo) return;

      const clean = cleanWordString(wordInfo.word);
      if (clean && clean !== popup?.word) {
        const coords = calculateCoordinates(wordInfo.rect);
        lookupDefinition(clean, coords);
      }
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest(".dictionary-popup")) {
        return;
      }
      setPopup(null);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!popup?.word || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(popup.word);
      utterance.rate = 0.9;
      utterance.lang = "en-US";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Helper pill */}
      <div className="mb-4 flex items-center justify-between text-xs text-emerald-950/40 select-none pb-2 border-b border-emerald-950/5">
        <div className="flex items-center gap-1.5 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
          <span>Interactive Dictionary: Click or hover any word for concise meaning</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-900/60 bg-emerald-950/5 px-2.5 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Pronounce & Define
        </div>
      </div>

      {/* Article Content Container */}
      <div
        ref={articleRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer selection:bg-amber-200/80 selection:text-emerald-950 transition-colors"
      >
        {children}
      </div>

      {/* Concise Floating Popup Card */}
      {popup && (
        <div
          className={`dictionary-popup fixed z-50 -translate-x-1/2 bg-emerald-950 text-cream-50 rounded-2xl shadow-2xl border border-emerald-800/40 p-4 w-76 max-w-[calc(100vw-32px)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            popup.placement === "top" ? "-translate-y-full" : "translate-y-0"
          }`}
          style={{
            left: `${popup.x - window.scrollX}px`,
            top: `${popup.y - window.scrollY}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Word, Phonetics & Pronunciation button */}
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif font-bold text-base text-amber-300 capitalize truncate">
                {popup.word}
              </span>

              {popup.pronunciation && (
                <span className="text-xs text-emerald-400/80 font-mono">
                  {popup.pronunciation}
                </span>
              )}

              <button
                type="button"
                onClick={handlePronounce}
                className={`p-1 rounded-lg hover:bg-emerald-900/60 transition-colors cursor-pointer text-emerald-300 hover:text-white ${
                  isSpeaking ? "text-amber-400 animate-pulse" : ""
                }`}
                title="Pronounce word"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPopup(null)}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Meaning Body (Clean, concise 1-sentence meaning) */}
          <div className="text-xs leading-relaxed text-emerald-50/90 font-normal">
            {loadingWord === popup.word ? (
              <div className="flex items-center gap-2 py-1 text-emerald-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finding meaning...</span>
              </div>
            ) : (
              <p>{popup.definition}</p>
            )}
          </div>

          {/* Pointer Triangle */}
          {popup.placement === "top" ? (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-emerald-950" />
          ) : (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-6 border-transparent border-b-emerald-950" />
          )}
        </div>
      )}
    </div>
  );
}
