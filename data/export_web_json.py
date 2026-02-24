#!/usr/bin/env python3
"""
Export articles from articles.db into JSON files for the Next.js web app.

Output structure:
  article-data/index.json         — metadata for all articles (listing/filtering)
  article-data/detail/{id}.json   — full article with paragraphs and sentences

Run from the web/ directory:
    python data/export_web_json.py
"""
import json
import shutil
import sqlite3
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent.parent  # web/
DB_PATH = WEB_DIR / "articles.db"
OUTPUT_DIR = WEB_DIR / "article-data"


def export() -> None:
    if not DB_PATH.exists():
        print(f"[export] {DB_PATH} not found — nothing to export.")
        return

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Clean output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    detail_dir = OUTPUT_DIR / "detail"
    detail_dir.mkdir()

    # Fetch all articles ordered by crawled_at DESC
    articles = conn.execute(
        "SELECT * FROM articles ORDER BY crawled_at DESC"
    ).fetchall()

    index_entries: list[dict] = []

    for article in articles:
        aid = article["id"]

        # Count paragraphs
        para_count = conn.execute(
            "SELECT COUNT(*) FROM paragraphs WHERE article_id = ?", (aid,)
        ).fetchone()[0]

        # Build index entry (metadata only, no paragraphs/sentences)
        index_entries.append({
            "id": aid,
            "source": article["source"],
            "url": article["url"],
            "title": article["title"],
            "title_cn": article["title_cn"] or "",
            "author": article["author"] or "",
            "published_at": article["published_at"] or "",
            "category": article["category"] or "",
            "difficulty": article["difficulty"] or "cet6",
            "image_url": article["image_url"] or "",
            "crawled_at": article["crawled_at"],
            "paragraph_count": para_count,
        })

        # Build full detail (with paragraphs and sentences)
        para_rows = conn.execute(
            "SELECT * FROM paragraphs WHERE article_id = ? ORDER BY seq", (aid,)
        ).fetchall()

        paragraphs: list[dict] = []
        for para in para_rows:
            sent_rows = conn.execute(
                "SELECT * FROM sentences WHERE paragraph_id = ? ORDER BY seq",
                (para["id"],),
            ).fetchall()

            sentences = [
                {
                    "id": sent["id"],
                    "paragraph_id": sent["paragraph_id"],
                    "seq": sent["seq"],
                    "en_text": sent["en_text"],
                    "cn_text": sent["cn_text"] or "",
                    "is_complex": bool(sent["is_complex"]),
                    "analysis": sent["analysis"] or "",
                }
                for sent in sent_rows
            ]

            paragraphs.append({
                "id": para["id"],
                "article_id": para["article_id"],
                "seq": para["seq"],
                "en_text": para["en_text"],
                "cn_text": para["cn_text"] or "",
                "sentences": sentences,
            })

        detail = {
            "id": aid,
            "source": article["source"],
            "url": article["url"],
            "title": article["title"],
            "title_cn": article["title_cn"] or "",
            "author": article["author"] or "",
            "published_at": article["published_at"] or "",
            "category": article["category"] or "",
            "difficulty": article["difficulty"] or "cet6",
            "image_url": article["image_url"] or "",
            "crawled_at": article["crawled_at"],
            "paragraphs": paragraphs,
        }

        # One JSON file per article (compact — no indentation)
        with open(detail_dir / f"{aid}.json", "w", encoding="utf-8") as f:
            json.dump(detail, f, ensure_ascii=False)

    conn.close()

    # Write master index (pretty-printed for easier debugging)
    with open(OUTPUT_DIR / "index.json", "w", encoding="utf-8") as f:
        json.dump({"articles": index_entries}, f, ensure_ascii=False, indent=2)

    print(f"  Exported {len(index_entries)} articles → {OUTPUT_DIR}")
    print(f"    Index : {OUTPUT_DIR / 'index.json'}")
    print(f"    Detail: {detail_dir}/ ({len(index_entries)} files)")


if __name__ == "__main__":
    print("=" * 50)
    print("OpenWords → Export articles to JSON")
    print("=" * 50)
    export()
