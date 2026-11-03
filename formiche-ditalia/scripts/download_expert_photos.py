#!/usr/bin/env python3
"""
Download expert profile photos locally to avoid hotlink blocking.

For every entry in PHOTO_URLS, downloads the source image, optionally crops it
to a square box centred on the face (the site shows photos as small circular
avatars with object-cover), resizes it and saves it as
public/images/esperti/{expert_id}.webp. It then makes sure the matching expert
in src/data/experts.json points to that local path.

Requires Pillow (pip install Pillow).

Usage:
    python3 scripts/download_expert_photos.py            # all entries
    python3 scripts/download_expert_photos.py elia-nalini enrico-schifani
"""

import io
import json
import os
import sys
import urllib.request

from PIL import Image, ImageOps

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
EXPERTS_JSON = os.path.join(PROJECT_DIR, "src", "data", "experts.json")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "public", "images", "esperti")

DEFAULT_SIZE = 400  # output side in px (images smaller than this are not upscaled)
WEBP_QUALITY = 85

# expert id -> source URL, optional crop box (left, top, right, bottom) in
# source-image pixels, optional output size.
PHOTO_URLS = {
    "elia-nalini": {
        # https://www.eurac.edu/en/people/elia-nalini
        "url": "https://www.datocms-assets.com/31538/1712057501-nalinielia.jpg",
        "crop": (867, 0, 4335, 3468),
        "size": 600,
    },
    "enrico-schifani": {
        # Frontiers Loop profile: https://loop.frontiersin.org/people/801756
        "url": "https://loop.frontiersin.org/images/profile/801756/203",
    },
    "mattia-menchetti": {
        # https://www.mattiamenchetti.com/about
        "url": "https://www.mattiamenchetti.com/_astro/portrait_2025.F7r8VqeM_28mx6B.webp",
        "crop": (145, 523, 2238, 2616),
    },
    "alessandra-mori": {
        # https://myrmecologylab.wordpress.com/people/alessandra-mori/
        "url": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/ale2.jpg",
        "crop": (95, 10, 335, 250),
    },
    "cristina-castracani": {
        # https://myrmecologylab.wordpress.com/people/cristina-castracani/
        "url": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/cristina.jpg",
        "crop": (184, 0, 604, 420),
    },
    "francesco-mensa": {
        "url": "https://www.muse.it/contrib/uploads/2025/04/Francesco-Mensa-scaled.jpg",
        "crop": (500, 0, 1420, 920),
    },
    "donato-andrea-grasso": {
        "url": "https://www.accademiaentomologia.it/wp-content/uploads/2021/03/grasso-300x300.jpg",
    },
    # Not listed (source URL unknown, local file kept as is): antonio-alicata,
    # antonio-scupola, daniele-giannetti, fabrizio-rigato.
}

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def process_photo(expert_id: str, spec: dict) -> bool:
    """Download, crop, resize and save one photo. Returns True on success."""
    dest = os.path.join(OUTPUT_DIR, f"{expert_id}.webp")
    try:
        data = fetch(spec["url"])
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
        if spec.get("crop"):
            im = im.crop(spec["crop"])
        size = spec.get("size", DEFAULT_SIZE)
        if im.width > size or im.height > size:
            im = ImageOps.fit(im, (size, size), Image.LANCZOS)
        im.save(dest, "WEBP", quality=WEBP_QUALITY)
        print(f"  Saved {os.path.basename(dest)} {im.size} ({len(data)} bytes downloaded)")
        return True
    except Exception as e:
        print(f"  ERROR processing {spec['url']}: {e}", file=sys.stderr)
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    wanted = sys.argv[1:] or list(PHOTO_URLS)
    unknown = [i for i in wanted if i not in PHOTO_URLS]
    if unknown:
        sys.exit(f"Unknown expert id(s): {', '.join(unknown)}")

    with open(EXPERTS_JSON, "r", encoding="utf-8") as f:
        experts = json.load(f)
    by_id = {e["id"]: e for e in experts}

    done = 0
    json_changed = False
    for expert_id in wanted:
        if expert_id not in by_id:
            print(f"Skipping {expert_id}: not in experts.json", file=sys.stderr)
            continue
        print(f"Processing {by_id[expert_id]['name']} ({expert_id})...")
        if process_photo(expert_id, PHOTO_URLS[expert_id]):
            done += 1
            local_path = f"/images/esperti/{expert_id}.webp"
            if by_id[expert_id].get("profile_photo_url") != local_path:
                by_id[expert_id]["profile_photo_url"] = local_path
                json_changed = True

    if json_changed:
        with open(EXPERTS_JSON, "w", encoding="utf-8") as f:
            json.dump(experts, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print(f"\nDone: {done}/{len(wanted)} photos saved.")


if __name__ == "__main__":
    main()
