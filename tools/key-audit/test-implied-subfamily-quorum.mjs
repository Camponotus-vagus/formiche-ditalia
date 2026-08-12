// Test: impliedSubfamily requires a quorum of >=2 concordant scoped selections.
// A single scoped answer must NOT trigger the out-of-scope penalty; two answers
// sharing one subfamily_scope MUST; mixed scopes must NOT. Mirrors §4 of
// docs/superpowers/specs/2026-07-09-character-globalization-design.md.
import { loadData, score, impliedSubfamily } from './simulator.mjs';

const { genera, matrixLookup, charById } = loadData();
let failures = 0;
const log = (ok, msg) => { if (ok) console.log(`  PASS — ${msg}`); else { console.error(`  FAIL — ${msg}`); failures++; } };
console.log('Test: impliedSubfamily quorum (>=2 concordant)');

// Find two characters that share the same non-null subfamily_scope.
const scoped = Object.values(charById).filter(c => c.subfamily_scope);
const byScope = {};
for (const c of scoped) (byScope[c.subfamily_scope] ??= []).push(c);
const scopeWithTwo = Object.entries(byScope).find(([, cs]) => cs.length >= 2);
log(!!scopeWithTwo, 'found a subfamily_scope with >=2 characters');
if (!scopeWithTwo) process.exit(1);
const [scopeName, cs] = scopeWithTwo;
const [c1, c2] = cs;

// A pick value that exists for c1/c2 in SOME genus of that scope (so the selection is realistic).
const pick = (c) => {
  for (const g of genera) { const v = matrixLookup[g.id]?.[c.id]; if (v && !v.includes('?') && !v.includes('-')) return v[0]; }
  return '0';
};
const sel1 = [{ characterId: c1.id, value: pick(c1), weight: 1 }];
const sel2 = [{ characterId: c1.id, value: pick(c1), weight: 1 }, { characterId: c2.id, value: pick(c2), weight: 1 }];

log(impliedSubfamily(sel1, charById) === null, 'single scoped selection implies NO subfamily');
log(impliedSubfamily(sel2, charById) === scopeName, `two concordant selections imply ${scopeName}`);

// Mixed: add a character from a different scope → still null.
const other = scoped.find(c => c.subfamily_scope !== scopeName);
if (other) {
  const selMixed = [...sel2, { characterId: other.id, value: pick(other), weight: 1 }];
  log(impliedSubfamily(selMixed, charById) === null, 'mixed scopes imply NO subfamily');
}

// Dismissal (issue #32 §1): the banner's "don't lock the subfamily" must fully
// disengage the out-of-scope penalty — same scores as no quorum at all — while a
// dismissal of a DIFFERENT subfamily must not suppress the lock.
log(impliedSubfamily(sel2, charById, scopeName) === null,
    'dismissing the implied scope disengages the lock');
log(impliedSubfamily(sel2, charById, 'some-other-subfamily') === scopeName,
    'dismissing a different scope does not suppress the lock');

// Behavioural: with the lock dismissed, every genus scores exactly as if no
// subfamily were implied (compare against a single-selection run where the quorum
// cannot form — penalties must match the no-lock branch).
{
  const locked = score(sel2, genera, matrixLookup, charById, 99);
  const dismissed = score(sel2, genera, matrixLookup, charById, 99, scopeName);
  const outOfScope = genera.filter(g => g.subfamily_id && g.subfamily_id !== scopeName);
  const worse = outOfScope.filter(g => {
    const l = locked.find(r => r.genus.id === g.id);
    const d = dismissed.find(r => r.genus.id === g.id);
    return l && d && d.score < l.score;
  });
  log(worse.length === 0, 'no out-of-scope genus scores worse with the lock dismissed');
  const improved = outOfScope.some(g => {
    const l = locked.find(r => r.genus.id === g.id);
    const d = dismissed.find(r => r.genus.id === g.id);
    return l && d && d.score > l.score;
  });
  log(improved, 'at least one out-of-scope genus recovers score when the lock is dismissed');
}

// Behavioural: pick an out-of-scope genus lacking data for BOTH chars, so the
// out-of-scope penalty must engage only at quorum (2 answers), not at 1. Use a large
// maxMismatches to isolate the score from the tolerance filter and assert on score value.
const outGenus = genera.find(g =>
  g.subfamily_id && g.subfamily_id !== scopeName &&
  !matrixLookup[g.id]?.[c1.id] && !matrixLookup[g.id]?.[c2.id]);
if (outGenus) {
  const s1 = score(sel1, genera, matrixLookup, charById, 99).find(r => r.genus.id === outGenus.id);
  const s2 = score(sel2, genera, matrixLookup, charById, 99).find(r => r.genus.id === outGenus.id);
  log(s1 && s2 && s2.score < s1.score,
      `out-of-scope ${outGenus.id}: penalty engages only at quorum (1-answer=${s1?.score.toFixed(3)} > 2-answer=${s2?.score.toFixed(3)})`);
} else {
  console.log('  SKIP — no out-of-scope genus missing both probe chars (behavioural check)');
}

if (failures === 0) { console.log('\nPASS'); process.exit(0); }
console.error(`\nFAIL — ${failures} assertion(s)`); process.exit(1);
