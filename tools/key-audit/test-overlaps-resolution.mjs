import { loadData } from './simulator.mjs';
import { MACULATION, PSAMMOPHORE } from './overlaps-coding.mjs';

const { genera, characters, matrixLookup } = loadData();
let failures = 0;
const fail = (m) => { console.error(`  FAIL — ${m}`); failures++; };
console.log('Test: overlaps resolution (gen-33 global, gen-51 psammophore)');

// 1. Both characters global and coded 42/42, source-agreement with the approved module.
for (const [cid, S] of [['gen-33', MACULATION], ['gen-51', PSAMMOPHORE]]) {
  const ch = characters.find(c => c.id === cid);
  if (!ch || ch.subfamily_scope !== null) fail(`${cid} must exist and be global`);
  let coded = 0;
  for (const g of genera) {
    const cell = matrixLookup[g.id]?.[cid];
    const exp = S[g.id];
    if (!exp) { fail(`${cid}: ${g.id} not in module`); continue; }
    if (!cell) { fail(`${cid}: ${g.id} has no matrix cell`); continue; }
    coded++;
    const norm = a => JSON.stringify(a.slice().sort());
    if (norm(cell) !== norm(exp)) fail(`${cid}/${g.id}: coded [${cell}] but module says [${exp}]`);
  }
  if (coded !== genera.length) fail(`${cid}: coverage ${coded}/${genera.length}`);
}

// 2. Part 2 goal: Cataglyphis and Formica are separated by a character OTHER than gen-36 (expected gen-51).
// Characters on which two genera have no shared state (i.e. that discriminate them),
// skipping score-neutral '?'/'-' cells; `exclude` drops one character from the result.
const disjoint = (a, b, exclude = null) => {
  const skip = v => !v || v.includes('?') || v.includes('-');
  const A = matrixLookup[a], B = matrixLookup[b];
  return [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(cid => {
    if (cid === exclude) return false;
    const va = A[cid], vb = B[cid];
    return !skip(va) && !skip(vb) && !va.some(x => vb.includes(x));
  });
};
const sep = disjoint('cataglyphis', 'formica', 'gen-36');
if (!sep.includes('gen-51')) {
  fail(`Cataglyphis/Formica not separated by gen-51 (disjoint-non-gen-36 = [${sep}]). ` +
       `If the psammophore honest-coding fell back to multi-state, Part 2's goal is unmet — surface to user.`);
}

// 3. gen-36 still present and still separates the pair (guard against accidental deletion).
//    It is the load-bearing character we deliberately keep, so assert it actually still
//    discriminates Cataglyphis/Formica (presence alone is not enough).
if (!characters.find(c => c.id === 'gen-36')) fail('gen-36 was removed (must be kept)');
if (!disjoint('cataglyphis', 'formica').includes('gen-36')) {
  fail('gen-36 no longer separates Cataglyphis/Formica');
}

process.exit(failures === 0 ? (console.log(`  PASS — ${genera.length} genera; pair separated by [${sep}]`), 0) : 1);
