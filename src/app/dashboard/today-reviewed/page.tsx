"use client";

import FilteredWordList from "@/components/FilteredWordList";
import type { CardState } from "@/types";
import { useCallback } from "react";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function TodayReviewedPage() {
  const filter = useCallback(
    (c: CardState) => c.lastReview.startsWith(todayStr()) && c.repetitions > 1,
    []
  );

  return (
    <main className="min-h-screen">
      <FilteredWordList
        title="今日复习"
        icon="🔄"
        accentColor="green"
        filter={filter}
      />
    </main>
  );
}
