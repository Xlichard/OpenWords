#!/usr/bin/env python3
"""
OpenWords Article Crawler — entry point.

Run from the data/ directory:
    python run_crawler.py              # crawl once, then exit
    python run_crawler.py --loop       # run daily in a blocking loop
    python run_crawler.py --time 20:00 # daily loop at 20:00

Environment variables:
    DEEPSEEK_API_KEY  — Optional. Fill in your DeepSeek API key to enable:
                        - Higher-quality translation
                        - Long/complex sentence structural analysis

Without DEEPSEEK_API_KEY, Google Translate is used automatically (free).
"""
import os
import sys

# Ensure the data/ directory is on sys.path so the crawler package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crawler.scheduler import main

if __name__ == "__main__":
    main()
