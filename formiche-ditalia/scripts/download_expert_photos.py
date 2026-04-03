#!/usr/bin/env python3
"""
Download expert profile photos locally to avoid hotlink blocking.

Reads src/data/experts.json, downloads each profile_photo_url to
public/images/esperti/{expert_id}.jpg, and updates the JSON with the local path.
"""

import json
import os
import sys
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
EXPERTS_JSON = os.path.join(PROJECT_DIR, "src", "data", "experts.json")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "public", "images", "esperti")

# Map of expert id fragment -> download URL (explicit list to avoid issues)
PHOTO_URLS = {
    "enrico-schifani": "https://blog.myrmecologicalnews.org/wp-content/uploads/2024/04/profile_pic-edited.jpg",
    "donato-andrea-grasso": "https://www.accademiaentomologia.it/wp-content/uploads/2021/03/grasso-300x300.jpg",
    "cristina-castracani": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/cristina.jpg",
    "alessandra-mori": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/ale2.jpg",
    "francesco-mensa": "https://www.muse.it/contrib/uploads/2025/04/Francesco-Mensa-scaled.jpg",
}


def download_photo(url: str, dest: str) -> bool:
    """Download a photo from url to dest. Returns True on success."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(dest, "wb") as f:
            f.write(data)
        print(f"  Downloaded {os.path.basename(dest)} ({len(data)} bytes)")
        return True
    except Exception as e:
        print(f"  ERROR downloading {url}: {e}", file=sys.stderr)
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(EXPERTS_JSON, "r", encoding="utf-8") as f:
        experts = json.load(f)

    updated = 0
    for expert in experts:
        expert_id = expert["id"]
        url = expert.get("profile_photo_url")

        if not url or url.startswith("/"):
            # No URL or already local
            continue

        # Determine filename extension from URL
        ext = ".jpg"
        if url.lower().endswith(".png"):
            ext = ".png"

        filename = f"{expert_id}{ext}"
        dest = os.path.join(OUTPUT_DIR, filename)
        local_path = f"/images/esperti/{filename}"

        print(f"Processing {expert['name']} ({expert_id})...")

        if download_photo(url, dest):
            expert["profile_photo_url"] = local_path
            updated += 1
        else:
            print(f"  Keeping original URL for {expert_id}")

    with open(EXPERTS_JSON, "w", encoding="utf-8") as f:
        json.dump(experts, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nDone: {updated} photos downloaded and paths updated.")


if __name__ == "__main__":
    main()
