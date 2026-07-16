// Regression test for the honest mandibular-teeth-count merge (gen-7, globalized 2026-07-16).
// Two assertions, data-driven over all 42 genera, with expected bins derived from the
// documented ranges in dentition-bins.mjs — NOT from the cell under test, or the check would
// be tautological (`values.includes()` true by construction) and pass while the defect is
// present. This exists so a future edit that reintroduces false precision (e.g. coding Formica
// as '>=7' and excluding 6, the bug this merge removed) fails loudly.
import { loadData, score } from './simulator.mjs';
import { RANGES, binsForRange } from './dentition-bins.mjs';

const { genera, matrixLookup, charById } = loadData();

let failures = 0;
const fail = (m) => { console.error(`  FAIL — ${m}`); failures++; };
console.log('Test: gen-7 mandibular-teeth-count codings are honest');

// gen-38 must be gone (merged into gen-7)
if (charById['gen-38']) fail("gen-38 still exists — it must be merged into gen-7");
if (charById['gen-7']?.subfamily_scope !== null) fail('gen-7 is not global (subfamily_scope should be null)');

for (const g of genera) {
  const range = RANGES[g.id];
  if (!range) { fail(`${g.id}: no entry in RANGES`); continue; }
  const cell = matrixLookup[g.id]?.['gen-7'];
  if (!cell) { fail(`${g.id}: no gen-7 coding`); continue; }
  const expected = binsForRange(range);          // derived from the RANGE, independent of the cell

  // 1. Source agreement — the coded bins equal the bins the documented range implies.
  const got = cell.slice().sort();
  if (JSON.stringify(got) !== JSON.stringify(expected))
    fail(`${g.id}: coded [${got}] but range ${range[0]}-${range[1]} implies [${expected}]`);

  // 2. No false exclusion — every state within the documented range keeps the genus scored.
  for (const st of expected) {
    const r = score([{ characterId: 'gen-7', value: st }], genera, matrixLookup, charById);
    if (!r.some(x => x.genus.id === g.id))
      fail(`${g.id}: state ${st} (inside its own range ${range[0]}-${range[1]}) excludes it`);
  }
}

if (failures === 0) {
  console.log(`  PASS — all ${genera.length} genera coded from their documented TDC range, none self-excluded`);
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} problem(s)`);
  process.exit(1);
}
