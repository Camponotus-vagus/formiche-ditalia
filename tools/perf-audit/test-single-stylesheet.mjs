// Guards against Tailwind being generated twice (@astrojs/tailwind's applyBaseStyles
// injecting base.css alongside global.css's own @tailwind directives). That shipped
// two ~61 KB near-identical render-blocking stylesheets on every page.

import { requireDist, htmlPages, runChecks } from './lib.mjs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = requireDist();

runChecks('single-stylesheet', (check) => {
  for (const { rel, html } of htmlPages()) {
    const n = (html.match(/<link[^>]+rel="stylesheet"/g) || []).length;
    check(n <= 1, `${rel} links ${n} stylesheets (expected at most 1)`);
  }

  const css = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css'));
  check(css.length <= 1, `dist/_astro has ${css.length} stylesheets: ${css.join(', ')}`);
});
