"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCardStates } from "@/lib/storage";

interface ListSelectorProps {
  category: string;
  listCount: number;
  totalWords: number;
  wordIds: number[];
  listSize: number;
  color: string;
}

interface ListInfo {
  index: number;
  learned: number;
  total: number;
  dueCount: number;
}
const LISTS_PER_PAGE = 120;

export default function ListSelector({
  category,
  listCount,
  totalWords,
  wordIds,
  listSize,
  color,
}: ListSelectorProps) {
  const [lists, setLists] = useState<ListInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      setLoading(true);
      try {
        if (listCount <= 0 || wordIds.length === 0) {
          if (!cancelled) {
            setLists([]);
          }
          return;
        }

        const now = new Date().toISOString();
        const allCards = await getAllCardStates();
        const cardMap = new Map(allCards.map((card) => [card.wordId, card]));

        const infos: ListInfo[] = Array.from({ length: listCount }, (_, i) => {
          const start = i * listSize;
          const ids = wordIds.slice(start, start + listSize);
          let learned = 0;
          let dueCount = 0;

          for (const id of ids) {
            const state = cardMap.get(id);
            if (!state || state.repetitions <= 0) continue;
            learned += 1;
            if (state.nextReview <= now) dueCount += 1;
          }

          return {
            index: i,
            learned,
            total: ids.length,
            dueCount,
          };
        });

        if (!cancelled) {
          setLists(infos);
        }
      } catch {
        if (!cancelled) {
          const fallback: ListInfo[] = Array.from({ length: listCount }, (_, i) => ({
            index: i,
            learned: 0,
            total: Math.max(0, Math.min(listSize, totalWords - i * listSize)),
            dueCount: 0,
          }));
          setLists(fallback);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [listCount, listSize, totalWords, wordIds]);

  useEffect(() => {
    setPage(0);
  }, [listCount, listSize]);

  const totalPages = Math.max(1, Math.ceil(lists.length / LISTS_PER_PAGE));
  const pageStart = page * LISTS_PER_PAGE;
  const visibleLists = lists.slice(pageStart, pageStart + LISTS_PER_PAGE);

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
        {totalPages > 1 && (
          <>
            <span>·</span>
            <span>
              第 {page + 1}/{totalPages} 页
            </span>
          </>
        )}
      </div>

      {/* Review button */}
      {lists.some((l) => l.dueCount > 0) && (
        <Link
          href={`/learn/${category}/review`}
          prefetch={false}
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
        {visibleLists.map((list) => {
          const progress =
            list.total > 0
              ? Math.round((list.learned / list.total) * 100)
              : 0;
          const isCompleted = progress === 100;
          const isStarted = list.learned > 0;

          return (
            <Link
              key={list.index}
              href={`/learn/${category}/list/${list.index}?listSize=${listSize}`}
              prefetch={false}
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            上一页
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
