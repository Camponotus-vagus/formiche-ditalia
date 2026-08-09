import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { isNoindexRoute } from './src/utils/seo/noindex.mjs';

export default defineConfig({
  site: 'https://formicheditalia.it',
  // Canonical URL form is the directory one (/contatti/). Keep internal links,
  // <link rel="canonical">, the sitemap and the Vercel `trailingSlash` setting
  // in agreement, otherwise Google indexes both variants as duplicates.
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind(),
    // A page that carries a `noindex` robots tag has no business in the
    // sitemap: submitting it asks Google to crawl a URL we then tell it to
    // drop. src/utils/seo/noindex.mjs is the same module BaseLayout reads for
    // the meta tag, so the two answers cannot disagree.
    sitemap({
      filter: (page) => !isNoindexRoute(new URL(page).pathname),
    }),
  ],
  output: 'static',
});
