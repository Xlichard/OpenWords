"""VOA Learning English — designed for English learners, simpler vocabulary."""
from bs4 import BeautifulSoup

from .base import BaseSource


class VOASource(BaseSource):
    name = "voa"
    difficulty = "cet4"  # VOA Special/Learning English is 四级/高考 level
    rss_urls = [
        # VOA Learning English — general news
        "https://learningenglish.voanews.com/api/zmsqouvvpi",
        # VOA Learning English — science & technology
        "https://learningenglish.voanews.com/api/zpsqkqyrqo",
    ]

    def entry_to_meta(self, entry) -> dict | None:
        url: str = entry.get("link", "")
        if not url or "voanews.com" not in url:
            return None

        # Determine category from RSS tags if available
        tags = entry.get("tags", []) or []
        category = "society"
        for tag in tags:
            slug = (tag.get("term") or "").lower()
            if "science" in slug or "technology" in slug or "tech" in slug:
                category = "science"
                break
            if "health" in slug or "medicine" in slug:
                category = "health"
                break
            if "economy" in slug or "business" in slug:
                category = "economy"
                break

        # Image
        image_url = ""
        for media in entry.get("media_content", []):
            if isinstance(media, dict) and media.get("url"):
                image_url = media["url"]
                break

        return {
            "url": url,
            "title": entry.get("title", "").strip(),
            "author": entry.get("author", "VOA Learning English"),
            "published_at": entry.get("published", ""),
            "category": category,
            "image_url": image_url,
        }

    def extract_paragraphs(self, url: str, html: str) -> list[str]:
        soup = BeautifulSoup(html, "lxml")

        # Remove non-content elements
        for tag in soup.select(
            "nav, header, footer, aside, figure, figcaption, "
            ".media-block, .image-block, [class*='player'], [class*='social']"
        ):
            tag.decompose()

        # VOA Learning English article body selectors
        selectors = [
            ".wsw p",
            ".article-intro p, .article-content p",
            ".c-article-content p",
            "article .body-content p",
            "article p",
        ]
        for selector in selectors:
            tags = soup.select(selector)
            if len(tags) >= 3:
                return [t.get_text(separator=" ", strip=True) for t in tags]

        return []
