# FORMICHE D'ITALIA — Claude Code Handoff Document

## 🎯 MISSION

Build "Formiche d'Italia" — the first comprehensive Italian ant species directory with interactive identification key and expert network. This is a real project by Francesco Ferrario (researcher at MUSE, Trento), combining myrmecological expertise with modern web development.

**The end goal of THIS work session:** Get to a "Level 1" complete, live directory — genus-level identification key + species database + expert directory, deployed and accessible.

---

## 📁 PROJECT FILES (In Francesco's Folder)

Francesco has prepared a folder containing:

1. **This document** (`CLAUDE_CODE_HANDOFF.md`) — your primary reference
2. **`formiche_ditalia_roadmap.docx`** — Full 7-phase business plan and roadmap
3. **FormiKey NEXUS files** (`.nex` / `.nxs`) — Mesquite matrix files from Francesco's master thesis. These contain the character/taxon matrix for the interactive identification key. They encode which morphological characters correspond to which genera.
4. **Other thesis materials** — Possibly additional data files, images, or documentation from the original FormiKey project.

### About NEXUS Files

NEXUS is a standard bioinformatics file format used by Mesquite and other phylogenetics software. The files contain:
- A `TAXA` block listing all taxa (genera/species)
- A `CHARACTERS` block defining morphological characters and their states
- A `MATRIX` block with the actual data (which character states apply to which taxa)
- Possibly `ASSUMPTIONS` and `NOTES` blocks with additional metadata

**Your first task is to explore and parse these files.** They are the foundation of the interactive key.

---

## 📊 PHASE 1 RESULTS (Already Completed)

All research and validation has been done. Here are the key findings:

### SEO Landscape
- Italian ant queries are dominated by **pest control companies** (Rentokil, Biosistemi, Copyr, Insectum)
- Primary search intent: "come eliminare formiche" NOT "come identificare formiche"
- Pest control sites cover only 5-10 common species superficially
- **NO unified Italian ant identification resource exists** — this is the gap

### Competitive Analysis
- **AntWeb** (antweb.org): World's largest ant database, CC-licensed photos. Italy page on AntWiki is just a species list, no ID tools.
- **Schifani 2022 Checklist**: THE authoritative reference — 267 species, 42 genera, 7 subfamilies, 33 endemics. Published in Biogeographia. Data available at https://dataportal.lifewatchitaly.eu/data
- **Scupola 2018 "Le formiche del Veneto"**: Regional handbook, only covers Veneto but proves demand exists for accessible Italian ant resources.
- **FormiKey/MOSCHweb**: 2018 academic paper describes an interactive key for 41 Italian genera and 75 Rome species — but tool was never made public. Francesco's NEXUS files ARE this data.
- **Formicarium.it**: Active Italian ant-keeping forum (hobbyists, not naturalists)
- **Zero direct competitors** for a comprehensive Italian ant directory

### Italian Myrmecology Community
Key researchers to include in expert directory:
- **Enrico Schifani** (Univ. Parma) — Most active Italian myrmecologist, 2022 checklist author
- **Donato Antonio Grasso** (Univ. Parma) — Myrmecology Lab director
- **Antonio Scupola** (Natural History Museum Verona) — Veneto handbook author
- **Antonio Alicata** (Univ. Catania) — Endemic species, Sicily
- **Cristina Castracani, Alessandra Mori** (Univ. Parma) — Lab collaborators
- **Giorgio Sabella** (Univ. Catania) — Invasive species
- **Fabrizio Rigato** — AntWeb contributor
- **Francesco Ferrario** (MUSE, Trento) — Project creator, Alpine arthropods specialist
- **Mauro Gobbi** (MUSE, Trento) — Francesco's PI/supervisor
- Community size estimate: ~20-50 active Italian myrmecologists

### Monetization Reality
- Naturalist audience is small and non-commercial
- Best short-term revenue: pest control lead generation ("formiche in casa" → ID → local expert)
- Best long-term: EU biodiversity grants, AI identification tool
- Primary value: reputational + educational + community

---

## 🏗️ PHASES TO EXECUTE

### PHASE 2: Data Collection & Structuring

#### 2.1 Parse FormiKey NEXUS Files
1. **Read and explore** all `.nex`/`.nxs` files in the project folder
2. **Parse the NEXUS format** — extract:
   - List of all taxa (genera and/or species)
   - List of all morphological characters with their states
   - The character × taxon matrix
3. **Export to structured format** (JSON preferred, CSV as backup)
4. **Validate against Schifani 2022**: The NEXUS data may be based on pre-2022 taxonomy. Cross-reference with the current Italian checklist (42 genera, 267 species). Flag any discrepancies.

**NEXUS parsing approach:**
```python
# NEXUS files are plain text. Key blocks to parse:
# BEGIN TAXA; ... END;
# BEGIN CHARACTERS; ... END;
# BEGIN DATA; ... END;  (alternative to separate TAXA+CHARACTERS)
# The matrix maps taxa to character state vectors

# Python libraries: python-nexus (dendropy), or parse manually (it's simple text)
# pip install python-nexus  OR  pip install dendropy
```

#### 2.2 Build the Species Database
Using Schifani 2022 checklist as the authoritative source, create a structured database with:

**Genera table (42 records):**
```json
{
  "id": "string (slug, e.g. 'camponotus')",
  "scientific_name": "string",
  "subfamily": "string (one of 7: Amblyoponinae, Dolichoderinae, Dorylinae, Formicinae, Myrmicinae, Ponerinae, Proceratiinae)",
  "common_name_it": "string (if exists, e.g. 'formiche carpentiere' for Camponotus)",
  "description_it": "string (brief ecological/morphological description in Italian)",
  "description_en": "string (English version)",
  "habitat": "string",
  "nesting": "string (typical nesting habits)",
  "diet": "string",
  "species_count_italy": "number",
  "endemic_species_count": "number",
  "distribution_notes": "string",
  "diagnostic_characters": "string (key features for identification)",
  "photo_urls": ["array of AntWeb photo URLs or local paths"],
  "similar_genera": ["array of genera that might be confused with this one"],
  "references": ["array of key references"]
}
```

**Species table (~267 records):**
```json
{
  "id": "string (slug, e.g. 'camponotus-ligniperda')",
  "genus_id": "string (FK to genera)",
  "scientific_name": "string (full binomial)",
  "author_year": "string (e.g. 'Latreille, 1802')",
  "status": "enum: native | exotic | endemic",
  "subspecies": ["array if any"],
  "distribution_regions": ["array of Italian regions where found"],
  "altitude_range": "string (if known)",
  "habitat_notes": "string",
  "photo_urls": ["array"],
  "antcat_url": "string (link to AntCat entry)",
  "antweb_url": "string (link to AntWeb entry)",
  "gbif_id": "string (if available)"
}
```

**Characters table (from NEXUS data):**
```json
{
  "id": "string",
  "name_it": "string (Italian name of character)",
  "name_en": "string (English name)",
  "description_it": "string (how to observe this character)",
  "body_region": "string (head, thorax, petiole, gaster, legs, antennae)",
  "states": [
    {
      "value": "number or string",
      "label_it": "string",
      "label_en": "string",
      "illustration_url": "string (explanatory image)"
    }
  ],
  "difficulty": "enum: easy | medium | hard (how easy to observe without microscope)"
}
```

**Genus-Character matrix (from NEXUS):**
```json
{
  "genus_id": "string",
  "character_id": "string",
  "state_values": ["array of possible values for this genus (may be polymorphic)"]
}
```

**Experts table (~20-50 initial records):**
```json
{
  "id": "string (slug)",
  "name": "string",
  "affiliation": "string (institution)",
  "role": "string (e.g. 'Researcher', 'Professor', 'Museum Curator')",
  "email": "string (only if publicly available on institutional pages)",
  "website": "string",
  "region": "string (Italian region they're based in)",
  "specializations": ["array: taxonomy, ecology, behavior, invasive species, etc."],
  "genera_of_interest": ["array of genera they work on"],
  "key_publications": ["array of notable papers"],
  "bio_it": "string (brief bio in Italian)",
  "claimed": false,
  "profile_photo_url": "string"
}
```

#### 2.3 Data Sources & Where to Get Them

1. **Schifani 2022 Checklist data**: Available at https://dataportal.lifewatchitaly.eu/data — search for "Formicidae Italy" or "Schifani". This should have the complete species list with distributions.

2. **AntWeb photos**: CC-licensed. For each genus, the URL pattern is:
   - Genus page: `https://www.antweb.org/browse.do?genus=GENUS_NAME&rank=genus&project=allantwebants`
   - Species images: `https://www.antweb.org/browse.do?genus=GENUS_NAME&species=SPECIES_NAME&rank=species`
   - API: `https://www.antweb.org/api/v2/` (check documentation)

3. **AntWiki**: `https://www.antwiki.org/wiki/Italy` has the Italian species list. Individual genus pages have ecological info.

4. **Expert information**: From institutional web pages, Google Scholar profiles, ResearchGate. Only use publicly available information.

#### 2.4 Important Data Notes
- The 7 Italian subfamilies are: **Amblyoponinae, Dolichoderinae, Dorylinae, Formicinae, Myrmicinae, Ponerinae, Proceratiinae**
- The 42 genera are distributed across these subfamilies (Myrmicinae has the most)
- 33 species are endemic to Italy
- Notable invasive species: Linepithema humile (Argentine ant), Solenopsis invicta (recently found in Sicily — major news)
- Taxonomy is actively evolving — the 2022 checklist is the baseline but updates happen

---

### PHASE 3: Design & Architecture

#### 3.1 Tech Stack
Recommended (following modern JAMstack approach):
- **Frontend**: Next.js (React) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + free tier)
- **Hosting**: Vercel (free tier)
- **Domain**: formicheditalia.it (or similar — Francesco to register)
- **Images**: Stored in Supabase Storage or referenced from AntWeb (CC-licensed)

Alternative simpler stack (if speed is priority):
- **Static site**: Astro or Next.js static export
- **Data**: JSON files (no database needed for MVP)
- **Hosting**: Vercel/Netlify (free)

**Let Francesco decide the stack.** Ask him before starting the setup.

#### 3.2 User Flows

**Flow A: Interactive Identification Key**
1. User arrives wanting to identify an ant
2. Sees morphological character filters with explanatory illustrations
3. Can select characters in any order (multi-access key, not dichotomous)
4. Each selection narrows the list of possible genera
5. Shows remaining genera with photos and confidence scores
6. Clicking a genus goes to its full profile page

**Flow B: Browse/Explore**
1. User browses genera by subfamily, alphabetically, or by search
2. Each genus page shows: description, species list, photos, habitat info, distribution
3. Links to related genera, relevant experts

**Flow C: Expert Directory**
1. User searches experts by name, region, or specialization
2. Expert profiles show: affiliation, research interests, publications, genera they work on
3. "Claim your profile" button for experts to verify and update their info

#### 3.3 Database Schema (SQL for Supabase)

```sql
-- Core taxonomy
CREATE TABLE subfamilies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description_it TEXT,
  description_en TEXT
);

CREATE TABLE genera (
  id TEXT PRIMARY KEY,  -- slug: 'camponotus'
  scientific_name TEXT NOT NULL,
  subfamily_id TEXT REFERENCES subfamilies(id),
  common_name_it TEXT,
  description_it TEXT,
  description_en TEXT,
  habitat TEXT,
  nesting TEXT,
  diet TEXT,
  species_count_italy INTEGER,
  endemic_species_count INTEGER,
  distribution_notes TEXT,
  diagnostic_characters TEXT,
  similar_genera TEXT[],
  photo_urls TEXT[],
  references TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE species (
  id TEXT PRIMARY KEY,  -- slug: 'camponotus-ligniperda'
  genus_id TEXT REFERENCES genera(id),
  scientific_name TEXT NOT NULL,
  author_year TEXT,
  status TEXT CHECK (status IN ('native', 'exotic', 'endemic')),
  subspecies TEXT[],
  distribution_regions TEXT[],
  altitude_range TEXT,
  habitat_notes TEXT,
  photo_urls TEXT[],
  antweb_url TEXT,
  antcat_url TEXT,
  gbif_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identification key
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name_it TEXT NOT NULL,
  name_en TEXT,
  description_it TEXT,
  body_region TEXT,  -- head, thorax, petiole, gaster, legs, antennae
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  display_order INTEGER,
  illustration_url TEXT
);

CREATE TABLE character_states (
  id TEXT PRIMARY KEY,
  character_id TEXT REFERENCES characters(id),
  value TEXT NOT NULL,
  label_it TEXT NOT NULL,
  label_en TEXT,
  illustration_url TEXT,
  display_order INTEGER
);

CREATE TABLE genus_character_states (
  genus_id TEXT REFERENCES genera(id),
  character_state_id TEXT REFERENCES character_states(id),
  certainty TEXT DEFAULT 'definite',  -- definite, variable, rare
  PRIMARY KEY (genus_id, character_state_id)
);

-- Expert directory
CREATE TABLE experts (
  id TEXT PRIMARY KEY,  -- slug
  name TEXT NOT NULL,
  affiliation TEXT,
  role TEXT,
  email TEXT,
  website TEXT,
  region TEXT,
  specializations TEXT[],
  genera_of_interest TEXT[],
  key_publications TEXT[],
  bio_it TEXT,
  bio_en TEXT,
  profile_photo_url TEXT,
  claimed BOOLEAN DEFAULT FALSE,
  claim_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE genus_experts (
  genus_id TEXT REFERENCES genera(id),
  expert_id TEXT REFERENCES experts(id),
  PRIMARY KEY (genus_id, expert_id)
);
```

---

### PHASE 4: MVP Development

#### Sprint 1: Project Setup + Database
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase project (or JSON data files for simpler approach)
3. Create database schema
4. Parse NEXUS files → seed genera + characters + matrix
5. Seed species data from Schifani checklist
6. Seed initial expert profiles

#### Sprint 2: Interactive Identification Key
1. Build the key engine: given selected character states, filter matching genera
2. UI: character selector with illustrations (start with text labels, add images later)
3. Multi-access approach: any character can be selected in any order
4. Show matching genera with photos and match confidence
5. "Reset" and "Undo last selection" functionality

**Key algorithm:**
```
function filterGenera(selectedStates, allGenera, matrix):
    candidates = allGenera
    for each selectedState in selectedStates:
        candidates = candidates.filter(genus =>
            matrix[genus.id][selectedState.character_id].includes(selectedState.value)
            OR matrix[genus.id][selectedState.character_id] == 'variable'
        )
    return candidates sorted by number of matching characters
```

#### Sprint 3: Genus & Species Pages
1. Dynamic pages for each genus (`/generi/[slug]`)
2. Show: description, photos, species list, habitat, identification tips
3. Link to related genera and experts
4. SEO: proper meta tags, structured data (Schema.org), Italian content

#### Sprint 4: Expert Directory
1. Expert listing page (`/esperti`)
2. Individual expert profiles (`/esperti/[slug]`)
3. Filter by region, specialization, genus
4. Link experts to genera they work on

#### Sprint 5: Polish & Launch
1. Homepage with clear entry points (Identify / Browse / Find Expert)
2. About page (project description, methodology, credits)
3. Responsive design (mobile-first — naturalists are in the field)
4. SEO optimization for all pages
5. Basic analytics (Plausible or similar privacy-friendly)

---

### PHASE 5: SEO & Launch

#### On-Page SEO Requirements
Every genus page should have:
- Title: `[Genere] — Formiche d'Italia | Identificazione e specie italiane`
- Meta description: Brief Italian description of the genus
- H1: Scientific name + common name
- Structured data: `Schema.org/Taxon` or `Schema.org/CreativeWork`
- Internal links to related genera, subfamily, experts
- Photo alt texts with Italian descriptions

#### Content Pages to Create
- Homepage: "Formiche d'Italia — La guida italiana alla mirmecologia"
- `/identifica`: Interactive identification key
- `/generi`: Browse all genera
- `/generi/[slug]`: Individual genus pages (42 pages)
- `/specie/[slug]`: Individual species pages (267 pages — can be Phase 2)
- `/esperti`: Expert directory
- `/esperti/[slug]`: Individual expert pages
- `/chi-siamo`: About the project
- `/come-identificare-le-formiche`: Evergreen guide (SEO magnet)
- `/formiche-in-casa`: "Ants in the house" guide (intercepts pest control searches → highest traffic potential)

---

## ⚠️ IMPORTANT CONSTRAINTS

1. **Language**: The website must be primarily in **Italian**. English can be secondary.
2. **Accuracy**: This is a scientific resource. Taxonomic names, character descriptions, and species lists MUST be accurate. When in doubt, flag for Francesco to verify.
3. **Copyright**: AntWeb photos are CC-licensed (check specific license per image). Always credit photographers and AntWeb.
4. **Privacy**: Expert email addresses only if publicly available on institutional pages. Never scrape private contact info.
5. **NEXUS data age**: The FormiKey data is from Francesco's master thesis (possibly 2016-2020?). It MUST be cross-checked against Schifani 2022 for current taxonomy. Some genera may have been added, split, or synonymized since then.
6. **Budget**: Zero. Use only free tiers (Vercel, Supabase, etc.).

---

## 🔄 WORKFLOW INSTRUCTIONS FOR CLAUDE CODE

### General Approach
1. **Start by exploring the project folder** — list all files, read the NEXUS files, understand what data is available
2. **Parse NEXUS → JSON** — this is the critical first step. Everything else depends on understanding the character matrix
3. **Ask Francesco** before making architectural decisions (stack choice, hosting, etc.)
4. **Build incrementally** — get each piece working before moving to the next
5. **Commit often** — meaningful git commits with clear messages
6. **Test the identification key logic** — the multi-access key algorithm is the core differentiator

### When to Ask Francesco
- Choice of tech stack (Next.js vs Astro vs other)
- Any taxonomic uncertainty (genus names, character descriptions)
- Expert directory content (who to include, what info to show)
- Design preferences (colors, layout, branding)
- Domain name and hosting setup
- Any NEXUS file content that's unclear

### When to Proceed Autonomously
- Parsing NEXUS files and structuring data
- Writing code (frontend, backend, data processing)
- SEO optimization
- Generating Italian descriptions from the character matrix data
- Creating the identification key algorithm
- Setting up the database schema

---

## 📋 QUICK REFERENCE: Italian Ant Subfamilies

| Subfamily | Genera in Italy | Notes |
|-----------|----------------|-------|
| Amblyoponinae | ~1 (Stigmatomma) | Rare, cryptic |
| Dolichoderinae | ~4 (Dolichoderus, Linepithema, Tapinoma, etc.) | Includes Argentine ant |
| Dorylinae | ~1 (Dorylus) | Army ants, very rare in Italy |
| Formicinae | ~8-10 (Camponotus, Formica, Lasius, Plagiolepis, etc.) | Largest ants, very common |
| Myrmicinae | ~20+ (Messor, Myrmica, Pheidole, Crematogaster, Temnothorax, etc.) | Most diverse subfamily |
| Ponerinae | ~2-3 (Ponera, Hypoponera, etc.) | Small, cryptic |
| Proceratiinae | ~1 (Proceratium) | Rare, subterranean |

**Note**: Exact genus counts per subfamily should be verified from the NEXUS data and Schifani 2022. The above is approximate.

---

## 🚀 LET'S GO

Start with:
1. `ls` the project folder to see all files
2. Read and parse the NEXUS files
3. Report what you find to Francesco
4. Proceed to database structuring

Good luck! 🐜
