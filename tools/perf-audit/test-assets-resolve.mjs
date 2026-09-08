// src/data/image-variants.json is generated from what the variant script actually
// produced, and the templates build srcset from it. This asserts the other
// direction: every image URL in the built HTML resolves to a file on disk, so a
// stale map or a deleted variant fails the build rather than 404ing in production.

import { requireDist, htmlPages, imgTags, srcsetUrls, assetBytes, runChecks } from './lib.mjs';

requireDist();

runChecks('assets-resolve', (check) => {
  let checked = 0;
  for (const { rel, html } of htmlPages()) {
    for (const img of imgTags(html)) {
      for (const url of [img.src, ...srcsetUrls(img.srcset)].filter(Boolean)) {
        if (!url.startsWith('/images/')) continue;
        checked++;
        check(assetBytes(url) !== null, `${rel} references a missing file: ${url}`);
      }
    }
  }
  console.log(`  ${checked} image references resolved`);
});
