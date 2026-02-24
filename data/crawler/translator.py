"""
Translation service with two backends:
  - GoogleTranslator  (default, free, no API key needed)
  - DeepSeekTranslator (optional, requires DEEPSEEK_API_KEY, adds sentence analysis)

Usage:
    translator = get_translator()   # auto-selects based on config
    cn = translator.translate("Hello world")
"""
import json
import time
from abc import ABC, abstractmethod

import requests

from . import config


# ── Base class ────────────────────────────────────────────────────────────────

class BaseTranslator(ABC):

    @abstractmethod
    def translate(self, text: str) -> str:
        """Translate a single English text to Simplified Chinese."""
        ...

    def translate_batch(self, texts: list[str]) -> list[str]:
        """Translate a list of texts sequentially (override for batch efficiency)."""
        results = []
        for i, text in enumerate(texts):
            results.append(self.translate(text))
            if i < len(texts) - 1:
                time.sleep(1.2)  # rate-limit politeness
        return results

    def analyze_sentence(self, text: str) -> dict | None:
        """Return a structured analysis dict for a complex sentence.
        Returns None if this backend does not support analysis.
        """
        return None


# ── Google Translate (free, unofficial endpoint) ──────────────────────────────

class GoogleTranslator(BaseTranslator):
    """Calls the public Google Translate endpoint — no API key required."""

    _URL = "https://translate.googleapis.com/translate_a/single"

    def translate(self, text: str) -> str:
        if not text or not text.strip():
            return ""
        params = {
            "client": "gtx",
            "sl": "en",
            "tl": "zh-CN",
            "dt": "t",
            "q": text.strip(),
        }
        for attempt in range(3):
            try:
                resp = requests.get(self._URL, params=params, timeout=12)
                resp.raise_for_status()
                data = resp.json()
                return "".join(seg[0] for seg in data[0] if seg[0])
            except Exception as exc:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                else:
                    print(f"    [GoogleTranslator] failed after 3 attempts: {exc}")
                    return ""
        return ""

    def translate_batch(self, texts: list[str]) -> list[str]:
        results = []
        for i, text in enumerate(texts):
            results.append(self.translate(text))
            if i < len(texts) - 1:
                time.sleep(1.5)
        return results


# ── DeepSeek (optional, requires openai package + API key) ────────────────────

class DeepSeekTranslator(BaseTranslator):
    """Uses the DeepSeek LLM for translation and structural sentence analysis."""

    def __init__(self) -> None:
        try:
            from openai import OpenAI  # type: ignore
        except ImportError:
            raise RuntimeError(
                "The 'openai' package is required for DeepSeek.\n"
                "Install it with: pip install openai"
            )
        self._client = OpenAI(
            api_key=config.DEEPSEEK_API_KEY,
            base_url=config.DEEPSEEK_BASE_URL,
        )

    def _chat(self, user_prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user_prompt})
        resp = self._client.chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=messages,
            temperature=0.1,
        )
        return resp.choices[0].message.content.strip()

    def translate(self, text: str) -> str:
        if not text or not text.strip():
            return ""
        return self._chat(
            f"Translate the following English text to Simplified Chinese. "
            f"Output only the translation, no explanations:\n\n{text.strip()}",
            system="You are a professional English-to-Chinese translator.",
        )

    def translate_batch(self, texts: list[str]) -> list[str]:
        """Translate all paragraphs in a single API call for efficiency."""
        if not texts:
            return []
        numbered = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(texts))
        prompt = (
            "Translate each numbered English paragraph to Simplified Chinese. "
            "Output ONLY the numbered translations in the SAME format (e.g. '1. 翻译内容'), "
            "one per line:\n\n" + numbered
        )
        raw = self._chat(
            prompt,
            system="You are a professional English-to-Chinese translator.",
        )
        lines = [ln.strip() for ln in raw.strip().splitlines() if ln.strip()]
        results: list[str] = []
        for line in lines:
            if ". " in line[:5]:
                _, _, rest = line.partition(". ")
                results.append(rest.strip())
            else:
                results.append(line)
        # Pad or trim to match input length
        while len(results) < len(texts):
            results.append("")
        return results[: len(texts)]

    def analyze_sentence(self, text: str) -> dict | None:
        """Return a structured analysis of a complex sentence as a dict."""
        prompt = (
            "Analyze the following complex English sentence and return a JSON object with:\n"
            "- subject: main subject\n"
            "- predicate: main verb/predicate\n"
            "- object: main object (empty string if none)\n"
            "- clauses: list of objects with 'type' (relative/adverbial/nominal/etc.) and 'text'\n"
            "- structure_note: brief Chinese explanation of the grammatical structure\n"
            "- translation: accurate Chinese translation\n\n"
            f"Sentence: {text}\n\n"
            "Respond with valid JSON only, no markdown fences."
        )
        try:
            raw = self._chat(prompt)
            raw = raw.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            return json.loads(raw)
        except Exception as exc:
            print(f"    [DeepSeekTranslator] analyze_sentence error: {exc}")
            return None


# ── Factory ───────────────────────────────────────────────────────────────────

def get_translator() -> BaseTranslator:
    """Return the translator configured in config.py."""
    if config.TRANSLATOR_BACKEND == "deepseek" and config.DEEPSEEK_API_KEY:
        print("  Translator: DeepSeek")
        return DeepSeekTranslator()
    print("  Translator: Google Translate (free)")
    return GoogleTranslator()
