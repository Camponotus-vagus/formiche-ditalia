// The homepage once pulled 277 KB of JS: react-dom plus both i18n JSON files,
// almost all of it to render a two-character language button. src/i18n/lang.ts
// exists to keep the translations off this path; a static `from '../i18n'` in a
// client:load island puts them straight back.

import { requireDist, kb, runChecks, DIST } from './lib.mjs';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { HOMEPAGE_JS_BUDGET } from './budgets.mjs';

requireDist();
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

runChecks('homepage-js-budget', (check) => {
  const urls = [...new Set(html.match(/\/_astro\/[A-Za-z0-9_.-]+\.js/g) || [])];
  let total = 0;
  for (const u of urls) {
    const p = join(DIST, u.replace(/^\//, ''));
    check(existsSync(p), `homepage references a missing script: ${u}`);
    if (existsSync(p)) total += statSync(p).size;
  }
  check(
    total <= HOMEPAGE_JS_BUDGET,
    `homepage JS totals ${kb(total)}, over the ${kb(HOMEPAGE_JS_BUDGET)} budget`,
  );
  console.log(`  ${urls.length} chunks, ${kb(total)} of ${kb(HOMEPAGE_JS_BUDGET)}`);
});
