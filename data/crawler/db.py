"""
SQLite database operations for articles.db.

Schema:
  articles   — one row per article
  paragraphs — N rows per article (ordered by seq)
  sentences  — N rows per paragraph (ordered by seq)
"""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from . import config
from .models import RawArticle, ParagraphData

# ── Schema ────────────────────────────────────────────────────────────────────

_SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS articles (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source       TEXT    NOT NULL,
    url          TEXT    UNIQUE NOT NULL,
    title        TEXT    NOT NULL,
    title_cn     TEXT    DEFAULT '',
    author       TEXT    DEFAULT '',
    published_at TEXT    DEFAULT '',
    category     TEXT    DEFAULT '',
    difficulty   TEXT    DEFAULT 'cet6',
    image_url    TEXT    DEFAULT '',
    crawled_at   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS paragraphs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    seq        INTEGER NOT NULL,
    en_text    TEXT    NOT NULL,
    cn_text    TEXT    DEFAULT '',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sentences (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    paragraph_id INTEGER NOT NULL,
    seq          INTEGER NOT NULL,
    en_text      TEXT    NOT NULL,
    cn_text      TEXT    DEFAULT '',
    is_complex   INTEGER DEFAULT 0,
    analysis     TEXT    DEFAULT '',
    FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_source   ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_crawled  ON articles(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_paragraphs_art    ON paragraphs(article_id, seq);
CREATE INDEX IF NOT EXISTS idx_sentences_para    ON sentences(paragraph_id, seq);
"""


# ── Public API ────────────────────────────────────────────────────────────────

def init_db(db_path: Path = config.DB_PATH) -> None:
    """Create the database and schema if they don't already exist."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(_SCHEMA)
    conn.commit()
    conn.close()
    print(f"  DB ready: {db_path}")


def url_exists(url: str, db_path: Path = config.DB_PATH) -> bool:
    """Return True if the article URL is already in the database."""
    conn = sqlite3.connect(str(db_path))
    try:
        row = conn.execute(
            "SELECT 1 FROM articles WHERE url = ?", (url,)
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def save_article(
    raw: RawArticle,
    paragraphs: list[ParagraphData],
    title_cn: str = "",
    db_path: Path = config.DB_PATH,
) -> int:
    """
    Insert an article with all its paragraphs and sentences.

    Returns the new article id (or the existing id if the URL was already present).
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        cur = conn.execute(
            """
            INSERT OR IGNORE INTO articles
                (source, url, title, title_cn, author, published_at,
                 category, difficulty, image_url, crawled_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                raw.source, raw.url, raw.title, title_cn,
                raw.author, raw.published_at, raw.category,
                raw.difficulty, raw.image_url, now,
            ),
        )
        article_id = cur.lastrowid

        if article_id == 0:
            # URL already existed — retrieve its id
            row = conn.execute(
                "SELECT id FROM articles WHERE url = ?", (raw.url,)
            ).fetchone()
            conn.close()
            return row[0]

        for para in paragraphs:
            cur2 = conn.execute(
                "INSERT INTO paragraphs (article_id, seq, en_text, cn_text) VALUES (?, ?, ?, ?)",
                (article_id, para.seq, para.en_text, para.cn_text),
            )
            para_id = cur2.lastrowid
            for sent in para.sentences:
                conn.execute(
                    """
                    INSERT INTO sentences
                        (paragraph_id, seq, en_text, cn_text, is_complex, analysis)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        para_id, sent.seq, sent.en_text, sent.cn_text,
                        int(sent.is_complex), sent.analysis,
                    ),
                )

        conn.commit()
        return article_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
