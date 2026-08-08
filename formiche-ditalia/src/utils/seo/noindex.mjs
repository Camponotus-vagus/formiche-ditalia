// Single source of truth for "this route must not reach the search index".
//
// Two reasons feed into it today:
//   - the blog pre-launch gate (src/utils/blog/prelaunch.mjs);
//   - the 404 page.
//
// The sitemap filter (astro.config.mjs) and the robots meta tag
// (BaseLayout.astro) both read this module, so the two cannot drift apart.
// That was already the contract prelaunch.mjs set up for the blog; this
// generalises it so a third reason lands in one place instead of two.
//
// Plain .mjs, not .ts, because astro.config.mjs imports it too.

import { BLOG_PRELAUNCH, isBlogRoute } from '../blog/prelaunch.mjs';

// Astro builds src/pages/404.astro to /404.html; during the build its pathname
// is '/404'. Two things must not happen on that page:
//   - it must not be indexed;
//   - it must not emit <link rel="canonical" href="https://.../404/">, because
//     /404/ is not a real URL. That canonical points at a page that itself
//     404s, and tells Google every missing page is a duplicate of it.
export function is404Route(pathname) {
  return pathname === '/404' || pathname === '/404/';
}

// The robots meta content for a route, or null when the page should be indexed.
//
// The blog scaffolding keeps 'nofollow' as well: those pages link only to more
// scaffolding. The 404 page keeps the default 'follow' — its links back to the
// homepage and to the key are exactly where a lost crawler should go next.
export function robotsDirective(pathname) {
  if (BLOG_PRELAUNCH && isBlogRoute(pathname)) return 'noindex, nofollow';
  if (is404Route(pathname)) return 'noindex';
  return null;
}

export function isNoindexRoute(pathname) {
  return robotsDirective(pathname) !== null;
}
