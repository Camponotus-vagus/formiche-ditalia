// Aggregate runner for the key-audit regression suite.
// Runs every test-*.mjs plus sanity.mjs, reports a summary, and exits non-zero
// if ANY test fails — so `node run-tests.mjs` is a single green/red signal
// (the seed of the item-3.3 CI check).

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tests = readdirSync(here)
  .filter(f => f.startsWith('test-') && f.endsWith('.mjs'))
  .sort();
tests.push('sanity.mjs'); // sanity has no assertions but must not throw

let failed = 0;
for (const t of tests) {
  // cwd: here — the tests resolve the data dir relative to tools/key-audit, so run
  // them from there regardless of where this runner was invoked (repo root, CI, …).
  const res = spawnSync(process.execPath, [join(here, t)], { encoding: 'utf8', cwd: here });
  const ok = res.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${t}`);
  if (!ok) {
    process.stdout.write(res.stdout);
    process.stderr.write(res.stderr);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} suites passed`);
process.exit(failed === 0 ? 0 : 1);
