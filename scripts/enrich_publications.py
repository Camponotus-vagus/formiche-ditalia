#!/usr/bin/env python3
"""Enrich expert publications with metadata from OpenAlex.

Reads experts.json, searches OpenAlex for each publication title,
and replaces plain-string entries with structured objects containing
authors, DOI, year, and URL.

Usage:
    pip install pyalex
    python scripts/enrich_publications.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Optional, Tuple

try:
    from pyalex import Works
    import pyalex
except ImportError:
    print("ERROR: pip install pyalex")
    sys.exit(1)

pyalex.config.email = "formicheditalia@gmail.com"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "formiche-ditalia" / "src" / "data"
EXPERTS_FILE = DATA_DIR / "experts.json"


def extract_title_year(pub_string: str) -> tuple[str, int | None]:
    """Parse 'Some Title (2020)' into ('Some Title', 2020)."""
    m = re.match(r"^(.+?)\s*\((\d{4})\)\s*$", pub_string)
    if m:
        return m.group(1).strip(), int(m.group(2))
    return pub_string.strip(), None


def clean_html(text: str) -> str:
    """Remove HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", text)


def format_authors(authorships: list, max_authors: int = 3) -> str:
    """Format OpenAlex authorships as 'Lastname F., Lastname G.' etc."""
    names = []
    for a in authorships:
        raw = a.get("author", {}).get("display_name", "")
        if not raw:
            continue
        parts = raw.split()
        if len(parts) >= 2:
            last = parts[-1]
            initials = "".join(p[0] + "." for p in parts[:-1])
            names.append(f"{last} {initials}")
        else:
            names.append(raw)
    if len(names) > max_authors:
        return ", ".join(names[:max_authors]) + " et al."
    return ", ".join(names)


def extract_doi(doi_url: str | None) -> str | None:
    """Extract DOI string from full URL like https://doi.org/10.xxxx/yyyy."""
    if not doi_url:
        return None
    m = re.search(r"(10\.\d{4,}/[^\s]+)", doi_url)
    return m.group(1) if m else None


def search_openalex(title: str, year: int | None) -> dict | None:
    """Search OpenAlex for a work by title, return best match or None."""
    clean_title = clean_html(title)
    try:
        results = Works().search(clean_title).get()
        if not results:
            return None

        # Try to find a result matching the year and with similar title
        for work in results:
            work_title = clean_html(work.get("title", "") or "")
            work_year = work.get("publication_year")
            # Rough title similarity check
            if year and work_year and work_year != year:
                continue
            if _title_match(clean_title, work_title):
                return work

        # Fallback: check first result for title match regardless of year
        first = results[0]
        first_title = clean_html(first.get("title", "") or "")
        if _title_match(clean_title, first_title):
            return first

        return None
    except Exception as e:
        print(f"  WARNING: OpenAlex search failed for '{clean_title[:60]}...': {e}")
        return None


def _title_match(query: str, candidate: str) -> bool:
    """Check if two titles are similar enough."""
    q = re.sub(r"[^a-z0-9 ]", "", query.lower()).strip()
    c = re.sub(r"[^a-z0-9 ]", "", candidate.lower()).strip()
    # Check if one contains most words of the other
    q_words = set(q.split())
    c_words = set(c.split())
    if not q_words or not c_words:
        return False
    overlap = len(q_words & c_words)
    return overlap >= min(len(q_words), len(c_words)) * 0.6


def enrich_publication(pub_string: str) -> dict:
    """Convert a plain publication string to a structured object."""
    title, year = extract_title_year(pub_string)
    clean_title = clean_html(title)

    result = {
        "title": clean_title,
        "authors": None,
        "year": year,
        "doi": None,
        "url": None,
    }

    work = search_openalex(title, year)
    if work:
        # Authors
        authorships = work.get("authorships", [])
        if authorships:
            result["authors"] = format_authors(authorships)

        # Year
        if work.get("publication_year"):
            result["year"] = work["publication_year"]

        # DOI
        doi_url = work.get("doi")
        doi = extract_doi(doi_url)
        if doi:
            result["doi"] = doi
            result["url"] = f"https://doi.org/{doi}"
        else:
            # Try landing page URL
            loc = work.get("primary_location") or {}
            landing = loc.get("landing_page_url")
            if landing:
                result["url"] = landing

        print(f"  ENRICHED: {clean_title[:60]}...")
    else:
        print(f"  NOT FOUND: {clean_title[:60]}...")

    return result


def main():
    with open(EXPERTS_FILE) as f:
        experts = json.load(f)

    total_pubs = 0
    enriched_count = 0

    for expert in experts:
        pubs = expert.get("key_publications", [])
        if not pubs:
            continue

        print(f"\n--- {expert['name']} ({len(pubs)} publications) ---")
        new_pubs = []
        for pub in pubs:
            if isinstance(pub, str):
                total_pubs += 1
                enriched = enrich_publication(pub)
                new_pubs.append(enriched)
                if enriched.get("doi") or enriched.get("authors"):
                    enriched_count += 1
                # Be polite to the API
                time.sleep(0.3)
            else:
                # Already structured
                new_pubs.append(pub)

        expert["key_publications"] = new_pubs

    with open(EXPERTS_FILE, "w") as f:
        json.dump(experts, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n=== Done: {enriched_count}/{total_pubs} publications enriched ===")


if __name__ == "__main__":
    main()
