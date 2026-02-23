"use client";

import { useState, useCallback } from "react";
import Flashcard from "./Flashcard";
import ProgressBar from "./ProgressBar";
import AudioButton from "./AudioButton";
import type { Word, Quality } from "@/types";
import { createCardState, reviewCard, formatInterval } from "@/lib/sm2";
import {
  getCardState,
  saveCardState,
  incrementTodayStats,
} from "@/lib/storage";
import Link from "next/link";

interface WordRating {
  word: Word;
  quality: Quality;
  interval: number;
}

interface LearnSessionProps {
  words: Word[];
  category: string;
  categoryLabel: string;
  backUrl?: string;
}

export default function LearnSession({
  words,
  category,
  categoryLabel,
  backUrl = "/",
}: LearnSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ forgot: 0, hard: 0, easy: 0 });
  const [wordRatings, setWordRatings] = useState<WordRating[]>([]);

  const isMedical = category === "medical";
  const currentWord = words[currentIndex];

  const handleRate = useCallback(
    async (quality: Quality) => {
      if (!currentWord) return;

      // Update SM-2 state
      const existing = await getCardState(currentWord.id);
      const state = existing ?? createCardState(currentWord.id);
      const updated = reviewCard(state, quality);
      await saveCardState(updated);

      // Update daily stats
      const isNew = !existing || existing.repetitions === 0;
      await incrementTodayStats(isNew ? "learned" : "reviewed");

      // Track word rating
      setWordRatings((prev) => [
        ...prev,
        { word: currentWord, quality, interval: updated.interval },
      ]);

      // Update local stats
      setStats((prev) => ({
        forgot: prev.forgot + (quality === 0 ? 1 : 0),
        hard: prev.hard + (quality === 3 ? 1 : 0),
        easy: prev.easy + (quality === 5 ? 1 : 0),
      }));

      // Advance to next word or complete
      if (currentIndex + 1 < words.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCompleted(true);
      }
    },
    [currentWord, currentIndex, words.length]
  );

  if (completed) {
    const total = stats.forgot + stats.hard + stats.easy;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            本轮学习完成！
          </h2>
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-500">{stats.forgot}</div>
              <div className="text-sm text-gray-500">不认识</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-500">
                {stats.hard}
              </div>
              <div className="text-sm text-gray-500">模糊</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">
                {stats.easy}
              </div>
              <div className="text-sm text-gray-500">认识</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            共学习 {total} 个单词
          </div>
        </div>

        {/* Word Summary List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              本轮单词汇总
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
            {wordRatings.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                {/* Rating indicator */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.quality === 0
                      ? "bg-red-500"
                      : item.quality === 3
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />

                {/* Word info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.word.word}
                    </span>
                    {item.word.phonetic && (
                      <span className="text-xs text-gray-400">
                        /{item.word.phonetic}/
                      </span>
                    )}
                    <AudioButton
                      word={item.word.word}
                      className="text-gray-400 hover:text-blue-500 scale-75"
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.word.translation || "暂无释义"}
                  </div>
                </div>

                {/* Next review */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatInterval(item.interval)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setCompleted(false);
              setStats({ forgot: 0, hard: 0, easy: 0 });
              setWordRatings([]);
            }}
            className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            再来一轮
          </button>
          <Link
            href={backUrl}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            返回
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">📭</div>
        <p className="text-gray-500">该分类暂无单词</p>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={backUrl}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ← 返回
        </Link>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {categoryLabel}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar
        current={currentIndex + 1}
        total={words.length}
        className="mb-6"
      />

      {/* Flashcard */}
      <Flashcard
        key={currentWord.id}
        word={currentWord}
        onRate={handleRate}
        showDefinition={isMedical}
      />

      {/* Keyboard hint */}
      <div className="text-center mt-6 text-xs text-gray-400">
        点击卡片翻转 · 选择记忆程度进入下一个
      </div>
    </div>
  );
}
