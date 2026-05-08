// Test for P3 fix: '?' state must not penalize the score.
// Spec (guida_chiave_multi_accesso.md, Sez. 4 + 6.1):
//   "?" o "U" — Sconosciuto. Sempre sopravvive a qualsiasi filtro (approccio conservativo).
//   if "?" in taxon_states: continue  # sconosciuto: non penalizzato
//
// Property under test:
//   Adding a character to the selection where the target genus has '?' must NOT
//   change the genus's score, since the '?' character carries no information for
//   that genus and should be treated as if it weren't selected.
//
// Fixture: cardiocondyla (myrmicinae) has gen-3=["4"] and gen-7=["?"].
//   - selA = [gen-3=4]               → cardiocondyla matches gen-3 fully.
//   - selB = [gen-3=4, gen-7=3]      → adds a char where cardiocondyla has '?'.
//   Expected: scoreA == scoreB for cardiocondyla.

import { loadData, score } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();

const selA = [
  { characterId: 'gen-3', value: '4', weight: 1 },
];
const selB = [
  { characterId: 'gen-3', value: '4', weight: 1 },
  { characterId: 'gen-7', value: '3', weight: 1 },
];

const rankedA = score(selA, genera, matrixLookup, charById, 1);
const rankedB = score(selB, genera, matrixLookup, charById, 1);

const cardA = rankedA.find(r => r.genus.id === 'cardiocondyla');
const cardB = rankedB.find(r => r.genus.id === 'cardiocondyla');

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test P3: \'?\' must not penalize score');

log(!!cardA, `cardiocondyla survives selA tolerance=1`);
log(!!cardB, `cardiocondyla survives selB tolerance=1`);

if (cardA && cardB) {
  log(cardA.mismatches === 0, `cardiocondyla mismatches=0 in selA (got ${cardA.mismatches})`);
  log(cardB.mismatches === 0, `cardiocondyla mismatches=0 in selB (got ${cardB.mismatches})`);
  log(
    Math.abs(cardA.score - cardB.score) < 1e-9,
    `cardiocondyla score unchanged when adding '?' char: selA=${cardA.score.toFixed(6)}, selB=${cardB.score.toFixed(6)}`
  );
}

if (failures === 0) {
  console.log('\nP3 PASS — \'?\' is correctly neutral');
  process.exit(0);
} else {
  console.error(`\nP3 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
