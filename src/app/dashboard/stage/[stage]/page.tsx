"use client";

import { useParams } from "next/navigation";
import FilteredWordList from "@/components/FilteredWordList";
import type { CardState } from "@/types";
import { useCallback } from "react";
import Link from "next/link";

const stageConfigs: Record<string, { title: string; icon: string; color: string; filter: (c: CardState) => boolean }> = {
  new: {
    title: "新学词汇",
    icon: "🌱",
    color: "blue",
    filter: (c) => c.repetitions > 0 && c.interval < 1,
  },
  short: {
    title: "短期记忆",
    icon: "⏳",
    color: "yellow",
    filter: (c) => c.repetitions > 0 && c.interval >= 1 && c.interval < 7,
  },
  long: {
    title: "长期记忆",
    icon: "🧠",
    color: "green",
    filter: (c) => c.repetitions > 0 && c.interval >= 7 && c.interval < 30,
  },
  mature: {
    title: "已熟练",
    icon: "💎",
    color: "purple",
    filter: (c) => c.repetitions > 0 && c.interval >= 30,
  },
};

export default function StagePage() {
  const params = useParams();
  const stage = params.stage as string;
  const config = stageConfigs[stage];

  const filter = useCallback(
    (c: CardState) => config?.filter(c) ?? false,
    [stage] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!config) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">无效的记忆阶段</p>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          返回进度
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <FilteredWordList
        title={config.title}
        icon={config.icon}
        accentColor={config.color}
        filter={filter}
      />
    </main>
  );
}
