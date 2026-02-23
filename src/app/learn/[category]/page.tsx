import { CATEGORIES } from "@/types";
import CategoryPage from "@/components/CategoryPage";
import Link from "next/link";

interface LearnPageProps {
  params: Promise<{ category: string }>;
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { category } = await params;

  const catConfig = CATEGORIES.find((c) => c.tag === category);
  if (!catConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">未找到该分类</p>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <CategoryPage
        category={category}
        catLabel={catConfig.label}
        catDescription={catConfig.description}
        catIcon={catConfig.icon}
        catColor={catConfig.color}
      />
    </main>
  );
}

export async function generateMetadata({ params }: LearnPageProps) {
  const { category } = await params;
  const catConfig = CATEGORIES.find((c) => c.tag === category);
  return {
    title: catConfig
      ? `${catConfig.label} - OpenWords`
      : "学习 - OpenWords",
  };
}
