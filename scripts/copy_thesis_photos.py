#!/usr/bin/env python3
"""
Copy specimen photos from thesis directory (Formiche/Specie/) into the Astro site,
and update species.json with photo_urls for species that were previously missing photos.

Thesis directory structure:
  Formiche/Specie/{Subfamily}/{Genus epithet}/*.jpg
  Images follow AntWeb naming: {specimen_id}_{view}_{number}_high.jpg
  Views: h=head, p=profile, d=dorsal, l=label

Target structure:
  formiche-ditalia/public/images/specie/{species-id}/head.jpg
  formiche-ditalia/public/images/specie/{species-id}/profile.jpg
  formiche-ditalia/public/images/specie/{species-id}/dorsal.jpg
"""

from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
THESIS_SPECIE_DIR = PROJECT_ROOT / "Formiche" / "Specie"
SITE_DIR = PROJECT_ROOT / "formiche-ditalia"
SPECIES_JSON = SITE_DIR / "src" / "data" / "species.json"
OUTPUT_IMG_DIR = SITE_DIR / "public" / "images" / "specie"

# Map view codes to output filenames
VIEW_MAP = {
    "h": "head.jpg",
    "p": "profile.jpg",
    "d": "dorsal.jpg",
}

# Known name mismatches between species.json and thesis folder names
# species.json name -> thesis folder name
NAME_OVERRIDES = {
    "Cryptopone ochraceum": "Cryptopone ochracea",
    "Temnothorax mullerianus": "Temnothorax muellerianus",
}


def find_thesis_folder(scientific_name: str) -> Path | None:
    """Find the thesis folder for a species by scanning Formiche/Specie/{subfamily}/{name}."""
    lookup_name = NAME_OVERRIDES.get(scientific_name, scientific_name)
    for subfamily_dir in THESIS_SPECIE_DIR.iterdir():
        if not subfamily_dir.is_dir():
            continue
        candidate = subfamily_dir / lookup_name
        if candidate.is_dir():
            return candidate
    return None


def pick_best_image(images: list[Path], view: str) -> Path | None:
    """
    Given a list of image files and a view code (h/p/d),
    pick the best one (prefer _1_ variant, first specimen found).
    """
    view_images = [
        img for img in images
        if re.match(rf".+_{view}_\d+_high\.jpg$", img.name, re.IGNORECASE)
    ]
    if not view_images:
        return None
    # Sort to prefer _1_ (first image of the view)
    view_images.sort(key=lambda p: p.name)
    return view_images[0]


def main():
    with open(SPECIES_JSON) as f:
        species_list = json.load(f)

    missing = [s for s in species_list if not s.get("photo_urls") or len(s["photo_urls"]) == 0]
    print(f"Species missing photos: {len(missing)}")

    found = []
    not_found = []
    updated_ids = set()

    for sp in missing:
        name = sp["scientific_name"]
        sp_id = sp["id"]
        folder = find_thesis_folder(name)

        if folder is None:
            not_found.append(name)
            continue

        # Get all jpg files
        images = list(folder.glob("*.jpg"))
        if not images:
            not_found.append(f"{name} (folder exists but empty)")
            continue

        # Pick best image for each view
        dest_dir = OUTPUT_IMG_DIR / sp_id
        dest_dir.mkdir(parents=True, exist_ok=True)

        copied_views = []
        photo_urls = []
        for view_code, filename in VIEW_MAP.items():
            best = pick_best_image(images, view_code)
            if best:
                dest = dest_dir / filename
                shutil.copy2(best, dest)
                copied_views.append(view_code)
                photo_urls.append(f"/images/specie/{sp_id}/{filename}")

        if photo_urls:
            # Update the species entry
            sp["photo_urls"] = photo_urls
            updated_ids.add(sp_id)
            found.append(f"{name} -> {len(photo_urls)} photos (views: {', '.join(copied_views)})")
            print(f"  OK: {name} ({len(photo_urls)} photos copied)")
        else:
            not_found.append(f"{name} (no h/p/d images)")

    # Write updated species.json
    if updated_ids:
        with open(SPECIES_JSON, "w") as f:
            json.dump(species_list, f, indent=2, ensure_ascii=False)
        print(f"\nUpdated species.json with {len(updated_ids)} new photo entries.")

    # Summary
    total_with_photos = sum(1 for s in species_list if s.get("photo_urls") and len(s["photo_urls"]) > 0)
    total = len(species_list)

    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"{'='*60}")
    print(f"Species that got photos ({len(found)}):")
    for item in sorted(found):
        print(f"  + {item}")
    print(f"\nStill missing ({len(not_found)}):")
    for item in sorted(not_found):
        print(f"  - {item}")
    print(f"\nTotal coverage: {total_with_photos}/{total} species ({100*total_with_photos/total:.0f}%)")


if __name__ == "__main__":
    main()
