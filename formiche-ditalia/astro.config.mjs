import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://formicheditalia.it',
  // Canonical URL form is the directory one (/contatti/). Keep internal links,
  // <link rel="canonical">, the sitemap and the Vercel `trailingSlash` setting
  // in agreement, otherwise Google indexes both variants as duplicates.
  trailingSlash: 'always',
  integrations: [react(), tailwind(), sitemap()],
  output: 'static',
});
