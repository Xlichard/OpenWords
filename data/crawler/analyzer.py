"""
Sentence-level analysis utilities.

- Split paragraph text into individual sentences
- Detect complex / long sentences
- Coordinate translation and optional LLM analysis
"""
import json
import re

from . import config
from .models import SentenceData


# ── Sentence splitting ────────────────────────────────────────────────────────

# Abbreviations that should NOT trigger a sentence split
_ABBREVS = {
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "vs", "etc", "e.g",
    "i.e", "fig", "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec", "U.S", "U.K", "St",
}

_ABBREV_PAT = re.compile(
    r"\b(" + "|".join(re.escape(a) for a in _ABBREVS) + r")\.$",
    re.IGNORECASE,
)


def split_sentences(text: str) -> list[str]:
    """Split a paragraph into sentences using a heuristic approach."""
    # Split on '. ', '! ', '? ' when followed by a capital letter or quote
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z"\u201c])', text)
    sentences: list[str] = []
    buf = ""
    for part in parts:
        if buf:
            candidate = buf + " " + part
        else:
            candidate = part
        # Check if the split point was inside an abbreviation
        if buf and _ABBREV_PAT.search(buf.rstrip()):
            buf = candidate
            continue
        if buf:
            sentences.append(buf.strip())
        buf = part
    if buf:
        sentences.append(buf.strip())
    return [s for s in sentences if s]


# ── Complexity detection ──────────────────────────────────────────────────────

_COMPLEX_CONJUNCTIONS = re.compile(
    r"\b(which|that|who|whom|whose|where|when|although|though|because|"
    r"since|unless|whereas|while|whereby|wherein|despite|however|"
    r"furthermore|nevertheless|notwithstanding)\b",
    re.IGNORECASE,
)


def word_count(text: str) -> int:
    return len(text.split())


def is_complex(sentence: str) -> bool:
    """Heuristic: flag as complex if sentence is long OR contains subordination."""
    wc = word_count(sentence)
    if wc >= config.COMPLEX_MIN_WORDS:
        return True
    if _COMPLEX_CONJUNCTIONS.search(sentence) and wc >= 15:
        return True
    return False


# ── Paragraph processing ──────────────────────────────────────────────────────

def process_paragraph(
    para_text: str,
    translator,
    analyze: bool = False,
) -> tuple[str, list[SentenceData]]:
    """
    Translate a paragraph and build per-sentence data.

    Args:
        para_text:  Raw English paragraph text.
        translator: A BaseTranslator instance.
        analyze:    If True and translator supports it, run structural analysis
                    on complex sentences (DeepSeek only).

    Returns:
        (cn_paragraph_text, list_of_SentenceData)
    """
    sentences = split_sentences(para_text)
    sentence_data: list[SentenceData] = []

    for i, sent in enumerate(sentences):
        cn_text = ""
        analysis_str = ""
        complex_flag = is_complex(sent)

        if complex_flag and analyze:
            result = translator.analyze_sentence(sent)
            if result:
                analysis_str = json.dumps(result, ensure_ascii=False)
                cn_text = result.get("translation", "")

        if not cn_text:
            cn_text = translator.translate(sent)

        sentence_data.append(
            SentenceData(
                seq=i,
                en_text=sent,
                cn_text=cn_text,
                is_complex=complex_flag,
                analysis=analysis_str,
            )
        )

    cn_para = " ".join(s.cn_text for s in sentence_data)
    return cn_para, sentence_data
