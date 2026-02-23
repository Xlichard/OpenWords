"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWordIdsForList } from "@/lib/actions";
import { getLearnedCountForCategory, getDueCardsForWordIds } from "@/lib/storage";

interface ListSelectorProps {
  category: string;
  categoryLabel: string;
  listCount: number;
  totalWords: number;
  listSize: number;
  color: string;
}

interface ListInfo {
  index: number;
  learned: number;
  total: number;
  dueCount: number;
}

export default function ListSelector({
  category,
  categoryLabel,
  listCount,
  totalWords,
  listSize,
  color,
}: ListSelectorProps) {
  const [lists, setLists] = useState<ListInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      const infos: ListInfo[] = [];
      for (let i = 0; i < listCount; i++) {
        try {
          const wordIds = await getWordIdsForList(category, i, listSize);
          const learned = await getLearnedCountForCategory(wordIds);
          const dueCount = await getDueCardsForWordIds(wordIds);
          infos.push({
            index: i,
            learned,
            total: wordIds.length,
            dueCount,
          });
        } catch {
          infos.push({ index: i, learned: 0, total: listSize, dueCount: 0 });
        }
      }
      setLists(infos);
      setLoading(false);
    }
    loadProgress();
  }, [category, listCount, listSize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
        <span>共 {totalWords} 词</span>
        <span>·</span>
        <span>{listCount} 个列表</span>
        <span>·</span>
        <span>每组 {listSize} 词</span>
      </div>

      {/* Review button */}
      {lists.some((l) => l.dueCount > 0) && (
        <Link
          href={`/learn/${category}/review`}
          className={`mb-6 flex items-center justify-between w-full p-4 rounded-2xl bg-gradient-to-r ${color} text-white shadow-md hover:shadow-lg transition-all`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <div className="font-bold">开始复习</div>
              <div className="text-sm opacity-90">
                {lists.reduce((sum, l) => sum + l.dueCount, 0)} 个单词待复习
              </div>
            </div>
          </div>
          <span className="text-xl">→</span>
        </Link>
      )}

      {/* List Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {lists.map((list) => {
          const progress =
            list.total > 0
              ? Math.round((list.learned / list.total) * 100)
              : 0;
          const isCompleted = progress === 100;
          const isStarted = list.learned > 0;

          return (
            <Link
              key={list.index}
              href={`/learn/${category}/list/${list.index}`}
              className={`relative overflow-hidden rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                isCompleted
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : isStarted
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* List number */}
              <div
                className={`text-lg font-bold ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isStarted
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {list.index + 1}
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status text */}
              <div className="text-xs text-gray-400">
                {list.learned}/{list.total}
              </div>

              {/* Due badge */}
              {list.dueCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {list.dueCount > 9 ? "9+" : list.dueCount}
                </div>
              )}

              {/* Completed checkmark */}
              {isCompleted && (
                <div className="absolute top-1 right-1 text-green-500 text-xs">
                  ✓
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
