import { getCategories } from "@/lib/actions";
import HomeContent from "@/components/HomeContent";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          OpenWords
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          开源背单词应用 · 间隔重复记忆 · 覆盖四六级/考研/雅思/托福/GRE/医学词汇
        </p>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          选择词库开始学习
        </h2>
        <HomeContent categories={categories} />
      </section>
    </main>
  );
}
