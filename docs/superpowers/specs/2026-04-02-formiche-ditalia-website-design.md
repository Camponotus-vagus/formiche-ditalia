# Formiche d'Italia — Website Design Spec

## Overview

First comprehensive Italian ant species directory with interactive multi-access identification key, species/genus catalog, and expert network. Built as a static site from existing NEXUS character matrices (FormiKey thesis data) and enriched with data from OpenAlex and AntWeb.

**Target audience**: Italian naturalists, myrmecologists, students, and pest-control seekers.
**Languages**: Bilingual Italian/English.
**Budget**: Zero (free-tier hosting and tools only).

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Astro 5.x + React islands | Content-driven static site with minimal client JS; React only for interactive key and language switcher |
| Styling | Tailwind CSS 4.x | Rapid, modern design; utility-first |
| Language | TypeScript | Type safety for data structures and components |
| Data | Static JSON files in `src/data/` | Taxonomic data changes rarely; no database needed for MVP |
| Data pipeline | Python scripts (`scripts/`) | Parse NEXUS, Excel, OpenAlex API into JSON |
| Images | Referenced from AntWeb (CC-licensed) + local fallbacks | No image hosting costs |
| Hosting | Vercel (free tier, static deploy) | Auto-deploy on push to main |
| Analytics | Plausible (optional) or none for MVP | Privacy-friendly |

---

## Data Architecture

### Source Files

- **NEXUS files**: Two versions exist. `parse_nexus.py` will first try `TESI FORMICHE (Dropbox)/Matrici corrette da Rigato/` (expert-validated by Fabrizio Rigato). For any missing file, fall back to `TESI FORMICHE/`. The script logs which source was used for each matrix. Character matrices cover subfamilies, genera per subfamily, species per genus.
- **Excel "Schede formiKEY"** (`TESI FORMICHE (Dropbox)/Schede formiKEY/`): descriptive sheets for genera, subfamilies, and species.
- **Text files** (`Formiche/Specie/`, `Formiche/Generi/`): species and genera lists.
- **Specimen images** (`Formiche/Specie/*/`): AntWeb photos (casent/antweb IDs) with views: `_h` (head), `_p` (profile), `_d` (dorsal), `_l` (label).

### Pipeline Scripts

```
scripts/
  parse_nexus.py       — NEXUS -> characters.json, matrix.json, genera partial data
  parse_excel.py       — Excel schede -> descriptions, habitat, diet for genera/species
  build_experts.py     — OpenAlex API + co-author expansion -> experts.json
```

### Output JSON Files

```
src/data/
  subfamilies.json     — 7 subfamilies with descriptions IT/EN
  genera.json          — ~41 genera (name, subfamily, descriptions, habitat, photos, etc.)
  species.json         — ~75 species MVP (expandable to ~267 via Schifani 2022)
  characters.json      — Morphological characters with states, translations IT/EN, difficulty, body region
  matrix.json          — Genus x character state matrix (supports polymorphic values)
  experts.json         — ~20-50 researcher profiles
```

### Data Schemas

**Genus**:
```typescript
interface Genus {
  id: string                    // slug: 'camponotus'
  scientific_name: string
  subfamily_id: string
  common_name_it?: string
  description_it: string
  description_en: string
  habitat?: string
  nesting?: string
  diet?: string
  species_count_italy: number
  endemic_species_count?: number
  distribution_notes?: string
  distribution_regions?: string[]
  diagnostic_characters?: string
  photo_urls: string[]
  similar_genera?: string[]
  references?: string[]
}
```

**Species**:
```typescript
interface Species {
  id: string                    // slug: 'camponotus-ligniperda'
  genus_id: string
  scientific_name: string
  author_year?: string
  status: 'native' | 'exotic' | 'endemic'
  subspecies?: string[]
  distribution_regions?: string[]
  altitude_range?: string
  habitat_notes?: string
  photo_urls: string[]
  synonyms?: string[]            // previous names, e.g. ["Amblyopone denticulatum"]
  antweb_url?: string
  antcat_url?: string
  gbif_id?: string
}
```

**Character**:
```typescript
interface Character {
  id: string
  name_it: string
  name_en: string
  description_it?: string
  body_region: 'head' | 'thorax' | 'petiole' | 'gaster' | 'legs' | 'antennae'
  difficulty: 'easy' | 'medium' | 'hard'
  display_order: number
  illustration_url?: string
  states: CharacterState[]
}

interface CharacterState {
  value: string
  label_it: string
  label_en: string
  illustration_url?: string
}
```

**Matrix entry**:
```typescript
interface MatrixEntry {
  genus_id: string
  character_id: string
  state_values: string[]        // supports polymorphic: ["0", "1"]
}
```

**Expert**:
```typescript
interface Expert {
  id: string                    // slug
  name: string
  affiliation?: string
  role?: string
  email?: string                // only if publicly available
  website?: string
  orcid?: string
  region?: string               // Italian region
  specializations?: string[]
  genera_of_interest?: string[]
  key_publications?: string[]
  bio_it?: string
  bio_en?: string
  profile_photo_url?: string
  h_index?: number
  claimed: boolean
}
```

---

## Site Structure

### Pages

**Generated from data (getStaticPaths):**
- `/generi/[slug]` — ~41 genus pages
- `/specie/[slug]` — ~75 species pages (MVP). No `/specie` index page; species are accessed from their genus page's species list.
- `/esperti/[slug]` — ~20-50 expert pages

**Interactive:**
- `/identifica` — Multi-access identification key (React island)

**Editorial (Markdown):**
- `/` — Homepage with 3 entry points: Identifica / Esplora / Esperti
- `/generi` — Browse all genera (filter by subfamily, search). Subfamily filters link to a brief info panel about the selected subfamily (not separate pages; subfamilies are too few to warrant their own routes).
- `/esperti` — Expert directory (filter by region, specialization, genus)
- `/chi-siamo` — About the project, methodology, credits
- `/come-identificare-le-formiche` — Evergreen SEO guide
- `/formiche-in-casa` — Pest-control SEO page (highest traffic potential)

**Internationalization routing:**
Single-URL model — Italian paths are canonical. The `LanguageSwitcher` toggles content language client-side (swapping `description_it` ↔ `description_en`, UI strings from `i18n/*.json`). No duplicate `/en/` routes. SEO limitation: crawlers will only index the Italian version since English is toggled client-side. This is acceptable for MVP — Italian is the primary audience. If English SEO becomes important post-launch, Astro can pre-render `/en/` variants in a future iteration.

### Component Architecture

**Astro components (zero client JS):**
- `BaseLayout.astro` (in `layouts/`) — HTML shell: `<head>` with SEO meta, structured data, hreflang tags; wraps all pages
- `GenusCard.astro` — Reusable genus card for listings
- `SpeciesRow.astro` — Species entry row used in genus page species lists (name, status badge, photo thumbnail)
- `ExpertCard.astro` — Reusable expert card

**React islands (interactive, hydrated on client):**
- `IdentificationKey.tsx` — Core identification key engine and UI
- `LanguageSwitcher.tsx` — IT/EN toggle, persists preference in localStorage
- `GlossaryTooltip.tsx` — Visual glossary popups on technical terms (hover/tap)
- `FilterBar.tsx` — Interactive filter/search controls for genera and expert list pages

---

## Interactive Identification Key

### Multi-access Key Algorithm

The key allows selecting morphological characters in any order to narrow candidate genera.

```
function filterGenera(selectedStates, allGenera, matrix, maxMismatches = 1):
    for each genus in allGenera:
        mismatches = 0
        for each selectedState in selectedStates:
            genusValues = matrix[genus.id][selectedState.character_id]
            if genusValues == '?' (missing data):
                continue  // missing != incompatible
            if selectedState.value NOT IN genusValues:
                mismatches += 1
        genus.score = (selectedStates.length - mismatches) / selectedStates.length
        genus.mismatches = mismatches

    return allGenera
        .filter(g => g.mismatches <= maxMismatches)
        .sort(by score descending, then by name)
```

### MVP Features

**1. Error Tolerance** (unique differentiator — no web-based key offers this)
- Genera are scored by compatibility, not rigidly eliminated
- A genus matching 4/5 selected characters stays visible with a "4/5" badge
- Configurable threshold: default shows genera with at most 1 mismatch

**2. Geographic Pre-filtering**
- User selects macro-region (Nord-Ovest, Nord-Est, Centro, Sud, Sicilia, Sardegna) or administrative region
- Genera not present in the selected area are excluded or demoted
- Distribution data from species files + Schifani 2022

**3. Visual Glossary**
- Every technical term in character descriptions has a tooltip/popup
- Popup shows annotated specimen photo highlighting the character
- Images from existing project files + AntWeb
- Implemented as React component, appears on hover/tap

**4. Best Character Suggestion**
- After each selection, the system calculates which remaining character best discriminates among candidates (information gain / entropy)
- Suggested character is highlighted as "recommended next step"

**5. UX**
- Characters grouped by body region (head, thorax, petiole, gaster, legs, antennae)
- "Easy" characters shown first, "hard" characters at bottom
- Undo last selection / Reset all
- Real-time candidate count update
- Candidate cards with photo, name, subfamily, match score
- Click card → full genus page

### States & Error Handling

- **Zero matches**: Friendly message "Nessun genere corrisponde ai caratteri selezionati. Prova a rimuovere l'ultima selezione o ad aumentare la tolleranza." with undo and reset buttons.
- **Missing illustrations**: Character states without an illustration show a placeholder icon. Glossary tooltips without images show text-only definition.
- **Broken AntWeb images**: `<img>` tags use `onerror` fallback to a local placeholder image (`public/images/placeholder-ant.svg`).
- **Loading**: JSON data files are small (~41 genera, ~50 characters). They load synchronously at component mount; no spinner needed. If data is missing or malformed, show an error banner with instructions to report the issue.

### Features Deferred to Post-MVP

1. Side-by-side deep-zoom specimen comparison (inspired by CIVIK)
2. Dual mode: simplified key (beginners) / full key (experts)
3. Caste handling: worker/queen/male as top-level filter with separate matrices
4. Probability-based character states (Clavis format, 0-1 frequencies)
5. AI photo pre-filtering (upload photo to narrow candidates)
6. Clavis JSON format export for interoperability
7. Automatic character dependency management (hide inapplicable characters)

---

## Expert Directory

### Data Population Pipeline

Automated via `scripts/build_experts.py`:

1. **Seed**: Look up 10 known researchers in OpenAlex API (free, CC0 data)
2. **Expand**: Extract co-authors from their Formicidae publications, filter for Italian affiliations → 30-50 candidates
3. **Enrich**: Cross-reference with ORCID and Semantic Scholar; extract genera of interest via NLP on titles/abstracts; generate short bios from publication data
4. **Review**: Email researchers to invite profile verification

**Libraries**: `pyalex`, `semanticscholar`, `requests`, `pandas`

### Expert Pages

**List page** (`/esperti`):
- Grid of cards: photo, name, affiliation, region
- Filters: region, specialization, genus of interest
- Search by name

**Profile page** (`/esperti/[slug]`):
- Name, role, affiliation, region, ORCID link
- Specializations and genera of interest (linked to genus pages)
- Key publications
- Bio IT/EN
- Institutional website link
- "Claim your profile" button: sends a mailto to the project owner (Francesco). On verification, `claimed` is set to `true` in `experts.json`, site is rebuilt, and the profile shows a "Verified" badge. In post-MVP, this can be replaced with an auth-based claim flow.

### Privacy & GDPR

- Only professional, publicly available information
- Opt-out mechanism on site (contact form for removal requests)
- Privacy notice explaining data sources and purpose
- No personal emails, phones, or addresses

---

## SEO Strategy

**Title pattern**: `[Nome] — Formiche d'Italia`
**Meta descriptions**: Italian, unique per page
**Structured data**: Schema.org/Taxon on genus/species pages
**Sitemap**: Auto-generated by Astro
**Image alt texts**: Descriptive, in Italian

**High-value content pages**:
- `/come-identificare-le-formiche` — Intercepts educational searches
- `/formiche-in-casa` — Intercepts pest-control traffic (highest volume Italian ant queries)

**Internal linking**: genera ↔ related genera, genera ↔ experts, genera ↔ subfamily

---

## Accessibility

- Target WCAG 2.1 AA compliance
- Keyboard navigation for identification key (tab through characters, enter to select states, escape to undo)
- Sufficient color contrast (4.5:1 minimum for text)
- Screen reader support: ARIA labels on interactive controls, live regions for candidate count updates
- Touch targets minimum 44x44px for mobile use in the field

---

## Design Direction

Modern, visually engaging design that attracts both specialists and general public:
- Contemporary typography and layout
- Vibrant but natural color palette
- Subtle animations and transitions
- High-quality specimen images as visual anchors
- Mobile-first responsive design (naturalists are in the field)
- Clear visual hierarchy: scientific data presented accessibly

---

## Build & Deploy

```bash
# Development
npm run dev           # Astro dev server

# Production
npm run build         # Static site → dist/
npm run preview       # Preview production build locally

# Data pipeline (run manually when data changes)
python scripts/parse_nexus.py
python scripts/parse_excel.py
python scripts/build_experts.py

# Deploy: automatic on push to main via Vercel
```

---

## Project Directory Structure

```
formiche-ditalia/
  src/
    data/                     — Generated JSON data files
    pages/
      index.astro
      identifica.astro
      chi-siamo.astro
      come-identificare-le-formiche.astro
      formiche-in-casa.astro
      generi/
        index.astro
        [slug].astro
      specie/
        [slug].astro
      esperti/
        index.astro
        [slug].astro
    components/
      IdentificationKey.tsx   — React island: core key engine
      LanguageSwitcher.tsx    — React island: IT/EN toggle
      FilterBar.tsx           — React island: interactive filters/search
      GlossaryTooltip.tsx     — React island: visual glossary popups
      GenusCard.astro
      SpeciesRow.astro
      ExpertCard.astro
    layouts/
      BaseLayout.astro        — HTML shell with SEO meta, hreflang, nav, footer
    i18n/
      it.json
      en.json
    styles/
      global.css
  scripts/
    parse_nexus.py
    parse_excel.py
    build_experts.py
  public/
    images/
    fonts/
  docs/
    superpowers/specs/        — This spec and future specs
  astro.config.mjs
  tailwind.config.mjs
  tsconfig.json
  package.json
```
