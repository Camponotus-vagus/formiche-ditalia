// Test for Step 2: the myrmicinae triplet leptothorax/temnothorax/formicoxenus
// must be pairwise distinguishable in the matrix.
//
// Pre-fix state (verified by the pairwise audit):
//   pairwiseDistance(leptothorax, temnothorax)  → differences=0 over 19 comparable
//   pairwiseDistance(formicoxenus, temnothorax) → differences=0 over 19 comparable
//   pairwiseDistance(leptothorax, formicoxenus) → differences=0 over (likely 19) comparable
//
// Post-fix expectation (after adding gen-43 clipeo + gen-44 spina postpetiolare,
// sourced from Qian & Xu 2024 + Seifert 2023):
//   - clipeo (gen-43) splits temnothorax (state 1, convex) from {leptothorax, formicoxenus}
//     (both state 0, depressed)
//   - spina postpetiolare (gen-44) splits formicoxenus (state 0, with spine) from
//     leptothorax (state 1, no spine); temnothorax marked '?' (not sourced verbatim)
//   - Combined: every pair has at least one comparable character with disjoint
//     defined-state sets, so all three pairwise distances must be ≥ 1.

import { loadData } from './simulator.mjs';
import { pairwiseDistance } from './pairwise-distance.mjs';

const { characters, matrixLookup } = loadData();

const triplet = [
  ['leptothorax', 'temnothorax'],
  ['leptothorax', 'formicoxenus'],
  ['temnothorax', 'formicoxenus'],
];

let failures = 0;
console.log('Test Step 2: myrmicinae triplet resolution');

for (const [a, b] of triplet) {
  const r = pairwiseDistance(a, b, characters, matrixLookup);
  const ok = r.differences > 0;
  if (ok) console.log(`  PASS — ${a} × ${b}: differences=${r.differences}, comparable=${r.comparable}`);
  else { console.error(`  FAIL — ${a} × ${b}: differences=${r.differences}, comparable=${r.comparable} (still indistinguishable)`); failures++; }
}

if (failures === 0) {
  console.log('\nStep 2 PASS — triplet is pairwise distinguishable');
  process.exit(0);
} else {
  console.error(`\nStep 2 FAIL — ${failures} pair(s) still at distance 0`);
  process.exit(1);
}
