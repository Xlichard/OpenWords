"""
Crawler scheduler.

Usage (from data/ directory):
    python run_crawler.py              # run once and exit
    python run_crawler.py --loop       # run daily at 08:00 (blocking)
    python run_crawler.py --time 20:00 # run daily at 20:00

Windows Task Scheduler alternative (recommended for production):
    1. Open Task Scheduler → Create Basic Task
    2. Trigger: Daily at your preferred time
    3. Action: Start a program
       Program: python
       Arguments: run_crawler.py
       Start in: C:\path\to\OpenWords\data
"""
import argparse
import time

import schedule  # pip install schedule

from .main import run


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenWords Crawler Scheduler")
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run in a blocking daily loop instead of once",
    )
    parser.add_argument(
        "--time",
        default="08:00",
        metavar="HH:MM",
        help="Time of day for the daily run (default: 08:00)",
    )
    args = parser.parse_args()

    if not args.loop:
        # One-shot mode
        run()
        return

    # Daily loop mode
    print(f"Scheduler: daily run at {args.time}")
    schedule.every().day.at(args.time).do(run)

    print("Running initial crawl now...")
    run()

    print(f"Waiting for next scheduled run at {args.time}...")
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
