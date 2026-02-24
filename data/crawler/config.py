"""
Crawler configuration.

Set the DEEPSEEK_API_KEY environment variable to enable DeepSeek:
  - Higher-quality translation (replaces Google Translate)
  - Long/complex sentence structural analysis

Without DEEPSEEK_API_KEY, Google Translate is used for free (no key needed).
"""
import os
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
CRAWLER_DIR = Path(__file__).parent
DATA_DIR = CRAWLER_DIR.parent
DB_PATH = DATA_DIR / "articles.db"

# ── Translation ───────────────────────────────────────────────────────────────
DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
DEEPSEEK_MODEL: str = "deepseek-chat"

# Auto-select backend based on whether API key is present
TRANSLATOR_BACKEND: str = "deepseek" if DEEPSEEK_API_KEY else "google"

# ── Crawler behaviour ─────────────────────────────────────────────────────────
ARTICLES_PER_SOURCE: int = 5     # max new articles to fetch per source per run
MIN_WORD_COUNT: int = 200         # skip articles shorter than this
MAX_WORD_COUNT: int = 1500        # skip articles longer than this
CRAWL_DELAY_SECONDS: float = 2.0  # polite delay between HTTP requests (seconds)

# ── Complex-sentence detection ────────────────────────────────────────────────
COMPLEX_MIN_WORDS: int = 25       # flag sentences with >= this many words

# ── Proxy ────────────────────────────────────────────────────────────────────
# Reads standard HTTP_PROXY / HTTPS_PROXY environment variables automatically.
# Example: $env:HTTPS_PROXY = "http://127.0.0.1:7890"
HTTP_PROXY: str = os.environ.get("HTTP_PROXY", os.environ.get("http_proxy", ""))
HTTPS_PROXY: str = os.environ.get("HTTPS_PROXY", os.environ.get("https_proxy", ""))
PROXIES: dict = {}
if HTTP_PROXY:
    PROXIES["http"] = HTTP_PROXY
if HTTPS_PROXY:
    PROXIES["https"] = HTTPS_PROXY

# ── HTTP ──────────────────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}
