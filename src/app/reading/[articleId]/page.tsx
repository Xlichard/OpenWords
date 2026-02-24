import { getArticleById } from "@/lib/article-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SOURCE_META, DIFFICULTY_META, CATEGORY_LABELS } from "@/types/article";
import BilingualReader from "@/components/BilingualReader";
import SelectionTranslator from "@/components/SelectionTranslator";

interface PageProps {
  params: Promise<{ articleId: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { articleId } = await params;
  const id = parseInt(articleId);
  if (isNaN(id)) notFound();

  const article = await getArticleById(id);
  if (!article) notFound();

  const srcMeta = SOURCE_META[article.source] ?? {
    label: article.source,
    badge: "bg-gray-100 text-gray-700",
    color: "from-gray-500 to-gray-600",
  };
  const diffMeta = DIFFICULTY_META[article.difficulty] ?? {
    label: article.difficulty,
    badge: "bg-gray-100 text-gray-700",
  };
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;

  let dateStr = "";
  if (article.published_at) {
    try {
      dateStr = new Date(article.published_at).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      dateStr = article.published_at;
    }
  }

  const complexCount = article.paragraphs
    .flatMap((p) => p.sentences)
    .filter((s) => s.is_complex).length;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/reading"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
      >
        ← 返回文章列表
      </Link>

      {/* Article header */}
      <article>
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${srcMeta.badge}`}
          >
            {srcMeta.label}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${diffMeta.badge}`}
          >
            {diffMeta.label}
          </span>
          {categoryLabel && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {categoryLabel}
            </span>
          )}
          {complexCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {complexCount} 个长难句
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {article.title}
        </h1>
        {article.title_cn && (
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            {article.title_cn}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-8">
          {article.author && <span>{article.author}</span>}
          {dateStr && <span>{dateStr}</span>}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            原文链接 ↗
          </a>
        </div>

        {/* Tip */}
        <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>使用提示：</strong>选中单词可查词典，选中句子可翻译；蓝色高亮句为长难句，点击可解析结构
        </div>

        {/* Bilingual reader wrapped in selection translator */}
        <SelectionTranslator>
          <BilingualReader paragraphs={article.paragraphs} />
        </SelectionTranslator>

        {/* Footer source credit */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-400 dark:text-gray-500">
          来源：
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {srcMeta.label}
          </a>
          ，仅供个人英语学习使用
        </div>
      </article>
    </main>
  );
}
