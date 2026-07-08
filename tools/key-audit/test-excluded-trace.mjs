// Test for item 2.4: the "why was this genus excluded" trace.
// excludedGenera() returns every genus ruled out by the current answers, each with the
// reason(s): the selected characters whose answer the genus contradicts.
//
// Asserts:
//   A. Partition — with ≥1 real selection, kept (score) and excluded together cover
//      every genus exactly once (no overlap, none missing).
//   B. Every excluded genus carries ≥1 reason, and (since it failed the tolerance
//      filter) strictly more than `maxMismatches` reasons.
//   C. Every reason is a genuine contradiction — the genus's real states for that
//      character do NOT include the user's answer, and are not '?'/'-'.

import { loadData, score, excludedGenera } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test 2.4: excluded-genera trace');

// Build a real selection: answer 4 informative Myrmicinae characters exactly as
// Messor is coded, so plenty of genera contradict ≥2 of them and get excluded.
const target = 'messor';
const probeChars = ['gen-3', 'gen-7', 'gen-4', 'gen-14'];
const selections = probeChars
  .map(cid => {
    const v = matrixLookup[target]?.[cid];
    return v && !v.includes('?') && !v.includes('-') ? { characterId: cid, value: v[0], weight: 1 } : null;
  })
  .filter(Boolean);
log(selections.length >= 3, `built a ${selections.length}-character selection from ${target}`);

for (const tol of [0, 1]) {
  const kept = score(selections, genera, matrixLookup, charById, tol);
  const excluded = excludedGenera(selections, genera, matrixLookup, charById, tol);
  const keptIds = new Set(kept.map(s => s.genus.id));
  const exclIds = new Set(excluded.map(e => e.genusId));

  // A. partition
  const overlap = [...keptIds].filter(id => exclIds.has(id));
  log(kept.length + excluded.length === genera.length && overlap.length === 0,
      `tolerance=${tol}: kept(${kept.length}) + excluded(${excluded.length}) = ${genera.length}, no overlap`);
  log(excluded.length > 0, `tolerance=${tol}: some genera are excluded (${excluded.length})`);

  // B. every excluded genus has > tol reasons
  const badReasonCount = excluded.filter(e => e.reasons.length <= tol);
  log(badReasonCount.length === 0,
      `tolerance=${tol}: every excluded genus has > ${tol} reason(s)` +
      (badReasonCount.length ? ` (offenders: ${badReasonCount.map(e => e.genusId).join(', ')})` : ''));

  // C. every reason is a real contradiction
  let badReason = null;
  for (const e of excluded) {
    for (const r of e.reasons) {
      const vals = r.genusValues;
      if (vals.includes(r.userValue) || vals.includes('?') || vals.includes('-')) { badReason = `${e.genusId}/${r.characterId}`; break; }
    }
    if (badReason) break;
  }
  log(!badReason, `tolerance=${tol}: every reason is a genuine contradiction${badReason ? ` (bad: ${badReason})` : ''}`);
}

if (failures === 0) {
  console.log('\n2.4 PASS — excluded-genera trace partitions correctly with sound reasons');
  process.exit(0);
} else {
  console.error(`\n2.4 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
