import { getArticles, getArticleCount, getAvailableDates } from "@/lib/article-actions";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";
import { SOURCE_META, DIFFICULTY_META } from "@/types/article";

const PAGE_SIZE = 12;

const SOURCES = Object.entries(SOURCE_META).map(([key, meta]) => ({
  key,
  label: meta.label,
}));

const DIFFICULTIES = Object.entries(DIFFICULTY_META).map(([key, meta]) => ({
  key,
  label: meta.label,
}));

interface PageProps {
  searchParams: Promise<{
    page?: string;
    source?: string;
    difficulty?: string;
    month?: string;  // YYYY-MM
    day?: string;    // DD
  }>;
}

export default async function ReadingPage({ searchParams }: PageProps) {
  const { page: pageStr, source, difficulty, month, day } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  // Build exact date when both month and day are present
  const date = month && day ? `${month}-${day.padStart(2, "0")}` : undefined;

  const [articles, total, availableDates] = await Promise.all([
    getArticles({ page, limit: PAGE_SIZE, source, difficulty, date, month: date ? undefined : month }),
    getArticleCount({ source, difficulty, date, month: date ? undefined : month }),
    getAvailableDates(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(source || difficulty || month);

  // Days available for the selected month
  const selectedMonthEntry = month
    ? availableDates.find((m) => m.month === month)
    : null;

  function filterHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { source, difficulty, month, day, ...params };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/reading${qs ? `?${qs}` : ""}`;
  }

  function pageHref(p: number) {
    return filterHref({ page: String(p) });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          每日外刊精读
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          精选 Guardian · BBC · VOA · The Conversation 外刊文章，中英双语对照，选词/选句即时翻译，长难句解析
        </p>
      </section>

      {/* Date Browser */}
      {availableDates.length > 0 && (
        <section className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">按日期浏览</p>

          {/* Month tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Link
              href={filterHref({ month: undefined, day: undefined, page: undefined })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !month
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
              }`}
            >
              全部
            </Link>
            {availableDates.map((entry) => (
              <Link
                key={entry.month}
                href={filterHref({ month: entry.month, day: undefined, page: undefined })}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  month === entry.month
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                    : "border-gray-300 text-gray-600 hover:border-gray-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
                }`}
              >
                {entry.label}
                <span className="ml-1 text-[10px] opacity-60">{entry.total}</span>
              </Link>
            ))}
          </div>

          {/* Day picker (visible when a month is selected) */}
          {selectedMonthEntry && (
            <div className="flex flex-wrap gap-1">
              <Link
                href={filterHref({ day: undefined, page: undefined })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  !day
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-400"
                }`}
              >
                全月
              </Link>
              {selectedMonthEntry.days.map((d) => (
                <Link
                  key={d.date}
                  href={filterHref({ day: d.day, page: undefined })}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    day === d.day
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-400"
                  }`}
                  title={`${d.date} · ${d.count}篇`}
                >
                  {d.day}日
                  <span className="ml-0.5 text-[10px] opacity-60">{d.count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Source filter */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">来源：</span>
          <Link
            href={filterHref({ source: undefined, page: undefined })}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !source
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
            }`}
          >
            全部
          </Link>
          {SOURCES.map((s) => (
            <Link
              key={s.key}
              href={filterHref({ source: s.key, page: undefined })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                source === s.key
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-transparent md:hidden" />

        {/* Difficulty filter */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">难度：</span>
          <Link
            href={filterHref({ difficulty: undefined, page: undefined })}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !difficulty
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
            }`}
          >
            全部
          </Link>
          {DIFFICULTIES.map((d) => (
            <Link
              key={d.key}
              href={filterHref({ difficulty: d.key, page: undefined })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                difficulty === d.key
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-400"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(total > 0 || hasFilters) && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {date
            ? `${date} 共 ${total} 篇`
            : month
            ? `${month} 共 ${total} 篇`
            : `共 ${total} 篇文章`}
          {page > 1 && `，第 ${page} / ${totalPages} 页`}
        </p>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📰</p>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            {hasFilters ? "没有符合条件的文章" : "暂无文章"}
          </p>
          {!hasFilters && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                运行爬虫脚本以获取最新外刊文章
              </p>
              <div className="inline-block text-left bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-4 text-sm font-mono">
                <p className="text-gray-500 dark:text-gray-400 mb-1"># 安装依赖</p>
                <p className="text-gray-900 dark:text-gray-100">pip install -r data/requirements.txt</p>
                <p className="text-gray-500 dark:text-gray-400 mt-3 mb-1"># 运行爬虫</p>
                <p className="text-gray-900 dark:text-gray-100">cd data && python run_crawler.py</p>
                <p className="text-gray-500 dark:text-gray-400 mt-3 mb-1"># 复制数据库到 web/</p>
                <p className="text-gray-900 dark:text-gray-100">copy data\articles.db web\articles.db</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Article grid */}
      {articles.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ← 上一页
                </Link>
              )}

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      p === page
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-medium"
                        : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}

              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  下一页 →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
