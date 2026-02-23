"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CustomModule } from "@/types";
import { getCustomModule, deleteCustomModule } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function CustomModulePage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const [module, setModule] = useState<CustomModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const mod = await getCustomModule(moduleId);
      setModule(mod ?? null);
      setLoading(false);
    }
    load();
  }, [moduleId]);

  const handleDelete = async () => {
    if (!confirm("确定要删除该词库吗？此操作不可撤销。")) return;
    await deleteCustomModule(moduleId);
    router.push("/");
  };

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

  const listCount = Math.ceil(module.wordCount / module.listSize);

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ← 返回
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 text-sm transition-colors"
          >
            删除词库
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">{module.icon}</span>
            {module.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            自定义词库 · {module.wordCount} 词 · 每列表 {module.listSize} 词 · 每组{" "}
            {module.groupSize} 词
          </p>
        </div>

        {/* List grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: listCount }, (_, i) => {
            const start = i * module.listSize + 1;
            const end = Math.min((i + 1) * module.listSize, module.wordCount);
            return (
              <Link
                key={i}
                href={`/custom/${moduleId}/list/${i}`}
                className="relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {i + 1}
                </div>
                <div className="text-xs text-gray-400">
                  {start}-{end}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
