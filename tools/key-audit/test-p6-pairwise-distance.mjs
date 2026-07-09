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
//   - WITHIN-SUBFAMILY GUARD (globalized-key design, 2026-07-09): no two genera of the
//     SAME subfamily may have differences === 0 while comparable > 0 (a true
//     indistinguishable). Cross-subfamily pairs are intentionally NOT flagged: after
//     character globalization, genera of different subfamilies share the global
//     characters as comparable ground and may legitimately tie on them — in the key
//     they are separated by the subfamily mechanism (>=2-concordant impliedSubfamily) +
//     subfamily-scoped characters, not by shared-character distance. See
//     docs/superpowers/specs/2026-07-09-character-globalization-design.md §6.

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

// Within-subfamily guard: no real indistinguishable pair OF THE SAME SUBFAMILY
// (differences=0 with shared evidence). Cross-subfamily ties are acceptable by design
// (see header note) — they are broken by the subfamily mechanism, not shared-character
// distance.
const subById = Object.fromEntries(genera.map(g => [g.id, g.subfamily_id]));
const { all } = pairwiseReport(characters, genera, matrixLookup, 2);
const trueIndistinguishable = all.filter(
  r => r.differences === 0 && r.comparable > 0 && subById[r.a] === subById[r.b]);
log(trueIndistinguishable.length === 0,
    `no SAME-subfamily pair with differences=0 & comparable>0 (found ${trueIndistinguishable.length}${
      trueIndistinguishable.length ? ': ' + trueIndistinguishable.map(r => `${r.a}×${r.b}`).join(', ') : ''})`);

if (failures === 0) {
  console.log('\nP6 PASS — pairwise distance is correct and no true indistinguishable pair remains');
  process.exit(0);
} else {
  console.error(`\nP6 FAIL — ${failures} assertion(s)`);
  process.exit(1);
}
