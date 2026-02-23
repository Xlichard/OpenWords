"use client";

import { useState, useCallback } from "react";
import AudioButton from "./AudioButton";
import type { Word } from "@/types";
import { getCardState, saveCardState, incrementTodayStats } from "@/lib/storage";
import { createCardState, reviewCard } from "@/lib/sm2";

interface RecitationModeProps {
  words: Word[];
}

const PAGE_SIZE = 10;

export default function RecitationMode({ words }: RecitationModeProps) {
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [showTranslation, setShowTranslation] = useState(true);
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(words.length / PAGE_SIZE));
  const pageWords = words.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleMastered = useCallback(
    async (word: Word) => {
      const next = new Set(mastered);
      if (next.has(word.id)) {
        next.delete(word.id);
      } else {
        next.add(word.id);
        // Mark as "easy" in SM-2
        const existing = await getCardState(word.id);
        const state = existing ?? createCardState(word.id);
        const updated = reviewCard(state, 5);
        await saveCardState(updated);
        const isNew = !existing || existing.repetitions === 0;
        await incrementTodayStats(isNew ? "learned" : "reviewed");
      }
      setMastered(next);
    },
    [mastered]
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          已掌握 {mastered.size}/{words.length}
        </div>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {showTranslation ? "隐藏释义" : "显示释义"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${words.length > 0 ? (mastered.size / words.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Word list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {pageWords.map((word, idx) => {
            const isMastered = mastered.has(word.id);
            return (
              <div
                key={word.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isMastered
                    ? "bg-green-50 dark:bg-green-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                {/* Index */}
                <span className="text-xs text-gray-400 w-7 text-right flex-shrink-0">
                  {page * PAGE_SIZE + idx + 1}
                </span>

                {/* Mastered toggle */}
                <button
                  onClick={() => toggleMastered(word)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isMastered
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                  }`}
                >
                  {isMastered && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Word + phonetic */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isMastered
                          ? "text-green-700 dark:text-green-400 line-through"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {word.word}
                    </span>
                    {word.phonetic && (
                      <span className="text-xs text-gray-400">
                        /{word.phonetic}/
                      </span>
                    )}
                  </div>
                  {showTranslation && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {word.translation || "暂无释义"}
                    </div>
                  )}
                </div>

                {/* Audio button */}
                <AudioButton
                  word={word.word}
                  className="text-gray-400 hover:text-blue-500 flex-shrink-0"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ‹ 上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            下一页 ›
          </button>
        </div>
      )}

      {/* Summary */}
      {mastered.size === words.length && words.length > 0 && (
        <div className="mt-4 text-center text-green-600 dark:text-green-400 font-medium">
          🎉 本列表全部掌握！
        </div>
      )}
    </div>
  );
}
