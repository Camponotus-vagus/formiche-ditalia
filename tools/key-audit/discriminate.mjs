// For each genus, find:
//   - all single-character selections that put it (uniquely) on top
//   - all minimal pairs that put it (uniquely) on top
//   - if no 1- or 2-char path works, search 3-char paths
// Also report ties and competitor genera.
//
// "Selection" semantics: we use weight=1 (so subfamily-aware penalization still applies via
// implied subfamily, but we don't try to model entropy). With tolerance=1 (UI default).

import { loadData, score, compatibleSelections, isUniqueTop, selectionToString } from './simulator.mjs';
import fs from 'node:fs';

const TOLERANCE = 1;
const { characters, matrix, genera, subfamilies, matrixLookup, charById } = loadData();

// Helpers
const compat = {};
for (const g of genera) compat[g.id] = compatibleSelections(g.id, matrixLookup);

function rank(selections) {
  return score(selections, genera, matrixLookup, charById, TOLERANCE);
}

function topInfo(targetId, selections) {
  const r = rank(selections);
  if (r.length === 0) return { unique: false, top: null, gap: 0, tied: [], passingCount: 0, target: null };
  const top = r[0];
  const target = r.find(x => x.genus.id === targetId);
  const tied = r.filter(x => x.score === top.score && x.genus.id !== top.genus.id).map(x => x.genus.id);
  const gap = r.length >= 2 ? top.score - r[1].score : 1;
  return { unique: top.genus.id === targetId && tied.length === 0, top: top.genus.id, topScore: top.score, gap, tied, passingCount: r.length, target };
}

// --- 1. Single-character paths ---
function singlePaths(targetId) {
  const out = [];
  for (const sel of compat[targetId]) {
    const info = topInfo(targetId, [{ ...sel, weight: 1 }]);
    out.push({
      sel,
      uniqueTop: info.unique,
      topGenus: info.top,
      topScore: info.topScore,
      gap: info.gap,
      passingCount: info.passingCount,
    });
  }
  return out;
}

// --- 2. Pair paths (only if no good single) ---
function pairPaths(targetId, opts = {}) {
  const limit = opts.limit ?? Infinity;
  const sels = compat[targetId];
  const out = [];
  for (let i = 0; i < sels.length; i++) {
    for (let j = i + 1; j < sels.length; j++) {
      // Must be different characters (algorithm replaces same-char selections)
      if (sels[i].characterId === sels[j].characterId) continue;
      const trial = [{ ...sels[i], weight: 1 }, { ...sels[j], weight: 1 }];
      const info = topInfo(targetId, trial);
      if (info.unique) {
        out.push({ sels: [sels[i], sels[j]], topScore: info.topScore, gap: info.gap, passingCount: info.passingCount });
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

// --- 3. Triple paths (only if pair didn't work) ---
function triplePaths(targetId, opts = {}) {
  const limit = opts.limit ?? 5;
  const sels = compat[targetId];
  const out = [];
  for (let i = 0; i < sels.length; i++) {
    for (let j = i + 1; j < sels.length; j++) {
      if (sels[i].characterId === sels[j].characterId) continue;
      for (let k = j + 1; k < sels.length; k++) {
        if (sels[k].characterId === sels[i].characterId || sels[k].characterId === sels[j].characterId) continue;
        const trial = [
          { ...sels[i], weight: 1 },
          { ...sels[j], weight: 1 },
          { ...sels[k], weight: 1 },
        ];
        const info = topInfo(targetId, trial);
        if (info.unique) {
          out.push({ sels: [sels[i], sels[j], sels[k]], topScore: info.topScore, gap: info.gap, passingCount: info.passingCount });
          if (out.length >= limit) return out;
        }
      }
    }
  }
  return out;
}

// --- 4. Per-genus full report ---
const report = [];
for (const g of genera) {
  const single = singlePaths(g.id);
  const uniqueSingles = single.filter(s => s.uniqueTop);
  let pair = [];
  let triple = [];
  let depth = uniqueSingles.length > 0 ? 1 : null;

  if (uniqueSingles.length === 0) {
    pair = pairPaths(g.id, { limit: 50 });
    if (pair.length > 0) depth = 2;
    else {
      triple = triplePaths(g.id, { limit: 20 });
      if (triple.length > 0) depth = 3;
    }
  }

  // Closest competitors (with empty selection -> none; with target's full profile -> who else passes)
  const fullProfile = compat[g.id].map(s => ({ ...s, weight: 1 }));
  // But careful: if the genus has multiple states for one character, picking only one still matches.
  // Use only one selection per character (first-listed value).
  const oneStatePerChar = {};
  for (const s of fullProfile) {
    if (!oneStatePerChar[s.characterId]) oneStatePerChar[s.characterId] = s;
  }
  const fullSingleStateProfile = Object.values(oneStatePerChar);
  const fullRank = rank(fullSingleStateProfile);
  const fullTop = fullRank[0];
  const fullCompetitors = fullRank.slice(0, 5).map(r => ({ id: r.genus.id, score: r.score, mismatches: r.mismatches }));

  report.push({
    genus: g.id,
    subfamily: g.subfamily_id,
    scientific_name: g.scientific_name,
    profileSize: compat[g.id].length,
    distinctCharCount: new Set(compat[g.id].map(s => s.characterId)).size,
    discriminationDepth: depth,
    uniqueSingles: uniqueSingles.map(s => ({
      char: s.sel.characterId,
      val: s.sel.value,
      label: selectionToString(s.sel, charById),
      gap: s.gap.toFixed(3),
      passingCount: s.passingCount,
    })),
    pairs: pair.slice(0, 20).map(p => ({
      sels: p.sels.map(s => selectionToString(s, charById)),
      gap: p.gap.toFixed(3),
      passingCount: p.passingCount,
    })),
    triples: triple.slice(0, 10).map(p => ({
      sels: p.sels.map(s => selectionToString(s, charById)),
      gap: p.gap.toFixed(3),
      passingCount: p.passingCount,
    })),
    fullProfileResult: {
      topGenus: fullTop?.genus.id,
      topScore: fullTop?.score,
      uniqueTop: fullRank.length === 1 || (fullRank.length > 1 && fullRank[0].score > fullRank[1].score && fullRank[0].genus.id === g.id),
      top5: fullCompetitors,
    },
  });
}

fs.writeFileSync(new URL('./report-data.json', import.meta.url), JSON.stringify(report, null, 2));
console.log('Wrote report-data.json');

// Console summary
console.log('\n=== SUMMARY ===');
const byDepth = { 1: [], 2: [], 3: [], unreachable: [] };
for (const r of report) {
  if (r.discriminationDepth === 1) byDepth[1].push(r.genus);
  else if (r.discriminationDepth === 2) byDepth[2].push(r.genus);
  else if (r.discriminationDepth === 3) byDepth[3].push(r.genus);
  else byDepth.unreachable.push(r.genus);
}
console.log(`Reachable with 1 character: ${byDepth[1].length} -> ${byDepth[1].join(', ')}`);
console.log(`Reachable with 2 chars (not 1): ${byDepth[2].length} -> ${byDepth[2].join(', ')}`);
console.log(`Reachable only with 3+ chars: ${byDepth[3].length} -> ${byDepth[3].join(', ')}`);
console.log(`UNREACHABLE within 3 chars: ${byDepth.unreachable.length} -> ${byDepth.unreachable.join(', ')}`);

console.log('\n=== FULL-PROFILE CHECK (selecting all genus characters) ===');
for (const r of report) {
  if (!r.fullProfileResult.uniqueTop) {
    console.log(`  PROBLEM: ${r.genus} not unique top with full profile. Top5: ${r.fullProfileResult.top5.map(x => `${x.id}=${x.score.toFixed(3)}`).join(', ')}`);
  }
}
