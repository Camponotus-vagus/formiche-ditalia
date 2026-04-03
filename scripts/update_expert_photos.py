#!/usr/bin/env python3
"""
Update experts.json with publicly available profile photo URLs.

Photos sourced from official institutional/academic pages:
- Myrmecology Lab WordPress (University of Parma lab site)
- ANIE (Accademia Nazionale Italiana di Entomologia)
- Myrmecological News Blog
- Frontiers Loop academic profiles

Only publicly accessible URLs from official sources are used.
"""

import json
from pathlib import Path

EXPERTS_JSON = Path(__file__).resolve().parent.parent / "formiche-ditalia" / "src" / "data" / "experts.json"

# Mapping of expert IDs to their publicly available profile photo URLs.
# Sources are noted for each.
PHOTO_URLS = {
    # Myrmecological News Blog profile (April 2024 interview/profile post)
    "enrico-schifani": "https://blog.myrmecologicalnews.org/wp-content/uploads/2024/04/profile_pic-edited.jpg",

    # ANIE - Accademia Nazionale Italiana di Entomologia (official academic profile)
    "donato-andrea-grasso": "https://www.accademiaentomologia.it/wp-content/uploads/2021/03/grasso-300x300.jpg",

    # No public institutional photo found
    "antonio-scupola": None,

    # No public institutional photo found
    "antonio-alicata": None,

    # Myrmecology Lab WordPress (University of Parma lab website, staff page)
    "cristina-castracani": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/cristina.jpg",

    # Myrmecology Lab WordPress (University of Parma lab website, staff page)
    "alessandra-mori": "https://myrmecologylab.wordpress.com/wp-content/uploads/2010/09/ale2.jpg",

    # No public institutional photo found
    "giorgio-sabella": None,

    # No public institutional photo found
    "fabrizio-rigato": None,

    # No public institutional photo found
    "francesco-mensa": None,
}


def main():
    print(f"Reading experts from: {EXPERTS_JSON}")
    with open(EXPERTS_JSON, "r", encoding="utf-8") as f:
        experts = json.load(f)

    updated = []
    skipped = []

    for expert in experts:
        eid = expert["id"]
        if eid in PHOTO_URLS:
            url = PHOTO_URLS[eid]
            if url is not None:
                expert["profile_photo_url"] = url
                updated.append(f"  + {expert['name']}: {url}")
            else:
                skipped.append(f"  - {expert['name']}: no public photo found")
        else:
            skipped.append(f"  ? {expert['name']}: not in photo mapping")

    with open(EXPERTS_JSON, "w", encoding="utf-8") as f:
        json.dump(experts, f, indent=2, ensure_ascii=False)

    print(f"\nUpdated {len(updated)} expert(s) with photos:")
    for line in updated:
        print(line)

    print(f"\nSkipped {len(skipped)} expert(s):")
    for line in skipped:
        print(line)

    print(f"\nWrote updated data to: {EXPERTS_JSON}")


if __name__ == "__main__":
    main()
