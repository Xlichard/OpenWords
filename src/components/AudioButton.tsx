"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [speaking, setSpeaking] = useState(false);
  const lastTriggerTsRef = useRef(0);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    // Warm up voices list for Safari/iOS
    window.speechSynthesis.getVoices();
  }, [supported]);
  const speakWord = useCallback(() => {
    if (!supported || typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    try {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = accent;
      utterance.rate = 0.9;

      const voices = synth.getVoices();
      const preferred = voices.find(
        (voice) =>
          voice.lang === accent ||
          voice.lang.toLowerCase().startsWith(accent.split("-")[0].toLowerCase())
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      const clearSpeaking = () => setSpeaking(false);
      setSpeaking(true);
      utterance.onend = clearSpeaking;
      utterance.onerror = clearSpeaking;

      if (synth.speaking) synth.cancel();
      if (synth.paused) synth.resume();
      synth.speak(utterance);

      // Fallback in case some mobile browsers fail to dispatch end/error.
      window.setTimeout(clearSpeaking, 4000);
    } catch {
      setSpeaking(false);
    }
  }, [word, accent, supported]);

  const handleSpeak = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      const now = Date.now();
      if (now - lastTriggerTsRef.current < 280) return;
      lastTriggerTsRef.current = now;

      speakWord();
    },
    [speakWord]
  );

  if (!supported) {
    return (
      <button
        type="button"
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
      type="button"
      aria-label={accent === "en-US" ? "播放美式发音" : "播放英式发音"}
      onPointerUp={handleSpeak}
      onClick={handleSpeak}
      onTouchEnd={handleSpeak}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ touchAction: "manipulation" }}
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
