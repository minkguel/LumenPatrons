"""
Novo Nordisk Fonden project scraper using crawl4ai.

Collects all project URLs from the NNF WordPress AJAX API, then crawls
each individual project page with crawl4ai to extract structured data.

Usage:
    source venv/bin/activate
    python crawl4ai_nnf.py
"""

import asyncio
import json
import re
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

BASE_URL = "https://novonordiskfonden.dk"
AJAX_API = f"{BASE_URL}/wp/wp-admin/admin-ajax.php"
PATRON_NAME = "Novo Nordisk Foundation"


def collect_project_urls() -> list[str]:
    """Fetch all project URLs from the NNF AJAX API (single request)."""
    resp = httpx.get(
        AJAX_API,
        params={
            "action": "content_api",
            "type": "projects",
            "sort": "DESC",
            "orderby": "publish_date",
            "lang": "en",
            "per_page": "200",
        },
        timeout=30,
    )
    resp.raise_for_status()

    # Extract total count
    total_match = re.search(r'data-total-posts="(\d+)"', resp.text)
    total = int(total_match.group(1)) if total_match else 0
    print(f"  API reports {total} total projects")

    # Extract unique project URLs
    urls = re.findall(
        r'href="(https?://novonordiskfonden\.dk/en/projects/[a-z0-9][a-z0-9-]+/?)"',
        resp.text,
    )
    unique = sorted({u.rstrip("/") for u in urls})
    print(f"  Collected {len(unique)} unique project URLs")
    return unique


async def scrape_project(crawler: AsyncWebCrawler, url: str) -> dict | None:
    """Scrape a single project detail page and return structured data."""
    run_config = CrawlerRunConfig()
    result = await crawler.arun(url=url, config=run_config)

    if not result.success:
        print(f"    FAILED: {url}")
        return None

    soup = BeautifulSoup(result.html, "html.parser")
    item: dict = {}

    # --- Title ---
    h1 = soup.find("h1")
    item["title"] = h1.get_text(strip=True) if h1 else ""

    # --- Subtitle / tagline (h6 immediately after h1) ---
    if h1:
        tagline = h1.find_next_sibling("h6")
        item["subtitle"] = tagline.get_text(strip=True) if tagline else ""
    else:
        item["subtitle"] = ""

    # --- Description (main body paragraphs) ---
    paragraphs: list[str] = []
    content_div = (
        soup.find("div", class_="nnf-node-content__body")
        or soup.find("div", class_="nnf-article-body")
        or soup.find("article")
    )
    if content_div:
        for p in content_div.find_all("p"):
            text = p.get_text(strip=True)
            if text:
                paragraphs.append(text)
    item["description"] = "\n\n".join(paragraphs)

    # --- Project data sidebar (Year, Grant amount, Project website) ---
    sidebar = soup.find("div", class_="nnf-project-sidebar")
    labels = [d.get_text(strip=True) for d in sidebar.find_all("div", class_="nnf-project-sidebar__label")] if sidebar else []
    values = [d.get_text(strip=True) for d in sidebar.find_all("div", class_="nnf-project-sidebar__data")] if sidebar else []

    data_map = dict(zip(labels, values))
    item["year"] = data_map.get("Year", "")
    item["grant_amount"] = data_map.get("Grant amount", "")

    # Project website (extract href)
    item["project_website"] = ""
    if sidebar:
        for label_div, data_div in zip(
            sidebar.find_all("div", class_="nnf-project-sidebar__label"),
            sidebar.find_all("div", class_="nnf-project-sidebar__data"),
        ):
            if label_div.get_text(strip=True) == "Project website":
                a = data_div.find("a")
                item["project_website"] = a["href"] if a and a.get("href") else data_div.get_text(strip=True)

    # --- Static fields ---
    item["patron_name"] = PATRON_NAME
    item["category"] = ""
    item["minimum_amount"] = item["grant_amount"]
    item["deadline"] = ""
    item["external_url"] = url

    return item


async def main() -> None:
    print("=== Novo Nordisk Fonden scraper (crawl4ai) ===\n")

    # Phase 1: collect project URLs via AJAX API
    print("Phase 1 — Collecting project URLs from API...")
    project_urls = collect_project_urls()
    print(f"\nFound {len(project_urls)} projects.\n")

    # Phase 2: scrape each project detail page
    print("Phase 2 — Scraping individual project pages...")
    browser_config = BrowserConfig(headless=True, verbose=False)
    items: list[dict] = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for i, url in enumerate(project_urls, 1):
            print(f"  [{i}/{len(project_urls)}] {url.split('/')[-1]}")
            item = await scrape_project(crawler, url)
            if item:
                items.append(item)

    # Phase 3: write output
    output_path = Path(__file__).resolve().parent / "output_nnf.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print(f"\nDone — wrote {len(items)} projects to {output_path.name}")


if __name__ == "__main__":
    asyncio.run(main())
