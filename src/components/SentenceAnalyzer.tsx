"use client";

import { useState } from "react";
import type { Sentence, SentenceAnalysis } from "@/types/article";

interface SentenceAnalyzerProps {
  sentence: Sentence;
  onClose: () => void;
}

const CLAUSE_TYPE_LABELS: Record<string, string> = {
  relative: "定语从句",
  adverbial: "状语从句",
  nominal: "名词性从句",
  subject: "主语从句",
  object: "宾语从句",
  complement: "表语从句",
  appositive: "同位语从句",
  participial: "分词短语",
  infinitive: "不定式短语",
  prepositional: "介词短语",
};

export default function SentenceAnalyzer({
  sentence,
  onClose,
}: SentenceAnalyzerProps) {
  const [liveAnalysis, setLiveAnalysis] = useState<SentenceAnalysis | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Parse pre-computed analysis stored in the database
  let storedAnalysis: SentenceAnalysis | null = null;
  if (sentence.analysis) {
    try {
      storedAnalysis = JSON.parse(sentence.analysis) as SentenceAnalysis;
    } catch {
      // ignore malformed JSON
    }
  }

  // Prefer live (just-fetched) analysis over stored one
  const analysis = liveAnalysis ?? storedAnalysis;

  async function handleFetchAnalysis() {
    setFetchLoading(true);
    setFetchError("");
    try {
      const resp = await fetch("/api/analyze-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence.en_text }),
      });
      const data = await resp.json();
      if (data.analysis) {
        setLiveAnalysis(data.analysis as SentenceAnalysis);
      } else {
        setFetchError(data.error ?? "解析失败");
      }
    } catch {
      setFetchError("网络错误，请重试");
    } finally {
      setFetchLoading(false);
    }
  }

  return (
    <div className="mt-3 mb-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-100 dark:bg-blue-900/40 border-b border-blue-200 dark:border-blue-800">
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
          长难句解析
        </span>
        <button
          onClick={onClose}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 text-lg leading-none"
          aria-label="关闭"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-3 text-sm">
        {/* Original sentence */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
            原句
          </p>
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed italic">
            {sentence.en_text}
          </p>
        </div>

        {/* Translation */}
        {(analysis?.translation || sentence.cn_text) && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
              译文
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysis?.translation || sentence.cn_text}
            </p>
          </div>
        )}

        {/* Structural analysis */}
        {analysis ? (
          <>
            {/* Main clause */}
            {(analysis.subject || analysis.predicate) && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                  句子主干
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.subject && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs">
                      <span className="font-semibold">主</span>
                      {analysis.subject}
                    </span>
                  )}
                  {analysis.predicate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs">
                      <span className="font-semibold">谓</span>
                      {analysis.predicate}
                    </span>
                  )}
                  {analysis.object && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs">
                      <span className="font-semibold">宾</span>
                      {analysis.object}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Subordinate clauses */}
            {analysis.clauses && analysis.clauses.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                  从句 / 修饰成分
                </p>
                <div className="space-y-1.5">
                  {analysis.clauses.map((clause, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                        {CLAUSE_TYPE_LABELS[clause.type] ?? clause.type}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 italic">
                        {clause.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structure note */}
            {analysis.structure_note && (
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  结构说明
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                  {analysis.structure_note}
                </p>
              </div>
            )}
          </>
        ) : (
          /* No stored analysis — offer on-demand AI fetch */
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            {fetchError && (
              <p className="text-xs text-red-500 dark:text-red-400 mb-2">{fetchError}</p>
            )}
            <button
              onClick={handleFetchAnalysis}
              disabled={fetchLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
            >
              {fetchLoading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  AI 解析中…
                </>
              ) : (
                <>✨ AI 深度解析</>
              )}
            </button>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              由 DeepSeek 实时解析句子结构
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
