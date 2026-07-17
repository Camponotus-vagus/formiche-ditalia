// Single source of truth for the subpetiolar-process coding (character gen-15, globalised).
// Imported by the one-time migration (writes matrix.json + characters.json + coding-provenance.csv)
// and by test-subpetiolar-honest.mjs, so the coding and the test cannot drift apart.
//
// State set (gen-15):
//   '0' = absent or reduced (at most a small tooth/lobe)
//   '1' = well-developed lobe
//   '2' = well-developed tooth/spine
//   '3' = translucent fenestra (thin, often with a posterior tooth)   [Ponerine, ~Ponera only]
//   '?' = not assessed (off-axis or unsourced form)
//
// Approved by the project owner 2026-07-17. Globalizability guard fired during research and was
// resolved: a dedicated Formicinae pass closed the source gap (Borowiec & Salata 2022 genus
// diagnoses describe the petiole as an "unarmed scale/node", and the monograph reports ventral
// armature when present — so its silence for Formicinae is a citable absence). Two off-axis cells
// remain '?': strumigenys (spongiform appendage, not a lobe/tooth/fenestra) and leptanilla
// (Griebenow 2024 gives "present or absent" with no form).

export const STATES = {
  // Myrmicinae
  aphaenogaster: ['0'], cardiocondyla: ['0'], crematogaster: ['0'], formicoxenus: ['1'],
  harpagoxenus: ['2'], leptothorax: ['0'], manica: ['0'], messor: ['0'], monomorium: ['0'],
  myrmecina: ['0'], myrmica: ['0'], oxyopomyrmex: ['0'], pheidole: ['0'], solenopsis: ['0'],
  stenamma: ['0'], strongylognathus: ['0'], strumigenys: ['?'], temnothorax: ['0', '2'],
  tetramorium: ['0'],
  // Ponerinae
  brachyponera: ['2'], cryptopone: ['1'], hypoponera: ['1'], ponera: ['3'],
  // Dolichoderinae
  bothriomyrmex: ['1'], dolichoderus: ['0'], linepithema: ['1'], liometopum: ['1'], tapinoma: ['1'],
  // Formicinae (all unarmed)
  camponotus: ['0'], cataglyphis: ['0'], colobopsis: ['0'], formica: ['0'], lasius: ['0'],
  lepisiota: ['0'], nylanderia: ['0'], paratrechina: ['0'], plagiolepis: ['0'], polyergus: ['0'],
  prenolepis: ['0'],
  // Leptanillinae / Proceratiinae / Amblyoponinae
  leptanilla: ['?'], proceratium: ['1', '2'], stigmatomma: ['1'],
};

const SPECIFIC = {
  formicoxenus: { confidence: 'high',   source: 'Borowiec & Salata 2025, Ants of Greece Vol.2, p.164', source_url: '', evidence: 'petiole "ventral margin with large, semicircular process" (rounded → lobe); the tooth-like process is on the POSTPETIOLE (gen-44), not the petiole' },
  harpagoxenus: { confidence: 'high',   source: 'Borowiec & Salata 2025, Ants of Greece Vol.2, p.166-168', source_url: '', evidence: 'genus diagnosis "petiole and postpetiole on ventral margin with lamella or spiniform process"; H. sublaevis petiole "anteriorly forming subangulate, triangular process" → tooth/spine' },
  temnothorax:  { confidence: 'high',   source: 'Csősz et al. 2024 (T. apenninicus); Schifani et al. 2025 (T. siculus)', source_url: '', evidence: '"Subpetiolar process well developed, tooth-like" when developed; reduced/absent in the nylanderi group ("without or with a very minimally developed subpetiolar process") → 0 and 2' },
  strumigenys:  { confidence: 'high',   source: 'Bolton 2000 (quoted in Borowiec & Salata 2025 p.417); Bolton 1994 Dacetini key', source_url: '', evidence: 'the petiolar structure is a "spongiform appendage ... ranging from massive to absent", NOT a lobe/tooth/fenestra — off this axis → coded ?' },
  stigmatomma:  { confidence: 'high',   source: 'Hsu et al. 2017, ZooKeys 705 (Stigmatomma)', source_url: 'https://doi.org/10.3897/zookeys.705.10296', evidence: '"Subpetiolar process well developed and lobe-shaped" → lobe' },
  brachyponera: { confidence: 'medium', source: 'Yamane 2007 (quoted in AntWiki Brachyponera)', source_url: '', evidence: '"subpetiolar process with a backward-directed projection ... flat with a round apical margin, and in profile acute apically" — no fenestra, projecting → tooth (interpretive, best-fit)' },
  cryptopone:   { confidence: 'medium', source: 'Csősz, Ponerinae of the Carpathian Basin; Bolton 1994 couplet', source_url: '', evidence: '"subpetiolar process in profile with a simple lobe, without an acute posteroventral angle and lacking an anteroventral fenestra" (grouped with Hypoponera) → lobe' },
  hypoponera:   { confidence: 'high',   source: 'Bolton 1994, Ant genera of the world (Ponerinae couplets); Schmidt & Shattuck 2014', source_url: '', evidence: '"Subpetiolar process in profile a simple lobe, without an acute posteroventral angle and lacking an anterior fenestra ... Hypoponera" → lobe' },
  ponera:       { confidence: 'high',   source: 'Bolton 1994 (Ponerinae couplets); Schmidt & Shattuck 2014', source_url: '', evidence: '"Subpetiolar process in profile with an acute angle posteroventrally and with a fenestra or translucent thin spot anteriorly ... Ponera" → fenestra' },
  bothriomyrmex:{ confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae (AntWiki worker redescription)', source_url: '', evidence: 'PETIOLE: "Venter with a well developed lobe" → lobe' },
  dolichoderus: { confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: 'PETIOLE: "Venter without a lobe" → absent' },
  linepithema:  { confidence: 'high',   source: 'Shattuck 1992; Wild 2007 (Linepithema revision)', source_url: '', evidence: 'PETIOLE: "Venter with a slight to well developed lobe" → lobe' },
  liometopum:   { confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: 'PETIOLE: "Venter with a slight or weakly developed lobe" → lobe' },
  tapinoma:     { confidence: 'high',   source: 'Shattuck 1992, generic revision of Dolichoderinae', source_url: '', evidence: 'PETIOLE: "Venter with a slight to well developed lobe" → lobe' },
  leptanilla:   { confidence: 'medium', source: 'Griebenow 2024, Systematic revision of Leptanillinae (ZooKeys 1189)', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10838183/', evidence: '"Subpetiolar process present or absent" — no form given for the Italian taxon; form unresolvable → coded ?' },
  proceratium:  { confidence: 'medium', source: 'Baroni Urbani & de Andrade 2003 (Proceratium worker redescription, AntWiki)', source_url: '', evidence: '"Ventral petiolar process small or large, truncate, triangular or spiniform" → lobe or tooth (variable), present (never 0/3)' },
};

const FORMICINAE = new Set(['camponotus','cataglyphis','colobopsis','formica','lasius','lepisiota','nylanderia','paratrechina','plagiolepis','polyergus','prenolepis']);
const FORM_DEFAULT = { confidence: 'high', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1 (Formicinae genus diagnoses)', source_url: '', evidence: 'petiole "in form of unarmed scale or node" — no ventral process; the monograph reports ventral petiolar armature where present, so its silence here is a sourced absence (Lepisiota medium: bidentate apex is dorsal)' };
const MYRM_DEFAULT = { confidence: 'medium', source: 'thesis matrix (Caratteri formiche TESI.xlsx) + Bolton 1994', source_url: '', evidence: 'sternite of petiole at most with a small anteroventral tooth — no well-developed subpetiolar process (plesiomorphic default for this Myrmicinae genus)' };

// Derive the key list from STATES so PROVENANCE can never drift out of sync with the coding.
export const PROVENANCE = Object.fromEntries(
  Object.keys(STATES).map(g => [g, SPECIFIC[g] || (FORMICINAE.has(g) ? FORM_DEFAULT : MYRM_DEFAULT)])
);
