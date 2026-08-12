// Test: the Formicinae extension of gen-32 (Squama peziolare) matches the approved,
// sourced coding — issue #32 §5, owner-approved bucket-A exception (source-coverage
// pre-screen: 11/11 explicit petiole clauses in Borowiec & Salata 2022 Greece Vol.1).
// Imports the same module the migration used (single-source-of-truth pattern).
import { loadData, score } from './simulator.mjs';
import { STATES } from './gen32-formicinae-states.mjs';

const { genera, characters, matrixLookup, charById } = loadData();
let failures = 0;
console.log('Test: gen-32 Formicinae rows are honest');

// Scope decision guard: gen-32 deliberately KEEPS its dolichoderinae scope (owner
// call) — the rows add data, not a globalization.
const gen32 = characters.find(c => c.id === 'gen-32');
if (!gen32 || gen32.subfamily_scope !== 'dolichoderinae') {
  console.error('  FAIL — gen-32 must keep subfamily_scope "dolichoderinae"'); failures++;
}

const formicinae = genera.filter(g => g.subfamily_id === 'formicinae');
if (formicinae.length !== Object.keys(STATES).length) {
  console.error(`  FAIL — STATES covers ${Object.keys(STATES).length} genera, Formicinae are ${formicinae.length}`); failures++;
}

const norm = (a) => JSON.stringify(a?.slice().sort());
for (const g of formicinae) {
  const cell = matrixLookup[g.id]?.['gen-32'];
  const expected = STATES[g.id];
  if (!expected) { console.error(`  FAIL — ${g.id}: not in gen32-formicinae-states.mjs`); failures++; continue; }
  if (norm(cell) !== norm(expected)) {
    console.error(`  FAIL — ${g.id}: coded [${cell}] but approved table says [${expected}]`);
    failures++; continue;
  }
  // No false exclusion.
  for (const st of expected) {
    const r = score([{ characterId: 'gen-32', value: st }], genera, matrixLookup, charById);
    if (!r.some(x => x.genus.id === g.id)) {
      console.error(`  FAIL — ${g.id}: excluded by state ${st}, one of its own coded states`); failures++;
    }
  }
}

// The point of the extension: from a mixed Formicinae+Dolichoderinae set, answering
// "squama ben sviluppata" (0) must now exclude Tapinoma (coded 1) while keeping every
// Formicinae — previously the 11 Formicinae had no row and only Tapinoma/Linepithema
// carried data.
const r0 = score([{ characterId: 'gen-32', value: '0' }], genera, matrixLookup, charById);
if (!formicinae.every(g => r0.some(x => x.genus.id === g.id))) {
  console.error('  FAIL — state 0 must keep all Formicinae'); failures++;
}
if (r0.some(x => x.genus.id === 'tapinoma')) {
  console.error('  FAIL — state 0 must exclude tapinoma (coded 1)'); failures++;
}

process.exit(failures === 0 ? (console.log(`  PASS — ${formicinae.length} Formicinae rows`), 0) : 1);
