// Aggregate runner for the blog audit suite — same contract as
// tools/key-audit/run-tests.mjs: runs every test-*.mjs here, prints a summary,
// exits non-zero if any test fails, so it works as a single CI signal.

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
  if (!ok) {
    process.stdout.write(res.stdout);
    process.stderr.write(res.stderr);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} suites passed`);
process.exit(failed === 0 ? 0 : 1);
