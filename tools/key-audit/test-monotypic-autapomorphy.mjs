// Test Step 2B: each monotypic-subfamily genus must be uniquely identifiable in ONE
// step via a single global autapomorphy character (subfamily_scope=null).
//
// After the 2026-07-09 globalization the project moved away from subfamily-scoped
// discrimination; Step 2B therefore adds one strong GLOBAL autapomorphy per monotypic
// genus (Dorylinae excluded per Schifani 2022) instead of >=2 scoped characters:
//   - gen-47 Secondo tergite del gastro       state 1 → proceratium (vaulted gastral
//            tergite; MacGown 2025, Baroni Urbani & de Andrade 2003)
//   - gen-48 Denticolatura del margine clipeale state 1 → stigmatomma (denticulate
//            clypeal margin; MacGown 2025, Esteves & Fisher 2016)
//   - gen-49 Lobi frontali e inserzioni antennali state 1 → leptanilla (frontal lobes
//            absent / antennal sockets fully exposed; Bolton 2003)
//
// Expectation: selecting ONLY the diagnostic character at its derived state (1) makes
// the target genus the unique top-scoring candidate.

import { loadData, score, isUniqueTop } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();

const cases = [
  { char: 'gen-47', target: 'proceratium' },
  { char: 'gen-48', target: 'stigmatomma' },
  { char: 'gen-49', target: 'leptanilla' },
];

let failures = 0;
console.log('Test Step 2B: monotypic-genus global autapomorphies');

for (const { char, target } of cases) {
  // the character must exist, be global, and code the target as the ONLY state-1 genus
  const c = charById[char];
  if (!c) { console.error(`  FAIL — ${char} missing from characters.json`); failures++; continue; }
  if (c.subfamily_scope !== null) { console.error(`  FAIL — ${char} is not global (scope=${c.subfamily_scope})`); failures++; continue; }

  const ones = genera.filter(g => (matrixLookup[g.id]?.[char] || []).includes('1')).map(g => g.id);
  if (ones.length !== 1 || ones[0] !== target) {
    console.error(`  FAIL — ${char} state 1 should be exactly [${target}], got [${ones.join(',')}]`);
    failures++; continue;
  }

  const sel = [{ characterId: char, value: '1' }];
  const uniq = isUniqueTop(target, sel, genera, matrixLookup, charById);
  if (uniq.unique) {
    console.log(`  PASS — ${target}: ${char}=1 → unique top (score ${uniq.score}, gap ${uniq.gap})`);
  } else {
    console.error(`  FAIL — ${target}: ${char}=1 not unique top (${JSON.stringify(uniq)})`);
    failures++;
  }
}

if (failures === 0) {
  console.log('\nStep 2B PASS — all monotypic genera resolve in one step');
  process.exit(0);
} else {
  console.error(`\nStep 2B FAIL — ${failures} case(s)`);
  process.exit(1);
}
