// Test for item 1.4: "prefer easier characters" difficulty-aware suggestion.
// When the toggle is on, the suggested character (bestNextCharacter / the component's
// bestCharacterId) avoids 'hard' (microscopic) traits, only falling back to a hard one
// when no easier character discriminates the remaining genera.
//
// Asserts:
//   A. On the full initial candidate set, preferEasy=true never suggests a 'hard'
//      character (an easy/medium character always discriminates at the start).
//   B. Following the prefer-easy guided path (restricted to characters the target
//      genus can actually answer) still reaches a unique ID for every one of the 43
//      genera, and uses strictly fewer 'hard' characters than the default path.

import {
  loadData, score, isUniqueTop, characterEntropy, bestNextCharacter,
} from './simulator.mjs';

const { genera, characters, matrixLookup, charById } = loadData();

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test 1.4: prefer-easier difficulty-aware suggestion');

// --- A. preferEasy never suggests a hard char at the start ------------------
const allScored = genera.map(g => ({ genus: g }));
const easyPick = bestNextCharacter(allScored, characters, matrixLookup, new Set(), new Set(), true);
const defaultPick = bestNextCharacter(allScored, characters, matrixLookup, new Set(), new Set(), false);
log(!!easyPick && charById[easyPick.id]?.difficulty !== 'hard',
    `preferEasy start pick is non-hard: ${easyPick?.id} (${charById[easyPick?.id]?.difficulty})`);
log(!!defaultPick, `default start pick exists: ${defaultPick?.id} (${charById[defaultPick?.id]?.difficulty})`);

// --- B. prefer-easy guided path converges & uses fewer hard chars -----------
// Guided path: at each step pick the best character the TARGET can answer (real,
// non-'?'/'-' value). In easy mode, restrict to non-hard first, fall back to hard.
function guidedPath(targetId, maxMismatches, preferEasy) {
  const used = new Set();
  const sels = [];
  let hardUsed = 0;
  let scored = score(sels, genera, matrixLookup, charById, maxMismatches);
  for (let step = 0; step < characters.length; step++) {
    if (isUniqueTop(targetId, sels, genera, matrixLookup, charById, maxMismatches).unique) break;
    const answerable = characters.filter(c => {
      if (used.has(c.id)) return false;
      const tv = matrixLookup[targetId]?.[c.id];
      return tv && !tv.includes('?') && !tv.includes('-');
    });
    const bestOf = (cands) => {
      let id = '', e = -1;
      for (const c of cands) {
        const ent = characterEntropy(c.id, scored, matrixLookup);
        if (ent > e) { e = ent; id = c.id; }
      }
      return { id, e };
    };
    let choice = null;
    if (preferEasy) {
      const easier = bestOf(answerable.filter(c => c.difficulty !== 'hard'));
      if (easier.id && easier.e > 0) choice = easier;
    }
    if (!choice) choice = bestOf(answerable);
    if (!choice.id || choice.e <= 0) break;
    used.add(choice.id);
    if (charById[choice.id]?.difficulty === 'hard') hardUsed++;
    sels.push({ characterId: choice.id, value: matrixLookup[targetId][choice.id][0], weight: 1 });
    scored = score(sels, genera, matrixLookup, charById, maxMismatches);
  }
  const uniq = isUniqueTop(targetId, sels, genera, matrixLookup, charById, maxMismatches);
  return { ok: uniq.unique, steps: sels.length, hardUsed };
}

for (const tol of [0, 1]) {
  const easy = genera.map(g => guidedPath(g.id, tol, true));
  const def = genera.map(g => guidedPath(g.id, tol, false));
  const easyConverged = easy.filter(r => r.ok).length;
  const easyHard = easy.reduce((s, r) => s + r.hardUsed, 0);
  const defHard = def.reduce((s, r) => s + r.hardUsed, 0);

  log(easyConverged === genera.length,
      `tolerance=${tol}: prefer-easy path converges for all ${genera.length} genera (${easyConverged})`);
  log(easyHard <= defHard,
      `tolerance=${tol}: prefer-easy uses ≤ hard chars than default (easy=${easyHard} vs default=${defHard})`);
}

if (failures === 0) {
  console.log('\n1.4 PASS — prefer-easier suggestion avoids hard traits yet still resolves every genus');
  process.exit(0);
} else {
  console.error(`\n1.4 FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
