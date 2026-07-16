// Genus pairs the multi-access key cannot separate with a single discrete character —
// documented and accepted, not papered over with false precision. The audit tests import
// this so the exception is explicit and reviewable, never silent.
//
// lasius × nylanderia (both Formicinae): their variation envelopes overlap on every
// discrete matrix character — mandibular teeth (both reach 6-7), scape erect setae
// (Lasius is {0,1} across its subgenera), cuticle colour, livery. In myrmecology these two
// are told apart by a COMBINATION of quantitative traits (scape index, eye position, palp
// proportions), which the disjoint-set model of a multi-access key cannot represent.
// The tie surfaced on 2026-07-16 when gen-7 (mandibular teeth) was recoded honestly from
// Bolton 2003 TDC + Mediterranean monographs, retiring a prior false-precision coding that
// had spuriously separated them (it excluded 6 teeth from Lasius and 7 from Nylanderia,
// inventing a gap where the two genera in fact overlap). Both Italian Nylanderia species
// are exotic, so the ambiguity is low-frequency in practice. See coding-provenance.csv.
export const KNOWN_UNRESOLVED_PAIRS = [
  ['lasius', 'nylanderia'],
];

export function isKnownUnresolved(a, b) {
  return KNOWN_UNRESOLVED_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// A guided-path result is acceptable if the genus resolves uniquely, OR its only remaining
// within-subfamily tie is a documented known-unresolved partner.
export function convergenceAccepted(id, uniqLike) {
  if (uniqLike.ok ?? uniqLike.unique) return true;
  const tied = uniqLike.tiedWith;
  return uniqLike.reason === 'tied-within-subfamily' && Array.isArray(tied) && tied.length > 0
    && tied.every(t => isKnownUnresolved(id, t));
}
