"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AudioButton from "./AudioButton";
import type { Word, Quality } from "@/types";

interface FlashcardProps {
  word: Word;
  onRate: (quality: Quality) => void;
  showDefinition?: boolean;
}

export default function Flashcard({
  word,
  onRate,
  showDefinition = false,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) setFlipped(true);
  };

  const handleRate = (quality: Quality) => {
    setFlipped(false);
    // Small delay so flip animation starts before advancing
    setTimeout(() => onRate(quality), 200);
  };

  return (
    <div
      className="w-full max-w-lg mx-auto perspective-[1000px]"
      style={{ minHeight: "380px" }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          minHeight: "380px",
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center gap-4 cursor-pointer"
          style={{
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "none" : "auto",
          }}
          onClick={handleFlip}
          onTouchEnd={handleFlip}
        >
          <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
            {word.word}
          </div>

          {word.phonetic && (
            <div className="text-lg text-gray-500 dark:text-gray-400">
              /{word.phonetic}/
            </div>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <AudioButton
              word={word.word}
              className="mt-2 text-gray-500 hover:text-blue-500 dark:text-gray-400"
            />
          </div>

          <div className="mt-6 text-sm text-gray-400 dark:text-gray-500">
            点击卡片查看释义
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {word.word}
            </div>

            {word.phonetic && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                /{word.phonetic}/
              </div>
            )}

            {word.pos && (
              <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {word.pos}
              </div>
            )}

            {/* Chinese translation */}
            <div className="mt-4 text-center text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {word.translation || "暂无中文释义"}
            </div>

            {/* English definition (shown for medical or when toggled) */}
            {showDefinition && word.definition && (
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3 whitespace-pre-line">
                {word.definition}
              </div>
            )}
          </div>

          {/* Rating Buttons */}
          <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleRate(0)}
              className="flex-1 py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium transition-colors"
            >
              不认识
            </button>
            <button
              onClick={() => handleRate(3)}
              className="flex-1 py-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 font-medium transition-colors"
            >
              模糊
            </button>
            <button
              onClick={() => handleRate(5)}
              className="flex-1 py-3 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 font-medium transition-colors"
            >
              认识
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
