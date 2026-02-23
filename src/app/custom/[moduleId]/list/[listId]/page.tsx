"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CustomModule, CustomWord, Word } from "@/types";
import { getCustomModule, getCustomWordsForList } from "@/lib/storage";
import ListDetail from "@/components/ListDetail";

function customWordToWord(cw: CustomWord): Word {
  return {
    id: cw.index + 100000000, // Offset to avoid collision with SQLite IDs
    word: cw.word,
    phonetic: cw.phonetic,
    translation: cw.translation,
    definition: "",
    pos: "",
    collins: 0,
    oxford: 0,
    bnc: 0,
    frq: 0,
    exchange: "",
    tags: "custom",
  };
}

export default function CustomListPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const listId = params.listId as string;
  const listIndex = parseInt(listId, 10);

  const [module, setModule] = useState<CustomModule | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const mod = await getCustomModule(moduleId);
      if (!mod) {
        setLoading(false);
        return;
      }
      setModule(mod);
      const customWords = await getCustomWordsForList(
        moduleId,
        listIndex,
        mod.listSize
      );
      setWords(customWords.map(customWordToWord));
      setLoading(false);
    }
    load();
  }, [moduleId, listIndex]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">加载中...</div>
      </main>
    );
  }

  if (!module) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">❌</div>
        <p className="text-gray-500">未找到该词库</p>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <ListDetail
        words={words}
        category={`custom-${moduleId}`}
        categoryLabel={module.name}
        listIndex={listIndex}
        backUrl={`/custom/${moduleId}`}
        groupUrlPrefix={`/custom/${moduleId}/list/${listIndex}`}
      />
    </main>
  );
}
