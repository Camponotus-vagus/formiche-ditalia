// Test for P6: pairwise distance computation per guide Sez. 8.2.
// Spec:
//   distance(A, B) = number of characters where states_A and states_B are disjoint
//                    (after excluding 'NA' and '?' from both sets, then skipping if
//                     either is empty — "not comparable on this character").
//
// Known invariants (cross-checked against sanity.mjs):
//   - nylanderia and paratrechina have IDENTICAL profiles (sanity output) →
//     pairwiseDistance must be 0.
//   - aphaenogaster vs messor (both myrmicinae, distinct profiles in sanity) →
//     pairwiseDistance must be > 0.
//   - self-pair → 0.
//   - return value must include both `differences` and `comparable` (number of
//     characters where both genera had non-empty defined state sets).

import { loadData } from './simulator.mjs';
import { pairwiseDistance } from './pairwise-distance.mjs';

const { characters, matrixLookup } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test P6: pairwise distance');

const npResult = pairwiseDistance('nylanderia', 'paratrechina', characters, matrixLookup);
log(typeof npResult === 'object' && 'differences' in npResult && 'comparable' in npResult,
    `result shape {differences, comparable} (got ${JSON.stringify(npResult)})`);
log(npResult.differences === 0,
    `nylanderia vs paratrechina differences=0 (got ${npResult.differences})`);
log(npResult.comparable > 0,
    `nylanderia vs paratrechina comparable>0 (got ${npResult.comparable})`);

const amResult = pairwiseDistance('aphaenogaster', 'messor', characters, matrixLookup);
log(amResult.differences > 0,
    `aphaenogaster vs messor differences>0 (got ${amResult.differences})`);

const selfResult = pairwiseDistance('aphaenogaster', 'aphaenogaster', characters, matrixLookup);
log(selfResult.differences === 0,
    `self pair (aphaenogaster vs aphaenogaster) differences=0 (got ${selfResult.differences})`);

if (failures === 0) {
  console.log('\nP6 PASS — pairwise distance is correct');
  process.exit(0);
} else {
  console.error(`\nP6 FAIL — ${failures} assertion(s)`);
  process.exit(1);
}
