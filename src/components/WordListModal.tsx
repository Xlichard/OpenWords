"use client";

import { useState } from "react";
import AudioButton from "./AudioButton";
import type { Word } from "@/types";

const PAGE_SIZE = 10;

interface WordListModalProps {
  title: string;
  words: Word[];
  extraInfo?: (word: Word) => string; // optional extra column text
  onClose: () => void;
}

export default function WordListModal({
  title,
  words,
  extraInfo,
  onClose,
}: WordListModalProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(words.length / PAGE_SIZE));
  const pageWords = words.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{words.length} 词</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {words.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无数据</div>
          ) : (
            pageWords.map((word, idx) => (
              <div
                key={word.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">
                  {page * PAGE_SIZE + idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {word.word}
                    </span>
                    {word.phonetic && (
                      <span className="text-xs text-gray-400">
                        /{word.phonetic}/
                      </span>
                    )}
                    <AudioButton
                      word={word.word}
                      className="text-gray-400 hover:text-blue-500 scale-75"
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {word.translation || "暂无释义"}
                  </div>
                </div>
                {extraInfo && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {extraInfo(word)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ‹ 上一页
            </button>
            <span className="text-sm text-gray-500">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              下一页 ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
