import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { BLOG_PRELAUNCH, isBlogRoute } from './src/utils/blog/prelaunch.mjs';

export default defineConfig({
  site: 'https://formicheditalia.it',
  // Canonical URL form is the directory one (/contatti/). Keep internal links,
  // <link rel="canonical">, the sitemap and the Vercel `trailingSlash` setting
  // in agreement, otherwise Google indexes both variants as duplicates.
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind(),
    // The blog routes stay out of the sitemap until post #0 ships — see
    // src/utils/blog/prelaunch.mjs.
    sitemap({
      filter: (page) => !BLOG_PRELAUNCH || !isBlogRoute(new URL(page).pathname),
    }),
  ],
  output: 'static',
});
