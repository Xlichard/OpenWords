"""
Main crawler orchestrator.

Usage (from data/ directory):
    python -m crawler.main
    python -m crawler.scheduler --once
"""
import time

from . import config
from .analyzer import process_paragraph, word_count
from .db import init_db, save_article, url_exists
from .models import ParagraphData
from .sources.bbc import BBCSource
from .sources.conversation import ConversationSource
from .sources.guardian import GuardianSource
from .sources.voa import VOASource
from .translator import get_translator

SOURCES = [
    GuardianSource(),
    BBCSource(),
    VOASource(),
    ConversationSource(),
]


def run() -> None:
    print("=" * 60)
    print("OpenWords Article Crawler")
    print(f"  Backend    : {config.TRANSLATOR_BACKEND}")
    print(f"  Articles   : up to {config.ARTICLES_PER_SOURCE} per source")
    print(f"  Word range : {config.MIN_WORD_COUNT}–{config.MAX_WORD_COUNT}")
    print("=" * 60)

    init_db()
    translator = get_translator()
    do_analysis = config.TRANSLATOR_BACKEND == "deepseek"

    saved = 0
    skipped = 0

    for source in SOURCES:
        print(f"\n▶ {source.name.upper()}")
        try:
            articles = source.get_articles(limit=config.ARTICLES_PER_SOURCE)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            continue

        print(f"  Candidates: {len(articles)}")

        for raw in articles:
            # Skip articles already in DB
            if url_exists(raw.url):
                print(f"  SKIP (exists) : {raw.title[:60]}")
                skipped += 1
                continue

            # Word-count filter
            total_words = sum(word_count(p) for p in raw.paragraphs)
            if total_words < config.MIN_WORD_COUNT:
                print(f"  SKIP (short {total_words}w) : {raw.title[:60]}")
                skipped += 1
                continue
            if total_words > config.MAX_WORD_COUNT:
                print(f"  SKIP (long {total_words}w)  : {raw.title[:60]}")
                skipped += 1
                continue

            print(f"  → Processing ({total_words}w): {raw.title[:60]}")

            # Translate title
            title_cn = translator.translate(raw.title)
            time.sleep(0.5)

            # Build paragraph data with per-sentence translation
            paragraph_data: list[ParagraphData] = []
            for i, para_text in enumerate(raw.paragraphs):
                cn_text, sentences = process_paragraph(
                    para_text, translator, analyze=do_analysis
                )
                paragraph_data.append(
                    ParagraphData(
                        seq=i,
                        en_text=para_text,
                        cn_text=cn_text,
                        sentences=sentences,
                    )
                )
                if i < len(raw.paragraphs) - 1:
                    time.sleep(config.CRAWL_DELAY_SECONDS)

            article_id = save_article(raw, paragraph_data, title_cn)
            print(f"  ✓ Saved (id={article_id}): {raw.title[:60]}")
            saved += 1

    print(f"\n{'=' * 60}")
    print(f"  Saved: {saved}   Skipped: {skipped}")
    print("=" * 60)


if __name__ == "__main__":
    run()
