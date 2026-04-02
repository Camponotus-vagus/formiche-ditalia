# Formiche d'Italia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first comprehensive Italian ant species directory with interactive identification key, genus/species catalog, and expert network as a static Astro website.

**Architecture:** Static Astro 5.x site with React islands for interactivity. Python scripts parse NEXUS character matrices and Excel sheets into JSON data files consumed at build time. Four React islands provide client-side interactivity: identification key, language switcher, glossary tooltips, and filter bar.

**Tech Stack:** Astro 5.x, React 19, TypeScript, Tailwind CSS 3.x (stable with @astrojs/tailwind), Python 3.10+ (pyalex, openpyxl, pandas), Vercel hosting.

**Note:** Tailwind CSS 3.x is used instead of 4.x because @astrojs/tailwind does not yet support v4. Migration to v4 can happen when the integration is updated.

**Spec:** `docs/superpowers/specs/2026-04-02-formiche-ditalia-website-design.md`

---

## File Map

### Python Data Pipeline (`scripts/`)

| File | Responsibility |
|------|----------------|
| `scripts/parse_nexus.py` | Parse all `.nex` files → `characters.json`, `matrix.json`, partial `genera.json`, `subfamilies.json`, `species.json` |
| `scripts/parse_excel.py` | Parse Excel schede → enrich genera/species/subfamilies with descriptions |
| `scripts/build_experts.py` | Query OpenAlex API, co-author expansion → `experts.json` |
| `scripts/requirements.txt` | Python dependencies |

### Astro Site (`formiche-ditalia/`)

| File | Responsibility |
|------|----------------|
| `src/types.ts` | TypeScript interfaces for all data schemas (Genus, Species, Character, etc.) |
| `src/i18n/it.json` | Italian UI strings |
| `src/i18n/en.json` | English UI strings |
| `src/i18n/index.ts` | i18n helper: reads lang from localStorage, returns translated strings |
| `src/data/*.json` | Generated JSON data files (not hand-edited) |
| `src/layouts/BaseLayout.astro` | HTML shell: head, nav, footer, SEO meta, hreflang |
| `src/components/GenusCard.astro` | Genus card for listings (photo, name, subfamily badge) |
| `src/components/SpeciesRow.astro` | Species row for genus pages (name, status badge, thumbnail) |
| `src/components/ExpertCard.astro` | Expert card for listings (photo, name, affiliation, region) |
| `src/components/LanguageSwitcher.tsx` | React island: IT/EN toggle, persists in localStorage |
| `src/components/FilterBar.tsx` | React island: search + filter controls for list pages |
| `src/components/GlossaryTooltip.tsx` | React island: hover/tap tooltip with term definition + image |
| `src/components/IdentificationKey.tsx` | React island: multi-access key engine + UI |
| `src/pages/index.astro` | Homepage: 3 entry points |
| `src/pages/identifica.astro` | Identification key page (wraps IdentificationKey island) |
| `src/pages/generi/index.astro` | Browse genera (wraps FilterBar island) |
| `src/pages/generi/[slug].astro` | Individual genus page |
| `src/pages/specie/[slug].astro` | Individual species page |
| `src/pages/esperti/index.astro` | Expert directory (wraps FilterBar island) |
| `src/pages/esperti/[slug].astro` | Individual expert page |
| `src/pages/chi-siamo.astro` | About page |
| `src/pages/come-identificare-le-formiche.astro` | SEO guide page |
| `src/pages/formiche-in-casa.astro` | Pest-control SEO page |
| `src/styles/global.css` | Tailwind base + custom styles |
| `public/images/placeholder-ant.svg` | Fallback image for broken AntWeb URLs |
| `astro.config.mjs` | Astro config with React + Tailwind + sitemap integrations |
| `tailwind.config.mjs` | Tailwind config with custom theme colors |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencies and scripts |

---

## Task 1: NEXUS Parser Script

**Files:**
- Create: `scripts/parse_nexus.py`
- Create: `scripts/requirements.txt`

This is the foundational step. All site data flows from the NEXUS matrices.

- [ ] **Step 1: Create `scripts/requirements.txt`**

```
openpyxl>=3.1.0
pandas>=2.0.0
pyalex>=0.14
semanticscholar>=0.8.0
requests>=2.31.0
```

- [ ] **Step 2: Write the NEXUS parser core**

Create `scripts/parse_nexus.py`. The parser must handle:
- `BEGIN TAXA` block → extract taxon labels
- `BEGIN CHARACTERS` block → extract `CHARSTATELABELS` (character names + state labels)
- `MATRIX` block → extract taxon-to-states mapping
- Polymorphic states: `{0 1}` → `["0", "1"]`
- Missing data: `?` → `["?"]`

The NEXUS files are in two locations (prefer Rigato-corrected):
- Primary: `TESI FORMICHE (Dropbox)/Matrici corrette da Rigato/`
- Fallback: `TESI FORMICHE/`

```python
#!/usr/bin/env python3
"""Parse NEXUS (.nex) files from FormiKey thesis into JSON data files.

Reads character matrices for subfamilies, genera (per subfamily), and species
(per genus). Outputs: subfamilies.json, genera.json, species.json,
characters.json, matrix.json into ../formiche-ditalia/src/data/

Usage:
    python scripts/parse_nexus.py
"""

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

    # Extract taxa
    taxa_match = re.search(
        r"BEGIN TAXA;.*?TAXLABELS\s+(.*?)\s*;",
        text, re.DOTALL | re.IGNORECASE
    )
    taxa = taxa_match.group(1).split() if taxa_match else []

    # Extract character state labels
    charstates_match = re.search(
        r"CHARSTATELABELS\s+(.*?)\s*;",
        text, re.DOTALL | re.IGNORECASE
    )
    characters = []
    if charstates_match:
        raw = charstates_match.group(1)
        # Split on character number boundaries: ", N " or just "N " at start
        # Each entry: "N name / state0 state1 ..."
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
            # Parse states: split by unquoted spaces, respecting 'quoted states'
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
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            taxon_name = parts[0]
            state_str = parts[1].strip()
            # Parse state string character by character
            states_list = parse_state_string(state_str)
            matrix[taxon_name] = states_list

    return {"taxa": taxa, "characters": characters, "matrix": matrix}


def parse_state_string(s: str) -> list[list[str]]:
    """Parse a NEXUS matrix row like '001{0 1}?10' into list of state lists.

    Each position becomes a list:
    - '0' → ['0']
    - '{0 1}' → ['0', '1'] (polymorphic)
    - '?' → ['?'] (missing)
    """
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
    """Build genera.json and characters.json from all genera .nex files.

    Args:
        subfamily_genera_parses: dict mapping subfamily_name -> parsed NEXUS data

    Returns:
        (genera_list, characters_list, matrix_entries)
    """
    all_genera = []
    all_characters = []
    all_matrix = []
    char_id_counter = 0

    for subfamily_name, parsed in subfamily_genera_parses.items():
        subfamily_id = slugify(subfamily_name)

        # Build characters with unique IDs scoped to this level
        char_id_map = {}  # maps (subfamily, char_num) -> char_id
        for char_info in parsed["characters"]:
            char_id_counter += 1
            char_id = f"gen-{char_id_counter}"
            char_id_map[char_info["num"]] = char_id

            states = []
            for idx, state_label in enumerate(char_info["states"]):
                states.append({
                    "value": str(idx),
                    "label_it": state_label,  # will be translated later
                    "label_en": state_label,
                })

            all_characters.append({
                "id": char_id,
                "name_it": char_info["name"].replace("_", " "),
                "name_en": char_info["name"].replace("_", " "),
                "description_it": "",
                "body_region": "head",  # default, to be refined manually
                "difficulty": "medium",
                "display_order": char_id_counter,
                "illustration_url": None,
                "states": states,
                "level": "genus",
                "subfamily_scope": subfamily_id,
            })

        # Build genera
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

            # Build matrix entries for this genus
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


def build_species(species_parses: dict) -> list[dict]:
    """Build species.json from all species .nex files."""
    all_species = []
    for genus_name, parsed in species_parses.items():
        genus_id = slugify(genus_name)
        for taxon in parsed["taxa"]:
            # Species names in .nex files are like "Camponotus_aethiops"
            parts = taxon.split("_", 1)
            species_epithet = parts[1] if len(parts) > 1 else parts[0]
            scientific_name = taxon.replace("_", " ")
            species_id = slugify(scientific_name)
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
    # Note: Amblyoponinae, Leptanillinae, Proceratiinae have 1 genus each
    # and may not have separate genera .nex files

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
            # Extract genus name from filename: "Specie Camponotus.nex" -> "Camponotus"
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
```

- [ ] **Step 3: Run the parser and verify output**

```bash
cd "/Users/francesco.mensa/Downloads/Progetto Formiche d'Italia"
pip install openpyxl pandas
python scripts/parse_nexus.py
```

Expected: JSON files created in `formiche-ditalia/src/data/` with:
- `subfamilies.json`: 7 records
- `genera.json`: ~41 records
- `species.json`: ~75 records
- `characters.json`: populated with character definitions
- `matrix.json`: populated with genus×character state entries

Verify by spot-checking: `python -c "import json; d=json.load(open('formiche-ditalia/src/data/genera.json')); print(len(d), [g['scientific_name'] for g in d[:5]])"`

- [ ] **Step 4: Commit**

```bash
git add scripts/parse_nexus.py scripts/requirements.txt formiche-ditalia/src/data/
git commit -m "feat: add NEXUS parser, generate initial JSON data files"
```

---

## Task 2: Excel Parser Script

**Files:**
- Create: `scripts/parse_excel.py`
- Modify: `formiche-ditalia/src/data/genera.json` (enriched)
- Modify: `formiche-ditalia/src/data/subfamilies.json` (enriched)

The Excel schede files (`Schede generi.xlsx`, `Schede sottofamiglie.xlsx`, `Schede specie.xlsx`) contain Italian descriptions, habitat info, and other details that enrich the NEXUS-derived JSON.

- [ ] **Step 1: Explore the Excel files to understand their structure**

```bash
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('/Users/francesco.mensa/Downloads/Progetto Formiche d\\'Italia/TESI FORMICHE (Dropbox)/Schede formiKEY/Generi/Schede generi.xlsx')
ws = wb.active
print('Columns:', [cell.value for cell in ws[1]])
for row in ws.iter_rows(min_row=2, max_row=4, values_only=True):
    print(row)
"
```

Review the output to understand column names and data structure. Repeat for `Schede sottofamiglie.xlsx` and `Schede specie.xlsx`.

- [ ] **Step 2: Write `scripts/parse_excel.py`**

The script should:
1. Read each Excel file
2. Match rows to existing JSON records by taxon name
3. Merge descriptive fields (description_it, habitat, nesting, diet, diagnostic_characters)
4. Write updated JSON files

```python
#!/usr/bin/env python3
"""Parse Excel 'Schede formiKEY' files to enrich genera/subfamilies/species JSON.

Reads descriptive sheets and merges into existing JSON data files.
Must run AFTER parse_nexus.py.

Usage:
    python scripts/parse_excel.py
"""

import json
import sys
from pathlib import Path

import openpyxl

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "formiche-ditalia" / "src" / "data"
SCHEDE_DIR = PROJECT_ROOT / "TESI FORMICHE (Dropbox)" / "Schede formiKEY"


def load_json(filename: str) -> list[dict]:
    path = DATA_DIR / filename
    if not path.exists():
        print(f"ERROR: {path} not found. Run parse_nexus.py first.")
        sys.exit(1)
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(filename: str, data: list[dict]):
    path = DATA_DIR / filename
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Updated {filename}: {len(data)} records")


def read_excel_rows(filepath: Path) -> list[dict]:
    """Read an Excel file and return list of dicts keyed by header row."""
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(rows[0])]
    result = []
    for row in rows[1:]:
        d = {}
        for i, val in enumerate(row):
            if i < len(headers):
                d[headers[i]] = val
        result.append(d)
    wb.close()
    return result


def slugify(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main():
    print("=== Enriching JSON with Excel data ===\n")

    # Load existing JSON
    genera = load_json("genera.json")
    subfamilies = load_json("subfamilies.json")
    species = load_json("species.json")

    genera_by_id = {g["id"]: g for g in genera}
    sf_by_id = {s["id"]: s for s in subfamilies}
    species_by_id = {s["id"]: s for s in species}

    # Enrich genera
    generi_xlsx = SCHEDE_DIR / "Generi" / "Schede generi.xlsx"
    if generi_xlsx.exists():
        print(f"Reading {generi_xlsx.name}...")
        rows = read_excel_rows(generi_xlsx)
        matched = 0
        for row in rows:
            # Try to match by name — adapt column name based on actual Excel structure
            name = None
            for key in row:
                if "nome" in key.lower() or "genere" in key.lower() or "genus" in key.lower():
                    name = row[key]
                    break
            if not name:
                name = row.get(list(row.keys())[0])  # first column as fallback
            if not name or not isinstance(name, str):
                continue
            gid = slugify(name.strip())
            if gid in genera_by_id:
                g = genera_by_id[gid]
                # Map Excel columns to JSON fields — adapt based on actual column names
                for key, val in row.items():
                    if val is None:
                        continue
                    kl = key.lower()
                    if "descri" in kl and "it" in kl:
                        g["description_it"] = str(val)
                    elif "descri" in kl and "en" in kl:
                        g["description_en"] = str(val)
                    elif "habitat" in kl:
                        g["habitat"] = str(val)
                    elif "nid" in kl or "nest" in kl:
                        g["nesting"] = str(val)
                    elif "diet" in kl or "aliment" in kl:
                        g["diet"] = str(val)
                    elif "diagnost" in kl or "caratter" in kl:
                        g["diagnostic_characters"] = str(val)
                matched += 1
        print(f"  Matched {matched}/{len(rows)} genera rows")
    else:
        print(f"  {generi_xlsx} not found, skipping")

    # Enrich subfamilies
    sf_xlsx = SCHEDE_DIR / "Sottofamiglie" / "Schede sottofamiglie.xlsx"
    if sf_xlsx.exists():
        print(f"\nReading {sf_xlsx.name}...")
        rows = read_excel_rows(sf_xlsx)
        matched = 0
        for row in rows:
            name = None
            for key in row:
                if "nome" in key.lower() or "sottofam" in key.lower() or "subfamily" in key.lower():
                    name = row[key]
                    break
            if not name:
                name = row.get(list(row.keys())[0])
            if not name or not isinstance(name, str):
                continue
            sid = slugify(name.strip())
            if sid in sf_by_id:
                sf = sf_by_id[sid]
                for key, val in row.items():
                    if val is None:
                        continue
                    kl = key.lower()
                    if "descri" in kl and "it" in kl:
                        sf["description_it"] = str(val)
                    elif "descri" in kl and "en" in kl:
                        sf["description_en"] = str(val)
                matched += 1
        print(f"  Matched {matched}/{len(rows)} subfamily rows")

    # Enrich species
    sp_xlsx = SCHEDE_DIR / "Specie" / "Schede specie.xlsx"
    if sp_xlsx.exists():
        print(f"\nReading {sp_xlsx.name}...")
        rows = read_excel_rows(sp_xlsx)
        matched = 0
        for row in rows:
            name = None
            for key in row:
                if "nome" in key.lower() or "specie" in key.lower() or "species" in key.lower():
                    name = row[key]
                    break
            if not name:
                name = row.get(list(row.keys())[0])
            if not name or not isinstance(name, str):
                continue
            sid = slugify(name.strip())
            if sid in species_by_id:
                sp = species_by_id[sid]
                for key, val in row.items():
                    if val is None:
                        continue
                    kl = key.lower()
                    if "habitat" in kl:
                        sp["habitat_notes"] = str(val)
                    elif "sinon" in kl or "synon" in kl:
                        if isinstance(val, str) and val.strip():
                            sp["synonyms"] = [s.strip() for s in val.split(",")]
                matched += 1
        print(f"  Matched {matched}/{len(rows)} species rows")

    # Save
    print("\n=== Saving enriched JSON ===")
    save_json("genera.json", genera)
    save_json("subfamilies.json", subfamilies)
    save_json("species.json", species)
    print("\nDone!")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the Excel parser**

```bash
python scripts/parse_excel.py
```

Expected: JSON files updated with enriched descriptions. Script reports how many records were matched.

- [ ] **Step 4: Manually review enriched data**

```bash
python3 -c "
import json
genera = json.load(open('formiche-ditalia/src/data/genera.json'))
for g in genera[:3]:
    print(g['scientific_name'], '->', g.get('description_it', '')[:80])
"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/parse_excel.py formiche-ditalia/src/data/
git commit -m "feat: add Excel parser, enrich genera/subfamilies/species descriptions"
```

---

## Task 3: Astro Project Setup

**Files:**
- Create: `formiche-ditalia/package.json`
- Create: `formiche-ditalia/astro.config.mjs`
- Create: `formiche-ditalia/tailwind.config.mjs`
- Create: `formiche-ditalia/tsconfig.json`
- Create: `formiche-ditalia/src/types.ts`
- Create: `formiche-ditalia/src/styles/global.css`
- Create: `formiche-ditalia/src/i18n/it.json`
- Create: `formiche-ditalia/src/i18n/en.json`
- Create: `formiche-ditalia/src/i18n/index.ts`
- Create: `formiche-ditalia/public/images/placeholder-ant.svg`

- [ ] **Step 0: Ensure git repo exists**

The project directory already has a git repo initialized with the spec and CLAUDE.md. Verify:

```bash
cd "/Users/francesco.mensa/Downloads/Progetto Formiche d'Italia"
git status
```

If not initialized: `git init`.

- [ ] **Step 1: Initialize the Astro project**

```bash
cd "/Users/francesco.mensa/Downloads/Progetto Formiche d'Italia"
mkdir -p formiche-ditalia
cd formiche-ditalia
npm create astro@latest -- --template minimal --no-install --no-git .
npm install
npm install @astrojs/react @astrojs/tailwind @astrojs/sitemap react react-dom
npm install -D @types/react @types/react-dom tailwindcss@3
```

Note: `tailwindcss@3` is pinned for compatibility with `@astrojs/tailwind`.

- [ ] **Step 2: Create `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://formicheditalia.it',
  integrations: [react(), tailwind(), sitemap()],
  output: 'static',
});
```

- [ ] **Step 3: Create `tailwind.config.mjs`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#f9edd9',
          200: '#f2d7ad',
          300: '#e9b97a',
          400: '#df9545',
          500: '#d67a28',
          600: '#c4601e',
          700: '#a3481b',
          800: '#843a1d',
          900: '#6c311b',
        },
        forest: {
          50: '#f0f7f0',
          100: '#dceddc',
          200: '#bbdcbc',
          300: '#8ec490',
          400: '#5ea762',
          500: '#3d8b41',
          600: '#2d6f32',
          700: '#265a2a',
          800: '#214824',
          900: '#1c3b1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@data/*": ["src/data/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

- [ ] **Step 5: Create `src/types.ts`**

```typescript
export interface Subfamily {
  id: string;
  name: string;
  description_it: string;
  description_en: string;
}

export interface Genus {
  id: string;
  scientific_name: string;
  subfamily_id: string;
  common_name_it: string | null;
  description_it: string;
  description_en: string;
  habitat: string | null;
  nesting: string | null;
  diet: string | null;
  species_count_italy: number;
  endemic_species_count: number;
  distribution_notes: string | null;
  distribution_regions: string[];
  diagnostic_characters: string | null;
  photo_urls: string[];
  similar_genera: string[];
  references: string[];
}

export interface Species {
  id: string;
  genus_id: string;
  scientific_name: string;
  author_year: string | null;
  status: 'native' | 'exotic' | 'endemic';
  subspecies: string[];
  distribution_regions: string[];
  altitude_range: string | null;
  habitat_notes: string | null;
  photo_urls: string[];
  synonyms: string[];
  antweb_url: string | null;
  antcat_url: string | null;
  gbif_id: string | null;
}

export interface CharacterState {
  value: string;
  label_it: string;
  label_en: string;
  illustration_url: string | null;
}

export interface Character {
  id: string;
  name_it: string;
  name_en: string;
  description_it: string;
  body_region: 'head' | 'thorax' | 'petiole' | 'gaster' | 'legs' | 'antennae';
  difficulty: 'easy' | 'medium' | 'hard';
  display_order: number;
  illustration_url: string | null;
  states: CharacterState[];
  level: 'subfamily' | 'genus';
  subfamily_scope: string;
}

export interface MatrixEntry {
  genus_id: string;
  character_id: string;
  state_values: string[];
}

export interface Expert {
  id: string;
  name: string;
  affiliation: string | null;
  role: string | null;
  email: string | null;
  website: string | null;
  orcid: string | null;
  region: string | null;
  specializations: string[];
  genera_of_interest: string[];
  key_publications: string[];
  bio_it: string | null;
  bio_en: string | null;
  profile_photo_url: string | null;
  h_index: number | null;
  claimed: boolean;
}
```

- [ ] **Step 6: Create `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply text-gray-800 bg-white antialiased;
  }

  h1, h2, h3, h4 {
    @apply font-display;
  }

  .scientific-name {
    @apply italic;
  }
}
```

- [ ] **Step 7: Create i18n files**

Create `src/i18n/it.json`:
```json
{
  "site_title": "Formiche d'Italia",
  "site_description": "La guida italiana alla mirmecologia — identificazione, catalogo specie e rete di esperti",
  "nav_home": "Home",
  "nav_identify": "Identifica",
  "nav_genera": "Generi",
  "nav_experts": "Esperti",
  "nav_about": "Chi siamo",
  "hero_title": "Formiche d'Italia",
  "hero_subtitle": "La prima guida completa alle formiche italiane",
  "hero_identify": "Identifica",
  "hero_browse": "Esplora",
  "hero_experts": "Esperti",
  "identify_title": "Chiave di identificazione",
  "identify_select_region": "Seleziona la tua regione",
  "identify_reset": "Ricomincia",
  "identify_undo": "Annulla",
  "identify_no_results": "Nessun genere corrisponde ai caratteri selezionati. Prova a rimuovere l'ultima selezione o ad aumentare la tolleranza.",
  "identify_matches": "generi corrispondenti",
  "identify_best_next": "Carattere consigliato",
  "identify_tolerance": "Tolleranza errori",
  "genera_title": "Generi di formiche italiane",
  "genera_filter_subfamily": "Filtra per sottofamiglia",
  "genera_search": "Cerca un genere...",
  "genera_species_count": "specie in Italia",
  "species_title": "Specie",
  "species_status_native": "Nativa",
  "species_status_exotic": "Esotica",
  "species_status_endemic": "Endemica",
  "experts_title": "Esperti di mirmecologia italiana",
  "experts_search": "Cerca un esperto...",
  "experts_filter_region": "Regione",
  "experts_filter_specialization": "Specializzazione",
  "experts_claim": "Rivendica il tuo profilo",
  "experts_verified": "Verificato",
  "footer_credits": "Un progetto di Francesco Mensa — MUSE, Trento",
  "footer_data_credits": "Immagini: AntWeb.org (CC BY-SA 3.0). Dati tassonomici: Schifani 2022.",
  "about_title": "Chi siamo",
  "lang_switch": "English"
}
```

Create `src/i18n/en.json`:
```json
{
  "site_title": "Ants of Italy",
  "site_description": "The Italian guide to myrmecology — identification, species catalog and expert network",
  "nav_home": "Home",
  "nav_identify": "Identify",
  "nav_genera": "Genera",
  "nav_experts": "Experts",
  "nav_about": "About",
  "hero_title": "Ants of Italy",
  "hero_subtitle": "The first comprehensive guide to Italian ants",
  "hero_identify": "Identify",
  "hero_browse": "Browse",
  "hero_experts": "Experts",
  "identify_title": "Identification Key",
  "identify_select_region": "Select your region",
  "identify_reset": "Reset",
  "identify_undo": "Undo",
  "identify_no_results": "No genera match the selected characters. Try removing the last selection or increasing the tolerance.",
  "identify_matches": "matching genera",
  "identify_best_next": "Suggested character",
  "identify_tolerance": "Error tolerance",
  "genera_title": "Italian ant genera",
  "genera_filter_subfamily": "Filter by subfamily",
  "genera_search": "Search genus...",
  "genera_species_count": "species in Italy",
  "species_title": "Species",
  "species_status_native": "Native",
  "species_status_exotic": "Exotic",
  "species_status_endemic": "Endemic",
  "experts_title": "Italian myrmecology experts",
  "experts_search": "Search expert...",
  "experts_filter_region": "Region",
  "experts_filter_specialization": "Specialization",
  "experts_claim": "Claim your profile",
  "experts_verified": "Verified",
  "footer_credits": "A project by Francesco Mensa — MUSE, Trento",
  "footer_data_credits": "Images: AntWeb.org (CC BY-SA 3.0). Taxonomic data: Schifani 2022.",
  "about_title": "About",
  "lang_switch": "Italiano"
}
```

Create `src/i18n/index.ts`:
```typescript
import it from './it.json';
import en from './en.json';

export type Lang = 'it' | 'en';
export type TranslationKey = keyof typeof it;

const translations: Record<Lang, Record<string, string>> = { it, en };

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'it';
  return (localStorage.getItem('lang') as Lang) || 'it';
}

export function setLang(lang: Lang): void {
  localStorage.setItem('lang', lang);
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

export function t(key: TranslationKey, lang?: Lang): string {
  const l = lang || getLang();
  return translations[l]?.[key] || translations.it[key] || key;
}

export function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang?: Lang,
): string {
  const l = lang || getLang();
  const localized = obj[`${field}_${l}`];
  if (typeof localized === 'string' && localized) return localized;
  const fallback = obj[`${field}_it`];
  return typeof fallback === 'string' ? fallback : '';
}
```

- [ ] **Step 8: Create placeholder SVG**

Create `public/images/placeholder-ant.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <rect width="200" height="200" rx="8" fill="#f3f4f6"/>
  <text x="100" y="105" text-anchor="middle" font-family="system-ui" font-size="14" fill="#9ca3af">Immagine non disponibile</text>
</svg>
```

- [ ] **Step 9: Verify the project builds**

```bash
cd formiche-ditalia
npm run dev
```

Expected: Astro dev server starts on `localhost:4321`. Stop it with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add formiche-ditalia/
git commit -m "feat: scaffold Astro project with Tailwind, React, i18n, types"
```

---

## Task 4: BaseLayout and Navigation

**Files:**
- Create: `formiche-ditalia/src/layouts/BaseLayout.astro`
- Create: `formiche-ditalia/src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
interface Props {
  title: string;
  description?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
}

const { title, description, canonicalUrl, structuredData } = Astro.props;
const siteTitle = "Formiche d'Italia";
const fullTitle = title === siteTitle ? title : `${title} — ${siteTitle}`;
const metaDescription = description || "La guida italiana alla mirmecologia — identificazione, catalogo specie e rete di esperti";
const currentUrl = canonicalUrl || Astro.url.href;

import '../styles/global.css';
import LanguageSwitcher from '../components/LanguageSwitcher.tsx';
---

<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{fullTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={currentUrl} />
  <link rel="alternate" hreflang="it" href={currentUrl} />
  <link rel="alternate" hreflang="en" href={`${currentUrl}${currentUrl.includes('?') ? '&' : '?'}lang=en`} />
  {structuredData && (
    <script type="application/ld+json" set:html={JSON.stringify(structuredData)} />
  )}
</head>
<body class="min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a href="/" class="font-display text-xl font-bold text-forest-700 hover:text-forest-600 transition-colors">
        Formiche d'Italia
      </a>
      <div class="hidden sm:flex items-center gap-6">
        <a href="/identifica" class="text-sm font-medium text-gray-600 hover:text-forest-600 transition-colors" data-i18n="nav_identify">Identifica</a>
        <a href="/generi" class="text-sm font-medium text-gray-600 hover:text-forest-600 transition-colors" data-i18n="nav_genera">Generi</a>
        <a href="/esperti" class="text-sm font-medium text-gray-600 hover:text-forest-600 transition-colors" data-i18n="nav_experts">Esperti</a>
        <a href="/chi-siamo" class="text-sm font-medium text-gray-600 hover:text-forest-600 transition-colors" data-i18n="nav_about">Chi siamo</a>
        <LanguageSwitcher client:load />
      </div>
      <!-- Mobile hamburger -->
      <button id="mobile-menu-btn" class="sm:hidden p-2" aria-label="Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </nav>
  </header>
  <!-- Mobile menu (hidden by default) -->
  <div id="mobile-menu" class="sm:hidden hidden border-b border-gray-200 bg-white">
    <div class="px-4 py-3 space-y-2">
      <a href="/identifica" class="block text-sm font-medium text-gray-600 py-2">Identifica</a>
      <a href="/generi" class="block text-sm font-medium text-gray-600 py-2">Generi</a>
      <a href="/esperti" class="block text-sm font-medium text-gray-600 py-2">Esperti</a>
      <a href="/chi-siamo" class="block text-sm font-medium text-gray-600 py-2">Chi siamo</a>
    </div>
  </div>
  <script>
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
  </script>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="bg-gray-50 border-t border-gray-200 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p class="text-sm text-gray-500" data-i18n="footer_credits">Un progetto di Francesco Mensa — MUSE, Trento</p>
      <p class="text-xs text-gray-400 mt-1" data-i18n="footer_data_credits">Immagini: AntWeb.org (CC BY-SA 3.0). Dati tassonomici: Schifani 2022.</p>
    </div>
  </footer>
</body>
</html>
```

- [ ] **Step 2: Create `src/components/LanguageSwitcher.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { getLang, setLang, type Lang } from '../i18n';

export default function LanguageSwitcher() {
  const [lang, setCurrentLang] = useState<Lang>('it');

  useEffect(() => {
    setCurrentLang(getLang());
  }, []);

  const toggle = () => {
    const newLang: Lang = lang === 'it' ? 'en' : 'it';
    setLang(newLang);
    setCurrentLang(newLang);
    // Update all data-i18n elements on the page
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        import('../i18n').then(({ t }) => {
          el.textContent = t(key as any, newLang);
        });
      }
    });
  };

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-gray-500 hover:text-forest-600 transition-colors px-2 py-1 rounded border border-gray-300 hover:border-forest-400"
      aria-label={lang === 'it' ? 'Switch to English' : 'Passa all\'italiano'}
    >
      {lang === 'it' ? 'EN' : 'IT'}
    </button>
  );
}
```

- [ ] **Step 3: Verify layout renders**

```bash
cd formiche-ditalia && npm run dev
```

Visit `localhost:4321`. The nav bar should render with links and language switcher. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add formiche-ditalia/src/layouts/ formiche-ditalia/src/components/LanguageSwitcher.tsx
git commit -m "feat: add BaseLayout with nav, footer, SEO meta, language switcher"
```

---

## Task 5: Homepage

**Files:**
- Create: `formiche-ditalia/src/pages/index.astro`

- [ ] **Step 1: Create the homepage**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Formiche d'Italia">
  <section class="relative overflow-hidden bg-gradient-to-br from-forest-50 to-brand-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-forest-900 tracking-tight" data-i18n="hero_title">
        Formiche d'Italia
      </h1>
      <p class="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl" data-i18n="hero_subtitle">
        La prima guida completa alle formiche italiane
      </p>
      <div class="mt-10 flex flex-col sm:flex-row gap-4">
        <a href="/identifica" class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-forest-600 text-white font-semibold hover:bg-forest-700 transition-colors shadow-lg hover:shadow-xl">
          <span data-i18n="hero_identify">Identifica</span>
          <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </a>
        <a href="/generi" class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-forest-700 font-semibold border-2 border-forest-200 hover:border-forest-400 transition-colors">
          <span data-i18n="hero_browse">Esplora</span>
        </a>
        <a href="/esperti" class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-brand-700 font-semibold border-2 border-brand-200 hover:border-brand-400 transition-colors">
          <span data-i18n="hero_experts">Esperti</span>
        </a>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-6">
        <div class="text-4xl font-bold text-forest-600">7</div>
        <div class="text-sm text-gray-500 mt-1">Sottofamiglie</div>
      </div>
      <div class="text-center p-6">
        <div class="text-4xl font-bold text-forest-600">41</div>
        <div class="text-sm text-gray-500 mt-1">Generi</div>
      </div>
      <div class="text-center p-6">
        <div class="text-4xl font-bold text-forest-600">75+</div>
        <div class="text-sm text-gray-500 mt-1">Specie</div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify homepage renders**

```bash
cd formiche-ditalia && npm run dev
```

Visit `localhost:4321`. Homepage should show hero section with 3 CTA buttons and stats.

- [ ] **Step 3: Commit**

```bash
git add formiche-ditalia/src/pages/index.astro
git commit -m "feat: add homepage with hero section and entry points"
```

---

## Task 6: GenusCard, SpeciesRow, ExpertCard Components

**Files:**
- Create: `formiche-ditalia/src/components/GenusCard.astro`
- Create: `formiche-ditalia/src/components/SpeciesRow.astro`
- Create: `formiche-ditalia/src/components/ExpertCard.astro`

- [ ] **Step 1: Create `src/components/GenusCard.astro`**

```astro
---
import type { Genus } from '../types';
interface Props {
  genus: Genus;
}
const { genus } = Astro.props;
const photoUrl = genus.photo_urls[0] || '/images/placeholder-ant.svg';
---

<a href={`/generi/${genus.id}`} class="group block rounded-xl overflow-hidden border border-gray-200 hover:border-forest-400 hover:shadow-lg transition-all duration-200">
  <div class="aspect-[4/3] overflow-hidden bg-gray-100">
    <img
      src={photoUrl}
      alt={`${genus.scientific_name} — formica italiana`}
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
      onerror="this.src='/images/placeholder-ant.svg'"
    />
  </div>
  <div class="p-4">
    <h3 class="font-display text-lg font-semibold scientific-name text-gray-900 group-hover:text-forest-600 transition-colors">
      {genus.scientific_name}
    </h3>
    <p class="text-sm text-gray-500 mt-1">
      {genus.subfamily_id.charAt(0).toUpperCase() + genus.subfamily_id.slice(1)}
    </p>
    {genus.species_count_italy > 0 && (
      <p class="text-xs text-forest-600 mt-2">
        {genus.species_count_italy} <span data-i18n="genera_species_count">specie in Italia</span>
      </p>
    )}
  </div>
</a>
```

- [ ] **Step 2: Create `src/components/SpeciesRow.astro`**

```astro
---
import type { Species } from '../types';
interface Props {
  species: Species;
}
const { species } = Astro.props;

const statusColors: Record<string, string> = {
  native: 'bg-forest-100 text-forest-700',
  exotic: 'bg-red-100 text-red-700',
  endemic: 'bg-brand-100 text-brand-700',
};
const statusLabels: Record<string, string> = {
  native: 'Nativa',
  exotic: 'Esotica',
  endemic: 'Endemica',
};
---

<a href={`/specie/${species.id}`} class="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
  {species.photo_urls[0] ? (
    <img
      src={species.photo_urls[0]}
      alt={species.scientific_name}
      class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      loading="lazy"
      onerror="this.src='/images/placeholder-ant.svg'"
    />
  ) : (
    <div class="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
  )}
  <div class="flex-1 min-w-0">
    <span class="scientific-name text-gray-900 group-hover:text-forest-600 transition-colors">
      {species.scientific_name}
    </span>
    {species.author_year && (
      <span class="text-sm text-gray-400 ml-2">{species.author_year}</span>
    )}
  </div>
  <span class={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[species.status] || ''}`}>
    {statusLabels[species.status] || species.status}
  </span>
</a>
```

- [ ] **Step 3: Create `src/components/ExpertCard.astro`**

```astro
---
import type { Expert } from '../types';
interface Props {
  expert: Expert;
}
const { expert } = Astro.props;
---

<a href={`/esperti/${expert.id}`} class="group block rounded-xl overflow-hidden border border-gray-200 hover:border-brand-400 hover:shadow-lg transition-all duration-200 p-5">
  <div class="flex items-start gap-4">
    {expert.profile_photo_url ? (
      <img
        src={expert.profile_photo_url}
        alt={expert.name}
        class="w-14 h-14 rounded-full object-cover flex-shrink-0"
        loading="lazy"
      />
    ) : (
      <div class="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <span class="text-brand-600 font-semibold text-lg">
          {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </span>
      </div>
    )}
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
          {expert.name}
        </h3>
        {expert.claimed && (
          <span class="text-xs bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full" data-i18n="experts_verified">Verificato</span>
        )}
      </div>
      {expert.affiliation && (
        <p class="text-sm text-gray-500 truncate">{expert.affiliation}</p>
      )}
      {expert.region && (
        <p class="text-xs text-gray-400 mt-1">{expert.region}</p>
      )}
    </div>
  </div>
  {expert.specializations && expert.specializations.length > 0 && (
    <div class="flex flex-wrap gap-1 mt-3">
      {expert.specializations.slice(0, 3).map(spec => (
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{spec}</span>
      ))}
    </div>
  )}
</a>
```

- [ ] **Step 4: Commit**

```bash
git add formiche-ditalia/src/components/GenusCard.astro formiche-ditalia/src/components/SpeciesRow.astro formiche-ditalia/src/components/ExpertCard.astro
git commit -m "feat: add GenusCard, SpeciesRow, ExpertCard components"
```

---

## Task 7: FilterBar Component

**Files:**
- Create: `formiche-ditalia/src/components/FilterBar.tsx`

- [ ] **Step 1: Create the FilterBar React island**

```tsx
import { useState, useMemo, useEffect, type ReactNode } from 'react';

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props<T> {
  items: T[];
  filters: FilterConfig[];
  searchField: keyof T;
  searchPlaceholder: string;
  renderItem: (item: T) => ReactNode;
  getFilterValue: (item: T, filterKey: string) => string | string[];
}

export default function FilterBar<T extends { id: string }>({
  items,
  filters,
  searchField,
  searchPlaceholder,
  renderItem,
  getFilterValue,
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (search) {
        const fieldVal = String(item[searchField] || '').toLowerCase();
        if (!fieldVal.includes(search.toLowerCase())) return false;
      }
      // Filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (!value) continue;
        const itemVal = getFilterValue(item, key);
        if (Array.isArray(itemVal)) {
          if (!itemVal.includes(value)) return false;
        } else {
          if (itemVal !== value) return false;
        }
      }
      return true;
    });
  }, [items, search, activeFilters, searchField, getFilterValue]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
        />
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] || ''}
            onChange={(e) =>
              setActiveFilters((prev) => ({ ...prev, [filter.key]: e.target.value }))
            }
            className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm bg-white"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} risultati
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          Nessun risultato trovato.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add formiche-ditalia/src/components/FilterBar.tsx
git commit -m "feat: add FilterBar component with search and multi-filter support"
```

---

## Task 8: Genera Pages (Index + Detail)

**Files:**
- Create: `formiche-ditalia/src/pages/generi/index.astro`
- Create: `formiche-ditalia/src/pages/generi/[slug].astro`

- [ ] **Step 1: Create genera index page**

Create `src/pages/generi/index.astro` — imports `genera.json` and `subfamilies.json`, renders a FilterBar island with GenusCard rendering. The FilterBar needs to be wrapped in a client-side wrapper since it renders Astro components; instead, use a simpler approach: render all genus cards in Astro and use the FilterBar for the controls only, or create a self-contained React genera browser.

For simplicity, create a dedicated `GeneraBrowser.tsx` React island that contains both filtering logic and card rendering:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import genera from '../../data/genera.json';
import subfamilies from '../../data/subfamilies.json';

const pageTitle = "Generi di formiche italiane";
---

<BaseLayout title={pageTitle} description="Esplora tutti i generi di formiche presenti in Italia, organizzati per sottofamiglia.">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="font-display text-3xl font-bold text-gray-900 mb-8" data-i18n="genera_title">{pageTitle}</h1>

    <div id="genera-browser">
      <!-- FilterBar island will go here once the React wrapper is created -->
      <!-- For now, render all genera statically -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {genera.map((genus: any) => (
          <a href={`/generi/${genus.id}`} class="group block rounded-xl overflow-hidden border border-gray-200 hover:border-forest-400 hover:shadow-lg transition-all duration-200">
            <div class="aspect-[4/3] overflow-hidden bg-gray-100">
              <img
                src={genus.photo_urls?.[0] || '/images/placeholder-ant.svg'}
                alt={`${genus.scientific_name} — formica italiana`}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div class="p-4">
              <h3 class="font-display text-lg font-semibold italic text-gray-900 group-hover:text-forest-600 transition-colors">
                {genus.scientific_name}
              </h3>
              <p class="text-sm text-gray-500 mt-1 capitalize">{genus.subfamily_id}</p>
              {genus.species_count_italy > 0 && (
                <p class="text-xs text-forest-600 mt-2">{genus.species_count_italy} specie in Italia</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  </div>
</BaseLayout>
```

Note: For MVP, the genera index uses static Astro rendering with all cards visible. A dedicated `GeneraBrowser.tsx` React island should be created to add client-side filtering by subfamily and search. This island receives `genera` and `subfamilies` as JSON props and renders its own card grid internally (since Astro components cannot be rendered inside React islands). Same pattern applies to the experts index with `ExpertsBrowser.tsx`.

- [ ] **Step 2: Create genus detail page**

Create `src/pages/generi/[slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SpeciesRow from '../../components/SpeciesRow.astro';
import type { Genus, Species, Subfamily } from '../../types';

import generaData from '../../data/genera.json';
import speciesData from '../../data/species.json';
import subfamiliesData from '../../data/subfamilies.json';

export function getStaticPaths() {
  const genera = generaData as Genus[];
  return genera.map((genus) => ({
    params: { slug: genus.id },
    props: { genus },
  }));
}

const { genus } = Astro.props as { genus: Genus };
const species = (speciesData as Species[]).filter(s => s.genus_id === genus.id);
const subfamily = (subfamiliesData as Subfamily[]).find(s => s.id === genus.subfamily_id);

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Taxon",
  name: genus.scientific_name,
  taxonRank: "genus",
  parentTaxon: {
    "@type": "Taxon",
    name: subfamily?.name || genus.subfamily_id,
    taxonRank: "subfamily",
  },
};
---

<BaseLayout
  title={genus.scientific_name}
  description={genus.description_it || `${genus.scientific_name} — genere di formiche italiane della sottofamiglia ${subfamily?.name || genus.subfamily_id}`}
  structuredData={structuredData}
>
  <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <nav class="text-sm text-gray-500 mb-6">
      <a href="/generi" class="hover:text-forest-600">Generi</a>
      <span class="mx-2">/</span>
      <span class="capitalize">{genus.subfamily_id}</span>
      <span class="mx-2">/</span>
      <span class="scientific-name">{genus.scientific_name}</span>
    </nav>

    <header class="mb-8">
      <h1 class="font-display text-4xl font-bold scientific-name text-gray-900">
        {genus.scientific_name}
      </h1>
      {genus.common_name_it && (
        <p class="text-lg text-gray-500 mt-1">{genus.common_name_it}</p>
      )}
      <p class="text-sm text-forest-600 mt-2 capitalize">
        Sottofamiglia {subfamily?.name || genus.subfamily_id}
      </p>
    </header>

    {genus.photo_urls.length > 0 && (
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {genus.photo_urls.slice(0, 4).map((url) => (
          <img
            src={url}
            alt={`${genus.scientific_name} specimen`}
            class="rounded-lg w-full aspect-square object-cover"
            loading="lazy"
            onerror="this.src='/images/placeholder-ant.svg'"
          />
        ))}
      </div>
    )}

    {genus.description_it && (
      <section class="prose prose-gray max-w-none mb-8">
        <h2 class="font-display text-xl font-semibold">Descrizione</h2>
        <p>{genus.description_it}</p>
      </section>
    )}

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {genus.habitat && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Habitat</h3>
          <p class="text-gray-700">{genus.habitat}</p>
        </div>
      )}
      {genus.nesting && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Nidificazione</h3>
          <p class="text-gray-700">{genus.nesting}</p>
        </div>
      )}
      {genus.diet && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Alimentazione</h3>
          <p class="text-gray-700">{genus.diet}</p>
        </div>
      )}
      {genus.diagnostic_characters && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Caratteri diagnostici</h3>
          <p class="text-gray-700">{genus.diagnostic_characters}</p>
        </div>
      )}
    </div>

    {species.length > 0 && (
      <section class="mb-8">
        <h2 class="font-display text-xl font-semibold mb-4">
          Specie in Italia ({species.length})
        </h2>
        <div class="divide-y divide-gray-100">
          {species.map((sp) => (
            <SpeciesRow species={sp} />
          ))}
        </div>
      </section>
    )}

    {genus.similar_genera && genus.similar_genera.length > 0 && (
      <section>
        <h2 class="font-display text-xl font-semibold mb-4">Generi simili</h2>
        <div class="flex flex-wrap gap-2">
          {genus.similar_genera.map(g => (
            <a href={`/generi/${g}`} class="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-forest-100 hover:text-forest-700 transition-colors italic">
              {g}
            </a>
          ))}
        </div>
      </section>
    )}
  </article>
</BaseLayout>
```

- [ ] **Step 3: Verify genera pages build**

```bash
cd formiche-ditalia && npm run build
```

Expected: Build succeeds, generating ~41 genus pages at `/generi/[slug]`.

- [ ] **Step 4: Commit**

```bash
git add formiche-ditalia/src/pages/generi/
git commit -m "feat: add genera index and detail pages with species list"
```

---

## Task 9: Species Detail Pages

**Files:**
- Create: `formiche-ditalia/src/pages/specie/[slug].astro`

- [ ] **Step 1: Create species detail page**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import type { Species, Genus } from '../../types';

import speciesData from '../../data/species.json';
import generaData from '../../data/genera.json';

export function getStaticPaths() {
  const species = speciesData as Species[];
  return species.map((sp) => ({
    params: { slug: sp.id },
    props: { species: sp },
  }));
}

const { species } = Astro.props as { species: Species };
const genus = (generaData as Genus[]).find(g => g.id === species.genus_id);

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Taxon",
  name: species.scientific_name,
  taxonRank: "species",
  parentTaxon: genus ? {
    "@type": "Taxon",
    name: genus.scientific_name,
    taxonRank: "genus",
  } : undefined,
};
---

<BaseLayout
  title={species.scientific_name}
  description={`${species.scientific_name} — specie di formica italiana del genere ${genus?.scientific_name || species.genus_id}`}
  structuredData={structuredData}
>
  <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <nav class="text-sm text-gray-500 mb-6">
      <a href="/generi" class="hover:text-forest-600">Generi</a>
      <span class="mx-2">/</span>
      <a href={`/generi/${species.genus_id}`} class="hover:text-forest-600 italic">{genus?.scientific_name || species.genus_id}</a>
      <span class="mx-2">/</span>
      <span class="scientific-name">{species.scientific_name}</span>
    </nav>

    <header class="mb-8">
      <h1 class="font-display text-4xl font-bold scientific-name text-gray-900">
        {species.scientific_name}
      </h1>
      {species.author_year && (
        <p class="text-gray-500 mt-1">{species.author_year}</p>
      )}
      <div class="flex items-center gap-3 mt-3">
        <span class={`text-sm px-3 py-1 rounded-full font-medium ${
          species.status === 'endemic' ? 'bg-brand-100 text-brand-700' :
          species.status === 'exotic' ? 'bg-red-100 text-red-700' :
          'bg-forest-100 text-forest-700'
        }`}>
          {species.status === 'native' ? 'Nativa' : species.status === 'exotic' ? 'Esotica' : 'Endemica'}
        </span>
      </div>
    </header>

    {species.photo_urls.length > 0 && (
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {species.photo_urls.slice(0, 4).map((url) => (
          <img src={url} alt={`${species.scientific_name} specimen`} class="rounded-lg w-full aspect-square object-cover" loading="lazy" onerror="this.src='/images/placeholder-ant.svg'" />
        ))}
      </div>
    )}

    {species.synonyms && species.synonyms.length > 0 && (
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Sinonimi</h2>
        <p class="text-gray-700 italic">{species.synonyms.join(', ')}</p>
      </section>
    )}

    {species.habitat_notes && (
      <section class="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Habitat</h2>
        <p class="text-gray-700">{species.habitat_notes}</p>
      </section>
    )}

    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Link esterni</h2>
      <div class="flex flex-wrap gap-3">
        {species.antweb_url && (
          <a href={species.antweb_url} target="_blank" rel="noopener noreferrer" class="text-sm text-forest-600 hover:text-forest-800 underline">AntWeb</a>
        )}
        {species.antcat_url && (
          <a href={species.antcat_url} target="_blank" rel="noopener noreferrer" class="text-sm text-forest-600 hover:text-forest-800 underline">AntCat</a>
        )}
        {species.gbif_id && (
          <a href={`https://www.gbif.org/species/${species.gbif_id}`} target="_blank" rel="noopener noreferrer" class="text-sm text-forest-600 hover:text-forest-800 underline">GBIF</a>
        )}
      </div>
    </section>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Verify species pages build**

```bash
cd formiche-ditalia && npm run build
```

Expected: Build succeeds, generating ~75 species pages.

- [ ] **Step 3: Commit**

```bash
git add formiche-ditalia/src/pages/specie/
git commit -m "feat: add species detail pages with synonyms and external links"
```

---

## Task 10: Expert Directory Pages

**Files:**
- Create: `formiche-ditalia/src/pages/esperti/index.astro`
- Create: `formiche-ditalia/src/pages/esperti/[slug].astro`
- Create: `scripts/build_experts.py`

- [ ] **Step 1: Create a minimal `experts.json` seed file**

Create `formiche-ditalia/src/data/experts.json` with the 10 known researchers:

```json
[
  {"id":"enrico-schifani","name":"Enrico Schifani","affiliation":"Universit\u00e0 di Parma","role":"Researcher","email":null,"website":null,"orcid":null,"region":"Emilia-Romagna","specializations":["taxonomy","checklist","biodiversity"],"genera_of_interest":[],"key_publications":["Checklist of the Italian Fauna - Formicidae (2022)"],"bio_it":"Autore della checklist 2022 delle formiche italiane.","bio_en":"Author of the 2022 Italian ant checklist.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"donato-andrea-grasso","name":"Donato Andrea Grasso","affiliation":"Universit\u00e0 di Parma","role":"Professor","email":null,"website":null,"orcid":null,"region":"Emilia-Romagna","specializations":["myrmecology","behavior","ecology"],"genera_of_interest":["Formica","Polyergus"],"key_publications":[],"bio_it":"Direttore del laboratorio di mirmecologia, Universit\u00e0 di Parma.","bio_en":"Director of the myrmecology lab, University of Parma.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"antonio-scupola","name":"Antonio Scupola","affiliation":"Museo di Storia Naturale di Verona","role":"Curator","email":null,"website":null,"orcid":null,"region":"Veneto","specializations":["taxonomy","regional fauna"],"genera_of_interest":[],"key_publications":["Le formiche del Veneto (2018)"],"bio_it":"Autore della guida alle formiche del Veneto.","bio_en":"Author of the Veneto ant handbook.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"antonio-alicata","name":"Antonio Alicata","affiliation":"Universit\u00e0 di Catania","role":"Professor","email":null,"website":null,"orcid":null,"region":"Sicilia","specializations":["taxonomy","endemic species"],"genera_of_interest":[],"key_publications":[],"bio_it":"Specialista in specie endemiche siciliane.","bio_en":"Specialist in Sicilian endemic species.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"cristina-castracani","name":"Cristina Castracani","affiliation":"Universit\u00e0 di Parma","role":"Researcher","email":null,"website":null,"orcid":null,"region":"Emilia-Romagna","specializations":["ecology","urban entomology"],"genera_of_interest":[],"key_publications":[],"bio_it":"Ricercatrice presso il laboratorio di mirmecologia di Parma.","bio_en":"Researcher at the Parma myrmecology lab.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"alessandra-mori","name":"Alessandra Mori","affiliation":"Universit\u00e0 di Parma","role":"Researcher","email":null,"website":null,"orcid":null,"region":"Emilia-Romagna","specializations":["social parasitism","behavior"],"genera_of_interest":["Polyergus","Formica"],"key_publications":[],"bio_it":"Specialista in parassitismo sociale nelle formiche.","bio_en":"Specialist in social parasitism in ants.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"giorgio-sabella","name":"Giorgio Sabella","affiliation":"Universit\u00e0 di Catania","role":"Professor","email":null,"website":null,"orcid":null,"region":"Sicilia","specializations":["invasive species","taxonomy"],"genera_of_interest":["Linepithema","Solenopsis"],"key_publications":[],"bio_it":"Specialista in specie invasive.","bio_en":"Specialist in invasive species.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"fabrizio-rigato","name":"Fabrizio Rigato","affiliation":"Museo Civico di Storia Naturale di Milano","role":"Curator","email":null,"website":null,"orcid":null,"region":"Lombardia","specializations":["taxonomy","morphology"],"genera_of_interest":[],"key_publications":[],"bio_it":"Curatore e contributore AntWeb. Ha validato le matrici FormiKey.","bio_en":"Museum curator and AntWeb contributor. Validated the FormiKey matrices.","profile_photo_url":null,"h_index":null,"claimed":false},
  {"id":"francesco-mensa","name":"Francesco Mensa","affiliation":"MUSE, Trento","role":"Researcher","email":null,"website":null,"orcid":null,"region":"Trentino-Alto Adige","specializations":["taxonomy","alpine arthropods","identification keys"],"genera_of_interest":[],"key_publications":[],"bio_it":"Creatore del progetto Formiche d'Italia e della chiave FormiKey.","bio_en":"Creator of Formiche d'Italia and the FormiKey identification key.","profile_photo_url":null,"h_index":null,"claimed":true},
  {"id":"mauro-gobbi","name":"Mauro Gobbi","affiliation":"MUSE, Trento","role":"Researcher","email":null,"website":null,"orcid":null,"region":"Trentino-Alto Adige","specializations":["glacial ecology","alpine entomology"],"genera_of_interest":[],"key_publications":[],"bio_it":"Supervisore del progetto, specialista in ecologia glaciale.","bio_en":"Project supervisor, specialist in glacial ecology.","profile_photo_url":null,"h_index":null,"claimed":false}
]
```

- [ ] **Step 2: Create experts index page**

Create `src/pages/esperti/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ExpertCard from '../../components/ExpertCard.astro';
import experts from '../../data/experts.json';

const pageTitle = "Esperti di mirmecologia italiana";
const regions = [...new Set(experts.map((e: any) => e.region).filter(Boolean))].sort();
---

<BaseLayout title={pageTitle} description="Directory degli esperti di mirmecologia in Italia — ricercatori, professori e curatori museali.">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="font-display text-3xl font-bold text-gray-900 mb-8" data-i18n="experts_title">{pageTitle}</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {experts.map((expert: any) => (
        <ExpertCard expert={expert} />
      ))}
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Create expert detail page**

Create `src/pages/esperti/[slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import type { Expert } from '../../types';
import expertsData from '../../data/experts.json';
import generaData from '../../data/genera.json';

export function getStaticPaths() {
  return (expertsData as Expert[]).map((expert) => ({
    params: { slug: expert.id },
    props: { expert },
  }));
}

const { expert } = Astro.props as { expert: Expert };
const expertGenera = generaData.filter((g: any) =>
  expert.genera_of_interest?.includes(g.scientific_name) || expert.genera_of_interest?.includes(g.id)
);
---

<BaseLayout title={expert.name} description={`${expert.name} — ${expert.affiliation || 'esperto di mirmecologia italiana'}`}>
  <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <nav class="text-sm text-gray-500 mb-6">
      <a href="/esperti" class="hover:text-brand-600">Esperti</a>
      <span class="mx-2">/</span>
      <span>{expert.name}</span>
    </nav>

    <header class="flex items-start gap-6 mb-8">
      {expert.profile_photo_url ? (
        <img src={expert.profile_photo_url} alt={expert.name} class="w-24 h-24 rounded-full object-cover" />
      ) : (
        <div class="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span class="text-brand-600 font-bold text-2xl">{expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
        </div>
      )}
      <div>
        <div class="flex items-center gap-3">
          <h1 class="font-display text-3xl font-bold text-gray-900">{expert.name}</h1>
          {expert.claimed && <span class="text-xs bg-forest-100 text-forest-700 px-2 py-1 rounded-full">Verificato</span>}
        </div>
        {expert.role && <p class="text-gray-600 mt-1">{expert.role}</p>}
        {expert.affiliation && <p class="text-gray-500">{expert.affiliation}</p>}
        {expert.region && <p class="text-sm text-gray-400 mt-1">{expert.region}</p>}
      </div>
    </header>

    {expert.bio_it && (
      <section class="prose prose-gray max-w-none mb-8">
        <p>{expert.bio_it}</p>
      </section>
    )}

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {expert.specializations && expert.specializations.length > 0 && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Specializzazioni</h2>
          <div class="flex flex-wrap gap-2">
            {expert.specializations.map(s => <span class="text-sm bg-white text-gray-700 px-3 py-1 rounded-full border border-gray-200">{s}</span>)}
          </div>
        </div>
      )}
      {expert.orcid && (
        <div class="bg-gray-50 rounded-lg p-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ORCID</h2>
          <a href={`https://orcid.org/${expert.orcid}`} target="_blank" rel="noopener noreferrer" class="text-forest-600 hover:text-forest-800 underline">{expert.orcid}</a>
        </div>
      )}
    </div>

    {expertGenera.length > 0 && (
      <section class="mb-8">
        <h2 class="font-display text-xl font-semibold mb-4">Generi di interesse</h2>
        <div class="flex flex-wrap gap-2">
          {expertGenera.map((g: any) => (
            <a href={`/generi/${g.id}`} class="text-sm bg-forest-50 text-forest-700 px-3 py-1 rounded-full hover:bg-forest-100 transition-colors italic">{g.scientific_name}</a>
          ))}
        </div>
      </section>
    )}

    {expert.key_publications && expert.key_publications.length > 0 && (
      <section class="mb-8">
        <h2 class="font-display text-xl font-semibold mb-4">Pubblicazioni principali</h2>
        <ul class="space-y-2">
          {expert.key_publications.map(pub => <li class="text-gray-700">{pub}</li>)}
        </ul>
      </section>
    )}

    <div class="border-t border-gray-200 pt-6 mt-8">
      <a href={`mailto:francesco.mensa@muse.it?subject=Claim profilo Formiche d'Italia: ${expert.name}`} class="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
        Rivendica il tuo profilo
      </a>
      {expert.website && (
        <a href={expert.website} target="_blank" rel="noopener noreferrer" class="ml-4 text-forest-600 hover:text-forest-800 underline">Sito istituzionale</a>
      )}
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Create `scripts/build_experts.py`**

This script queries OpenAlex to enrich the seed `experts.json` with h-index, ORCID, publications, and discovers new Italian myrmecologists via co-author expansion.

```python
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

# Italian genera names for NLP extraction
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
    """Extract ant genus names mentioned in publication titles."""
    found = set()
    for work in works:
        title = (work.get("title") or "").lower()
        for genus in GENERA_NAMES:
            if genus.lower() in title:
                found.add(genus)
    return sorted(found)


def enrich_expert(expert: dict) -> dict:
    """Look up an expert on OpenAlex and enrich their profile."""
    print(f"  Looking up {expert['name']}...")
    try:
        results = list(Authors().search(expert["name"]).get())
    except Exception as e:
        print(f"    Error: {e}")
        return expert

    # Find best match (prefer Italian affiliation)
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

    # Enrich
    oa_id = best.get("id", "").split("/")[-1]
    expert["orcid"] = expert.get("orcid") or best.get("orcid")
    stats = best.get("summary_stats") or {}
    expert["h_index"] = expert.get("h_index") or stats.get("h_index")

    institutions = best.get("last_known_institutions") or []
    if institutions and not expert.get("affiliation"):
        expert["affiliation"] = institutions[0].get("display_name")

    # Get top publications
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

        # Extract genera from all titles
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
```

- [ ] **Step 5: Verify expert pages build**

```bash
cd formiche-ditalia && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add scripts/build_experts.py formiche-ditalia/src/pages/esperti/ formiche-ditalia/src/data/experts.json
git commit -m "feat: add expert directory with seed data and OpenAlex pipeline"
```

---

## Task 11: Identification Key Engine

**Files:**
- Create: `formiche-ditalia/src/components/IdentificationKey.tsx`
- Create: `formiche-ditalia/src/components/GlossaryTooltip.tsx`
- Create: `formiche-ditalia/src/pages/identifica.astro`

This is the core differentiating feature. The identification key is a React island that:
1. Loads characters, matrix, and genera JSON
2. Lets user select character states in any order
3. Filters genera with error tolerance (max 1 mismatch by default)
4. Suggests the best next character (information gain)
5. Shows matching genera as cards with scores

- [ ] **Step 1: Create `src/components/GlossaryTooltip.tsx`**

```tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';

interface Props {
  term: string;
  definition: string;
  imageUrl?: string | null;
  children: ReactNode;
}

export default function GlossaryTooltip({ term, definition, imageUrl, children }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-describedby={`glossary-${term}`}
    >
      <span className="border-b border-dashed border-gray-400 cursor-help">
        {children}
      </span>
      {visible && (
        <div
          ref={ref}
          id={`glossary-${term}`}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-sm"
        >
          <p className="font-semibold text-gray-900 mb-1">{term}</p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={term}
              className="w-full h-32 object-cover rounded mb-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <p className="text-gray-600">{definition}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -translate-y-1.5" />
          </div>
        </div>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/IdentificationKey.tsx`**

This is the largest component. Key sections:
1. State management: selectedStates, maxMismatches, selectedRegion
2. `filterGenera()`: the scoring algorithm with error tolerance
3. `getBestCharacter()`: information gain calculation
4. UI: character selector (grouped by body region), results grid

```tsx
import { useState, useMemo, useCallback } from 'react';
import type { Character, MatrixEntry, Genus } from '../types';

// Data will be passed as props from the Astro page
interface Props {
  characters: Character[];
  matrix: MatrixEntry[];
  genera: Genus[];
  lang: 'it' | 'en';
}

interface SelectedState {
  characterId: string;
  value: string;
}

interface ScoredGenus {
  genus: Genus;
  score: number;
  mismatches: number;
  matchedCount: number;
}

export default function IdentificationKey({ characters, matrix, genera, lang }: Props) {
  const [selectedStates, setSelectedStates] = useState<SelectedState[]>([]);
  const [maxMismatches, setMaxMismatches] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const regions = [
    { value: 'nord-ovest', label: lang === 'it' ? 'Nord-Ovest' : 'North-West' },
    { value: 'nord-est', label: lang === 'it' ? 'Nord-Est' : 'North-East' },
    { value: 'centro', label: lang === 'it' ? 'Centro' : 'Central' },
    { value: 'sud', label: lang === 'it' ? 'Sud' : 'South' },
    { value: 'sicilia', label: lang === 'it' ? 'Sicilia' : 'Sicily' },
    { value: 'sardegna', label: lang === 'it' ? 'Sardegna' : 'Sardinia' },
  ];

  // Pre-filter genera by region (if selected)
  const regionFilteredGenera = useMemo(() => {
    if (!selectedRegion) return genera;
    return genera.filter(g =>
      !g.distribution_regions || g.distribution_regions.length === 0 ||
      g.distribution_regions.includes(selectedRegion)
    );
  }, [genera, selectedRegion]);

  // Build lookup: genusId -> characterId -> stateValues[]
  const matrixLookup = useMemo(() => {
    const lookup: Record<string, Record<string, string[]>> = {};
    for (const entry of matrix) {
      if (!lookup[entry.genus_id]) lookup[entry.genus_id] = {};
      lookup[entry.genus_id][entry.character_id] = entry.state_values;
    }
    return lookup;
  }, [matrix]);

  // Filter genera based on selections
  const scoredGenera = useMemo((): ScoredGenus[] => {
    if (selectedStates.length === 0) {
      return genera.map(g => ({ genus: g, score: 1, mismatches: 0, matchedCount: 0 }));
    }

    return regionFilteredGenera.map((genus) => {
      let mismatches = 0;
      let matched = 0;
      for (const sel of selectedStates) {
        const values = matrixLookup[genus.id]?.[sel.characterId];
        if (!values || values.includes('?')) {
          // Missing data — don't count as mismatch
          continue;
        }
        if (values.includes(sel.value)) {
          matched++;
        } else {
          mismatches++;
        }
      }
      const score = selectedStates.length > 0
        ? (selectedStates.length - mismatches) / selectedStates.length
        : 1;
      return { genus, score, mismatches, matchedCount: matched };
    })
    .filter(sg => sg.mismatches <= maxMismatches)
    .sort((a, b) => b.score - a.score || a.genus.scientific_name.localeCompare(b.genus.scientific_name));
  }, [genera, selectedStates, matrixLookup, maxMismatches]);

  // Calculate best next character (information gain)
  const bestCharacterId = useMemo(() => {
    const usedIds = new Set(selectedStates.map(s => s.characterId));
    const remaining = characters.filter(c => !usedIds.has(c.id));
    const candidateIds = new Set(scoredGenera.map(sg => sg.genus.id));

    let bestId = '';
    let bestScore = -1;

    for (const char of remaining) {
      // Count how many genera have each state value
      const stateCounts: Record<string, number> = {};
      let total = 0;
      for (const sg of scoredGenera) {
        const values = matrixLookup[sg.genus.id]?.[char.id];
        if (!values || values.includes('?')) continue;
        for (const v of values) {
          stateCounts[v] = (stateCounts[v] || 0) + 1;
        }
        total++;
      }
      if (total === 0) continue;

      // Shannon entropy
      let entropy = 0;
      for (const count of Object.values(stateCounts)) {
        const p = count / total;
        if (p > 0) entropy -= p * Math.log2(p);
      }
      if (entropy > bestScore) {
        bestScore = entropy;
        bestId = char.id;
      }
    }
    return bestId;
  }, [characters, selectedStates, scoredGenera, matrixLookup]);

  const selectState = (characterId: string, value: string) => {
    setSelectedStates(prev => {
      const filtered = prev.filter(s => s.characterId !== characterId);
      return [...filtered, { characterId, value }];
    });
  };

  const undo = () => {
    setSelectedStates(prev => prev.slice(0, -1));
  };

  const reset = () => {
    setSelectedStates([]);
    setSelectedRegion('');
  };

  // Group characters by body region
  const usedIds = new Set(selectedStates.map(s => s.characterId));
  const bodyRegions = ['head', 'thorax', 'petiole', 'gaster', 'legs', 'antennae'] as const;
  const charsByRegion = bodyRegions.map(region => ({
    region,
    chars: characters
      .filter(c => c.body_region === region && !usedIds.has(c.id))
      .sort((a, b) => {
        // Easy first, then medium, then hard
        const order = { easy: 0, medium: 1, hard: 2 };
        return order[a.difficulty] - order[b.difficulty];
      }),
  })).filter(g => g.chars.length > 0);

  const regionLabels: Record<string, string> = {
    head: lang === 'it' ? 'Testa' : 'Head',
    thorax: lang === 'it' ? 'Torace' : 'Thorax',
    petiole: lang === 'it' ? 'Peziolo' : 'Petiole',
    gaster: lang === 'it' ? 'Gastro' : 'Gaster',
    legs: lang === 'it' ? 'Zampe' : 'Legs',
    antennae: lang === 'it' ? 'Antenne' : 'Antennae',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Character selector panel */}
      <div className="lg:w-1/2">
        {/* Region selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {lang === 'it' ? 'Regione geografica' : 'Geographic region'}
          </label>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none text-sm bg-white"
          >
            <option value="">{lang === 'it' ? 'Tutta Italia' : 'All Italy'}</option>
            {regions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={undo}
            disabled={selectedStates.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:border-forest-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'it' ? 'Annulla' : 'Undo'}
          </button>
          <button
            onClick={reset}
            disabled={selectedStates.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'it' ? 'Ricomincia' : 'Reset'}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            {lang === 'it' ? 'Tolleranza' : 'Tolerance'}:
            <select
              value={maxMismatches}
              onChange={e => setMaxMismatches(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </div>

        {selectedStates.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedStates.map((sel, i) => {
              const char = characters.find(c => c.id === sel.characterId);
              const state = char?.states.find(s => s.value === sel.value);
              return (
                <span key={i} className="text-xs bg-forest-100 text-forest-700 px-2 py-1 rounded-full">
                  {lang === 'it' ? char?.name_it : char?.name_en}: {lang === 'it' ? state?.label_it : state?.label_en}
                </span>
              );
            })}
          </div>
        )}

        {charsByRegion.map(({ region, chars }) => (
          <details key={region} className="mb-4" open={chars.some(c => c.id === bestCharacterId)}>
            <summary className="cursor-pointer font-semibold text-gray-700 py-2">
              {regionLabels[region] || region}
            </summary>
            <div className="space-y-3 pl-4 mt-2">
              {chars.map(char => (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg border transition-all ${
                    char.id === bestCharacterId
                      ? 'border-forest-400 bg-forest-50 ring-1 ring-forest-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    {lang === 'it' ? char.name_it : char.name_en}
                    {char.id === bestCharacterId && (
                      <span className="ml-2 text-xs text-forest-600 font-normal">
                        ★ {lang === 'it' ? 'consigliato' : 'suggested'}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {char.states.map(state => (
                      <button
                        key={state.value}
                        onClick={() => selectState(char.id, state.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:bg-forest-50 transition-colors min-h-[44px]"
                      >
                        {lang === 'it' ? state.label_it : state.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Results panel */}
      <div className="lg:w-1/2">
        <p className="text-sm text-gray-500 mb-4" aria-live="polite">
          <span className="font-semibold text-forest-700 text-lg">{scoredGenera.length}</span>{' '}
          {lang === 'it' ? 'generi corrispondenti' : 'matching genera'}
        </p>

        {scoredGenera.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{lang === 'it'
              ? 'Nessun genere corrisponde ai caratteri selezionati. Prova a rimuovere l\'ultima selezione o ad aumentare la tolleranza.'
              : 'No genera match the selected characters. Try removing the last selection or increasing the tolerance.'
            }</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={undo} className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors">
                {lang === 'it' ? 'Annulla' : 'Undo'}
              </button>
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                {lang === 'it' ? 'Ricomincia' : 'Reset'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoredGenera.map(({ genus, score, mismatches }) => (
              <a
                key={genus.id}
                href={`/generi/${genus.id}`}
                className="group block p-4 rounded-xl border border-gray-200 hover:border-forest-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold italic text-gray-900 group-hover:text-forest-600 transition-colors">
                      {genus.scientific_name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{genus.subfamily_id}</p>
                  </div>
                  {selectedStates.length > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      mismatches === 0 ? 'bg-forest-100 text-forest-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {Math.round(score * 100)}%
                    </span>
                  )}
                </div>
                {genus.photo_urls[0] && (
                  <img
                    src={genus.photo_urls[0]}
                    alt={genus.scientific_name}
                    className="mt-3 w-full h-24 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-ant.svg'; }}
                  />
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/identifica.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import IdentificationKey from '../components/IdentificationKey.tsx';

import characters from '../data/characters.json';
import matrix from '../data/matrix.json';
import genera from '../data/genera.json';
---

<BaseLayout title="Chiave di identificazione" description="Identifica le formiche italiane con la chiave interattiva multi-accesso. Seleziona i caratteri morfologici in qualsiasi ordine.">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="font-display text-3xl font-bold text-gray-900 mb-2" data-i18n="identify_title">
      Chiave di identificazione
    </h1>
    <p class="text-gray-500 mb-8">
      Seleziona i caratteri morfologici in qualsiasi ordine per identificare il genere.
    </p>

    <IdentificationKey
      client:load
      characters={characters}
      matrix={matrix}
      genera={genera}
      lang="it"
    />
  </div>
</BaseLayout>
```

- [ ] **Step 4: Verify the identification key works**

```bash
cd formiche-ditalia && npm run dev
```

Visit `localhost:4321/identifica`. The key should:
- Show characters grouped by body region
- Allow selecting a state
- Filter genera in real-time
- Show the best character highlighted
- Handle undo/reset

- [ ] **Step 5: Commit**

```bash
git add formiche-ditalia/src/components/IdentificationKey.tsx formiche-ditalia/src/components/GlossaryTooltip.tsx formiche-ditalia/src/pages/identifica.astro
git commit -m "feat: add interactive identification key with error tolerance and best-character suggestion"
```

---

## Task 12: Editorial Pages

**Files:**
- Create: `formiche-ditalia/src/pages/chi-siamo.astro`
- Create: `formiche-ditalia/src/pages/come-identificare-le-formiche.astro`
- Create: `formiche-ditalia/src/pages/formiche-in-casa.astro`

- [ ] **Step 1: Create the three editorial pages**

These are Markdown-style content pages wrapped in BaseLayout. Write initial Italian content (Francesco can refine later). Each page includes:
- Proper `<title>` and meta description for SEO
- Heading structure (H1, H2)
- Internal links to genera and identification key
- `/formiche-in-casa` should intercept "come eliminare formiche" searches and guide toward identification

- [ ] **Step 2: Verify all pages build**

```bash
cd formiche-ditalia && npm run build
```

Expected: Full static build succeeds with all pages generated.

- [ ] **Step 3: Commit**

```bash
git add formiche-ditalia/src/pages/chi-siamo.astro formiche-ditalia/src/pages/come-identificare-le-formiche.astro formiche-ditalia/src/pages/formiche-in-casa.astro
git commit -m "feat: add editorial pages (about, identification guide, pest-control SEO)"
```

---

## Task 13: Full Build Verification and Polish

**Files:**
- Various fixes across all files

- [ ] **Step 1: Run a full production build**

```bash
cd formiche-ditalia && npm run build
```

Fix any build errors.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Navigate through all pages, test the identification key, check responsive design on mobile viewport.

- [ ] **Step 3: Run accessibility check**

Use the browser's Lighthouse audit (Accessibility tab) on the homepage and identification key page. Fix any critical issues (color contrast, missing ARIA labels, keyboard navigation).

- [ ] **Step 4: Verify SEO**

Check that:
- All pages have unique `<title>` and `<meta name="description">`
- Genus/species pages have Schema.org structured data
- Sitemap is generated at `/sitemap-index.xml`
- All images have alt text

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete MVP build with all pages, identification key, and SEO"
```

---

## Task 14: Deploy to Vercel

**Files:** None (deployment configuration)

- [ ] **Step 1: Initialize Vercel project**

```bash
cd formiche-ditalia
npx vercel --yes
```

Follow prompts. Set build command to `npm run build`, output directory to `dist`.

- [ ] **Step 2: Deploy**

```bash
npx vercel --prod
```

- [ ] **Step 3: Verify live site**

Visit the deployed URL. Test all pages, identification key, language switcher, mobile responsive.

- [ ] **Step 4: Commit Vercel config if any files were created**

```bash
git add -A
git commit -m "chore: add Vercel deployment config"
```
