// Test for P6: pairwise distance computation per guide Sez. 8.2.
// Spec:
//   distance(A, B) = number of characters where states_A and states_B are disjoint
//                    (after excluding 'NA' and '?' from both sets, then skipping if
//                     either is empty — "not comparable on this character").
//
// Invariants:
//   - Result shape includes both `differences` and `comparable`.
//   - self-pair → differences = 0.
//   - Two genera with distinct profiles (aphaenogaster vs messor) → differences > 0.
//   - nylanderia vs paratrechina → differences > 0. NOTE: pre-Step-4 these had
//     IDENTICAL profiles (distance 0); Step 4 (2026-07-07) added gen-45/gen-46
//     specifically to separate the Formicinae trio, so they must now DIFFER. This
//     assertion was updated from `=== 0` to `> 0` at that point.
//   - GLOBAL GUARD (self-validating, mirrors sanity.mjs "0 identical-profile pairs"):
//     no genus pair may have differences === 0 while comparable > 0. Such a pair is a
//     true indistinguishable — two genera sharing evidence yet disjoint on nothing.
//     This turns P6 into a live regression net for every future matrix edit.

import { loadData } from './simulator.mjs';
import { pairwiseDistance, pairwiseReport } from './pairwise-distance.mjs';

const { characters, genera, matrixLookup } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test P6: pairwise distance');

const npResult = pairwiseDistance('nylanderia', 'paratrechina', characters, matrixLookup);
log(typeof npResult === 'object' && 'differences' in npResult && 'comparable' in npResult,
    `result shape {differences, comparable} (got ${JSON.stringify(npResult)})`);
log(npResult.differences > 0,
    `nylanderia vs paratrechina differences>0 post-Step-4 (got ${npResult.differences})`);
log(npResult.comparable > 0,
    `nylanderia vs paratrechina comparable>0 (got ${npResult.comparable})`);

const amResult = pairwiseDistance('aphaenogaster', 'messor', characters, matrixLookup);
log(amResult.differences > 0,
    `aphaenogaster vs messor differences>0 (got ${amResult.differences})`);

const selfResult = pairwiseDistance('aphaenogaster', 'aphaenogaster', characters, matrixLookup);
log(selfResult.differences === 0,
    `self pair (aphaenogaster vs aphaenogaster) differences=0 (got ${selfResult.differences})`);

// Global guard: no real indistinguishable pair (differences=0 with shared evidence).
const { all } = pairwiseReport(characters, genera, matrixLookup, 2);
const trueIndistinguishable = all.filter(r => r.differences === 0 && r.comparable > 0);
log(trueIndistinguishable.length === 0,
    `no genus pair with differences=0 & comparable>0 (found ${trueIndistinguishable.length}${
      trueIndistinguishable.length ? ': ' + trueIndistinguishable.map(r => `${r.a}×${r.b}`).join(', ') : ''})`);

if (failures === 0) {
  console.log('\nP6 PASS — pairwise distance is correct and no true indistinguishable pair remains');
  process.exit(0);
} else {
  console.error(`\nP6 FAIL — ${failures} assertion(s)`);
  process.exit(1);
}
