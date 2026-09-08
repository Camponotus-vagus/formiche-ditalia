// Aggregate runner for the perf-audit suite: budgets and build-output invariants
// that keep the homepage's byte weight from creeping back.
//
// Unlike key-audit and blog-audit, this suite reads dist/ — run `npm run build` in
// formiche-ditalia/ first, or every test exits with an explicit error rather than a
// false green.
//
// Deliberately no timing assertions. Lighthouse timings depend on the runner's CPU,
// which on GitHub-hosted runners varies enough that thresholds get retuned instead
// of the site getting fixed. Bytes and request counts are deterministic.

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tests = readdirSync(here)
  .filter((f) => f.startsWith('test-') && f.endsWith('.mjs'))
  .sort();

let failed = 0;
for (const t of tests) {
  const res = spawnSync(process.execPath, [join(here, t)], { encoding: 'utf8', cwd: here });
  const ok = res.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${t}`);
  process.stdout.write(res.stdout);
  if (!ok) process.stderr.write(res.stderr);
}

console.log(`\n${tests.length - failed}/${tests.length} suites passed`);
process.exit(failed === 0 ? 0 : 1);
