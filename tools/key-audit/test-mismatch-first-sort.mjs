// Test: tolerance defaults to 0 and tolerated genera never outrank fully matching
// ones — issue #32 §3. At tolerance 1 the old sort (score-only) ranked Aphaenogaster/
// Messor/Monomorium (Myrmicinae contradicting the user's "1 waist segment" answer,
// but with full data coverage) ABOVE Lasius, the genus every answer agreed with:
// missing data was penalised while contradicted data was forgiven. The sort is now
// mismatches asc, then score desc; score() also reports mismatchedCharIds so the UI
// can say WHICH answer a tolerated genus contradicts.
import { loadData, score } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();
let failures = 0;
const log = (ok, msg) => { if (ok) console.log(`  PASS — ${msg}`); else { console.error(`  FAIL — ${msg}`); failures++; } };
console.log('Test: mismatch-first ranking and tolerance-0 default (issue #32 §3)');

const sel = (characterId, value) => ({ characterId, value, weight: 1 });

// The issue's 13-selection Lasius run (phone-photo-readable characters only).
const LASIUS_RUN = [
  sel('gen-50', '0'), sel('gen-2', '1'), sel('gen-20', '0'), sel('gen-26', '0'),
  sel('gen-5', '0'), sel('gen-6', '0'), sel('gen-12', '0'), sel('gen-10', '1'),
  sel('gen-18', '0'), sel('gen-27', '0'), sel('gen-21', '2'), sel('gen-33', '0'),
  sel('gen-47', '0'),
];

// (a) Ranking invariant at every tolerance: mismatches never decrease down the list.
for (const tol of [1, 2, 3]) {
  const ranked = score(LASIUS_RUN, genera, matrixLookup, charById, tol);
  let monotone = true;
  for (let i = 1; i < ranked.length; i++) {
    if (ranked[i].mismatches < ranked[i - 1].mismatches) { monotone = false; break; }
  }
  log(monotone, `tolerance ${tol}: mismatch count is non-decreasing down the ranking`);
}

// (b) The named regression: at tolerance 1, every 0-mismatch genus (incl. lasius)
// ranks above every 1-mismatch genus (incl. the three Myrmicinae that previously won).
const r1 = score(LASIUS_RUN, genera, matrixLookup, charById, 1);
const firstTolerated = r1.findIndex(sg => sg.mismatches > 0);
const lastClean = r1.map(sg => sg.mismatches).lastIndexOf(0);
log(firstTolerated === -1 || lastClean < firstTolerated,
    'tol 1: no contradicting genus above any fully matching one');
const pos = (id) => r1.findIndex(sg => sg.genus.id === id);
for (const myrm of ['aphaenogaster', 'messor', 'monomorium']) {
  if (pos(myrm) === -1) continue; // may not survive other filters — fine
  log(pos('lasius') < pos(myrm), `lasius ranks above ${myrm} at tolerance 1 (was below)`);
}

// (c) mismatchedCharIds names exactly the contradicted character(s).
const aph = r1.find(sg => sg.genus.id === 'aphaenogaster');
if (aph) {
  log(aph.mismatches === aph.mismatchedCharIds.length,
      'mismatchedCharIds length equals the mismatch count');
  log(aph.mismatchedCharIds.includes('gen-50'),
      `aphaenogaster's contradiction is gen-50 (waist segments) — got [${aph.mismatchedCharIds}]`);
} else {
  console.log('  SKIP — aphaenogaster not in the tol-1 set');
}

// (d) Default tolerance is 0: calling score() without the param must filter every
// genus that contradicts any answer.
const rDefault = score(LASIUS_RUN, genera, matrixLookup, charById);
log(rDefault.every(sg => sg.mismatches === 0), 'score() default tolerance is 0 (no tolerated genus in the set)');
log(!rDefault.some(sg => sg.genus.id === 'aphaenogaster'), 'aphaenogaster is excluded by default');
log(rDefault.some(sg => sg.genus.id === 'lasius'), 'lasius survives by default');

if (failures === 0) { console.log('\nPASS'); process.exit(0); }
console.error(`\nFAIL — ${failures} assertion(s)`); process.exit(1);
