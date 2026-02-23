"use client";

import { useCallback, useEffect, useState } from "react";

interface AudioButtonProps {
  word: string;
  accent?: "en-US" | "en-GB";
  className?: string;
}

export default function AudioButton({
  word,
  accent = "en-US",
  className = "",
}: AudioButtonProps) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Don't trigger card flip
      e.preventDefault();

      if (!supported || speaking) return;

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = accent;
      utterance.rate = 0.9;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    },
    [word, accent, supported, speaking]
  );

  if (!supported) {
    return (
      <button
        className={`opacity-30 cursor-not-allowed ${className}`}
        title="浏览器不支持语音合成"
        disabled
      >
        <SpeakerIcon />
      </button>
    );
  }

  return (
    <button
      onClick={speak}
      className={`hover:scale-110 active:scale-95 transition-transform ${
        speaking ? "text-blue-500 animate-pulse" : ""
      } ${className}`}
      title={accent === "en-US" ? "美式发音" : "英式发音"}
    >
      <SpeakerIcon />
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
