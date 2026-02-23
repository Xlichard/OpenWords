"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RecitationMode from "./RecitationMode";
import type { Word } from "@/types";
import { getSettings } from "@/lib/storage";

interface ListDetailProps {
  words: Word[];
  category: string;
  categoryLabel: string;
  listIndex: number;
  listSize?: number;
  backUrl: string;
  groupUrlPrefix?: string; // e.g. "/custom/abc/list/0" — if omitted, defaults to /learn/{category}/list/{listIndex}
}

export default function ListDetail({
  words,
  category,
  categoryLabel,
  listIndex,
  listSize,
  backUrl,
  groupUrlPrefix,
}: ListDetailProps) {
  const [mode, setMode] = useState<"recite" | "learn">("recite");
  const [groupSize, setGroupSize] = useState(20);
  const effectiveListSize = listSize ?? 80;

  useEffect(() => {
    getSettings().then((s) => setGroupSize(s.groupSize));
  }, []);

  const groupCount = Math.ceil(words.length / groupSize);

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={backUrl}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ← 返回
        </Link>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {categoryLabel} · 列表 {listIndex + 1}
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setMode("recite")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "recite"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          📖 背诵模式
        </button>
        <button
          onClick={() => setMode("learn")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "learn"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          🎯 学习模式
        </button>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        本列表共 {words.length} 词
        {mode === "learn" && ` · 分为 ${groupCount} 组 · 每组 ${groupSize} 词`}
      </div>

      {/* Content */}
      {mode === "recite" ? (
        <RecitationMode words={words} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: groupCount }, (_, i) => {
            const start = i * groupSize + 1;
            const end = Math.min((i + 1) * groupSize, words.length);
            return (
              <Link
                key={i}
                href={`${groupUrlPrefix ?? `/learn/${category}/list/${listIndex}`}/group/${i}${
                  groupUrlPrefix
                    ? ""
                    : `?listSize=${effectiveListSize}&groupSize=${groupSize}`
                }`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  第 {i + 1} 组
                </div>
                <div className="text-xs text-gray-400">
                  {start}-{end} 词
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
