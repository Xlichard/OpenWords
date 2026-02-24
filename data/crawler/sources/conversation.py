"""The Conversation — academic articles for the public (CC BY-ND licence)."""
from bs4 import BeautifulSoup

from .base import BaseSource


class ConversationSource(BaseSource):
    name = "conversation"
    difficulty = "ielts"  # The Conversation suits 雅思/考研 level
    rss_urls = [
        # US edition
        "https://theconversation.com/us/articles.atom",
        # UK edition
        "https://theconversation.com/uk/articles.atom",
    ]

    def entry_to_meta(self, entry) -> dict | None:
        url: str = entry.get("link", "")
        if not url or "theconversation.com" not in url:
            return None

        # Derive category from Atom categories/tags
        category = "science"  # default: The Conversation skews science/society
        tags = entry.get("tags", []) or []
        for tag in tags:
            term = (tag.get("term") or "").lower()
            if any(k in term for k in ("economics", "business", "finance", "economy")):
                category = "economy"
                break
            if any(k in term for k in ("politics", "government", "policy", "society", "social")):
                category = "society"
                break
            if any(k in term for k in ("health", "medicine", "mental")):
                category = "health"
                break
            if any(k in term for k in ("technology", "ai ", "artificial", "digital")):
                category = "technology"
                break
            if any(k in term for k in ("environment", "climate", "ecology")):
                category = "science"
                break

        # Author — Atom feeds typically have <author><name>
        author = ""
        authors = entry.get("authors", [])
        if authors:
            author = authors[0].get("name", "")
        if not author:
            author = entry.get("author", "")

        # Image
        image_url = ""
        for media in entry.get("media_content", []):
            if isinstance(media, dict) and media.get("url"):
                image_url = media["url"]
                break

        return {
            "url": url,
            "title": entry.get("title", "").strip(),
            "author": author,
            "published_at": entry.get("published", entry.get("updated", "")),
            "category": category,
            "image_url": image_url,
        }

    def extract_paragraphs(self, url: str, html: str) -> list[str]:
        soup = BeautifulSoup(html, "lxml")

        # Remove non-content elements
        for tag in soup.select(
            "nav, header, footer, aside, figure, figcaption, "
            ".partner, .disclosure, .republish-info, .article-footer, "
            "[class*='related'], [class*='subscribe'], [class*='newsletter']"
        ):
            tag.decompose()

        # The Conversation content selectors
        selectors = [
            ".content-body p",
            "article .body p",
            ".article-body p",
            "div[itemprop='articleBody'] p",
            "article p",
        ]
        for selector in selectors:
            tags = soup.select(selector)
            if len(tags) >= 3:
                return [t.get_text(separator=" ", strip=True) for t in tags]

        return []
