import { getWordsForList, getListCount } from "@/lib/actions";
import { CATEGORIES } from "@/types";
import ListDetail from "@/components/ListDetail";
import Link from "next/link";

interface ListLearnPageProps {
  params: Promise<{ category: string; listId: string }>;
  searchParams: Promise<{ listSize?: string }>;
}

export default async function ListLearnPage({
  params,
  searchParams,
}: ListLearnPageProps) {
  const { category, listId } = await params;
  const sp = await searchParams;
  const parsedListSize = Number.parseInt(sp.listSize || "80", 10);
  const listSize = Number.isFinite(parsedListSize) && parsedListSize > 0 ? parsedListSize : 80;
  const listIndex = parseInt(listId, 10);

  const catConfig = CATEGORIES.find((c) => c.tag === category);
  if (!catConfig || isNaN(listIndex)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">未找到该列表</p>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  const listCount = await getListCount(category, listSize);
  if (listIndex < 0 || listIndex >= listCount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">列表编号超出范围</p>
        <Link
          href={`/learn/${category}`}
          className="text-blue-500 hover:underline"
        >
          返回列表
        </Link>
      </div>
    );
  }

  const words = await getWordsForList(category, listIndex, listSize);

  return (
    <main className="min-h-screen py-8">
      <ListDetail
        words={words}
        category={category}
        categoryLabel={catConfig.label}
        listIndex={listIndex}
        listSize={listSize}
        backUrl={`/learn/${category}`}
      />
    </main>
  );
}

export async function generateMetadata({ params }: ListLearnPageProps) {
  const { category, listId } = await params;
  const catConfig = CATEGORIES.find((c) => c.tag === category);
  const listNum = parseInt(listId, 10) + 1;
  return {
    title: catConfig
      ? `${catConfig.label} 列表${listNum} - OpenWords`
      : "学习 - OpenWords",
  };
}
