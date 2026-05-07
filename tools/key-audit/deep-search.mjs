// Deeper analysis for genera that didn't have a 1/2/3-char unique-top path.
// 1. Check 4-char paths.
// 2. For each "stuck" genus, identify the persistent tie-mate(s).
// 3. Test what specific selection would break the tie (if any exists).

import { loadData, score, compatibleSelections, selectionToString } from './simulator.mjs';
import fs from 'node:fs';

const TOLERANCE = 1;
const { characters, matrix, genera, subfamilies, matrixLookup, charById } = loadData();

const compat = {};
for (const g of genera) compat[g.id] = compatibleSelections(g.id, matrixLookup);

function rank(selections) {
  return score(selections, genera, matrixLookup, charById, TOLERANCE);
}

function topInfo(targetId, selections) {
  const r = rank(selections);
  if (r.length === 0) return { unique: false, top: null, gap: 0, tied: [], passingCount: 0 };
  const top = r[0];
  const tied = r.filter(x => x.score === top.score && x.genus.id !== top.genus.id).map(x => x.genus.id);
  const gap = r.length >= 2 ? top.score - r[1].score : 1;
  return { unique: top.genus.id === targetId && tied.length === 0, top: top.genus.id, topScore: top.score, gap, tied, passingCount: r.length };
}

const STUCK = ['stenamma', 'lasius', 'prenolepis', 'proceratium', 'leptanilla', 'nylanderia', 'paratrechina', 'brachyponera'];

// Helper to enumerate k-tuples of distinct-character selections from compat
function* kCombos(arr, k) {
  if (k === 0) { yield []; return; }
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of kCombos(arr.slice(i + 1), k - 1)) {
      // Skip if the new element shares a character with any in rest
      if (rest.some(r => r.characterId === arr[i].characterId)) continue;
      yield [arr[i], ...rest];
    }
  }
}

console.log('=== 4-CHARACTER PATH SEARCH for stuck genera ===\n');
for (const targetId of STUCK) {
  const sels = compat[targetId];
  let found = [];
  outer: for (const combo of kCombos(sels, 4)) {
    const trial = combo.map(s => ({ ...s, weight: 1 }));
    const info = topInfo(targetId, trial);
    if (info.unique) {
      found.push({ combo, gap: info.gap, passing: info.passingCount });
      if (found.length >= 5) break outer;
    }
  }
  console.log(`-- ${targetId} --`);
  if (found.length === 0) {
    console.log('  No 4-char unique-top path found. Trying 5...');
    let found5 = [];
    outer5: for (const combo of kCombos(sels, 5)) {
      const trial = combo.map(s => ({ ...s, weight: 1 }));
      const info = topInfo(targetId, trial);
      if (info.unique) {
        found5.push({ combo, gap: info.gap, passing: info.passingCount });
        if (found5.length >= 3) break outer5;
      }
    }
    if (found5.length === 0) {
      console.log('  ❌ NO 5-char unique-top path either');
    } else {
      console.log(`  ✓ 5-char paths exist: ${found5.length}`);
      for (const f of found5.slice(0, 2)) {
        console.log(`     ${f.combo.map(s => selectionToString(s, charById)).join(' AND ')}  gap=${f.gap.toFixed(3)} passing=${f.passing}`);
      }
    }
  } else {
    console.log(`  ✓ Found ${found.length} 4-char paths. First example:`);
    for (const f of found.slice(0, 2)) {
      console.log(`     ${f.combo.map(s => selectionToString(s, charById)).join(' AND ')}  gap=${f.gap.toFixed(3)} passing=${f.passing}`);
    }
  }

  // Diagnostic: with full profile, who ties?
  const oneStatePerChar = {};
  for (const s of sels) {
    if (!oneStatePerChar[s.characterId]) oneStatePerChar[s.characterId] = s;
  }
  const fullProfile = Object.values(oneStatePerChar).map(s => ({ ...s, weight: 1 }));
  const r = rank(fullProfile);
  const top = r[0]?.score;
  const tied = r.filter(x => x.score === top).map(x => x.genus.id);
  console.log(`  Full-profile tie-mates: ${tied.join(', ')}`);
  console.log('');
}

// Compare profiles of identical-twin trio: prenolepis vs nylanderia vs paratrechina
console.log('\n=== IDENTICAL-PROFILE TRIO ===');
function profileMap(gid) {
  const m = matrixLookup[gid] || {};
  const out = {};
  for (const [c, v] of Object.entries(m)) {
    if (!v.includes('?')) out[c] = v;
  }
  return out;
}
const pp = ['prenolepis', 'nylanderia', 'paratrechina'];
const allChars = new Set();
for (const id of pp) for (const c of Object.keys(profileMap(id))) allChars.add(c);
console.log(`Char | ${pp.join(' | ')}`);
for (const c of allChars) {
  const ch = charById[c];
  const row = pp.map(id => (profileMap(id)[c] || []).join(','));
  console.log(`  ${c} (${ch?.name_it}) | ${row.join(' | ')}`);
}

// stenamma vs pheidole
console.log('\n=== stenamma vs pheidole differences ===');
{
  const a = profileMap('stenamma'), b = profileMap('pheidole');
  const allC = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of allC) {
    if ((a[c] || []).join(',') !== (b[c] || []).join(',')) {
      console.log(`  ${c} (${charById[c]?.name_it}): stenamma=${(a[c]||['<absent>']).join(',')} | pheidole=${(b[c]||['<absent>']).join(',')}`);
    }
  }
}

// formica vs lasius
console.log('\n=== formica vs lasius differences ===');
{
  const a = profileMap('formica'), b = profileMap('lasius');
  const allC = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of allC) {
    if ((a[c] || []).join(',') !== (b[c] || []).join(',')) {
      console.log(`  ${c} (${charById[c]?.name_it}): formica=${(a[c]||['<absent>']).join(',')} | lasius=${(b[c]||['<absent>']).join(',')}`);
    }
  }
}

// brachyponera vs hypoponera
console.log('\n=== brachyponera vs hypoponera differences ===');
{
  const a = profileMap('brachyponera'), b = profileMap('hypoponera');
  const allC = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of allC) {
    if ((a[c] || []).join(',') !== (b[c] || []).join(',')) {
      console.log(`  ${c} (${charById[c]?.name_it}): brachyponera=${(a[c]||['<absent>']).join(',')} | hypoponera=${(b[c]||['<absent>']).join(',')}`);
    }
  }
}

// proceratium vs myrmecina
console.log('\n=== proceratium vs myrmecina differences ===');
{
  const a = profileMap('proceratium'), b = profileMap('myrmecina');
  const allC = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of allC) {
    if ((a[c] || []).join(',') !== (b[c] || []).join(',')) {
      console.log(`  ${c} (${charById[c]?.name_it}): proceratium=${(a[c]||['<absent>']).join(',')} | myrmecina=${(b[c]||['<absent>']).join(',')}`);
    }
  }
}

// leptanilla vs aphaenogaster
console.log('\n=== leptanilla vs aphaenogaster differences ===');
{
  const a = profileMap('leptanilla'), b = profileMap('aphaenogaster');
  const allC = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of allC) {
    if ((a[c] || []).join(',') !== (b[c] || []).join(',')) {
      console.log(`  ${c} (${charById[c]?.name_it}): leptanilla=${(a[c]||['<absent>']).join(',')} | aphaenogaster=${(b[c]||['<absent>']).join(',')}`);
    }
  }
}
