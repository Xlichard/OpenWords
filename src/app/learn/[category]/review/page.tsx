import { CATEGORIES } from "@/types";
import ReviewSession from "@/components/ReviewSession";
import Link from "next/link";

interface ReviewPageProps {
  params: Promise<{ category: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
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
      <ReviewSession category={category} categoryLabel={catConfig.label} />
    </main>
  );
}

export async function generateMetadata({ params }: ReviewPageProps) {
  const { category } = await params;
  const catConfig = CATEGORIES.find((c) => c.tag === category);
  return {
    title: catConfig
      ? `复习 ${catConfig.label} - OpenWords`
      : "复习 - OpenWords",
  };
}
