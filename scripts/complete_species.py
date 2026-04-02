#!/usr/bin/env python3
"""
Complete species.json to match the full 75-species target from Formiche/Specie.txt.

Reads the authoritative species list, compares with existing species.json,
adds any missing species with the standard schema, and updates genus species
counts in genera.json.
"""

import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "formiche-ditalia" / "src" / "data"
SPECIES_TXT = PROJECT_ROOT / "Formiche" / "Specie.txt"


def parse_species_txt(filepath: Path) -> list[dict]:
    """Parse Formiche/Specie.txt and return list of species dicts with name, slug, genus."""
    species = []
    current_subfamily = None

    # Known typos in the source file
    TYPO_FIXES = {
        "Creamtogaster": "Crematogaster",
    }

    with open(filepath, encoding="utf-8") as f:
        for line in f:
            raw = line.strip()

            # Skip empty lines
            if not raw:
                continue

            # Stop at TOTALE line -- everything after is notes
            if raw.startswith("TOTALE"):
                break

            # Skip summary lines like "38 (13 generi)", "5(43) (3 generi)"
            if raw.startswith("("):
                continue
            if re.match(r"^\d+", raw):
                continue

            # Detect subfamily annotations (e.g., "Myrmicinae" at end of first species line)
            subfamily_match = re.search(
                r"(Myrmicinae|Ponerinae|Amblyoponinae|Dolichoderinae|Formicinae|Proceratiinae|Leptanillinae)$",
                raw,
            )
            if subfamily_match:
                current_subfamily = subfamily_match.group(1).lower()
                # Remove subfamily from the line to get the species name
                raw = raw[: subfamily_match.start()].strip()

            # Now parse the species name
            parts = raw.split()
            if len(parts) < 2:
                continue

            genus = parts[0]
            epithet = parts[1]

            # Must start with uppercase (genus name)
            if not genus[0].isupper():
                continue

            # Fix known typos
            if genus in TYPO_FIXES:
                genus = TYPO_FIXES[genus]

            # Handle "sp." entries (indeterminate species)
            if epithet == "sp.":
                slug = f"{genus.lower()}-sp"
                species.append(
                    {
                        "scientific_name": f"{genus} sp.",
                        "slug": slug,
                        "genus": genus.lower(),
                        "subfamily": current_subfamily,
                    }
                )
                continue

            # Strip trailing commas or other punctuation from epithet
            epithet = epithet.rstrip(",")

            slug = f"{genus.lower()}-{epithet.lower()}"
            species.append(
                {
                    "scientific_name": f"{genus} {epithet}",
                    "slug": slug,
                    "genus": genus.lower(),
                    "subfamily": current_subfamily,
                }
            )

    return species


def make_species_entry(name: str, slug: str, genus_slug: str) -> dict:
    """Create a species entry matching the schema from parse_nexus.py."""
    parts = name.split()
    genus_name = parts[0]
    species_epithet = parts[1] if len(parts) > 1 else "sp."

    return {
        "id": slug,
        "genus_id": genus_slug,
        "scientific_name": name,
        "author_year": None,
        "status": "native",
        "subspecies": [],
        "distribution_regions": [],
        "altitude_range": None,
        "habitat_notes": None,
        "photo_urls": [],
        "synonyms": [],
        "antweb_url": f"https://www.antweb.org/browse.do?genus={genus_name}&species={species_epithet}&rank=species",
        "antcat_url": None,
        "gbif_id": None,
    }


def main():
    # 1. Parse the target species list
    target_species = parse_species_txt(SPECIES_TXT)
    print(f"Target species from Specie.txt: {len(target_species)}")

    # 2. Load existing species.json
    species_path = DATA_DIR / "species.json"
    with open(species_path, encoding="utf-8") as f:
        existing_species = json.load(f)
    existing_ids = {s["id"] for s in existing_species}
    print(f"Existing species in JSON: {len(existing_ids)}")

    # 3. Handle the "Creamtogaster" typo: after fix it becomes "crematogaster-scutellaris"
    #    which already exists, so it will be skipped naturally.

    # 4. Find and add missing species
    added = []
    for sp in target_species:
        slug = sp["slug"]
        if slug not in existing_ids:
            entry = make_species_entry(sp["scientific_name"], slug, sp["genus"])
            existing_species.append(entry)
            existing_ids.add(slug)
            added.append(slug)
            print(f"  + Added: {sp['scientific_name']} ({slug})")

    print(f"\nAdded {len(added)} new species")
    print(f"Total species now: {len(existing_species)}")

    # 5. Sort species by id for consistency
    existing_species.sort(key=lambda s: s["id"])

    # 6. Save updated species.json
    with open(species_path, "w", encoding="utf-8") as f:
        json.dump(existing_species, f, indent=2, ensure_ascii=False)
    print(f"Saved {species_path}")

    # 7. Update genus species counts in genera.json
    genera_path = DATA_DIR / "genera.json"
    with open(genera_path, encoding="utf-8") as f:
        genera = json.load(f)

    # Count species per genus from the updated species list
    genus_counts: dict[str, int] = {}
    for sp in existing_species:
        gid = sp["genus_id"]
        genus_counts[gid] = genus_counts.get(gid, 0) + 1

    updated_genera = 0
    for genus in genera:
        new_count = genus_counts.get(genus["id"], 0)
        old_count = genus.get("species_count_italy", 0)
        if new_count != old_count:
            print(f"  genus {genus['id']}: {old_count} -> {new_count}")
            genus["species_count_italy"] = new_count
            updated_genera += 1

    with open(genera_path, "w", encoding="utf-8") as f:
        json.dump(genera, f, indent=2, ensure_ascii=False)
    print(f"Updated {updated_genera} genus species counts in {genera_path}")


if __name__ == "__main__":
    main()
