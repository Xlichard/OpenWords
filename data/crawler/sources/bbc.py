"""BBC News — top stories, science & environment, technology."""
import re

from bs4 import BeautifulSoup

from .base import BaseSource

_CATEGORY_MAP = {
    "science_and_environment": "science",
    "technology": "technology",
    "business": "economy",
    "health": "health",
    "education": "society",
    "entertainment_and_arts": "culture",
    "world": "society",
}


class BBCSource(BaseSource):
    name = "bbc"
    difficulty = "cet6"  # BBC English is clear and suits 六级/考研 level
    rss_urls = [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        "https://feeds.bbci.co.uk/news/technology/rss.xml",
    ]

    def entry_to_meta(self, entry) -> dict | None:
        url: str = entry.get("link", "")
        if not url or "bbc.co.uk" not in url and "bbc.com" not in url:
            return None
        # Skip live pages, videos, sport pages
        if any(x in url for x in ["/live/", "/sport/", "/av/", "/video/"]):
            return None

        # Detect category from RSS source URL
        cat_slug = ""
        for rss_url in self.rss_urls:
            if rss_url in (entry.get("source", {}) or {}).get("href", ""):
                m = re.search(r"/news/([^/]+)/rss", rss_url)
                if m:
                    cat_slug = m.group(1)
                break
        category = _CATEGORY_MAP.get(cat_slug, "society")

        # Image
        image_url = ""
        for enc in entry.get("enclosures", []):
            if isinstance(enc, dict) and enc.get("url") and "image" in enc.get("type", ""):
                image_url = enc["url"]
                break
        if not image_url:
            for media in entry.get("media_thumbnail", []):
                if isinstance(media, dict) and media.get("url"):
                    image_url = media["url"]
                    break

        return {
            "url": url,
            "title": entry.get("title", "").strip(),
            "author": entry.get("author", "BBC News"),
            "published_at": entry.get("published", ""),
            "category": category,
            "image_url": image_url,
        }

    def extract_paragraphs(self, url: str, html: str) -> list[str]:
        soup = BeautifulSoup(html, "lxml")

        # Remove non-content elements
        for tag in soup.select(
            "nav, header, footer, aside, figure, figcaption, "
            "[class*='advertisement'], [class*='promo'], "
            "[data-component='links-block'], [data-component='image-block'], "
            "[data-component='related-internet-links']"
        ):
            tag.decompose()

        # BBC uses data-component="text-block" for article paragraphs (newer layout)
        text_blocks = soup.select("[data-component='text-block'] p")
        if len(text_blocks) >= 3:
            return [t.get_text(separator=" ", strip=True) for t in text_blocks]

        # Fallback selectors for older BBC layout
        selectors = [
            ".article__body-content p",
            "#main-content article p",
            "article p",
        ]
        for selector in selectors:
            tags = soup.select(selector)
            if len(tags) >= 3:
                return [t.get_text(separator=" ", strip=True) for t in tags]

        return []
