// The hero carousel lives in a `hidden lg:block` wrapper. With client:load, mobile
// downloaded and hydrated it anyway — React mounting an invisible tree and running
// a 4s setInterval on it. client:media must mirror the wrapper's breakpoint.

import { requireDist, runChecks, DIST } from './lib.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

requireDist();
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

runChecks('hydration-directives', (check) => {
  const islands = [...html.matchAll(/<astro-island\b([^>]*)>/g)].map(([, attrs]) => {
    const m = {};
    for (const [, k, v] of attrs.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) m[k] = v;
    return m;
  });

  const carousel = islands.filter((i) => (i['component-url'] || '').includes('HeroCarousel'));
  check(carousel.length === 1, `expected 1 HeroCarousel island on the homepage, found ${carousel.length}`);
  for (const i of carousel) {
    check(
      i.client === 'media',
      `HeroCarousel hydrates with client="${i.client}" — it must be client:media, ` +
        `it is display:none below 1024px`,
    );
  }
  console.log(`  ${islands.length} island(s); carousel is client="${carousel[0]?.client}"`);
});
