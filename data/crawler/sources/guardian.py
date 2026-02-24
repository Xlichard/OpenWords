"""The Guardian — world, science, technology sections."""
import re

from bs4 import BeautifulSoup

from .base import BaseSource

_CATEGORY_MAP = {
    "world": "society",
    "science": "science",
    "technology": "technology",
    "environment": "science",
    "education": "society",
    "society": "society",
    "politics": "society",
    "business": "economy",
    "commentisfree": "culture",
    "culture": "culture",
    "lifeandstyle": "culture",
    "health": "health",
    "books": "culture",
    "media": "society",
    "cities": "society",
    "us-news": "society",
    "uk-news": "society",
    "australia-news": "society",
}


class GuardianSource(BaseSource):
    name = "guardian"
    difficulty = "kaoyan"   # Guardian English suits 考研/雅思 level
    rss_urls = [
        "https://www.theguardian.com/world/rss",
        "https://www.theguardian.com/science/rss",
        "https://www.theguardian.com/technology/rss",
    ]

    def entry_to_meta(self, entry) -> dict | None:
        url: str = entry.get("link", "")
        if not url or "theguardian.com" not in url:
            return None

        # Detect category from URL path segment
        m = re.search(r"theguardian\.com/([^/]+)/", url)
        cat_slug = m.group(1) if m else "world"
        category = _CATEGORY_MAP.get(cat_slug, "society")

        # Author
        author = entry.get("author", "")
        if not author:
            detail = getattr(entry, "author_detail", None)
            if detail:
                author = getattr(detail, "name", "")

        # First image from media content
        image_url = ""
        for media in entry.get("media_content", []):
            if isinstance(media, dict) and media.get("url"):
                image_url = media["url"]
                break

        return {
            "url": url,
            "title": entry.get("title", "").strip(),
            "author": author,
            "published_at": entry.get("published", ""),
            "category": category,
            "image_url": image_url,
        }

    def extract_paragraphs(self, url: str, html: str) -> list[str]:
        soup = BeautifulSoup(html, "lxml")

        # Remove non-content elements
        for tag in soup.select(
            "aside, nav, header, footer, figure, figcaption, "
            "[class*='skip'], [class*='ad-'], [class*='submeta'], "
            "[class*='after-article'], [class*='share'], [class*='callout']"
        ):
            tag.decompose()

        # Try selectors from most to least specific
        selectors = [
            "[data-gu-name='body'] p",
            ".article-body-commercial-selector p",
            ".content__article-body p",
            ".js-article__body p",
            "article p",
        ]
        for selector in selectors:
            tags = soup.select(selector)
            if len(tags) >= 3:
                return [t.get_text(separator=" ", strip=True) for t in tags]

        return []
