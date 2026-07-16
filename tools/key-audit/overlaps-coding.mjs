// Single source of truth for the two overlap-resolution codings (bucket-C sub-project C).
// Imported by the one-time migration (writes matrix.json + characters.json + coding-provenance.csv)
// and by test-overlaps-resolution.mjs, so coding and test cannot drift apart.
//   MACULATION (gen-33, globalised): '0' absent | '1' discrete pale gastral spots present | '?' unknown
//   PSAMMOPHORE (gen-51, new):       '0' absent | '1' psammophore present                 | '?' unknown
// Positives sourced individually; plausible candidates verified; non-candidates default '0'
// (absent/plesiomorphic), the Step-2B autapomorphy convention. Approved by the owner 2026-07-16
// (Temnothorax maculation resolved to '0' by owner: T. recedens spot is a non-Italian population,
// orange not pale, genus otherwise banded).

const GENERA = [
  'aphaenogaster','cardiocondyla','crematogaster','formicoxenus','harpagoxenus','leptothorax',
  'manica','messor','monomorium','myrmecina','myrmica','oxyopomyrmex','pheidole','solenopsis',
  'stenamma','strongylognathus','strumigenys','temnothorax','tetramorium',
  'brachyponera','cryptopone','hypoponera','ponera',
  'bothriomyrmex','dolichoderus','linepithema','liometopum','tapinoma',
  'camponotus','cataglyphis','colobopsis','formica','lasius','lepisiota','nylanderia',
  'paratrechina','plagiolepis','polyergus','prenolepis',
  'leptanilla','proceratium','stigmatomma',
];

// --- gen-33 Maculatura del gastro -------------------------------------------------------------
const MAC_ONE = new Set(['dolichoderus', 'colobopsis']);
export const MACULATION = Object.fromEntries(GENERA.map(g => [g, [MAC_ONE.has(g) ? '1' : '0']]));

const MAC_PROV_SPECIFIC = {
  dolichoderus: { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1 (Dolichoderus quadripunctatus)', source_url: '', evidence: '"black head, red mesosoma and black gaster with white maculae at base of first two gastral tergites"' },
  colobopsis:   { confidence: 'high',   source: 'AntWiki / Borowiec & Salata (Colobopsis truncata, the sole Italian species)', source_url: '', evidence: '"gaster dark brown to black, second tergite in anterolateral corners often with pale, white to yellowish spot"' },
  camponotus:   { confidence: 'high',   source: 'AntWiki species pages (6 Italian Camponotus checked)', source_url: '', evidence: 'gaster uniformly dark or plain-bicolour with head/mesosoma (e.g. C. lateralis "black gaster"); translucent tergite margins are bands, not discrete maculae — absent' },
  crematogaster:{ confidence: 'high',   source: 'Collingwood 1979 (Crematogaster scutellaris), AntWiki', source_url: '', evidence: '"head shining yellowish red contrasting with the brown alitrunk and dark gaster" — regional bicoloration, no discrete gastral spots — absent' },
  cataglyphis:  { confidence: 'medium', source: 'AntWiki Cataglyphis (type species "bicolor")', source_url: '', evidence: 'classic dark/reddish bicoloration, no maculae described — absent' },
  cardiocondyla:{ confidence: 'high',   source: 'Seifert 2003/2023, AntWiki (C. nuda, C. elegans)', source_url: '', evidence: '"head, mesosoma, waist, and gaster concolourous medium to blackish brown" — absent' },
  temnothorax:  { confidence: 'medium', source: 'owner decision 2026-07-16 (T. recedens spot rejected: non-Italian population, orange not pale, genus banded)', source_url: '', evidence: 'genus dominated by transverse bands/fasciae, not discrete pale maculae — absent' },
};
const MAC_PROV_DEFAULT = { confidence: 'medium', source: 'local corpus (AntWiki genus/species accounts, species.json, Bolton 1994)', source_url: '', evidence: 'concolour/dark or plain-bicolour gaster; no discrete pale maculae reported — specialised trait absent (plesiomorphic default)' };
export const PROV_MAC = Object.fromEntries(GENERA.map(g => [g, MAC_PROV_SPECIFIC[g] || MAC_PROV_DEFAULT]));

// --- gen-51 Psammoforo ------------------------------------------------------------------------
const PSA_ONE = new Set(['cataglyphis', 'messor', 'oxyopomyrmex']);
export const PSAMMOPHORE = Object.fromEntries(GENERA.map(g => [g, [PSA_ONE.has(g) ? '1' : '0']]));

const PSA_PROV_SPECIFIC = {
  cataglyphis:  { confidence: 'high',   source: 'Agosti & Collingwood 1987, Balkan ants key (European Formicinae)', source_url: '', evidence: '"posterior of maxilla with long curved hairs ... Cataglyphis"; all Italian species (nodus, aenescens, cursor/piliscapa, italica) key under this psammophore-bearing branch, no exception' },
  messor:       { confidence: 'high',   source: 'Bolton 1994, Ant genera of the world (key couplet) + Bolton 1982 Messor revision', source_url: '', evidence: '"Ventral surface of head with a psammophore" (Bolton 1994); "ventral surface of head with elongate ammochaete hairs which usually form a psammophore" (Bolton 1982)' },
  oxyopomyrmex: { confidence: 'high',   source: 'Salata & Borowiec 2015 genus revision; Borowiec & Salata 2025 Ants of Greece Vol.2', source_url: '', evidence: '"ventral surface of the head with a long psammophore appressed to erect long setae"' },
  formica:      { confidence: 'high',   source: 'Agosti & Collingwood 1987, Balkan ants key', source_url: '', evidence: '"posterior of maxilla without long curved hairs" (couplet opposite Cataglyphis) — absent' },
  aphaenogaster:{ confidence: 'high',   source: 'Bolton 1994, Ant genera of the world (key couplet opposite Messor)', source_url: '', evidence: '"Ventral surface of head without a psammophore" — absent' },
  bothriomyrmex:{ confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: '"Psammophore absent"' },
  linepithema:  { confidence: 'high',   source: 'Shattuck 1992; Wild 2007', source_url: '', evidence: '"Psammophore absent"' },
  liometopum:   { confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: '"Psammophore absent"' },
  tapinoma:     { confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: '"Psammophore absent"' },
  monomorium:   { confidence: 'medium', source: 'Bolton 1987 worker diagnosis (AntWiki); Borowiec & Salata 2025 diagnosis', source_url: '', evidence: 'thorough worker diagnosis makes no mention of a psammophore (which the same works flag explicitly for Messor/Oxyopomyrmex) — absent' },
  cardiocondyla:{ confidence: 'medium', source: 'Eguchi et al. 2011; Seifert 2003 (AntWiki)', source_url: '', evidence: '"dorsa of head, mesosoma, waist and gaster lacking standing hairs" — no psammophore — absent' },
  pheidole:     { confidence: 'medium', source: 'Bolton 1994 key; Borowiec & Salata 2025 genus diagnosis', source_url: '', evidence: 'separated from Messor/Aphaenogaster by dentition/clypeus, never by a psammophore; diagnosis silent — absent' },
  solenopsis:   { confidence: 'low',    source: 'Borowiec & Salata 2025 genus diagnosis', source_url: '', evidence: 'genus diagnosis makes no mention of a psammophore — absent (provisional)' },
};
const PSA_PROV_DEFAULT = { confidence: 'medium', source: 'biological default (mesic/arboreal/predatory taxon, not arid-granivorous)', source_url: '', evidence: 'psammophore is a sand-carrying structure of arid/granivorous ants; absent in this taxon — no psammophore reported in the local corpus' };
export const PROV_PSA = Object.fromEntries(GENERA.map(g => [g, PSA_PROV_SPECIFIC[g] || PSA_PROV_DEFAULT]));
