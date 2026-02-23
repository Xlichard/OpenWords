"use client";

import { useEffect, useState } from "react";
import LearnSession from "./LearnSession";
import Link from "next/link";
import { getCategoryWordIds, getWordsByIds } from "@/lib/actions";
import { getDueWordIdsForCategory } from "@/lib/storage";
import type { Word } from "@/types";

interface ReviewSessionProps {
  category: string;
  categoryLabel: string;
}

export default function ReviewSession({
  category,
  categoryLabel,
}: ReviewSessionProps) {
  const [words, setWords] = useState<Word[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDueWords() {
      try {
        // Get all word IDs for this category
        const allWordIds = await getCategoryWordIds(category);
        // Find which ones are due for review
        const dueIds = await getDueWordIdsForCategory(allWordIds);

        if (dueIds.length === 0) {
          setWords([]);
          setLoading(false);
          return;
        }

        // Fetch word data from server (limit to 50 per session)
        const limitedIds = dueIds.slice(0, 50);
        const wordData = await getWordsByIds(limitedIds);
        setWords(wordData);
      } catch (e) {
        console.error("加载复习单词失败:", e);
        setError("加载失败，请重试");
      } finally {
        setLoading(false);
      }
    }
    loadDueWords();
  }, [category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">加载待复习单词...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-gray-500">{error}</p>
        <Link
          href={`/learn/${category}`}
          className="text-blue-500 hover:underline"
        >
          返回列表
        </Link>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          暂无待复习单词
        </h2>
        <p className="text-gray-500 text-sm">所有单词都已按时复习，继续保持！</p>
        <Link
          href={`/learn/${category}`}
          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <LearnSession
      words={words}
      category={category}
      categoryLabel={`${categoryLabel} · 复习`}
      backUrl={`/learn/${category}`}
    />
  );
}
