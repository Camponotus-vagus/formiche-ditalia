import { loadData, score } from './simulator.mjs';
import { STATES } from './subpetiolar-states.mjs';

const { genera, characters, matrixLookup, charById } = loadData();
let failures = 0;
console.log('Test: gen-15 subpetiolar-process codings are honest');

// Structural guards (mirror test-spur-honest.mjs): the merge globalised gen-15 and
// removed gen-25. A regression that de-globalised gen-15 or re-added gen-25 must fail here.
const gen15 = characters.find(c => c.id === 'gen-15');
if (!gen15 || gen15.subfamily_scope !== null) {
  console.error('  FAIL — gen-15 must exist and be global (subfamily_scope: null)'); failures++;
}
if (characters.some(c => c.id === 'gen-25')) {
  console.error('  FAIL — gen-25 must be removed (merged into gen-15)'); failures++;
}

for (const g of genera) {
  const cell = matrixLookup[g.id]?.['gen-15'];
  const expected = STATES[g.id];
  if (!expected) { console.error(`  FAIL — ${g.id}: not in subpetiolar-states.mjs`); failures++; continue; }

  // 1. Source agreement: matrix cell equals the approved, sourced coding.
  const norm = (a) => JSON.stringify(a?.slice().sort());
  if (norm(cell) !== norm(expected)) {
    console.error(`  FAIL — ${g.id}: coded [${cell}] but approved table says [${expected}]`);
    failures++; continue;
  }

  // 2. No false exclusion: every real state a genus carries must keep it in the candidate set.
  for (const st of expected) {
    if (st === '?') continue;   // '?' is score-neutral, nothing to assert; skip only this state
    const r = score([{ characterId: 'gen-15', value: st }], genera, matrixLookup, charById);
    if (!r.some(x => x.genus.id === g.id)) {
      console.error(`  FAIL — ${g.id}: excluded by state ${st}, which is one of its own coded states`);
      failures++;
    }
  }
}
process.exit(failures === 0 ? (console.log(`  PASS — ${genera.length} genera`), 0) : 1);
