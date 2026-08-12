// Test: predictStateImpact is EXACT — issue #32 §2. The -N badge must equal the
// number of genera actually removed when the hypothetical selection is appended
// and the scored set recomputed (brute-force oracle), at every tolerance. The old
// predictor overstated exclusions (out-of-scope-no-data counted as excluded, and
// maxMismatches ignored): gen-32 advertised -7 when clicking removed 1 genus, and
// gen-19 advertised -8 when clicking removed 0.
import { loadData, score, predictStateImpact } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();
let failures = 0;
const log = (ok, msg) => { if (ok) console.log(`  PASS — ${msg}`); else { console.error(`  FAIL — ${msg}`); failures++; } };
console.log('Test: predictStateImpact parity with the scored-set oracle (issue #32 §2)');

const sel = (characterId, value) => ({ characterId, value, weight: 1 });

// The issue's real-world run: 13 phone-photo-readable selections chasing a Lasius
// queen (Belluno). At tolerance 0 this leaves exactly 8 genera.
const LASIUS_RUN = [
  sel('gen-50', '0'), // peduncolo: 1 segmento
  sel('gen-2', '1'),  // capo: non triangolare
  sel('gen-20', '0'), // casta soldato: assente o polimorfismo continuo
  sel('gen-26', '0'), // occhi: ben sviluppati
  sel('gen-5', '0'),  // occhi composti: ovali
  sel('gen-6', '0'),  // mandibole: triangolari
  sel('gen-12', '0'), // propodeo: arrotondato
  sel('gen-10', '1'), // mesosoma: promesonoto più alto del propodeo
  sel('gen-18', '0'), // gastro: ovale
  sel('gen-27', '0'), // livrea: concolore
  sel('gen-21', '2'), // tegumento: bruno
  sel('gen-33', '0'), // maculatura: assente
  sel('gen-47', '0'), // secondo tergite: normale
];
const EXPECTED_8 = ['brachyponera', 'camponotus', 'formica', 'lasius', 'linepithema', 'paratrechina', 'prenolepis', 'tapinoma'];

const r0 = score(LASIUS_RUN, genera, matrixLookup, charById, 0);
log(JSON.stringify(r0.map(sg => sg.genus.id).sort()) === JSON.stringify(EXPECTED_8),
    `Lasius run at tol 0 leaves the issue's 8 genera (got ${r0.length})`);

// Named regressions from the issue, measured on the 8-genus state at tol 0:
log(predictStateImpact('gen-32', '0', r0, matrixLookup, 0) === 1, 'gen-32 "ben sviluppato" predicts 1 (was -7)');
log(predictStateImpact('gen-32', '1', r0, matrixLookup, 0) === 1, 'gen-32 "virtualmente assente" predicts 1 (was -7)');
log(predictStateImpact('gen-19', '0', r0, matrixLookup, 0) === 0, 'gen-19 state 0 predicts 0 (was -8)');
log(predictStateImpact('gen-19', '1', r0, matrixLookup, 0) === 0, 'gen-19 state 1 predicts 0 (was -8)');
log(predictStateImpact('gen-46', '1', r0, matrixLookup, 0) === 4, 'gen-46 "presente" predicts 4 (was -6/-7)');

// '?' is always score-neutral.
log(predictStateImpact('gen-2', '?', r0, matrixLookup, 0) === 0, "selecting '?' predicts 0");

// Brute-force oracle sweep: prediction === |before| - |after| for every unused
// character × every real state × tolerances 0-3, across three scenario states
// (fresh page, a 2-selection start, the full Lasius run).
const SCENARIOS = [
  { name: 'fresh page', sels: [] },
  { name: '2-selection start', sels: [sel('gen-50', '0'), sel('gen-12', '0')] },
  { name: 'Lasius run (13)', sels: LASIUS_RUN },
];
let checked = 0, mismatched = 0;
for (const { name, sels } of SCENARIOS) {
  const usedIds = new Set(sels.map(s => s.characterId));
  for (const tol of [0, 1, 2, 3]) {
    const before = score(sels, genera, matrixLookup, charById, tol);
    for (const char of Object.values(charById)) {
      if (usedIds.has(char.id)) continue;
      for (const st of char.states) {
        const predicted = predictStateImpact(char.id, st.value, before, matrixLookup, tol);
        const after = score([...sels, sel(char.id, st.value)], genera, matrixLookup, charById, tol);
        const actual = before.length - after.length;
        checked++;
        if (predicted !== actual) {
          mismatched++;
          if (mismatched <= 5) console.error(`    MISMATCH [${name}, tol ${tol}] ${char.id}=${st.value}: predicted ${predicted}, actual ${actual}`);
        }
      }
    }
  }
}
log(mismatched === 0, `oracle sweep: prediction exact in ${checked}/${checked} cases across ${SCENARIOS.length} scenarios × tolerances 0-3`);

if (failures === 0) { console.log('\nPASS'); process.exit(0); }
console.error(`\nFAIL — ${failures} assertion(s)`); process.exit(1);
