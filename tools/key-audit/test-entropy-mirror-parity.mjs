// Production (IdentificationKey.tsx) and the simulator mirror implement the same scoring
// algorithm and must stay aligned — a project constraint with no test harness behind it,
// because the TSX cannot be imported here. They drifted three times before this test existed:
//   - the simulator skipped '?' and '-', production skipped only '?' (phantom state);
//   - neither normalised multi-state cells (entropy above its own ceiling);
//   - production held THREE copies of the loop; only one fed the answer weight, while the
//     UI suggestion used the other two, so a fix could land on one path and miss the rest.
// Source-level assertions are crude but catch exactly that drift.
//
// Run from tools/key-audit (run-tests.mjs sets cwd=here for every test it spawns), hence
// the relative path below.
import { readFileSync } from 'node:fs';

const TSX_PATH = '../../formiche-ditalia/src/components/IdentificationKey.tsx';
const tsx = readFileSync(TSX_PATH, 'utf8');
const sim = readFileSync('./simulator.mjs', 'utf8');

let failures = 0;
const log = (ok, msg) => {
  if (ok) console.log(`  PASS — ${msg}`);
  else { console.error(`  FAIL — ${msg}`); failures++; }
};

console.log('Test: entropy mirror parity (IdentificationKey.tsx <-> simulator.mjs)');

// --- 1. exactly one entropy loop in production ------------------------------
// The state-tally line is the fingerprint of the entropy loop body. If it appears more
// than once, the triplication (fixed by a73487c) has crept back in — one copy could get
// patched while the others (feeding a different UI path) stay stale, as happened before.
const LOOP_FINGERPRINT = /stateCounts\[v\] = \(stateCounts\[v\] \|\| 0\) \+/g;
const tsxLoopCount = (tsx.match(LOOP_FINGERPRINT) || []).length;
log(
  tsxLoopCount === 1,
  `IdentificationKey.tsx has exactly one entropy-loop body (found ${tsxLoopCount}) — ` +
    (tsxLoopCount === 1
      ? 'single calculateCharacterEntropy feeds every caller'
      : `if >1, collapse the duplicates back into one calculateCharacterEntropy and have every ` +
        `caller (bestCharacterId, bestEasyCharId, answer-weight calc) call it`)
);

// --- 2. predicate parity: both files define isInformative and hasCharacterData ---
const hasFn = (src, name) =>
  new RegExp(`\\b(?:function|const)\\s+${name}\\b`).test(src) ||
  new RegExp(`\\bexport\\s+function\\s+${name}\\b`).test(src);

log(
  hasFn(tsx, 'isInformative'),
  `IdentificationKey.tsx defines isInformative — if missing, re-add the shared "cell carries ` +
    `usable signal" predicate (must exclude '?' and '-')`
);
log(
  hasFn(sim, 'isInformative'),
  `simulator.mjs defines (exports) isInformative — if missing, re-add the mirror predicate ` +
    `so characterEntropy/hasCharacterData can use it`
);

// The predicate must exclude BOTH meta-codes, not just '?' — this is the exact bug that
// slipped through once (simulator excluded '-' too, production excluded only '?', so a
// genus coded '-' was silently treated as real data in the UI and not in the audit).
const extractLine = (src, marker) => {
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const end = src.indexOf('\n', idx);
  return src.slice(idx, end === -1 ? undefined : end);
};

const tsxIsInformativeLine =
  extractLine(tsx, "!!values && !values.includes") ||
  extractLine(tsx, 'isInformative = (values');
const simIsInformativeLine =
  extractLine(sim, "!!values && !values.includes") ||
  extractLine(sim, 'export function isInformative');

if (tsxIsInformativeLine) {
  log(
    tsxIsInformativeLine.includes("'?'") && tsxIsInformativeLine.includes("'-'"),
    `IdentificationKey.tsx's isInformative excludes both '?' and '-' — if either is missing, ` +
      `that meta-code will leak into the entropy distribution as if it were a real state ` +
      `(found: ${tsxIsInformativeLine.trim()})`
  );
}
if (simIsInformativeLine) {
  log(
    simIsInformativeLine.includes("'?'") && simIsInformativeLine.includes("'-'"),
    `simulator.mjs's isInformative excludes both '?' and '-' (found: ${simIsInformativeLine.trim()})`
  );
}
log(
  hasFn(tsx, 'hasCharacterData'),
  `IdentificationKey.tsx defines hasCharacterData — if missing, re-add the "any genus has ` +
    `informative data for this character" guard used before asking a question`
);
log(
  hasFn(sim, 'hasCharacterData'),
  `simulator.mjs defines (exports) hasCharacterData — if missing, re-add the mirror guard`
);

// --- 3. both entropy implementations normalise AND route through isInformative ---
// Pull just the entropy function bodies (from their `const`/`export function` header to the
// next top-level closing brace) so the checks below don't accidentally match unrelated code
// elsewhere in either file.
const extractFn = (src, header) => {
  const start = src.indexOf(header);
  if (start === -1) return null;
  // walk braces from the first '{' after the header to find the matching close
  const braceStart = src.indexOf('{', start);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
};

const tsxEntropyFn = extractFn(tsx, 'const calculateCharacterEntropy');
const simEntropyFn = extractFn(sim, 'export function characterEntropy');

log(tsxEntropyFn !== null, 'located calculateCharacterEntropy body in IdentificationKey.tsx');
log(simEntropyFn !== null, 'located characterEntropy body in simulator.mjs');

const NORMALISATION = /\+\s*1\s*\/\s*values\.length/;
if (tsxEntropyFn) {
  log(
    NORMALISATION.test(tsxEntropyFn),
    "IdentificationKey.tsx's entropy loop normalises by 1/values.length — if absent, a " +
      'multi-state cell inflates the distribution above its own ceiling (the original bug)'
  );
  log(
    /isInformative\(/.test(tsxEntropyFn),
    "IdentificationKey.tsx's entropy loop guards with isInformative(...) — if it inlines its " +
      "own '?'-only (or '-'-only) check instead, the guard can drift from the shared predicate"
  );
}
if (simEntropyFn) {
  log(
    NORMALISATION.test(simEntropyFn),
    "simulator.mjs's characterEntropy normalises by 1/values.length — if absent, it no longer " +
      'mirrors production and pairwise-distance/audit numbers will disagree with the live key'
  );
  log(
    /isInformative\(/.test(simEntropyFn),
    "simulator.mjs's characterEntropy guards with isInformative(...) — if it inlines its own " +
      'check instead, it can silently diverge from the shared predicate'
  );
}

// --- 4. predictStateImpact parity (issue #32 §2) ------------------------------
// Both implementations must exclude a genus only when informative data contradicts
// the hypothetical answer AND the tolerance budget is exhausted. The fingerprint is
// the tolerance-respecting exclusion condition; if it disappears from either file,
// the -N badge (or its offline oracle) has regressed to counting no-data genera.
const IMPACT_FINGERPRINT = /sg\.mismatches \+ 1 > maxMismatches/;
log(
  IMPACT_FINGERPRINT.test(tsx),
  "IdentificationKey.tsx's predictStateImpact respects the tolerance budget " +
    '(sg.mismatches + 1 > maxMismatches) — if missing, the -N badge no longer counts ' +
    'actual exclusions from the shown set'
);
log(
  IMPACT_FINGERPRINT.test(sim),
  "simulator.mjs's predictStateImpact respects the tolerance budget — if missing, the " +
    'offline mirror has drifted from the production badge'
);
log(
  hasFn(sim, 'predictStateImpact'),
  'simulator.mjs defines (exports) predictStateImpact — if missing, re-add the mirror ' +
    'so test-predict-impact-parity.mjs can oracle-check the badge semantics'
);

if (failures === 0) {
  console.log('\nPASS — production has one entropy implementation, and it mirrors simulator.mjs');
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} assertion(s) failed (see messages above for what to fix)`);
  process.exit(1);
}
