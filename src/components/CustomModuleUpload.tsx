"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CustomModule, CustomWord } from "@/types";
import { saveCustomModule } from "@/lib/storage";

const ICONS = ["📝", "📒", "📕", "📗", "📘", "📙", "🗂️", "💼", "🎒", "⭐"];
const COLORS = [
  "from-blue-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-purple-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-purple-600",
  "from-yellow-500 to-orange-600",
];

interface ParsedWord {
  word: string;
  translation: string;
}

function parseTextContent(text: string): ParsedWord[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words: ParsedWord[] = [];
  for (const line of lines) {
    // Support: "word\ttranslation", "word,translation", "word  translation", or just "word"
    const tabMatch = line.match(/^([^\t,]+)[\t,]\s*(.+)$/);
    if (tabMatch) {
      words.push({ word: tabMatch[1].trim(), translation: tabMatch[2].trim() });
    } else {
      // Check for double-space separator
      const spaceMatch = line.match(/^(\S+)\s{2,}(.+)$/);
      if (spaceMatch) {
        words.push({ word: spaceMatch[1].trim(), translation: spaceMatch[2].trim() });
      } else {
        words.push({ word: line.trim(), translation: "" });
      }
    }
  }
  return words.filter((w) => w.word.length > 0);
}

async function parseFile(file: File): Promise<ParsedWord[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "csv") {
    const text = await file.text();
    return parseTextContent(text);
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return parseTextContent(result.value);
  }

  if (ext === "pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item) => "str" in item)
        .map((item) => (item as { str: string }).str)
        .join(" ");
      fullText += pageText + "\n";
    }
    return parseTextContent(fullText);
  }

  throw new Error(`不支持的文件格式: .${ext}`);
}

export default function CustomModuleUpload() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "config">("upload");
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📝");
  const [color, setColor] = useState(COLORS[0]);
  const [listSize, setListSize] = useState(80);
  const [groupSize, setGroupSize] = useState(20);
  const [saving, setSaving] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setError(null);
    setFileName(file.name);
    try {
      const words = await parseFile(file);
      if (words.length === 0) {
        setError("未能从文件中解析出单词，请检查文件格式");
        return;
      }
      setParsedWords(words);
      setName(file.name.replace(/\.[^.]+$/, ""));
      setStep("config");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析文件失败");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const moduleId = crypto.randomUUID();
      const module: CustomModule = {
        id: moduleId,
        name: name.trim(),
        icon,
        color,
        listSize,
        groupSize,
        wordCount: parsedWords.length,
        createdAt: new Date().toISOString(),
      };
      const words: CustomWord[] = parsedWords.map((w, i) => ({
        moduleId,
        index: i,
        word: w.word,
        phonetic: "",
        translation: w.translation,
      }));
      await saveCustomModule(module, words);
      router.push(`/custom/${moduleId}`);
    } catch (e) {
      setError("保存失败，请重试");
      setSaving(false);
    }
  };

  if (step === "config") {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          配置自定义词库
        </h1>

        <div className="space-y-5">
          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              已解析 {parsedWords.length} 个单词
            </div>
            <div className="mt-2 text-xs text-blue-500 dark:text-blue-400 space-y-1">
              {parsedWords.slice(0, 5).map((w, i) => (
                <div key={i}>
                  {w.word}
                  {w.translation && ` — ${w.translation}`}
                </div>
              ))}
              {parsedWords.length > 5 && <div>...</div>}
            </div>
          </div>

          {/* Module name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              词库名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="输入词库名称"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              图标
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    icon === ic
                      ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${c} transition-transform ${
                    color === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* List size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每列表单词数
              </label>
              <input
                type="number"
                value={listSize}
                onChange={(e) => setListSize(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                min={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每组学习词数
              </label>
              <input
                type="number"
                value={groupSize}
                onChange={(e) => setGroupSize(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                min={5}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("upload")}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : "创建词库"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        添加自定义词库
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        上传包含单词的文件，支持 .txt .csv .docx .pdf 格式
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".txt,.csv,.docx,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {parsing ? (
          <div className="text-gray-400 animate-pulse">
            正在解析 {fileName}...
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📄</div>
            <div className="text-gray-600 dark:text-gray-300 font-medium mb-2">
              点击选择或拖拽文件到此处
            </div>
            <div className="text-xs text-gray-400">
              支持 .txt .csv .docx .pdf
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Format help */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          文件格式说明
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>每行一个单词，可选释义（用 Tab、逗号或两个以上空格分隔）：</p>
          <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
            abandon{"\t"}放弃{"\n"}
            ability{"\t"}能力{"\n"}
            able
          </code>
        </div>
      </div>
    </div>
  );
}
