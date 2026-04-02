#!/usr/bin/env python3
"""
Copy local AntWeb specimen images into the Astro project and update JSON data files.

For each genus: picks 1 specimen from the first available species subfolder.
For each species: picks 1 specimen from the matching species subfolder.
Copies head, profile, dorsal views only.
"""

from __future__ import annotations

import json
import os
import re
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Optional

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANTWEB_IMAGES = Path("/Users/francesco.mensa/Downloads/AntWeb_ML_Platform/antweb_images")
GENERA_JSON = PROJECT_ROOT / "formiche-ditalia" / "src" / "data" / "genera.json"
SPECIES_JSON = PROJECT_ROOT / "formiche-ditalia" / "src" / "data" / "species.json"
PUBLIC_DIR = PROJECT_ROOT / "formiche-ditalia" / "public"

VIEWS = ["head", "profile", "dorsal"]

# Some genera were reclassified; map JSON genus name -> antweb folder name
GENUS_FOLDER_ALIASES = {
    "Stigmatomma": "Amblyopone",
}


def find_genus_folder(genus_name: str) -> Path | None:
    """Find the antweb_images folder for a genus, trying aliases."""
    candidates = [genus_name, GENUS_FOLDER_ALIASES.get(genus_name, "")]
    for name in candidates:
        if not name:
            continue
        folder = ANTWEB_IMAGES / name
        if folder.is_dir():
            return folder
    return None


def find_first_specimen(species_folder: Path) -> str | None:
    """Find the first specimen ID that has at least head or profile view."""
    specimens = defaultdict(set)
    for f in sorted(species_folder.iterdir()):
        if not f.is_file() or not f.suffix.lower() == ".jpg":
            continue
        # Pattern: {specimen_id}_{view}_{n}.jpg
        match = re.match(r"^(.+?)_(head|profile|dorsal)_\d+\.jpg$", f.name, re.IGNORECASE)
        if match:
            spec_id = match.group(1)
            view = match.group(2).lower()
            specimens[spec_id].add(view)

    # Prefer specimens with all 3 views, then 2, then 1
    for target_count in (3, 2, 1):
        for spec_id in sorted(specimens.keys()):
            if len(specimens[spec_id]) >= target_count:
                return spec_id
    return None


def copy_specimen_images(species_folder: Path, specimen_id: str, dest_dir: Path) -> list[str]:
    """Copy head/profile/dorsal for a specimen. Returns list of copied view names."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    copied_views = []

    for view in VIEWS:
        # Find the file (try _1 first, the most common)
        src = None
        for n in range(1, 5):
            candidate = species_folder / f"{specimen_id}_{view}_{n}.jpg"
            if candidate.exists():
                src = candidate
                break

        if src is None:
            continue

        dest = dest_dir / f"{view}.jpg"
        shutil.copy2(src, dest)
        copied_views.append(view)

    return copied_views


def main():
    # Load JSON data
    with open(GENERA_JSON) as f:
        genera = json.load(f)
    with open(SPECIES_JSON) as f:
        species_list = json.load(f)

    total_size = 0
    genera_with_photos = 0
    genera_without_photos = []
    species_with_photos = 0
    species_without_photos = []

    # --- Process genera ---
    print("=== Processing genera ===")
    for genus in genera:
        genus_id = genus["id"]
        genus_name = genus["scientific_name"]

        genus_folder = find_genus_folder(genus_name)
        if genus_folder is None:
            genera_without_photos.append(genus_name)
            print(f"  SKIP {genus_name}: no folder in antweb_images")
            continue

        # Pick the first species subfolder (sorted for determinism)
        species_subfolders = sorted(
            [d for d in genus_folder.iterdir() if d.is_dir()]
        )
        if not species_subfolders:
            genera_without_photos.append(genus_name)
            print(f"  SKIP {genus_name}: no species subfolders")
            continue

        # Try species subfolders until we find one with a usable specimen
        copied = False
        for sp_folder in species_subfolders:
            specimen_id = find_first_specimen(sp_folder)
            if specimen_id is None:
                continue

            dest_dir = PUBLIC_DIR / "images" / "genera" / genus_id
            copied_views = copy_specimen_images(sp_folder, specimen_id, dest_dir)

            if copied_views:
                photo_urls = [f"/images/genera/{genus_id}/{v}.jpg" for v in copied_views]
                genus["photo_urls"] = photo_urls
                genera_with_photos += 1

                size = sum((dest_dir / f"{v}.jpg").stat().st_size for v in copied_views)
                total_size += size
                print(f"  OK   {genus_name} <- {sp_folder.name}/{specimen_id} ({len(copied_views)} views, {size/1024:.0f} KB)")
                copied = True
                break

        if not copied:
            genera_without_photos.append(genus_name)
            print(f"  SKIP {genus_name}: no usable specimens found")

    # --- Process species ---
    print("\n=== Processing species ===")
    for sp in species_list:
        sp_id = sp["id"]
        sci_name = sp["scientific_name"]

        # Parse genus + epithet
        parts = sci_name.split()
        if len(parts) < 2 or parts[1] in ("sp.", "sp"):
            species_without_photos.append(sci_name)
            print(f"  SKIP {sci_name}: no epithet")
            continue

        genus_name = parts[0]
        epithet = parts[1].lower()

        # Find the species folder
        genus_folder = find_genus_folder(genus_name)
        if genus_folder is None:
            species_without_photos.append(sci_name)
            print(f"  SKIP {sci_name}: no genus folder")
            continue

        sp_folder = genus_folder / epithet
        if not sp_folder.is_dir():
            species_without_photos.append(sci_name)
            print(f"  SKIP {sci_name}: no species folder '{epithet}'")
            continue

        specimen_id = find_first_specimen(sp_folder)
        if specimen_id is None:
            species_without_photos.append(sci_name)
            print(f"  SKIP {sci_name}: no usable specimen")
            continue

        dest_dir = PUBLIC_DIR / "images" / "specie" / sp_id
        copied_views = copy_specimen_images(sp_folder, specimen_id, dest_dir)

        if copied_views:
            photo_urls = [f"/images/specie/{sp_id}/{v}.jpg" for v in copied_views]
            sp["photo_urls"] = photo_urls
            species_with_photos += 1

            size = sum((dest_dir / f"{v}.jpg").stat().st_size for v in copied_views)
            total_size += size
            print(f"  OK   {sci_name} <- {specimen_id} ({len(copied_views)} views, {size/1024:.0f} KB)")
        else:
            species_without_photos.append(sci_name)
            print(f"  SKIP {sci_name}: copy failed")

    # --- Write updated JSON ---
    with open(GENERA_JSON, "w") as f:
        json.dump(genera, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(SPECIES_JSON, "w") as f:
        json.dump(species_list, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # --- Report ---
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Genera with photos:  {genera_with_photos} / {len(genera)}")
    print(f"Species with photos: {species_with_photos} / {len(species_list)}")
    print(f"Total size copied:   {total_size / 1024 / 1024:.1f} MB")

    if genera_without_photos:
        print(f"\nGenera WITHOUT photos ({len(genera_without_photos)}):")
        for g in genera_without_photos:
            print(f"  - {g}")

    if species_without_photos:
        print(f"\nSpecies WITHOUT photos ({len(species_without_photos)}):")
        for s in species_without_photos:
            print(f"  - {s}")


if __name__ == "__main__":
    main()
