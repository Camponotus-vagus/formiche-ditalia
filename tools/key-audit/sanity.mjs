// Sanity checks on data integrity and simulator behaviour.
import { loadData, score, compatibleSelections, isUniqueTop, selectionToString } from './simulator.mjs';

const { characters, matrix, genera, subfamilies, matrixLookup, charById } = loadData();

console.log('=== DATA INTEGRITY ===');
console.log(`Genera: ${genera.length} | Characters: ${characters.length} | Matrix entries: ${matrix.length}`);

// Characters without any matrix data
const usedChars = new Set(matrix.map(m => m.character_id));
const orphanChars = characters.filter(c => !usedChars.has(c.id));
console.log(`Characters with NO matrix data: ${orphanChars.length}`);
for (const c of orphanChars) console.log(`  - ${c.id} "${c.name_it}" (scope=${c.subfamily_scope})`);

// Genera without any matrix data
const usedGenera = new Set(matrix.map(m => m.genus_id));
const orphanGenera = genera.filter(g => !usedGenera.has(g.id));
console.log(`Genera with NO matrix data: ${orphanGenera.length}`);
for (const g of orphanGenera) console.log(`  - ${g.id}`);

// Coverage per genus by subfamily-scope characters
console.log('\n=== COVERAGE BY SUBFAMILY-SCOPE ===');
const scopes = ['myrmicinae', 'ponerinae', 'dolichoderinae', 'formicinae'];
const scopeChars = Object.fromEntries(scopes.map(s => [s, characters.filter(c => c.subfamily_scope === s).map(c => c.id)]));
for (const g of genera) {
  const covered = {};
  for (const s of scopes) {
    const inScope = scopeChars[s];
    const present = inScope.filter(cid => matrixLookup[g.id]?.[cid] && !matrixLookup[g.id][cid].includes('?'));
    covered[s] = `${present.length}/${inScope.length}`;
  }
  console.log(`  ${g.id} [${g.subfamily_id}]  ${scopes.map(s => `${s}: ${covered[s]}`).join(' | ')}`);
}

// Genera with identical compatible-selections set?
console.log('\n=== IDENTICAL-PROFILE PAIRS (potential indistinguishables) ===');
const profileKey = (gid) => {
  const sels = compatibleSelections(gid, matrixLookup);
  return sels.map(s => `${s.characterId}:${s.value}`).sort().join('|');
};
const byProfile = {};
for (const g of genera) {
  const k = profileKey(g.id);
  if (!byProfile[k]) byProfile[k] = [];
  byProfile[k].push(g.id);
}
let dupCount = 0;
for (const [k, ids] of Object.entries(byProfile)) {
  if (ids.length > 1) {
    dupCount++;
    console.log(`  IDENTICAL: ${ids.join(', ')}`);
  }
}
if (dupCount === 0) console.log('  (none — all genera have distinct profiles)');

// Quick simulation: select a single character known to be highly informative
console.log('\n=== SAMPLE SCORING: empty selection ===');
const r = score([], genera, matrixLookup, charById);
console.log(`Empty -> ${r.length} genera, top: ${r[0]?.genus.id}`);

console.log('\n=== SAMPLE: select gen-3 (antennal segments) = "12" ===');
const r2 = score([{ characterId: 'gen-3', value: '4', weight: 1 }], genera, matrixLookup, charById, 1);
console.log(`Top 5: ${r2.slice(0, 5).map(s => `${s.genus.id}(${s.score.toFixed(3)},m=${s.mismatches})`).join('  ')}`);
console.log(`Total passing tolerance=1: ${r2.length}`);
