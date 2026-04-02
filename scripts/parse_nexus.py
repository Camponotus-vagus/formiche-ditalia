#!/usr/bin/env python3
"""Parse NEXUS (.nex) files from FormiKey thesis into JSON data files.

Reads character matrices for subfamilies, genera (per subfamily), and species
(per genus). Outputs: subfamilies.json, genera.json, species.json,
characters.json, matrix.json into ../formiche-ditalia/src/data/

Usage:
    python scripts/parse_nexus.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Project root (parent of scripts/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "formiche-ditalia" / "src" / "data"

# NEXUS source directories (prefer Rigato-corrected)
RIGATO_DIR = PROJECT_ROOT / "TESI FORMICHE (Dropbox)" / "Matrici corrette da Rigato"
FALLBACK_DIR = PROJECT_ROOT / "TESI FORMICHE"
SPECIES_DIR = FALLBACK_DIR / "Specie"  # species .nex files only exist here
SPECIES_DIR_DROPBOX = PROJECT_ROOT / "TESI FORMICHE (Dropbox)" / "Specie"


def find_nex_file(filename: str, category: str = "generi") -> Path | None:
    """Find a .nex file, preferring Rigato-corrected version."""
    rigato = RIGATO_DIR / filename
    if rigato.exists():
        print(f"  [Rigato] {filename}")
        return rigato
    fallback_file = FALLBACK_DIR / filename
    if fallback_file.exists():
        print(f"  [Fallback] {filename}")
        return fallback_file
    if category == "generi":
        fallback_generi = FALLBACK_DIR / "Generi" / filename
        if fallback_generi.exists():
            print(f"  [Fallback/Generi] {filename}")
            return fallback_generi
    print(f"  [NOT FOUND] {filename}")
    return None


def parse_nexus(filepath: Path) -> dict:
    """Parse a NEXUS file and return taxa, characters, and matrix."""
    text = filepath.read_text(encoding="utf-8", errors="replace")

    # Extract taxa (handles single-quoted multi-word names)
    taxa_match = re.search(
        r"BEGIN TAXA;.*?TAXLABELS\s+(.*?)\s*;",
        text, re.DOTALL | re.IGNORECASE
    )
    taxa = []
    if taxa_match:
        taxa = re.findall(r"'[^']*'|\S+", taxa_match.group(1))
        taxa = [t.strip("'") for t in taxa]

    # Extract character state labels
    charstates_match = re.search(
        r"CHARSTATELABELS\s+(.*?)\s*;",
        text, re.DOTALL | re.IGNORECASE
    )
    characters = []
    if charstates_match:
        raw = charstates_match.group(1)
        entries = re.split(r",\s*(?=\d+\s)", raw.strip())
        for entry in entries:
            entry = entry.strip()
            m = re.match(r"(\d+)\s+(.+)", entry, re.DOTALL)
            if not m:
                continue
            char_num = int(m.group(1))
            rest = m.group(2).strip()
            if "/" in rest:
                name_part, states_part = rest.split("/", 1)
            else:
                name_part = rest
                states_part = ""
            char_name = name_part.strip().strip("'\"")
            states = []
            if states_part.strip():
                state_tokens = re.findall(
                    r"'[^']*'|\"[^\"]*\"|\S+",
                    states_part.strip()
                )
                states = [s.strip("'\"") for s in state_tokens]
            characters.append({
                "num": char_num,
                "name": char_name,
                "states": states,
            })

    # Extract matrix
    matrix_match = re.search(
        r"MATRIX\s*\n(.*?)\s*;",
        text, re.DOTALL | re.IGNORECASE
    )
    matrix = {}
    if matrix_match:
        for line in matrix_match.group(1).strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            # Handle single-quoted taxon names in matrix rows
            if line.startswith("'"):
                quote_end = line.index("'", 1)
                taxon_name = line[1:quote_end]
                state_str = line[quote_end + 1:].strip()
            else:
                parts = line.split(None, 1)
                if len(parts) != 2:
                    continue
                taxon_name = parts[0]
                state_str = parts[1].strip()
            states_list = parse_state_string(state_str)
            matrix[taxon_name] = states_list

    return {"taxa": taxa, "characters": characters, "matrix": matrix}


def parse_state_string(s: str) -> list[list[str]]:
    """Parse a NEXUS matrix row like '001{0 1}?10' into list of state lists."""
    result = []
    i = 0
    while i < len(s):
        if s[i] == "{":
            end = s.index("}", i)
            inner = s[i+1:end].split()
            result.append(inner)
            i = end + 1
        elif s[i] in " \t":
            i += 1
        else:
            result.append([s[i]])
            i += 1
    return result


# Known typos in source NEXUS files (taxon name corrections)
TAXON_TYPO_FIXES = {
    "Creamtogaster": "Crematogaster",
}


def fix_taxon_typos(name: str) -> str:
    """Fix known typos in taxon names from source NEXUS files."""
    for wrong, correct in TAXON_TYPO_FIXES.items():
        if wrong in name:
            name = name.replace(wrong, correct)
    return name


def slugify(name: str) -> str:
    """Convert a taxon name to a URL-friendly slug."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def build_subfamilies(parsed: dict) -> list[dict]:
    """Build subfamilies.json from the sottofamiglie.nex parse result."""
    subfamilies = []
    for taxon in parsed["taxa"]:
        subfamilies.append({
            "id": slugify(taxon),
            "name": taxon,
            "description_it": "",
            "description_en": "",
        })
    return subfamilies


def build_genera_and_characters(subfamily_genera_parses: dict) -> tuple:
    """Build genera.json and characters.json from all genera .nex files."""
    all_genera = []
    all_characters = []
    all_matrix = []
    char_id_counter = 0

    for subfamily_name, parsed in subfamily_genera_parses.items():
        subfamily_id = slugify(subfamily_name)

        char_id_map = {}
        for char_info in parsed["characters"]:
            char_id_counter += 1
            char_id = f"gen-{char_id_counter}"
            char_id_map[char_info["num"]] = char_id

            states = []
            for idx, state_label in enumerate(char_info["states"]):
                states.append({
                    "value": str(idx),
                    "label_it": state_label,
                    "label_en": state_label,
                })

            all_characters.append({
                "id": char_id,
                "name_it": char_info["name"].replace("_", " "),
                "name_en": char_info["name"].replace("_", " "),
                "description_it": "",
                "body_region": "head",
                "difficulty": "medium",
                "display_order": char_id_counter,
                "illustration_url": None,
                "states": states,
                "level": "genus",
                "subfamily_scope": subfamily_id,
            })

        for taxon in parsed["taxa"]:
            genus_id = slugify(taxon)
            all_genera.append({
                "id": genus_id,
                "scientific_name": taxon,
                "subfamily_id": subfamily_id,
                "common_name_it": None,
                "description_it": "",
                "description_en": "",
                "habitat": None,
                "nesting": None,
                "diet": None,
                "species_count_italy": 0,
                "endemic_species_count": 0,
                "distribution_notes": None,
                "distribution_regions": [],
                "diagnostic_characters": None,
                "photo_urls": [],
                "similar_genera": [],
                "references": [],
            })

            if taxon in parsed["matrix"]:
                row = parsed["matrix"][taxon]
                for i, char_info in enumerate(parsed["characters"]):
                    if i < len(row):
                        char_id = char_id_map[char_info["num"]]
                        all_matrix.append({
                            "genus_id": genus_id,
                            "character_id": char_id,
                            "state_values": row[i],
                        })

    return all_genera, all_characters, all_matrix


def normalize_taxon_name(taxon: str, genus_name: str) -> tuple[str, str, str]:
    """Normalize a taxon name, handling annotations like '(Raptiformica)'.

    Returns (scientific_name, species_epithet, annotation_or_empty).
    Taxon may be 'Genus_epithet' or 'Genus epithet (annotation)'.
    """
    # Replace underscores with spaces for uniform handling and fix typos
    name = fix_taxon_typos(taxon.replace("_", " ").strip())
    # Strip any parenthetical annotation: '(Raptiformica)', '(del gruppo Alienus)', etc.
    annotation = ""
    paren_match = re.search(r"\s*\(.*\)\s*$", name)
    if paren_match:
        annotation = paren_match.group(0).strip()
        name = name[:paren_match.start()].strip()
    # Now name should be "Genus epithet" — extract parts
    parts = name.split(None, 1)
    if len(parts) == 2:
        genus_part, epithet = parts
    elif len(parts) == 1:
        genus_part = genus_name
        epithet = parts[0]
    else:
        genus_part = genus_name
        epithet = name
    scientific_name = f"{genus_part} {epithet}"
    return scientific_name, epithet, annotation


def build_species(species_parses: dict) -> list[dict]:
    """Build species.json from all species .nex files."""
    all_species = []
    seen_ids = set()
    for genus_name, parsed in species_parses.items():
        for taxon in parsed["taxa"]:
            scientific_name, species_epithet, annotation = normalize_taxon_name(
                taxon, genus_name
            )
            species_id = slugify(scientific_name)
            # Derive genus_id from the actual taxon genus, not the filename
            actual_genus = scientific_name.split()[0]
            genus_id = slugify(actual_genus)
            # Skip duplicates (shouldn't happen but be safe)
            if species_id in seen_ids:
                print(f"  [WARN] Duplicate species ID: {species_id} from taxon '{taxon}'")
                continue
            seen_ids.add(species_id)
            all_species.append({
                "id": species_id,
                "genus_id": genus_id,
                "scientific_name": scientific_name,
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
            })
    return all_species


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("=== Parsing NEXUS files ===\n")

    # 1. Parse subfamilies
    print("1. Subfamilies:")
    sf_file = find_nex_file("sottofamiglie.nex")
    if not sf_file:
        print("ERROR: sottofamiglie.nex not found!")
        sys.exit(1)
    sf_parsed = parse_nexus(sf_file)
    subfamilies = build_subfamilies(sf_parsed)

    # 2. Parse genera per subfamily
    print("\n2. Genera per subfamily:")
    subfamily_names_in_nex = {
        "Myrmicinae": "generi Myrmicinae.nex",
        "Ponerinae": "generi Ponerinae.nex",
        "Dolichoderinae": "generi Dolichoderinae.nex",
        "Formicinae": "generi Formicinae.nex",
    }

    subfamily_genera_parses = {}
    for sf_name, nex_filename in subfamily_names_in_nex.items():
        nex_file = find_nex_file(nex_filename)
        if nex_file:
            subfamily_genera_parses[sf_name] = parse_nexus(nex_file)

    genera, characters, matrix_entries = build_genera_and_characters(
        subfamily_genera_parses
    )

    # Add single-genus subfamilies that don't have .nex files
    single_genus_map = {
        "Amblyoponinae": "Stigmatomma",
        "Proceratiinae": "Proceratium",
        "Leptanillinae": "Leptanilla",
    }
    for sf_name, genus_name in single_genus_map.items():
        genus_id = slugify(genus_name)
        if not any(g["id"] == genus_id for g in genera):
            genera.append({
                "id": genus_id,
                "scientific_name": genus_name,
                "subfamily_id": slugify(sf_name),
                "common_name_it": None,
                "description_it": "",
                "description_en": "",
                "habitat": None,
                "nesting": None,
                "diet": None,
                "species_count_italy": 0,
                "endemic_species_count": 0,
                "distribution_notes": None,
                "distribution_regions": [],
                "diagnostic_characters": None,
                "photo_urls": [],
                "similar_genera": [],
                "references": [],
            })

    # 3. Parse species per genus
    print("\n3. Species per genus:")
    species_parses = {}
    for species_dir in [SPECIES_DIR_DROPBOX, SPECIES_DIR]:
        if not species_dir.exists():
            continue
        for nex_file in sorted(species_dir.glob("Specie *.nex")):
            genus_name = nex_file.stem.replace("Specie ", "")
            if genus_name not in species_parses:
                print(f"  [{species_dir.parent.name}] {nex_file.name}")
                species_parses[genus_name] = parse_nexus(nex_file)

    species = build_species(species_parses)

    # Update genus species counts
    for genus in genera:
        genus["species_count_italy"] = sum(
            1 for s in species if s["genus_id"] == genus["id"]
        )

    # 4. Write output JSON files
    print(f"\n=== Writing JSON to {DATA_DIR} ===\n")

    outputs = {
        "subfamilies.json": subfamilies,
        "genera.json": genera,
        "species.json": species,
        "characters.json": characters,
        "matrix.json": matrix_entries,
    }
    for filename, data in outputs.items():
        outpath = DATA_DIR / filename
        outpath.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
        print(f"  {filename}: {len(data)} records")

    print("\nDone!")


if __name__ == "__main__":
    main()
