#!/usr/bin/env python3
"""
Export articles from articles.db into date-organized JSON files.

Output structure:
  data/articles/YYYY/MM/DD.json   — articles crawled on that date
  data/index.json                 — index of all available dates/months

Run from the data/ directory:
    python export_json.py
"""
import json
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).parent
DB_PATH = DATA_DIR / "articles.db"
ARTICLES_DIR = DATA_DIR / "articles"


def get_full_article(conn: sqlite3.Connection, article_id: int) -> dict:
    """Fetch a single article with all paragraphs and sentences."""
    article = dict(
        conn.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
    )

    para_rows = conn.execute(
        "SELECT * FROM paragraphs WHERE article_id = ? ORDER BY seq", (article_id,)
    ).fetchall()

    paragraphs = []
    for para in para_rows:
        para_dict = dict(para)
        sent_rows = conn.execute(
            "SELECT * FROM sentences WHERE paragraph_id = ? ORDER BY seq",
            (para["id"],),
        ).fetchall()
        para_dict["sentences"] = [dict(s) for s in sent_rows]
        paragraphs.append(para_dict)

    article["paragraphs"] = paragraphs
    return article


def build_index(by_date: dict) -> dict:
    """Build the master index from the by-date mapping."""
    dates_sorted = sorted(by_date.keys(), reverse=True)
    by_month: dict[str, list] = defaultdict(list)
    for date_str in dates_sorted:
        month = date_str[:7]  # YYYY-MM
        by_month[month].append({"date": date_str, "count": len(by_date[date_str])})

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_articles": sum(len(v) for v in by_date.values()),
        "months": [
            {"month": month, "days": days}
            for month, days in sorted(by_month.items(), reverse=True)
        ],
    }


def export() -> None:
    if not DB_PATH.exists():
        print(f"[export_json] {DB_PATH} not found — skipping export.")
        return

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Fetch all article IDs grouped by crawl date
    rows = conn.execute(
        "SELECT id, substr(crawled_at, 1, 10) AS date FROM articles ORDER BY crawled_at DESC"
    ).fetchall()

    by_date: dict[str, list] = defaultdict(list)
    for row in rows:
        by_date[row["date"]].append(row["id"])

    # Export one JSON file per date
    total_exported = 0
    for date_str, article_ids in sorted(by_date.items()):
        y, m, d = date_str.split("-")
        day_dir = ARTICLES_DIR / y / m
        day_dir.mkdir(parents=True, exist_ok=True)
        day_file = day_dir / f"{d}.json"

        articles = [get_full_article(conn, aid) for aid in article_ids]
        payload = {"date": date_str, "articles": articles}

        with open(day_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        print(f"  → {day_file}  ({len(articles)} articles)")
        total_exported += len(articles)

    conn.close()

    # Export master index
    index = build_index(by_date)
    index_file = DATA_DIR / "index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"\n  Total: {total_exported} articles across {len(by_date)} days")
    print(f"  Index → {index_file}")


if __name__ == "__main__":
    print("=" * 50)
    print("OpenWords JSON Export")
    print("=" * 50)
    export()
