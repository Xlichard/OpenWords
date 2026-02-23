"use client";

import Link from "next/link";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  learned?: number;
  dueCount?: number;
}

export default function CategoryCard({
  category,
  learned = 0,
  dueCount = 0,
}: CategoryCardProps) {
  const progress =
    category.count > 0 ? Math.round((learned / category.count) * 100) : 0;

  return (
    <Link href={`/learn/${category.tag}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Gradient accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${category.color}`}
        />

        {/* Due review badge */}
        {dueCount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {dueCount} 待复习
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl">{category.icon}</span>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {category.count.toLocaleString()} 词
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {category.label}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {category.description}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${category.color} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>
            已学 {learned}/{category.count}
          </span>
          <span>{progress}%</span>
        </div>
      </div>
    </Link>
  );
}
