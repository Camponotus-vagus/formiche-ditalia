// Single source of truth for the Formicinae extension of gen-32 "Squama peziolare"
// (issue #32 §5). The one-time migration that appended the 11 matrix rows generated
// them from this module, and test-gen32-formicinae.mjs imports it — coding and test
// cannot drift apart.
//
// Scope decision (owner-approved 2026-08-12): gen-32 KEEPS subfamily_scope
// "dolichoderinae" (it still contributes to the implied-subfamily quorum as before,
// and PR C's badge marks it), but the Formicinae rows give the character real data
// across 16/42 genera, so answering it can exclude Tapinoma & co. from a Formicinae
// candidate set instead of being pure missing-data noise. This is a bucket-A
// EXCEPTION justified by a dedicated source-coverage pre-screen: unlike the other
// bucket-A axes, the petiolar scale is described for every Formicinae genus by
// Borowiec & Salata 2022 (Ants of Greece Vol. 1) genus diagnoses — 11/11 explicit
// quotes. The internal multi-state redesign (thin/thick/reduced scale vs node) was
// deliberately deferred to a future brainstorm; under the current binary axis all 11
// genera are honestly '0' (ben sviluppato): even the heterogeneous Cataglyphis
// (scale or node by species) and the armed Lepisiota scale are developed petioles,
// nothing approaching Tapinoma's "virtually absent" state 1.
//
// Axis (unchanged): '0' = squama ben sviluppata | '1' = virtualmente assente.

export const STATES = {
  camponotus:   ['0'],
  cataglyphis:  ['0'],
  colobopsis:   ['0'],
  formica:      ['0'],
  lasius:       ['0'],
  lepisiota:    ['0'],
  nylanderia:   ['0'],
  paratrechina: ['0'],
  plagiolepis:  ['0'],
  polyergus:    ['0'],
  prenolepis:   ['0'],
};

export const PROVENANCE = {
  camponotus:   { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.57 (genus diagnosis); Bolton 1994 couplet 17', source_url: '', evidence: '"waist of one segment in form of moderately thick to thin scale"; Bolton: "Petiole a node or scale, never armed with spines or teeth"' },
  cataglyphis:  { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.137 (genus diagnosis)', source_url: '', evidence: '"petiole in form of unarmed scale or node" — species-heterogeneous ("Petiole squamiform" vs "Petiole in form of globular or cubical node"), but always developed, never virtually absent' },
  colobopsis:   { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.149 (genus diagnosis)', source_url: '', evidence: '"waist of one segment in form of thin scale"' },
  formica:      { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.152 (genus diagnosis)', source_url: '', evidence: '"petiole in form of unarmed scale"' },
  lasius:       { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.183 (genus diagnosis)', source_url: '', evidence: '"waist of one segment in form of thin scale"' },
  lepisiota:    { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.224; Bolton 1994 couplet 3', source_url: '', evidence: '"petiole in form of scale bidentate apically"; Bolton: "Dorsal edge of petiole usually armed with a pair of teeth or spines" — developed (armed) scale' },
  nylanderia:   { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.240; AntWiki Nylanderia', source_url: '', evidence: '"Petiole small, in form of thick scale with rounded apex"; AntWiki: "Petiole wedge-shaped (cuneate), never surpassing the height of the propodeum"' },
  paratrechina: { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.244; AntWiki Paratrechina', source_url: '', evidence: '"Petiole small, in form of thick scale with rounded apex"; AntWiki: "petiole cuneate, broadly rounded dorsally"' },
  plagiolepis:  { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.245; AntWiki Plagiolepis', source_url: '', evidence: '"petiole in form of unarmed scale with a shorter anterior face and longer posterior face"; AntWiki: "petiole reduced scale, inclined forward" — reduced but a distinct scale, not virtually absent' },
  polyergus:    { confidence: 'high',   source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.253 (genus diagnosis)', source_url: '', evidence: '"petiole in form of unarmed scale"; "Petiolar scale thick with rounded top"' },
  prenolepis:   { confidence: 'medium', source: 'Borowiec & Salata 2022, Ants of Greece Vol.1, p.255; AntWiki Prenolepis', source_url: '', evidence: '"petiole in form of unarmed scale"; "Petiole with long stem…, scale short"' },
};
