"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lookupWord } from "@/lib/article-actions";
import type { Word } from "@/types";

interface PopupState {
  x: number;
  y: number;
  selectedText: string;
  word: Word | null;       // vocab.db result (single word)
  translation: string;     // API translation result (phrase/sentence)
  loading: boolean;
  error: string;
}

interface SelectionTranslatorProps {
  children: React.ReactNode;
}

export default function SelectionTranslator({
  children,
}: SelectionTranslatorProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if selected text is a single word
  function isSingleWord(text: string) {
    return /^[a-zA-Z'-]+$/.test(text.trim());
  }

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    if (!text || text.length < 2) {
      setPopup(null);
      return;
    }

    // Ensure selection is within our container
    if (containerRef.current && selection?.anchorNode) {
      if (!containerRef.current.contains(selection.anchorNode)) {
        return;
      }
    }

    // Get position from selection bounding rect
    const range = selection?.getRangeAt(0);
    if (!range) return;
    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + window.scrollX;
    const y = rect.bottom + window.scrollY + 8;

    // Debounce to avoid multiple rapid calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPopup({
        x,
        y,
        selectedText: text,
        word: null,
        translation: "",
        loading: true,
        error: "",
      });

      try {
        if (isSingleWord(text)) {
          // Word lookup in vocab.db
          const word = await lookupWord(text);
          setPopup((prev) =>
            prev ? { ...prev, word, loading: false } : null
          );
        } else {
          // Phrase / sentence translation via API
          const resp = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const data = await resp.json();
          if (data.translation) {
            setPopup((prev) =>
              prev
                ? { ...prev, translation: data.translation, loading: false }
                : null
            );
          } else {
            setPopup((prev) =>
              prev
                ? { ...prev, error: "翻译失败", loading: false }
                : null
            );
          }
        }
      } catch {
        setPopup((prev) =>
          prev ? { ...prev, error: "网络错误", loading: false } : null
        );
      }
    }, 300);
  }, []);

  // Close popup on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setPopup(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Parse word tags for display
  function formatTags(tags: string) {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => {
        const labels: Record<string, string> = {
          cet4: "四级", cet6: "六级", kaoyan: "考研",
          ielts: "雅思", toefl: "托福", gre: "GRE",
          gaokao: "高考", zhongkao: "中考",
        };
        return labels[t] ?? t;
      });
  }

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="relative">
      {children}

      {/* Floating popup */}
      {popup && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            left: popup.x,
            top: popup.y,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
          className="w-72 max-w-[90vw] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {popup.selectedText}
            </span>
            <button
              onClick={() => setPopup(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-base leading-none ml-2 flex-shrink-0"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="p-3 text-sm">
            {popup.loading && (
              <p className="text-gray-400 dark:text-gray-500 text-center py-2">
                查询中...
              </p>
            )}

            {popup.error && !popup.loading && (
              <p className="text-red-500 dark:text-red-400 text-center py-1">
                {popup.error}
              </p>
            )}

            {/* Word detail from vocab.db */}
            {!popup.loading && popup.word && (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                    {popup.word.word}
                  </span>
                  {popup.word.phonetic && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      /{popup.word.phonetic}/
                    </span>
                  )}
                  {popup.word.pos && (
                    <span className="text-xs italic text-gray-400">
                      {popup.word.pos}
                    </span>
                  )}
                </div>
                {popup.word.translation && (
                  <p className="text-gray-700 dark:text-gray-300 leading-snug text-sm">
                    {popup.word.translation.replace(/\\n/g, "；")}
                  </p>
                )}
                {popup.word.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formatTags(popup.word.tags).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Word not in vocab.db — show translation fallback */}
            {!popup.loading && isSingleWord(popup.selectedText) && !popup.word && !popup.error && (
              <p className="text-gray-500 dark:text-gray-400 text-xs text-center py-1">
                词典中未收录此词
              </p>
            )}

            {/* Phrase / sentence translation */}
            {!popup.loading && popup.translation && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {popup.translation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
