// Test: gen-52 sting-condition codings are honest (issue #32 §4).
// Imports the same single-source-of-truth module the migration used, so the coding
// and the test that checks it cannot drift apart (pattern of test-spur-honest.mjs).
import { loadData, score } from './simulator.mjs';
import { STATES } from './sting-states.mjs';

const { genera, characters, matrixLookup, charById } = loadData();
let failures = 0;
console.log('Test: gen-52 sting-condition codings are honest');

// Structural guards: gen-52 exists, is global and easy (the whole point of the axis is
// a naked-eye, subfamily-free discriminator); gen-19 is renamed so no two characters
// share the name "Pungiglione" (P1 uniqueness).
const gen52 = characters.find(c => c.id === 'gen-52');
if (!gen52) { console.error('  FAIL — gen-52 must exist'); failures++; }
if (gen52 && gen52.subfamily_scope !== null) { console.error('  FAIL — gen-52 must be global (subfamily_scope: null)'); failures++; }
if (gen52 && gen52.difficulty !== 'easy') { console.error('  FAIL — gen-52 must be easy'); failures++; }
if (gen52 && !['0', '1', '2', '?'].every(v => gen52.states.some(s => s.value === v))) {
  console.error('  FAIL — gen-52 must declare states 0/1/2/?'); failures++;
}
const gen19 = characters.find(c => c.id === 'gen-19');
if (!gen19 || gen19.name_it === 'Pungiglione') {
  console.error('  FAIL — gen-19 must be renamed (apico-dorsal appendage), not "Pungiglione"'); failures++;
}
if (gen19 && gen19.subfamily_scope !== 'myrmicinae') {
  console.error('  FAIL — gen-19 must stay Myrmicinae-scoped'); failures++;
}

// No '-' and no '?' cells by design: a sting-condition verdict exists for every genus.
for (const g of genera) {
  const cell = matrixLookup[g.id]?.['gen-52'];
  const expected = STATES[g.id];
  if (!expected) { console.error(`  FAIL — ${g.id}: not in sting-states.mjs`); failures++; continue; }

  // 1. Source agreement: matrix cell equals the approved, sourced coding.
  const norm = (a) => JSON.stringify(a?.slice().sort());
  if (norm(cell) !== norm(expected)) {
    console.error(`  FAIL — ${g.id}: coded [${cell}] but approved table says [${expected}]`);
    failures++; continue;
  }
  if (cell.includes('?') || cell.includes('-')) {
    console.error(`  FAIL — ${g.id}: gen-52 must carry a real verdict, found meta-code [${cell}]`);
    failures++; continue;
  }

  // 2. No false exclusion: every real state a genus carries must keep it in the candidate set.
  for (const st of expected) {
    const r = score([{ characterId: 'gen-52', value: st }], genera, matrixLookup, charById);
    if (!r.some(x => x.genus.id === g.id)) {
      console.error(`  FAIL — ${g.id}: excluded by state ${st}, which is one of its own coded states`);
      failures++;
    }
  }
}

// 3. The axis does what the issue asked: answering "1" (acidopore) must leave ONLY
// Formicinae; answering "0" must exclude every Formicinae and every Dolichoderinae.
const r1 = score([{ characterId: 'gen-52', value: '1' }], genera, matrixLookup, charById);
if (!(r1.length > 0 && r1.every(x => x.genus.subfamily_id === 'formicinae'))) {
  console.error('  FAIL — state 1 (acidopore) must leave only Formicinae'); failures++;
}
const r0 = score([{ characterId: 'gen-52', value: '0' }], genera, matrixLookup, charById);
if (r0.some(x => x.genus.subfamily_id === 'formicinae' || x.genus.subfamily_id === 'dolichoderinae')) {
  console.error('  FAIL — state 0 (stinging) must exclude all Formicinae and Dolichoderinae'); failures++;
}

process.exit(failures === 0 ? (console.log(`  PASS — ${genera.length} genera`), 0) : 1);
