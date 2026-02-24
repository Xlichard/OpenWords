"use client";

import { useState } from "react";
import type { Paragraph, Sentence } from "@/types/article";
import SentenceAnalyzer from "./SentenceAnalyzer";

type ReadMode = "bilingual" | "english" | "chinese";

interface BilingualReaderProps {
  paragraphs: Paragraph[];
}

// ── Sentence span (inline within paragraph) ───────────────────────────────────

interface SentenceSpanProps {
  sentence: Sentence;
  isActive: boolean;
  onClick: (s: Sentence) => void;
}

function SentenceSpan({ sentence, isActive, onClick }: SentenceSpanProps) {
  if (sentence.is_complex) {
    return (
      <span
        onClick={() => onClick(sentence)}
        title="点击解析长难句结构"
        className={`cursor-pointer rounded px-0.5 transition-colors ${
          isActive
            ? "bg-blue-200 dark:bg-blue-700/60 underline decoration-blue-500"
            : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 underline decoration-dotted decoration-blue-400"
        }`}
      >
        {sentence.en_text}{" "}
      </span>
    );
  }
  return <span>{sentence.en_text} </span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BilingualReader({ paragraphs }: BilingualReaderProps) {
  const [mode, setMode] = useState<ReadMode>("bilingual");
  const [activeSentence, setActiveSentence] = useState<Sentence | null>(null);
  const [activeParagraphId, setActiveParagraphId] = useState<number | null>(
    null
  );

  function handleSentenceClick(sentence: Sentence, paragraphId: number) {
    if (activeSentence?.id === sentence.id) {
      // Toggle off
      setActiveSentence(null);
      setActiveParagraphId(null);
    } else {
      setActiveSentence(sentence);
      setActiveParagraphId(paragraphId);
    }
  }

  const modeOptions: { key: ReadMode; label: string }[] = [
    { key: "english", label: "英文" },
    { key: "bilingual", label: "双语" },
    { key: "chinese", label: "中文" },
  ];

  return (
    <div className="reading-area">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {modeOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === opt.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Paragraphs */}
      <div className="space-y-6">
        {paragraphs.map((para) => {
          const showEn = mode === "english" || mode === "bilingual";
          const showCn = mode === "chinese" || mode === "bilingual";
          const hasSentences = para.sentences.length > 0;

          return (
            <div key={para.id}>
              {/* English text */}
              {showEn && (
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed text-[1.0625rem]">
                  {hasSentences ? (
                    para.sentences.map((sent) => (
                      <SentenceSpan
                        key={sent.id}
                        sentence={sent}
                        isActive={activeSentence?.id === sent.id}
                        onClick={(s) =>
                          handleSentenceClick(s, para.id)
                        }
                      />
                    ))
                  ) : (
                    <span>{para.en_text}</span>
                  )}
                </div>
              )}

              {/* Sentence analysis panel (shown inline after the paragraph) */}
              {activeSentence && activeParagraphId === para.id && (
                <SentenceAnalyzer
                  sentence={activeSentence}
                  onClose={() => {
                    setActiveSentence(null);
                    setActiveParagraphId(null);
                  }}
                />
              )}

              {/* Chinese text */}
              {showCn && para.cn_text && (
                <p
                  className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
                    showEn
                      ? "mt-2 text-base border-l-2 border-gray-200 dark:border-gray-700 pl-3"
                      : "text-[1.0625rem]"
                  }`}
                >
                  {para.cn_text}
                </p>
              )}
              {showCn && !para.cn_text && (
                <p
                  className={`text-gray-400 dark:text-gray-600 italic text-sm ${
                    showEn ? "mt-2 pl-3" : ""
                  }`}
                >
                  (翻译暂缺)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
