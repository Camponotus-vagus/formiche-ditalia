// Pairwise distance between genera per guide Sez. 8.2.
//
// distance(A, B) = number of characters on which A's defined states are
// disjoint from B's defined states. 'NA' and '?' are excluded from each
// taxon's state set; if either set is empty after exclusion, that character
// is "not comparable" and is skipped.
//
// distance = 0 → A and B are indistinguishable by the current key.
// distance = 1 → at risk under tolerance ≥ 1.
// distance = 2 → at risk under tolerance ≥ 2.
//
// CLI: `node pairwise-distance.mjs` prints all pairs with distance ≤ 2,
// sorted by distance ascending then comparable descending. Use it as a
// reachability/discriminability diagnostic after every matrix edit.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadData } from './simulator.mjs';

export function pairwiseDistance(genusIdA, genusIdB, characters, matrixLookup) {
  const lookupA = matrixLookup[genusIdA] || {};
  const lookupB = matrixLookup[genusIdB] || {};
  let differences = 0;
  let comparable = 0;
  for (const c of characters) {
    const rawA = lookupA[c.id] || [];
    const rawB = lookupB[c.id] || [];
    const sa = new Set(rawA);
    sa.delete('?'); sa.delete('NA'); sa.delete('-');
    const sb = new Set(rawB);
    sb.delete('?'); sb.delete('NA'); sb.delete('-');
    if (sa.size === 0 || sb.size === 0) continue;
    comparable++;
    let overlap = false;
    for (const v of sa) {
      if (sb.has(v)) { overlap = true; break; }
    }
    if (!overlap) differences++;
  }
  return { differences, comparable };
}

export function allPairs(genera) {
  const out = [];
  for (let i = 0; i < genera.length; i++) {
    for (let j = i + 1; j < genera.length; j++) {
      out.push([genera[i], genera[j]]);
    }
  }
  return out;
}

export function pairwiseReport(characters, genera, matrixLookup, threshold = 2) {
  const pairs = allPairs(genera);
  const rows = pairs.map(([a, b]) => {
    const r = pairwiseDistance(a.id, b.id, characters, matrixLookup);
    return {
      a: a.id,
      b: b.id,
      sameSubfamily: a.subfamily_id === b.subfamily_id,
      ...r,
    };
  });
  rows.sort((x, y) =>
    x.differences - y.differences ||
    y.comparable - x.comparable ||
    x.a.localeCompare(x.b) ||
    x.b.localeCompare(y.b)
  );
  const critical = rows.filter(r => r.differences <= threshold);
  return { totalPairs: rows.length, critical, all: rows };
}

const isCLI = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCLI) {
  const { characters, genera, matrixLookup } = loadData();
  const { totalPairs, critical } = pairwiseReport(characters, genera, matrixLookup, 2);

  // Split critical pairs by whether they share any defined-state characters.
  // comparable=0 pairs are "vacuously indistinguishable" (no overlap of subfamily
  // scope on which both have data); the actual key separates them via the
  // subfamily inference, not via the matrix. comparable>0 pairs are the real
  // diagnostic signal.
  const real = critical.filter(r => r.comparable > 0);
  const vacuous = critical.filter(r => r.comparable === 0);

  console.log(`Pairs total: ${totalPairs}`);
  console.log(`Pairs with distance ≤ 2: ${critical.length}`);
  console.log(`  — with shared evidence (comparable>0): ${real.length}`);
  console.log(`  — vacuous (comparable=0, no overlap):  ${vacuous.length}\n`);

  console.log('================================================================');
  console.log(' REAL CRITICAL PAIRS — comparable > 0, distance ≤ 2');
  console.log('================================================================\n');
  const bucket = (n) => real.filter(r => r.differences === n);
  for (const d of [0, 1, 2]) {
    const list = bucket(d);
    console.log(`--- distance = ${d}  (${list.length} pair${list.length === 1 ? '' : 's'}) ---`);
    for (const r of list) {
      const tag = r.sameSubfamily ? '[same-sf] ' : '[cross-sf]';
      console.log(`  ${tag}  ${r.a.padEnd(18)} × ${r.b.padEnd(18)}  comparable=${r.comparable}`);
    }
    console.log('');
  }

  console.log('================================================================');
  console.log(` VACUOUS PAIRS — distance=0 only because comparable=0  (count: ${vacuous.length})`);
  console.log(' (separated by the algorithm via subfamily-scope inference, not by the matrix)');
  console.log('================================================================');
  console.log(' (omitted from this listing — see exported pairwiseReport() for full data)');
}
