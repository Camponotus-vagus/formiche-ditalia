// Entropy must be a valid Shannon entropy: each genus contributes probability mass 1,
// so entropy can never exceed log2(number of real states).
// Pre-fix, gen-8 (Formula palpale, 12 states, multi-state cells) measured 3.923 > log2(12)=3.585.
import { loadData, score, characterEntropy } from './simulator.mjs';

const { genera, characters, matrixLookup, charById } = loadData();
const scored = score([], genera, matrixLookup, charById);

let failures = 0;
console.log('Test: characterEntropy <= log2(real states)');

for (const ch of characters) {
  const realStates = ch.states.filter(s => s.value !== '?' && s.value !== '-').length;
  if (realStates < 2) continue;
  const e = characterEntropy(ch.id, scored, matrixLookup);
  const ceiling = Math.log2(realStates);
  if (e > ceiling + 1e-9) {
    console.error(`  FAIL — ${ch.id} ${ch.name_it}: entropy ${e.toFixed(3)} > ceiling ${ceiling.toFixed(3)}`);
    failures++;
  }
}

if (failures === 0) {
  console.log(`  PASS — all ${characters.length} characters within their entropy ceiling`);
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} character(s) exceed the theoretical maximum`);
  process.exit(1);
}
