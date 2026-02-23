"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ListSelector from "./ListSelector";
import SettingsPanel from "./SettingsPanel";
import type { UserSettings } from "@/types";
import { getCategoryWordIds } from "@/lib/actions";
import { getSettings, saveSettings } from "@/lib/storage";

interface CategoryPageProps {
  category: string;
  catLabel: string;
  catDescription: string;
  catIcon: string;
  catColor: string;
}

export default function CategoryPage({
  category,
  catLabel,
  catDescription,
  catIcon,
  catColor,
}: CategoryPageProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [listCount, setListCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [wordIds, setWordIds] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const loadData = useCallback(
    async (s: UserSettings) => {
      try {
        const ids = await getCategoryWordIds(category);
        setWordIds(ids);
        setTotalWords(ids.length);
        setListCount(Math.ceil(ids.length / s.listSize));
      } catch {
        setWordIds([]);
        setTotalWords(0);
        setListCount(0);
      }
    },
    [category]
  );

  useEffect(() => {
    async function init() {
      const s = await getSettings();
      setSettings(s);
      await loadData(s);
    }
    init();
  }, [loadData]);

  const handleSaveSettings = async (newSettings: UserSettings) => {
    await saveSettings(newSettings);
    const shouldReloadLists = !settings || settings.listSize !== newSettings.listSize;
    setSettings(newSettings);
    if (shouldReloadLists) {
      await loadData(newSettings);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
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
          onClick={() => setShowSettings(true)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xl"
          title="学习设置"
        >
          ⚙️
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-3xl">{catIcon}</span>
          {catLabel}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {catDescription}
        </p>
      </div>

      <ListSelector
        category={category}
        listCount={listCount}
        totalWords={totalWords}
        wordIds={wordIds}
        listSize={settings.listSize}
        color={catColor}
      />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
