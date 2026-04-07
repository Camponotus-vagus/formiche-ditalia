#!/usr/bin/env python3
"""
Add author_year citations to species.json for all 73 species missing them.
Authority: AntCat (antcat.org) — original describing authors only.
"""

import json
import os

SPECIES_JSON = os.path.join(
    os.path.dirname(__file__),
    "..", "formiche-ditalia", "src", "data", "species.json"
)

# Taxonomic author citations from AntCat.
# Key = scientific_name as it appears in species.json.
# Note: "Formica rufifabris" in the dataset likely refers to F. rufibarbis Fabricius, 1793.
AUTHOR_YEARS = {
    # Bothriomyrmex sp. — not identified to species, leave null
    "Bothriomyrmex sp.": None,

    # Camponotus
    "Camponotus aethiops": "(Latreille, 1798)",
    "Camponotus fallax": "(Nylander, 1856)",
    "Camponotus gestroi": "Emery, 1878",
    "Camponotus lateralis": "(Olivier, 1792)",
    "Camponotus piceus": "(Leach, 1825)",
    "Camponotus vagus": "(Scopoli, 1763)",

    # Cardiocondyla
    "Cardiocondyla elegans": "Emery, 1869",
    "Cardiocondyla nuda": "(Mayr, 1866)",

    # Colobopsis
    "Colobopsis truncata": "(Spinola, 1808)",

    # Crematogaster
    "Crematogaster scutellaris": "(Olivier, 1792)",
    "Crematogaster sordidula": "(Nylander, 1849)",

    # Cryptopone
    "Cryptopone ochraceum": "(Mayr, 1855)",

    # Dolichoderus
    "Dolichoderus quadripunctatus": "(Linnaeus, 1771)",

    # Formica
    "Formica cunicularia": "Latreille, 1798",
    "Formica gagates": "Latreille, 1798",
    "Formica rufifabris": "Fabricius, 1793",  # = F. rufibarbis
    "Formica sanguinea": "Latreille, 1798",

    # Hypoponera
    "Hypoponera abeillei": "(André, 1881)",
    "Hypoponera eduardi": "(Forel, 1894)",
    "Hypoponera punctatissima": "(Roger, 1859)",

    # Lasius
    "Lasius alienus": "(Förster, 1850)",
    "Lasius brunneus": "(Latreille, 1798)",
    "Lasius distinguendus": "(Emery, 1916)",
    "Lasius emarginatus": "(Olivier, 1792)",
    "Lasius fuliginosus": "(Latreille, 1798)",
    "Lasius lasioides": "(Emery, 1869)",
    "Lasius myops": "Forel, 1894",
    "Lasius niger": "(Linnaeus, 1758)",
    "Lasius nitidigaster": "Seifert, 1996",
    "Lasius paralienus": "Seifert, 1992",

    # Linepithema
    "Linepithema humile": "(Mayr, 1868)",

    # Messor
    "Messor capitatus": "(Latreille, 1798)",
    "Messor meridionalis": "(André, 1883)",
    "Messor minor": "(André, 1883)",
    "Messor structor": "(Latreille, 1798)",
    "Messor wasmanni": "Krausse, 1910",

    # Monomorium
    "Monomorium monomorium": "Bolton, 1987",
    "Monomorium pharaonis": "(Linnaeus, 1758)",

    # Myrmecina
    "Myrmecina graminicola": "(Latreille, 1802)",

    # Myrmica
    "Myrmica sabuleti": "Meinert, 1861",
    "Myrmica scabrinodis": "Nylander, 1846",
    "Myrmica specioides": "Bondroit, 1918",

    # Pheidole
    "Pheidole pallidula": "(Nylander, 1849)",

    # Plagiolepis
    "Plagiolepis pygmaea": "(Latreille, 1798)",
    "Plagiolepis xene": "Stärcke, 1936",

    # Polyergus
    "Polyergus rufescens": "(Latreille, 1798)",

    # Ponera
    "Ponera coarctata": "(Latreille, 1802)",

    # Solenopsis
    "Solenopsis fugax": "(Latreille, 1798)",

    # Stenamma
    "Stenamma debile": "(Förster, 1850)",
    "Stenamma striatulum": "Emery, 1895",

    # Stigmatomma
    "Stigmatomma denticulatum": "Roger, 1859",
    "Stigmatomma impressifrons": "(Emery, 1869)",

    # Strumigenys
    "Strumigenys argiola": "(Emery, 1869)",
    "Strumigenys baudueri": "(Emery, 1875)",
    "Strumigenys membranifera": "Emery, 1869",
    "Strumigenys tenuipilis": "Emery, 1915",

    # Tapinoma
    "Tapinoma erraticum": "(Latreille, 1798)",
    "Tapinoma madeirense": "Forel, 1895",
    "Tapinoma nigerrimum": "(Nylander, 1856)",

    # Temnothorax
    "Temnothorax italicus": "(Consani, 1952)",
    "Temnothorax lichtensteini": "(Bondroit, 1918)",
    "Temnothorax mullerianus": "(Finzi, 1922)",  # described as Leptothorax mullerianus by Finzi, 1922
    "Temnothorax nylanderi": "(Förster, 1850)",
    "Temnothorax parvulus": "(Schenck, 1852)",
    "Temnothorax recedens": "(Nylander, 1856)",
    "Temnothorax rottenbergii": "(Emery, 1870)",
    "Temnothorax tuberum": "(Fabricius, 1775)",
    "Temnothorax unifasciatus": "(Latreille, 1798)",

    # Tetramorium
    "Tetramorium caespitum": "(Linnaeus, 1758)",
    "Tetramorium meridionale": "Emery, 1870",
    "Tetramorium moravicum": "Kratochvíl, 1941",  # described by Kratochvíl in Novák & Sadil, 1941
    "Tetramorium semilaeve": "André, 1883",
}


def main():
    path = os.path.abspath(SPECIES_JSON)
    print(f"Reading {path}")

    with open(path, "r", encoding="utf-8") as f:
        species = json.load(f)

    updated = 0
    skipped = 0
    already_set = 0

    for sp in species:
        name = sp["scientific_name"]
        if name in AUTHOR_YEARS:
            new_val = AUTHOR_YEARS[name]
            if sp["author_year"] is not None:
                already_set += 1
                continue
            if new_val is None:
                skipped += 1
                continue
            sp["author_year"] = new_val
            updated += 1
            print(f"  + {name}: {new_val}")
        elif sp["author_year"] is None:
            print(f"  WARNING: No author_year mapping for '{name}'")

    print(f"\nUpdated: {updated}, Already set: {already_set}, Skipped (sp.): {skipped}")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(species, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Saved {path}")


if __name__ == "__main__":
    main()
