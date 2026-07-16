// Single source of truth for the mandibular-teeth-count coding (gen-7, globalized).
// Imported by BOTH the migration and test-dentition-honest.mjs, so the coding and the
// test that checks it cannot drift apart.
//
// The axis is Bolton's Total Dental Count (TDC): "the total number of teeth and denticles
// on the masticatory (apical) margin of the mandible" (Bolton 2003). Values are [lo, hi]
// on that margin only — Bolton's parenthetical basal-margin counts are excluded.
// Population: Italian fauna, all worker castes. Where a European species-level source
// covers the Italian fauna it supersedes Bolton's world-genus range (recorded in
// coding-provenance.csv). null would mean a judgement cell coded '?'; none remain.
export const RANGES = {
  // Myrmicinae
  aphaenogaster: [7, 16], cardiocondyla: [5, 5], crematogaster: [4, 5], formicoxenus: [5, 6],
  harpagoxenus: [0, 0], leptothorax: [5, 6], manica: [10, 16], messor: [6, 18],
  monomorium: [3, 5], myrmecina: [7, 9], myrmica: [6, 10], oxyopomyrmex: [7, 8],
  pheidole: [3, 18], solenopsis: [3, 4], stenamma: [6, 9], strongylognathus: [0, 1],
  strumigenys: [6, 14], temnothorax: [5, 6], tetramorium: [6, 11],
  // Formicinae
  camponotus: [4, 9], colobopsis: [4, 9], cataglyphis: [5, 7], formica: [7, 10],
  lasius: [6, 10], lepisiota: [5, 6], nylanderia: [6, 7], paratrechina: [5, 5],
  plagiolepis: [5, 5], polyergus: [0, 1], prenolepis: [6, 7],
  // Ponerinae
  cryptopone: [6, 8], hypoponera: [7, 18], ponera: [12, 17], brachyponera: [9, 9],
  // Dolichoderinae
  bothriomyrmex: [5, 6], dolichoderus: [5, 6], linepithema: [12, 18], liometopum: [7, 10],
  tapinoma: [5, 20],
  // Amblyoponinae / Proceratiinae / Leptanillinae
  stigmatomma: [7, 9], proceratium: [4, 6], leptanilla: [4, 4],
};

// Bin edges: 0 = 0-1 | 1 = 2-3 | 2 = 4-5 | 3 = 6-9 | 4 = 10+
export function binsForRange([lo, hi]) {
  const binOf = (n) => (n <= 1 ? '0' : n <= 3 ? '1' : n <= 5 ? '2' : n <= 9 ? '3' : '4');
  const out = new Set();
  for (let n = lo; n <= hi; n++) out.add(binOf(n));
  return [...out].sort();
}
