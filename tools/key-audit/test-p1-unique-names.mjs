// Test for P1 fix: each character must have a unique name within its language.
// Spec (guida_chiave_multi_accesso.md, Sez. 9.2):
//   "Ogni carattere deve avere un nome univoco nell'intera chiave."
//
// Duplicate names confuse the user (cannot tell which character is which) and
// complicate matrix maintenance. This test enumerates duplicates across name_it
// and name_en, and fails if any duplicate set has size > 1.
//
// Note: characters scoped to different subfamilies are still distinct characters
// in the data model (different `id`), so disambiguation must happen at the
// display-name level (e.g. by appending the subfamily in parentheses).

import { loadData } from './simulator.mjs';

const { characters } = loadData();

const findDuplicates = (field) => {
  const groups = {};
  for (const c of characters) {
    const k = c[field];
    if (!groups[k]) groups[k] = [];
    groups[k].push(c.id);
  }
  return Object.entries(groups).filter(([_, ids]) => ids.length > 1);
};

const dupIt = findDuplicates('name_it');
const dupEn = findDuplicates('name_en');

let failures = 0;
console.log('Test P1: character names must be unique');

if (dupIt.length === 0) {
  console.log(`  PASS — no duplicate name_it across ${characters.length} characters`);
} else {
  console.error(`  FAIL — ${dupIt.length} duplicate name_it set(s):`);
  for (const [name, ids] of dupIt) console.error(`    "${name}": ${ids.join(', ')}`);
  failures++;
}

if (dupEn.length === 0) {
  console.log(`  PASS — no duplicate name_en across ${characters.length} characters`);
} else {
  console.error(`  FAIL — ${dupEn.length} duplicate name_en set(s):`);
  for (const [name, ids] of dupEn) console.error(`    "${name}": ${ids.join(', ')}`);
  failures++;
}

if (failures === 0) {
  console.log('\nP1 PASS — all character names are unique');
  process.exit(0);
} else {
  console.error(`\nP1 FAIL — ${failures} field(s) with duplicates`);
  process.exit(1);
}
