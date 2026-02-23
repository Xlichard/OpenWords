"use client";

import { useState } from "react";
import type { UserSettings } from "@/types";

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [listSize, setListSize] = useState(settings.listSize);
  const [groupSize, setGroupSize] = useState(settings.groupSize);

  const handleSave = () => {
    onSave({ ...settings, listSize, groupSize });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          学习设置
        </h2>

        <div className="space-y-5">
          {/* List size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              每个列表单词数
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setListSize(Math.max(20, listSize - 10))}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={listSize}
                onChange={(e) =>
                  setListSize(Math.max(10, parseInt(e.target.value) || 10))
                }
                className="flex-1 text-center text-lg font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-gray-900 dark:text-white"
                min={10}
                step={10}
              />
              <button
                onClick={() => setListSize(listSize + 10)}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Group size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              每组学习单词数
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGroupSize(Math.max(5, groupSize - 5))}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={groupSize}
                onChange={(e) =>
                  setGroupSize(Math.max(5, parseInt(e.target.value) || 5))
                }
                className="flex-1 text-center text-lg font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-gray-900 dark:text-white"
                min={5}
                step={5}
              />
              <button
                onClick={() => setGroupSize(groupSize + 5)}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {groupSize > listSize && (
            <p className="text-xs text-red-500">
              每组单词数不能超过列表单词数
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={groupSize > listSize}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
