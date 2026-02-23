"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CategoryCard from "./CategoryCard";
import type { Category, CustomModule } from "@/types";
import { getCategoryWordIds } from "@/lib/actions";
import {
  getLearnedCountForCategory,
  getDueCardsForWordIds,
  getAllCustomModules,
} from "@/lib/storage";

interface HomeContentProps {
  categories: Category[];
}

export default function HomeContent({ categories }: HomeContentProps) {
  const [learnedCounts, setLearnedCounts] = useState<Record<string, number>>(
    {}
  );
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);

  useEffect(() => {
    async function loadProgress() {
      const learned: Record<string, number> = {};
      const due: Record<string, number> = {};
      for (const cat of categories) {
        try {
          const wordIds = await getCategoryWordIds(cat.tag);
          learned[cat.tag] = await getLearnedCountForCategory(wordIds);
          due[cat.tag] = await getDueCardsForWordIds(wordIds);
        } catch {
          learned[cat.tag] = 0;
          due[cat.tag] = 0;
        }
      }
      setLearnedCounts(learned);
      setDueCounts(due);

      // Load custom modules
      const modules = await getAllCustomModules();
      setCustomModules(modules);
    }
    loadProgress();
  }, [categories]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.tag}
            category={cat}
            learned={learnedCounts[cat.tag] ?? 0}
            dueCount={dueCounts[cat.tag] ?? 0}
          />
        ))}
      </div>

      {/* Custom modules section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          自定义词库
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {customModules.map((mod) => (
            <Link key={mod.id} href={`/custom/${mod.id}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`}
                />
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{mod.icon}</span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {mod.wordCount} 词
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {mod.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  自定义词库
                </p>
              </div>
            </Link>
          ))}

          {/* Add custom module card */}
          <Link href="/custom/new">
            <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer min-h-[160px]">
              <div className="text-3xl">+</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                添加自定义词库
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
