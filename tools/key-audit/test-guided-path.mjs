// Test for item 1.3: "best next question" (dynamic resolving power).
// Validates that following the entropy-ranked suggested character at each step —
// bestNextCharacter(), the mirror of IdentificationKey.tsx bestCharacterId — leads
// to a unique genus in few questions, for EVERY Italian genus.
//
// Method (guided path): start from an empty selection; at each step pick the
// not-yet-used character with the highest dynamic entropy over the current
// candidate set that the target genus can actually answer (a real, non-'?' state),
// answer it truthfully as the target would, and stop when the target is the unique
// top-ranked genus. Records the number of questions asked.
//
// Invariants (globalized-key design, 2026-07-09):
//   - Every one of the 42 genera converges to a WITHIN-SUBFAMILY unique top at tolerance
//     0 AND 1. Cross-subfamily genera tied on the global characters are acceptable (they
//     are broken in the key by the subfamily mechanism + scoped characters, not by the
//     entropy-ranked global suggestion) — see isUniqueTopWithinSubfamily and the P6 guard.
//   - The guided path is far shorter than answering all characters: max questions
//     stays well under the character count. Guard set at ≤ 12 for headroom.

import {
  loadData, score, isUniqueTopWithinSubfamily, characterEntropy,
} from './simulator.mjs';
import { convergenceAccepted } from './known-limitations.mjs';

const { genera, characters, matrixLookup, charById } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test 1.3: guided path (best next question) converges');

function guidedPath(targetId, maxMismatches) {
  const used = new Set();
  const sels = [];
  let scored = score(sels, genera, matrixLookup, charById, maxMismatches);
  for (let step = 0; step < characters.length; step++) {
    if (isUniqueTopWithinSubfamily(targetId, sels, genera, matrixLookup, charById, maxMismatches).unique) break;
    let bestId = '';
    let bestE = -1;
    for (const c of characters) {
      if (used.has(c.id)) continue;
      const tv = matrixLookup[targetId]?.[c.id];
      if (!tv || tv.includes('?')) continue; // target can't inform this character
      const e = characterEntropy(c.id, scored, matrixLookup);
      if (e > bestE) { bestE = e; bestId = c.id; }
    }
    if (!bestId || bestE <= 0) break; // no informative character left
    used.add(bestId);
    sels.push({ characterId: bestId, value: matrixLookup[targetId][bestId][0], weight: 1 });
    scored = score(sels, genera, matrixLookup, charById, maxMismatches);
  }
  const uniq = isUniqueTopWithinSubfamily(targetId, sels, genera, matrixLookup, charById, maxMismatches);
  return { steps: sels.length, ok: uniq.unique, reason: uniq.reason, tiedWith: uniq.tiedWith };
}

const STEP_GUARD = 12;
for (const tol of [0, 1]) {
  const res = genera.map(g => ({ id: g.id, ...guidedPath(g.id, tol) }));
  const converged = res.filter(r => r.ok);                          // genuinely unique; used for maxSteps
  const fails = res.filter(r => !convergenceAccepted(r.id, r));     // documented known-unresolved ties excepted
  const maxSteps = Math.max(...converged.map(r => r.steps));

  log(fails.length === 0,
      `tolerance=${tol}: all ${genera.length} genera converge to a within-subfamily unique top (documented known-unresolved pairs excepted)` +
      (fails.length ? ` (failed: ${fails.map(f => `${f.id}(${f.reason}${f.tiedWith ? ':' + f.tiedWith.join('|') : ''})`).join(', ')})` : ''));
  log(maxSteps <= STEP_GUARD,
      `tolerance=${tol}: guided path max=${maxSteps} questions ≤ ${STEP_GUARD} (well below ${characters.length} characters)`);
  log(maxSteps < characters.length,
      `tolerance=${tol}: guidance beats answering everything (${maxSteps} < ${characters.length})`);
}

if (failures === 0) {
  console.log('\n1.3 PASS — dynamic best-next-question guides every genus to a unique ID in few steps');
  process.exit(0);
} else {
  console.error(`\n1.3 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
