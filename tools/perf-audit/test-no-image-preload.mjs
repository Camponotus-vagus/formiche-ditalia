// react-dom/server emits a float <link rel="preload" as="image"> for every SSR'd
// <img> that is not loading="lazy" / fetchPriority="low". The hero carousel is
// display:none below 1024px, so such a preload makes mobile fetch, at high
// priority, an image it never paints.

import { requireDist, htmlPages, runChecks } from './lib.mjs';
import { PRELOAD_ALLOWLIST } from './budgets.mjs';

requireDist();

runChecks('no-image-preload', (check) => {
  let allowlistUsed = 0;
  for (const { rel, html } of htmlPages()) {
    const hits = html.match(/<link[^>]+rel="preload"[^>]*as="image"[^>]*>/g) || [];
    if (PRELOAD_ALLOWLIST.has(rel)) { if (hits.length) allowlistUsed++; continue; }
    check(hits.length === 0, `${rel} preloads ${hits.length} image(s): ${hits.join(' ')}`);
  }
  console.log(`  ${allowlistUsed} allowlisted page(s) still preload images`);
});
