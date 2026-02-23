import { getWordsForGroup } from "@/lib/actions";
import { CATEGORIES } from "@/types";
import LearnSession from "@/components/LearnSession";
import Link from "next/link";

interface GroupLearnPageProps {
  params: Promise<{ category: string; listId: string; groupId: string }>;
  searchParams: Promise<{ listSize?: string; groupSize?: string }>;
}

export default async function GroupLearnPage({
  params,
  searchParams,
}: GroupLearnPageProps) {
  const { category, listId, groupId } = await params;
  const sp = await searchParams;
  const listSize = parseInt(sp.listSize || "80", 10);
  const groupSize = parseInt(sp.groupSize || "20", 10);
  const listIndex = parseInt(listId, 10);
  const groupIndex = parseInt(groupId, 10);

  const catConfig = CATEGORIES.find((c) => c.tag === category);
  if (!catConfig || isNaN(listIndex) || isNaN(groupIndex)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">参数错误</p>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  const words = await getWordsForGroup(
    category,
    listIndex,
    groupIndex,
    listSize,
    groupSize
  );

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">📭</div>
        <p className="text-gray-500">该分组暂无单词</p>
        <Link
          href={`/learn/${category}/list/${listId}`}
          className="text-blue-500 hover:underline"
        >
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <LearnSession
        words={words}
        category={category}
        categoryLabel={`${catConfig.label} · 列表 ${listIndex + 1} · 第 ${groupIndex + 1} 组`}
        backUrl={`/learn/${category}/list/${listId}`}
      />
    </main>
  );
}

export async function generateMetadata({ params }: GroupLearnPageProps) {
  const { category, listId, groupId } = await params;
  const catConfig = CATEGORIES.find((c) => c.tag === category);
  const listNum = parseInt(listId, 10) + 1;
  const groupNum = parseInt(groupId, 10) + 1;
  return {
    title: catConfig
      ? `${catConfig.label} 列表${listNum} 第${groupNum}组 - OpenWords`
      : "学习 - OpenWords",
  };
}
