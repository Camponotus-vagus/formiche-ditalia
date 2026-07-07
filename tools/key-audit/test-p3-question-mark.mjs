// Test for P3: '?' state must be score-neutral in the scoring engine (item 1.1).
// Spec (guida_chiave_multi_accesso.md, Sez. 4 + 6.1):
//   "?" o "U" — Sconosciuto. Sempre sopravvive a qualsiasi filtro (approccio conservativo).
//   if "?" in taxon_states: continue  # sconosciuto: non penalizzato
//
// This test is DATA-DERIVED and SELF-VALIDATING: instead of hard-coding a genus
// whose cell happens to be '?' today (which rots the moment a Step-N edit resolves
// that cell — as happened when Step 4 resolved cardiocondyla gen-7 from '?' to '2'),
// it discovers a live ('?' probe char, matching anchor char) fixture at runtime and
// asserts the probe cell really is '?'. If the data ever loses all '?' cells the test
// fails loudly rather than silently passing on a stale assumption.
//
// Properties under test (all for the same target genus G):
//   A. matrix-'?' neutrality — answering the probe char (where G is coded '?') must
//      leave G's score AND mismatches identical to answering the anchor char alone.
//   B. survival — with ONLY the probe char answered (to a value G lacks), at strict
//      tolerance 0, G must still appear in the results: a '?' genus is never eliminated.
//   C. user-'?' neutrality — a user selection carrying the literal value '?' must
//      produce the exact same ranking as omitting that selection entirely.

import { loadData, score } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log("Test P3: '?' must be score-neutral");

// --- Discover a live fixture from the matrix -------------------------------
// probe: a (genus, char) cell whose state_values include '?'
// anchor: another char of the SAME genus with a single, real (non-'?') state,
//         so answering it gives the genus a clean full match (baseline score).
function findFixture() {
  for (const g of genera) {
    const row = matrixLookup[g.id];
    if (!row) continue;
    const probeChar = Object.keys(row).find(cid => row[cid].includes('?'));
    if (!probeChar) continue;
    const anchorChar = Object.keys(row).find(
      cid => cid !== probeChar && row[cid].length >= 1 && !row[cid].includes('?')
    );
    if (!anchorChar) continue;
    return { genusId: g.id, probeChar, anchorChar, anchorValue: row[anchorChar][0] };
  }
  return null;
}

const fx = findFixture();
log(!!fx, `found a live ('?' probe, anchor) fixture in the matrix`);
if (!fx) {
  console.error("\nP3 FAIL — no genus with a '?' cell found; cannot test neutrality");
  process.exit(1);
}
const { genusId, probeChar, anchorChar, anchorValue } = fx;
console.log(`  fixture: genus=${genusId} anchor=${anchorChar}=${anchorValue} probe=${probeChar}('?')`);

// Guard against silent fixture-rot: the probe cell MUST actually be '?'.
log(matrixLookup[genusId][probeChar].includes('?'),
    `probe cell ${genusId}/${probeChar} is '?' in the live matrix`);

// A probe answer value the target genus does NOT literally hold ('0' is a safe
// generic non-'?' value; the genus survives because the cell is '?', not because
// it matches '0').
const probeValue = '0';

// --- Property A: matrix-'?' neutrality -------------------------------------
const selAnchor = [{ characterId: anchorChar, value: anchorValue, weight: 1 }];
const selAnchorPlusProbe = [
  { characterId: anchorChar, value: anchorValue, weight: 1 },
  { characterId: probeChar, value: probeValue, weight: 1 },
];
const rA = score(selAnchor, genera, matrixLookup, charById, 1).find(r => r.genus.id === genusId);
const rB = score(selAnchorPlusProbe, genera, matrixLookup, charById, 1).find(r => r.genus.id === genusId);

log(!!rA, `${genusId} survives anchor-only tolerance=1`);
log(!!rB, `${genusId} survives anchor+probe tolerance=1`);
if (rA && rB) {
  log(rA.mismatches === rB.mismatches,
      `${genusId} mismatches unchanged by '?' probe (anchor=${rA.mismatches}, +probe=${rB.mismatches})`);
  log(Math.abs(rA.score - rB.score) < 1e-9,
      `${genusId} score unchanged by '?' probe (anchor=${rA.score.toFixed(6)}, +probe=${rB.score.toFixed(6)})`);
}

// --- Property B: survival at strict tolerance 0 ----------------------------
const selProbeOnly = [{ characterId: probeChar, value: probeValue, weight: 1 }];
const rProbe0 = score(selProbeOnly, genera, matrixLookup, charById, 0).find(r => r.genus.id === genusId);
log(!!rProbe0, `${genusId} survives probe-only at strict tolerance=0 (never eliminated on a '?' cell)`);
if (rProbe0) {
  log(rProbe0.mismatches === 0, `${genusId} has 0 mismatches on its '?' probe cell (got ${rProbe0.mismatches})`);
}

// --- Property C: user-selected '?' is neutral vs omitting it ---------------
const rankOmit = score(selAnchor, genera, matrixLookup, charById, 1);
const rankUserQ = score(
  [...selAnchor, { characterId: probeChar, value: '?', weight: 1 }],
  genera, matrixLookup, charById, 1
);
const sameRanking =
  rankOmit.length === rankUserQ.length &&
  rankOmit.every((r, i) =>
    r.genus.id === rankUserQ[i].genus.id && Math.abs(r.score - rankUserQ[i].score) < 1e-9);
log(sameRanking, `user-selected '?' yields identical ranking to omitting it (len ${rankOmit.length} vs ${rankUserQ.length})`);

if (failures === 0) {
  console.log("\nP3 PASS — '?' is correctly score-neutral (matrix cell + user selection)");
  process.exit(0);
} else {
  console.error(`\nP3 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
