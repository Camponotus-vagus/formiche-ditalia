// Item 3.3: data-integrity CI check for the identification matrix.
// Runs as part of the key-audit suite (node run-tests.mjs) so every matrix/character
// edit is validated. Catches exactly the class of defects the audit originally found
// (undeclared '?' values, orphan rows, indistinguishable pairs) BEFORE they reach the
// live site.
//
// Checks (all hard failures):
//   1. No undeclared state values — every matrix value is a declared state of its
//      character, or a whitelisted meta-code ('?' unknown, '-' inapplicable, 'NA').
//   2. No orphan matrix rows — every row references an existing genus AND character.
//   3. No duplicate (genus, character) rows.
//   4. No empty state_values arrays.
//   5. No genus without any matrix data.
//   6. Every character resolves ≥1 pair — has ≥2 distinct real (non-meta) states
//      across the genera that have data (a character with <2 is dead weight).
//   7. Per-subfamily separability — no two genera in the same subfamily share an
//      identical profile (pairwise distance 0 with shared evidence).

import { loadData } from './simulator.mjs';
import { pairwiseReport } from './pairwise-distance.mjs';

const { characters, matrix, genera, matrixLookup } = loadData();
const SPECIAL = new Set(['?', '-', 'NA']); // meta-codes, not real states

let failures = 0;
const fail = (msg) => { console.error('  FAIL — ' + msg); failures++; };
const pass = (msg) => console.log('  PASS — ' + msg);

console.log('Test 3.3: data integrity');

// 1. No undeclared state values
const declared = Object.fromEntries(characters.map(c => [c.id, new Set((c.states || []).map(s => s.value))]));
const undeclared = [];
for (const e of matrix) {
  const d = declared[e.character_id];
  if (!d) continue; // orphan char id handled by check 2
  for (const v of e.state_values) {
    if (!d.has(v) && !SPECIAL.has(v)) undeclared.push(`${e.genus_id}/${e.character_id}=${v}`);
  }
}
undeclared.length
  ? fail(`undeclared state values: ${undeclared.length} (${undeclared.slice(0, 8).join(', ')}${undeclared.length > 8 ? '…' : ''})`)
  : pass('no undeclared state values (all matrix values are declared states or ?/-/NA)');

// 2. No orphan matrix rows
const genusIds = new Set(genera.map(g => g.id));
const charIds = new Set(characters.map(c => c.id));
const orphanRows = matrix.filter(e => !genusIds.has(e.genus_id) || !charIds.has(e.character_id));
orphanRows.length
  ? fail(`orphan matrix rows: ${orphanRows.length} (${orphanRows.slice(0, 6).map(e => e.genus_id + '/' + e.character_id).join(', ')})`)
  : pass('no orphan matrix rows (all reference an existing genus + character)');

// 3. No duplicate (genus, character) rows
const seen = new Set();
const dups = new Set();
for (const e of matrix) {
  const k = e.genus_id + '|' + e.character_id;
  if (seen.has(k)) dups.add(k); else seen.add(k);
}
dups.size
  ? fail(`duplicate (genus,character) rows: ${dups.size} (${[...dups].slice(0, 6).join(', ')})`)
  : pass('no duplicate (genus,character) rows');

// 4. No empty state_values
const empties = matrix.filter(e => !Array.isArray(e.state_values) || e.state_values.length === 0);
empties.length
  ? fail(`empty state_values arrays: ${empties.length}`)
  : pass('no empty state_values arrays');

// 5. No genus without matrix data
const usedG = new Set(matrix.map(e => e.genus_id));
const orphanG = genera.filter(g => !usedG.has(g.id));
orphanG.length
  ? fail(`genera with no matrix data: ${orphanG.map(g => g.id).join(', ')}`)
  : pass(`all ${genera.length} genera have matrix data`);

// 6. Every character resolves ≥1 pair (≥2 distinct real states)
const dead = [];
for (const c of characters) {
  const vals = new Set();
  for (const g of genera) {
    const v = matrixLookup[g.id]?.[c.id];
    if (!v) continue;
    for (const x of v) if (!SPECIAL.has(x)) vals.add(x);
  }
  if (vals.size < 2) dead.push(`${c.id}(${vals.size})`);
}
dead.length
  ? fail(`characters with <2 distinct real states (resolve no pair): ${dead.join(', ')}`)
  : pass('every character has ≥2 distinct real states (resolves ≥1 pair)');

// 7. Per-subfamily separability
const { all } = pairwiseReport(characters, genera, matrixLookup, 0);
const sameSfIdentical = all.filter(r => r.sameSubfamily && r.differences === 0 && r.comparable > 0);
sameSfIdentical.length
  ? fail(`same-subfamily identical-profile pairs: ${sameSfIdentical.map(r => r.a + '×' + r.b).join(', ')}`)
  : pass('every subfamily: all genera pairwise-separable (no identical profiles)');

if (failures === 0) {
  console.log('\n3.3 PASS — matrix data integrity holds');
  process.exit(0);
} else {
  console.error(`\n3.3 FAIL — ${failures} integrity check(s) failed`);
  process.exit(1);
}
