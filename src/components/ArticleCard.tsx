import Link from "next/link";
import type { Article } from "@/types/article";
import { SOURCE_META, DIFFICULTY_META, CATEGORY_LABELS } from "@/types/article";

interface ArticleCardProps {
  article: Article & { paragraph_count?: number };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const srcMeta = SOURCE_META[article.source] ?? {
    label: article.source,
    badge: "bg-gray-100 text-gray-700",
    color: "from-gray-500 to-gray-600",
  };
  const diffMeta = DIFFICULTY_META[article.difficulty] ?? {
    label: article.difficulty,
    badge: "bg-gray-100 text-gray-700",
  };

  let dateStr = "";
  if (article.published_at) {
    try {
      dateStr = new Date(article.published_at).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    } catch {
      // ignore
    }
  }

  const categoryLabel = CATEGORY_LABELS[article.category];

  return (
    <Link href={`/reading/${article.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Gradient accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${srcMeta.color}`}
        />

        <div className="p-5 pt-6 flex flex-col flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${srcMeta.badge}`}
            >
              {srcMeta.label}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${diffMeta.badge}`}
            >
              {diffMeta.label}
            </span>
            {categoryLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {categoryLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          {/* Chinese title */}
          {article.title_cn && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
              {article.title_cn}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              {article.author && (
                <span className="truncate max-w-[120px]">{article.author}</span>
              )}
              {dateStr && <span>{dateStr}</span>}
            </div>
            {article.paragraph_count !== undefined && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {article.paragraph_count} 段
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
