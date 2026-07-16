// Single source of truth for the metatibial-spur coding (character gen-13).
// The one-time migration that wrote matrix.json + coding-provenance.csv generated its cells
// from this module, and test-spur-honest.mjs imports it to assert the matrix still matches —
// so the coding and the test that checks it cannot drift apart.
//
// State set (gen-13, globalised):
//   '0' = semplice o assente   |  '1' = pettinato   |  '2' = due speroni (uno semplice + uno pettinato)
//
// Sourcing principle (approved by the project owner, 2026-07-16): a European-fauna-specific
// source (Borowiec & Salata, "Ants of Greece" 2022/2025) overrides Bolton 2003's worldwide
// range; where Greece is silent, Bolton 2003 App.2 Spur Formula (SF) governs; the flagged
// cells (conflicts, "dedotto" inferences, intermediates) were verified against primary
// literature. Bolton notation: SF = meso,meta (s=simple, b=barbulate≈simple, p=pectinate,
// s-p=intermediate simple-to-pectinate, 0=absent). The metatibial value is the SECOND term.
//
// There is NO deterministic range->state function (unlike the dentition merge): the spur state
// is a categorical judgement, not a numeric range, so the approved states are stored directly
// and test-spur-honest.mjs asserts the matrix equals them.

export const STATES = {
  // Myrmicinae (19)
  aphaenogaster:    ['0'],
  cardiocondyla:    ['0'],
  crematogaster:    ['0'],
  formicoxenus:     ['0'],
  harpagoxenus:     ['0'],
  leptothorax:      ['0'],
  manica:           ['1'],
  messor:           ['0', '1'],
  monomorium:       ['0'],
  myrmecina:        ['0'],
  myrmica:          ['0', '1'],
  oxyopomyrmex:     ['0'],
  pheidole:         ['0'],
  solenopsis:       ['0'],
  stenamma:         ['0'],
  strongylognathus: ['0'],
  strumigenys:      ['0'],
  temnothorax:      ['0'],
  tetramorium:      ['0'],
  // Ponerinae (4)
  brachyponera:     ['2'],
  cryptopone:       ['2'],
  hypoponera:       ['1'],
  ponera:           ['1'],
  // Dolichoderinae (5)
  bothriomyrmex:    ['1'],
  dolichoderus:     ['0', '1'],
  linepithema:      ['1'],
  liometopum:       ['1'],
  tapinoma:         ['0'],
  // Formicinae (11)
  camponotus:       ['1'],
  cataglyphis:      ['0'],
  colobopsis:       ['1'],
  formica:          ['0'],
  lasius:           ['0'],
  lepisiota:        ['0'],
  nylanderia:       ['0'],
  paratrechina:     ['0'],
  plagiolepis:      ['0'],
  polyergus:        ['0'],
  prenolepis:       ['0'],
  // Leptanillinae (1)
  leptanilla:       ['0', '1', '2'],
  // Proceratiinae (1)
  proceratium:      ['1'],
  // Amblyoponinae (1)
  stigmatomma:      ['1', '2'],
};

// Provenance for coding-provenance.csv. One entry per genus; the migration writes one CSV row
// per state in STATES[genus], reusing this source/source_url/evidence/confidence.
export const PROVENANCE = {
  aphaenogaster:    { confidence: 'high',   source: 'Bolton 2003, Synopsis and Classification of Formicidae, App. 2', source_url: '', evidence: 'SF 1s,1s; 0,0 — metatibial spur simple or absent' },
  cardiocondyla:    { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  crematogaster:    { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent (corrects the earlier "1 simple, dedotto")' },
  formicoxenus:     { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  harpagoxenus:     { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  leptothorax:      { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  manica:           { confidence: 'high',   source: 'Borowiec & Salata 2025, Ants of Greece Vol.2 Part 1, p.179; Bolton 1994 p.87', source_url: '', evidence: '"tibial spurs of middle and hind legs pectinate" (Greece 2025); Bolton 1994 "usually pectinate, rarely simple or absent" (overrides Bolton 2003 SF 1s-p)' },
  messor:           { confidence: 'high',   source: 'Bolton 1982 (quoted in AntWiki); Bolton 2003 App. 2 SF 1s-b,1s-p; 0,0', source_url: '', evidence: '"Spurs on posterior tibiae varying from very feebly pectinate through partially barbate and minutely barbulate to simple" — genuinely intermediate → states 0 and 1' },
  monomorium:       { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent (simple or absent)' },
  myrmecina:        { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  myrmica:          { confidence: 'high',   source: 'Bolton 2003 App. 2 SF 1s-p,1s-p; 0,0; Borowiec & Salata 2025 Vol.2 p.277', source_url: '', evidence: 'intermediate/variable: "often reduced to some remnants, never pectinate" (M. tulinae) vs "distinct, pectinate" (M. sabuleti) → states 0 and 1' },
  oxyopomyrmex:     { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s; 0,0 — metatibial spur simple or absent (replaces the "dedotto" inference)' },
  pheidole:         { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent' },
  solenopsis:       { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s; 0,0 — metatibial spur simple or absent (replaces the "dedotto" inference)' },
  stenamma:         { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s; 0,0 — metatibial spur simple or absent' },
  strongylognathus: { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s — metatibial spur simple' },
  strumigenys:      { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent (overturns the doc\'s "2 spurs", which cited a non-European African guide)' },
  temnothorax:      { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 0,0 — metatibial spur absent (confirms the "dedotto" value)' },
  tetramorium:      { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s; 0,0 — metatibial spur simple or absent' },
  brachyponera:     { confidence: 'high',   source: 'Schmidt & Shattuck 2014 (Ponerinae revision), quoted in AntWiki Brachyponera', source_url: '', evidence: '"metatibiae with two spurs"; "Metatibial spur formula (1s, 1p)" — two spurs, overturns the earlier single-pectinate coding' },
  cryptopone:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.24 (C. ochracea); Bolton 2003 App. 2 SF 2(1s,1p)', source_url: '', evidence: '"mid and hind tibiae each with two spurs, median spur large and pectinate and lateral spur much smaller and not pectinate"' },
  hypoponera:       { confidence: 'high',   source: 'Bolton & Fisher 2011, Hypoponera revision; Bolton 2003 App. 2 SF 1p,1p', source_url: '', evidence: '"Mesotibia and metatibia each with only a single spur; metatibial spur always pectinate" — the doc\'s "simple" was wrong' },
  ponera:           { confidence: 'high',   source: 'Bolton 2003 App. 2 SF 1p; Bolton 1994; Borowiec & Salata 2022 Vol.1 p.24', source_url: '', evidence: '"a single, large, pectinate spur"; "mid and hind tibiae have only one pectinate spur" — the doc\'s "simple" was wrong' },
  bothriomyrmex:    { confidence: 'medium', source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1p — metatibial spur pectinate (overturns the doc\'s "0,0")' },
  dolichoderus:     { confidence: 'medium', source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s-p,1s-p — metatibial spur intermediate simple-to-pectinate → states 0 and 1' },
  linepithema:      { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1 (Genus Linepithema diagnosis)', source_url: '', evidence: '"pectinate tibial spurs on meso- and metatibiae" — overturns the doc\'s "0,0"' },
  liometopum:       { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s-p,1p — metatibial spur pectinate' },
  tapinoma:         { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1 (Genus Tapinoma diagnosis)', source_url: '', evidence: '"mid and hind tibiae with very long, sharp apical spur" (simple, not comb-like) → simple or absent' },
  camponotus:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.57 (Genus Camponotus diagnosis)', source_url: '', evidence: '"mid and hind tibiae each with one pectinate spur" (European subgenera; Bolton 2003 worldwide range 1s-p;0,0 overridden)' },
  cataglyphis:      { confidence: 'high',   source: 'Bolton 2003 App. 2 SF 1s,1s; Borowiec & Salata 2022 Vol.1 p.65', source_url: '', evidence: '"simple tibial spurs on meso- and metatibiae" — overturns the doc\'s "pettinata"' },
  colobopsis:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.149 (Genus Colobopsis diagnosis)', source_url: '', evidence: '"mid and hind tibiae each with one pectinate spur" (replaces the inference-from-Camponotus)' },
  formica:          { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s — metatibial spur simple; overturns the doc\'s "pettinata" (the Formicini do not have a pectinate metatibial spur)' },
  lasius:           { confidence: 'high',   source: 'Bolton 2003 App. 2 SF 1s,1s; 0,0; Borowiec & Salata 2022 Vol.1', source_url: '', evidence: '"mid and hind tibiae each with one spur" (simple/reduced) → simple or absent' },
  lepisiota:        { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.224; Bolton 2003 SF 0,0', source_url: '', evidence: '"no tibial pectinate spurs on meso- and metatibia"' },
  nylanderia:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.240 (Genus Nylanderia diagnosis)', source_url: '', evidence: '"tibial spurs on meso- and metatibia simple" (replaces the "dedotto" inference)' },
  paratrechina:     { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.244; Bolton 2003 SF 1s,1s; 0,1s; 0,0', source_url: '', evidence: '"tibial spurs on meso- and metatibia simple" (replaces the "dedotto" inference)' },
  plagiolepis:      { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.245; Bolton 2003 SF 0,0', source_url: '', evidence: '"no tibial spurs on meso- and metatibiae"' },
  polyergus:        { confidence: 'high',   source: 'Bolton 2003, App. 2', source_url: '', evidence: 'SF 1s,1s — metatibial spur simple; overturns the doc\'s "pettinata"' },
  prenolepis:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.244; Bolton 2003 SF 1s,1s', source_url: '', evidence: '"simple tibial spurs on meso- and metatibiae"' },
  leptanilla:       { confidence: 'medium', source: 'Bolton 2003 App. 2; Griebenow 2024 (Leptanillinae revision)', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10838183/', evidence: 'SF spans 1s / 1p / 2(1s,1p) across the genus; Griebenow 2024 worker "metatibial spur formula 2(1s,1p)" — genuinely variable across states 0, 1 and 2 (uninformative, coded honestly)' },
  proceratium:      { confidence: 'high',   source: 'Bolton 2003 App. 2 SF 1p; Baroni Urbani & de Andrade 2003 (quoted in AntWiki)', source_url: '', evidence: '"Metatibia with 1 spur" (Bolton 2003 key); "Tibiae of fore and hind legs with a large, pectinate spur"' },
  stigmatomma:      { confidence: 'medium', source: 'Esteves & Fisher 2016 (Stigmatomma revision)', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4934140/', evidence: '"Number of metatibial spurs: 1–2"; "Two metatibial spurs; anterior spur simple ... posterior spur pectinate" — states 1 and 2' },
};
