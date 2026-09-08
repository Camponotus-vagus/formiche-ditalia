// PSI flagged 1616 KiB of image savings on the homepage, 763 KB of it a
// 4096x4096 logo rendered at 36x36. Both a total budget and a per-file cap: the
// total catches death by a thousand thumbnails, the cap catches one huge file.

import { requireDist, imgTags, srcsetUrls, assetBytes, kb, runChecks, DIST } from './lib.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOMEPAGE_IMAGE_BUDGET, HOMEPAGE_MAX_IMAGE } from './budgets.mjs';

requireDist();
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const imgs = imgTags(html);

runChecks('homepage-image-budget', (check) => {
  // One fetch per distinct src: the same six genus files appear in both grids.
  const fetched = new Map();
  for (const i of imgs) if (i.src && !fetched.has(i.src)) fetched.set(i.src, assetBytes(i.src));

  let total = 0;
  for (const [url, bytes] of fetched) {
    check(bytes !== null, `homepage references a missing image: ${url}`);
    total += bytes ?? 0;
  }
  check(
    total <= HOMEPAGE_IMAGE_BUDGET,
    `homepage images total ${kb(total)}, over the ${kb(HOMEPAGE_IMAGE_BUDGET)} budget`,
  );

  // Any candidate the browser could pick, not just the fallback.
  for (const i of imgs) {
    for (const url of [i.src, ...srcsetUrls(i.srcset)].filter(Boolean)) {
      const bytes = assetBytes(url);
      if (bytes === null) continue;
      check(
        bytes <= HOMEPAGE_MAX_IMAGE,
        `${url} is ${kb(bytes)}, over the ${kb(HOMEPAGE_MAX_IMAGE)} per-image cap`,
      );
    }
  }

  console.log(`  ${fetched.size} images, ${kb(total)} of ${kb(HOMEPAGE_IMAGE_BUDGET)}`);
});
