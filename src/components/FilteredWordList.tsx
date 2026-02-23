"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AudioButton from "./AudioButton";
import type { Word, CardState } from "@/types";
import { getAllCardStates } from "@/lib/storage";
import { getWordsByIds } from "@/lib/actions";
import { formatInterval } from "@/lib/sm2";

const PAGE_SIZE = 10;

interface FilteredWordListProps {
  title: string;
  icon: string;
  accentColor: string; // e.g. "blue", "green", "purple"
  filter: (card: CardState) => boolean;
  backUrl?: string;
}

interface WordItem {
  word: Word;
  card: CardState;
  stage: string;
  stageColor: string;
}

const stageConfig: Record<string, { label: string; color: string }> = {
  new: { label: "新学", color: "text-blue-500 bg-blue-500/10" },
  short: { label: "短期", color: "text-amber-500 bg-amber-500/10" },
  long: { label: "长期", color: "text-emerald-500 bg-emerald-500/10" },
  mature: { label: "熟练", color: "text-purple-500 bg-purple-500/10" },
};

function getStageKey(card: CardState): string {
  if (card.interval < 1) return "new";
  if (card.interval < 7) return "short";
  if (card.interval < 30) return "long";
  return "mature";
}

const gradients: Record<string, string> = {
  blue: "from-blue-500/20 via-cyan-500/10 to-transparent",
  green: "from-emerald-500/20 via-teal-500/10 to-transparent",
  purple: "from-purple-500/20 via-pink-500/10 to-transparent",
  orange: "from-orange-500/20 via-amber-500/10 to-transparent",
  yellow: "from-yellow-500/20 via-amber-500/10 to-transparent",
  red: "from-red-500/20 via-rose-500/10 to-transparent",
};

export default function FilteredWordList({
  title,
  icon,
  accentColor,
  filter,
  backUrl = "/dashboard",
}: FilteredWordListProps) {
  const [items, setItems] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function load() {
      const allCards = await getAllCardStates();
      const filtered = allCards.filter(filter);
      filtered.sort((a, b) => b.lastReview.localeCompare(a.lastReview));

      const ids = filtered.map((c) => c.wordId);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const words = await getWordsByIds(ids);
      const wordMap = new Map(words.map((w) => [w.id, w]));

      const result: WordItem[] = [];
      for (const card of filtered) {
        const word = wordMap.get(card.wordId);
        if (!word) continue;
        const key = getStageKey(card);
        const cfg = stageConfig[key];
        result.push({ word, card, stage: cfg.label, stageColor: cfg.color });
      }
      setItems(result);
      setLoading(false);
    }
    load();
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const gradient = gradients[accentColor] || gradients.blue;

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-400 animate-pulse">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Hero gradient */}
      <div className={`absolute top-0 left-0 right-0 h-64 bg-gradient-to-b ${gradient} pointer-events-none`} />

      <div className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="animate-fade-up">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回进度
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl animate-float">{icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                共 {items.length} 个单词
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="animate-scale-in glass-card rounded-2xl p-12 text-center mt-8">
            <div className="text-5xl mb-4 animate-float">📭</div>
            <p className="text-gray-500 dark:text-gray-400 mb-3">暂无数据</p>
            <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors">
              前往词库开始学习 →
            </Link>
          </div>
        ) : (
          <div className="mt-6 animate-fade-up stagger-2">
            {/* Word list */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {pageItems.map((item, idx) => {
                  const isDue = item.card.nextReview <= new Date().toISOString();
                  return (
                    <div
                      key={item.word.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-200 animate-fade-up"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <span className="text-xs text-gray-400 w-7 text-right flex-shrink-0 font-mono">
                        {page * PAGE_SIZE + idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {item.word.word}
                          </span>
                          {item.word.phonetic && (
                            <span className="text-xs text-gray-400 font-light">
                              /{item.word.phonetic}/
                            </span>
                          )}
                          <AudioButton
                            word={item.word.word}
                            className="text-gray-400 hover:text-blue-500 scale-75 transition-colors"
                          />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {item.word.translation || "暂无释义"}
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${item.stageColor}`}>
                        {item.stage}
                      </span>
                      <span className={`text-xs flex-shrink-0 font-medium ${isDue ? "text-red-500" : "text-gray-400"}`}>
                        {isDue ? "待复习" : formatInterval(item.card.interval)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 animate-fade-in stagger-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="glass-card px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                >
                  ‹ 上一页
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 7 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "text-gray-500 hover:bg-white/60 dark:hover:bg-white/10"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="glass-card px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                >
                  下一页 ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
