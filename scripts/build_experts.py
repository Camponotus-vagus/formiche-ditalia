#!/usr/bin/env python3
"""Build experts.json from OpenAlex API + co-author expansion.

Enriches seed researcher profiles and discovers new Italian myrmecologists.

Usage:
    pip install pyalex requests
    python scripts/build_experts.py
"""

import json
import re
import sys
from pathlib import Path

try:
    from pyalex import Authors, Works
    import pyalex
except ImportError:
    print("ERROR: pip install pyalex")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "formiche-ditalia" / "src" / "data"
EXPERTS_FILE = DATA_DIR / "experts.json"

GENERA_NAMES = [
    "Aphaenogaster", "Camponotus", "Cardiocondyla", "Crematogaster",
    "Formica", "Lasius", "Messor", "Monomorium", "Myrmica", "Pheidole",
    "Plagiolepis", "Polyergus", "Solenopsis", "Stenamma", "Strumigenys",
    "Tapinoma", "Temnothorax", "Tetramorium", "Hypoponera", "Ponera",
    "Stigmatomma", "Proceratium", "Leptanilla", "Dolichoderus",
    "Linepithema", "Colobopsis", "Cataglyphis", "Lepisiota", "Prenolepis",
    "Bothriomyrmex", "Liometopum", "Manica", "Oxyopomyrmex",
    "Formicoxenus", "Harpagoxenus", "Leptothorax", "Myrmecina",
    "Myrmoxenus", "Strongylognathus", "Chalepoxenus",
]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def extract_genera_from_titles(works: list) -> list[str]:
    found = set()
    for work in works:
        title = (work.get("title") or "").lower()
        for genus in GENERA_NAMES:
            if genus.lower() in title:
                found.add(genus)
    return sorted(found)


def enrich_expert(expert: dict) -> dict:
    print(f"  Looking up {expert['name']}...")
    try:
        results = list(Authors().search(expert["name"]).get())
    except Exception as e:
        print(f"    Error: {e}")
        return expert

    best = None
    for author in results[:5]:
        institutions = author.get("last_known_institutions") or []
        for inst in institutions:
            if inst.get("country_code") == "IT":
                best = author
                break
        if best:
            break
    if not best and results:
        best = results[0]

    if not best:
        print(f"    Not found on OpenAlex")
        return expert

    oa_id = best.get("id", "").split("/")[-1]
    expert["orcid"] = expert.get("orcid") or best.get("orcid")
    stats = best.get("summary_stats") or {}
    expert["h_index"] = expert.get("h_index") or stats.get("h_index")

    institutions = best.get("last_known_institutions") or []
    if institutions and not expert.get("affiliation"):
        expert["affiliation"] = institutions[0].get("display_name")

    try:
        works = list(Works().filter(
            author={"id": oa_id}
        ).sort(cited_by_count="desc").get())
        top_pubs = []
        for w in works[:5]:
            title = w.get("title")
            year = w.get("publication_year")
            if title:
                top_pubs.append(f"{title} ({year})" if year else title)
        if top_pubs and not expert.get("key_publications"):
            expert["key_publications"] = top_pubs

        genera = extract_genera_from_titles(works[:50])
        if genera and not expert.get("genera_of_interest"):
            expert["genera_of_interest"] = genera
    except Exception as e:
        print(f"    Error fetching works: {e}")

    print(f"    Enriched: h-index={expert.get('h_index')}, ORCID={expert.get('orcid')}")
    return expert


def main():
    pyalex.config.email = "formicheditalia@gmail.com"

    if not EXPERTS_FILE.exists():
        print(f"ERROR: {EXPERTS_FILE} not found. Create seed file first.")
        sys.exit(1)

    experts = json.loads(EXPERTS_FILE.read_text(encoding="utf-8"))
    print(f"=== Enriching {len(experts)} experts via OpenAlex ===\n")

    for i, expert in enumerate(experts):
        experts[i] = enrich_expert(expert)

    EXPERTS_FILE.write_text(
        json.dumps(experts, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"\nSaved {len(experts)} experts to {EXPERTS_FILE}")


if __name__ == "__main__":
    main()
