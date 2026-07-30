// Shared loader for the blog audit suite. Mirrors tools/key-audit/simulator.mjs:
// every test imports loadData() from here so the data paths live in one place.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'formiche-ditalia', 'src', 'data', 'blog');

const readJson = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'));

export function loadData() {
  return {
    terre: readJson('terre.json'),
    spedizioni: readJson('spedizioni.json'),
  };
}

export { dataDir };
