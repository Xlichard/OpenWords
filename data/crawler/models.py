"""Data models used throughout the crawler pipeline."""
from dataclasses import dataclass, field


@dataclass
class RawArticle:
    """Article as fetched from the source, before translation."""
    source: str        # 'guardian' | 'bbc' | 'voa' | 'conversation'
    url: str
    title: str
    author: str
    published_at: str  # ISO 8601 string (may be empty)
    category: str      # 'science' | 'society' | 'economy' | 'culture' | 'health' | 'technology'
    difficulty: str    # 'gaokao' | 'cet4' | 'cet6' | 'kaoyan' | 'ielts'
    image_url: str
    paragraphs: list[str] = field(default_factory=list)


@dataclass
class SentenceData:
    """A single sentence within a paragraph."""
    seq: int
    en_text: str
    cn_text: str = ""
    is_complex: bool = False
    analysis: str = ""   # JSON string with structural breakdown (DeepSeek only)


@dataclass
class ParagraphData:
    """A paragraph with its sentences."""
    seq: int
    en_text: str
    cn_text: str = ""
    sentences: list[SentenceData] = field(default_factory=list)
