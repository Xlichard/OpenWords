"""Base class for all article sources."""
import time
import urllib.request
from abc import ABC, abstractmethod

import feedparser
import requests

from .. import config
from ..models import RawArticle


class BaseSource(ABC):
    """Abstract base for a news/magazine source."""

    name: str           # e.g. 'guardian'
    difficulty: str     # default difficulty tag
    rss_urls: list[str] = []

    # ── HTTP helpers ──────────────────────────────────────────────────────────

    def _get(self, url: str, timeout: int = 15) -> requests.Response:
        resp = requests.get(
            url,
            headers=config.HEADERS,
            proxies=config.PROXIES or None,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp

    # ── RSS parsing ───────────────────────────────────────────────────────────

    def _parse_rss(self) -> list:
        """Fetch and merge all RSS feed entries."""
        # Build feedparser handlers for proxy support
        handlers: list = []
        if config.PROXIES:
            handlers.append(urllib.request.ProxyHandler(config.PROXIES))

        entries = []
        for rss_url in self.rss_urls:
            try:
                feed = feedparser.parse(rss_url, handlers=handlers)
                entries.extend(feed.entries)
            except Exception as exc:
                print(f"    [RSS] {rss_url}: {exc}")
        return entries

    # ── Template methods (override in subclasses) ─────────────────────────────

    @abstractmethod
    def entry_to_meta(self, entry) -> dict | None:
        """
        Convert a feedparser entry to a metadata dict.
        Return None to skip this entry.

        Required keys: url, title
        Optional keys: author, published_at, category, image_url
        """
        ...

    @abstractmethod
    def extract_paragraphs(self, url: str, html: str) -> list[str]:
        """Return a list of paragraph text strings from article HTML."""
        ...

    # ── Public entry point ────────────────────────────────────────────────────

    def get_articles(self, limit: int = 5) -> list[RawArticle]:
        """Fetch up to `limit` new articles from this source."""
        entries = self._parse_rss()
        articles: list[RawArticle] = []
        fetched = 0

        for entry in entries:
            if fetched >= limit:
                break

            meta = self.entry_to_meta(entry)
            if not meta or not meta.get("url") or not meta.get("title"):
                continue

            url = meta["url"]
            try:
                resp = self._get(url)
                paragraphs = self.extract_paragraphs(url, resp.text)
                # Drop boilerplate / empty fragments
                paragraphs = [p.strip() for p in paragraphs if len(p.split()) >= 8]
                if not paragraphs:
                    continue

                articles.append(
                    RawArticle(
                        source=self.name,
                        url=url,
                        title=meta["title"],
                        author=meta.get("author", ""),
                        published_at=meta.get("published_at", ""),
                        category=meta.get("category", ""),
                        difficulty=self.difficulty,
                        image_url=meta.get("image_url", ""),
                        paragraphs=paragraphs,
                    )
                )
                fetched += 1
                time.sleep(config.CRAWL_DELAY_SECONDS)

            except Exception as exc:
                print(f"    [Fetch] {url[:80]}: {exc}")

        return articles
