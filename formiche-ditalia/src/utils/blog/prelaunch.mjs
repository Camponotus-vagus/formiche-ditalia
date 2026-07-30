// Pre-launch gate for the blog section.
//
// The scaffolding under /diario/ is deployable before any post exists, but its
// pages must not reach search engines yet: they would put a dozen-odd
// contentless pages into the index of a site whose subject is the
// identification key. While BLOG_PRELAUNCH is true the blog routes are kept out
// of the sitemap and served with `noindex`.
//
// To launch: set BLOG_PRELAUNCH to false. That is the whole switch — the
// sitemap filter and the robots meta both read it. Do it in the same change
// that publishes post #0, and add an entry point from the footer.
//
// Plain .mjs, not .ts, because astro.config.mjs imports it too.

export const BLOG_PRELAUNCH = true;

// Every route tree owned by the blog. Kept here so the sitemap filter and the
// robots meta tag cannot drift apart.
export const BLOG_ROUTE_PREFIXES = ['/diario', '/note-di-metodo', '/terre', '/spedizioni'];

export function isBlogRoute(pathname) {
  return BLOG_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
