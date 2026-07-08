// Test for item 3.1: the '-' (structurally inapplicable) code.
// '-' is distinct from '?' (unknown) in the DATA — it marks a character that can
// never take a state for that genus (compound eyes in eyeless genera; postpetiole
// in single-waist genera) — but the scoring engine must treat it IDENTICALLY to '?':
// score-neutral, never eliminating and never penalizing the genus.
//
// This mirrors the engine change in IdentificationKey.tsx and simulator.mjs.
//
// Asserts:
//   A. the 5 documented inapplicable cells are coded exactly ['-'] in the matrix;
//   B. '-' is score-neutral (same properties as P3 for '?'): a genus coded '-' for
//      an answered character keeps its score/mismatches and survives at tolerance 0;
//   C. '-' contributes nothing to a character's entropy (uninformative like '?').

import { loadData, score, characterEntropy } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log("Test 3.1: '-' inapplicable code is score-neutral");

// --- A. the 5 inapplicable cells are exactly ['-'] -------------------------
const INAPPLICABLE = [
  ['leptanilla', 'gen-5'],   // eyeless (Leptanillinae)
  ['dorylus', 'gen-5'],      // eyeless (Dorylinae)
  ['stigmatomma', 'gen-16'], // single-waist (Amblyoponinae)
  ['stigmatomma', 'gen-17'],
  ['dorylus', 'gen-16'],     // single-waist (Dorylinae)
];
for (const [g, c] of INAPPLICABLE) {
  const v = matrixLookup[g]?.[c];
  log(JSON.stringify(v) === JSON.stringify(['-']), `${g}/${c} is ['-'] (got ${JSON.stringify(v)})`);
}

// --- B. '-' is score-neutral (fixture: leptanilla gen-5='-') ---------------
const target = 'leptanilla';
const probeChar = 'gen-5';
log(matrixLookup[target][probeChar].includes('-'), `${target}/${probeChar} probe cell is '-'`);

// anchor: a real (non-'?'/'-') cell the target matches, for a clean baseline
const row = matrixLookup[target];
const anchorChar = Object.keys(row).find(
  cid => cid !== probeChar && row[cid].length >= 1 && !row[cid].includes('?') && !row[cid].includes('-')
);
const anchorValue = row[anchorChar][0];

const selAnchor = [{ characterId: anchorChar, value: anchorValue, weight: 1 }];
const selPlusProbe = [...selAnchor, { characterId: probeChar, value: '0', weight: 1 }];
const rA = score(selAnchor, genera, matrixLookup, charById, 1).find(r => r.genus.id === target);
const rB = score(selPlusProbe, genera, matrixLookup, charById, 1).find(r => r.genus.id === target);
log(!!rA && !!rB, `${target} survives both selections`);
if (rA && rB) {
  log(rA.mismatches === rB.mismatches, `${target} mismatches unchanged by '-' probe (${rA.mismatches} vs ${rB.mismatches})`);
  log(Math.abs(rA.score - rB.score) < 1e-9, `${target} score unchanged by '-' probe (${rA.score.toFixed(6)} vs ${rB.score.toFixed(6)})`);
}

// survival at strict tolerance 0 on the '-' cell
const rProbe0 = score([{ characterId: probeChar, value: '0', weight: 1 }], genera, matrixLookup, charById, 0)
  .find(r => r.genus.id === target);
log(!!rProbe0 && rProbe0.mismatches === 0, `${target} survives probe-only at tolerance=0 with 0 mismatches on its '-' cell`);

// --- C. '-' contributes nothing to entropy ---------------------------------
// gen-5 entropy over all genera must equal the entropy computed while ignoring
// the two '-' genera (leptanilla, dorylus) — i.e. they simply don't count.
const allScored = genera.map(g => ({ genus: g }));
const eWithDash = characterEntropy('gen-5', allScored, matrixLookup);
const eWithoutDashGenera = characterEntropy(
  'gen-5',
  allScored.filter(sg => !['leptanilla', 'dorylus'].includes(sg.genus.id)),
  matrixLookup
);
log(Math.abs(eWithDash - eWithoutDashGenera) < 1e-9,
    `'-' genera do not affect gen-5 entropy (${eWithDash.toFixed(6)} == ${eWithoutDashGenera.toFixed(6)})`);

if (failures === 0) {
  console.log("\n3.1 PASS — '-' is a distinct data code that scores identically to '?'");
  process.exit(0);
} else {
  console.error(`\n3.1 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
