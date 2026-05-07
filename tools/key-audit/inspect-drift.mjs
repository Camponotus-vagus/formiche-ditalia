// Compares current JSON state vs what `parse_nexus.py` would produce from Rigato NEXUS.
// Reproduces parse_nexus's char_id assignment (sequential gen-N counter across subfamilies,
// in the order: Myrmicinae, Ponerinae, Dolichoderinae, Formicinae).
// Output: drift report — which genera/matrix entries/characters are JSON-only vs NEXUS-derived.

import fs from 'node:fs';
import path from 'node:path';

const PROJECT = '/Users/francesco.mensa/Downloads/Progetto Formiche d\'Italia';
const RIGATO = path.join(PROJECT, 'TESI FORMICHE (Dropbox)', 'Matrici corrette da Rigato');
const FALLBACK_GENERI = path.join(PROJECT, 'TESI FORMICHE', 'Generi');
const DATA = path.join(PROJECT, '.claude/worktrees/nostalgic-goldberg-0d98a8/formiche-ditalia/src/data');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseNexus(filepath) {
  const text = fs.readFileSync(filepath, 'utf8');
  // TAXA
  const taxaMatch = text.match(/BEGIN TAXA;[\s\S]*?TAXLABELS\s+([\s\S]*?)\s*;/i);
  let taxa = [];
  if (taxaMatch) {
    taxa = taxaMatch[1].match(/'[^']*'|\S+/g) || [];
    taxa = taxa.map(t => t.replace(/^'|'$/g, ''));
  }
  // CHARSTATELABELS
  const cslMatch = text.match(/CHARSTATELABELS\s+([\s\S]*?)\s*;/i);
  const characters = [];
  if (cslMatch) {
    const raw = cslMatch[1];
    // Split on commas that precede a char-number (digits + space)
    const entries = raw.split(/,\s*(?=\d+\s)/);
    for (const e of entries) {
      const m = e.trim().match(/^(\d+)\s+([\s\S]+)/);
      if (!m) continue;
      const num = parseInt(m[1]);
      const rest = m[2].trim();
      let name, statesPart = '';
      if (rest.includes('/')) {
        const i = rest.indexOf('/');
        name = rest.slice(0, i).trim();
        statesPart = rest.slice(i + 1).trim();
      } else name = rest;
      name = name.replace(/^['"]|['"]$/g, '');
      const stateTokens = statesPart ? (statesPart.match(/'[^']*'|"[^"]*"|\S+/g) || []) : [];
      const states = stateTokens.map(s => s.replace(/^['"]|['"]$/g, ''));
      characters.push({ num, name, states });
    }
  }
  // MATRIX
  const matMatch = text.match(/MATRIX\s*\n([\s\S]*?)\s*;/i);
  const matrix = {};
  if (matMatch) {
    for (const line of matMatch[1].trim().split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let taxonName, stateStr;
      if (trimmed.startsWith("'")) {
        const e = trimmed.indexOf("'", 1);
        taxonName = trimmed.slice(1, e);
        stateStr = trimmed.slice(e + 1).trim();
      } else {
        const m = trimmed.match(/^(\S+)\s+(.+)/);
        if (!m) continue;
        taxonName = m[1];
        stateStr = m[2].trim();
      }
      const states = parseStateString(stateStr);
      matrix[taxonName] = states;
    }
  }
  return { taxa, characters, matrix };
}

function parseStateString(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '{') {
      const end = s.indexOf('}', i);
      out.push(s.slice(i + 1, end).split(/\s+/).filter(Boolean));
      i = end + 1;
    } else if (/\s/.test(s[i])) {
      i++;
    } else {
      out.push([s[i]]);
      i++;
    }
  }
  return out;
}

function findNex(filename) {
  const a = path.join(RIGATO, filename);
  if (fs.existsSync(a)) return a;
  const b = path.join(FALLBACK_GENERI, filename);
  if (fs.existsSync(b)) return b;
  return null;
}

// Reproduce parse_nexus.py: subfamily order matters — but Python iterates over a dict whose
// insertion order in main() is: Myrmicinae, Ponerinae, Dolichoderinae, Formicinae.
const SUBFAMILY_ORDER = ['Myrmicinae', 'Ponerinae', 'Dolichoderinae', 'Formicinae'];
const SF_FILES = {
  Myrmicinae: 'generi Myrmicinae.nex',
  Ponerinae: 'generi Ponerinae.nex',
  Dolichoderinae: 'generi Dolichoderinae.nex',
  Formicinae: 'generi Formicinae.nex',
};

// Build expected JSON
const subParses = {};
for (const sf of SUBFAMILY_ORDER) {
  const f = findNex(SF_FILES[sf]);
  if (!f) { console.error('Missing NEXUS for', sf); continue; }
  subParses[sf] = parseNexus(f);
}

let charCounter = 0;
const expectedChars = [];
const expectedGenera = [];
const expectedMatrix = [];
for (const sf of SUBFAMILY_ORDER) {
  const p = subParses[sf];
  const sfId = slugify(sf);
  const charIdMap = {};
  for (const ch of p.characters) {
    charCounter++;
    const cid = `gen-${charCounter}`;
    charIdMap[ch.num] = cid;
    expectedChars.push({ id: cid, scope: sfId, name: ch.name, n_states: ch.states.length });
  }
  for (const taxon of p.taxa) {
    const gid = slugify(taxon);
    expectedGenera.push({ id: gid, scientific_name: taxon, subfamily_id: sfId });
    if (p.matrix[taxon]) {
      const row = p.matrix[taxon];
      for (let i = 0; i < p.characters.length && i < row.length; i++) {
        const cid = charIdMap[p.characters[i].num];
        expectedMatrix.push({ genus_id: gid, character_id: cid, state_values: row[i] });
      }
    }
  }
}

// Subfamilies (from sottofamiglie.nex)
const sottoFile = findNex('sottofamiglie.nex');
const sotto = sottoFile ? parseNexus(sottoFile) : { taxa: [] };
const expectedSubfamilies = sotto.taxa.map(t => ({ id: slugify(t), name: t }));

// Plus monotypic injection (parse_nexus.py adds these unconditionally without matrix data)
const monotypicMap = { Amblyoponinae: 'Stigmatomma', Proceratiinae: 'Proceratium', Leptanillinae: 'Leptanilla' };
for (const [sfName, gName] of Object.entries(monotypicMap)) {
  const gid = slugify(gName);
  if (!expectedGenera.some(g => g.id === gid)) {
    expectedGenera.push({ id: gid, scientific_name: gName, subfamily_id: slugify(sfName) });
  }
}

// Current JSON
const currentSub = JSON.parse(fs.readFileSync(path.join(DATA, 'subfamilies.json'), 'utf8'));
const currentGenera = JSON.parse(fs.readFileSync(path.join(DATA, 'genera.json'), 'utf8'));
const currentChars = JSON.parse(fs.readFileSync(path.join(DATA, 'characters.json'), 'utf8'));
const currentMatrix = JSON.parse(fs.readFileSync(path.join(DATA, 'matrix.json'), 'utf8'));

// Compare
console.log('=== SUBFAMILIES ===');
console.log(`Expected (from sottofamiglie.nex + monotypic): ${expectedSubfamilies.length}`);
console.log(`Current JSON: ${currentSub.length}`);
const expSubIds = new Set(expectedSubfamilies.map(s => s.id));
const curSubIds = new Set(currentSub.map(s => s.id));
console.log('In JSON but NOT in NEXUS:', [...curSubIds].filter(x => !expSubIds.has(x)));
console.log('In NEXUS but NOT in JSON:', [...expSubIds].filter(x => !curSubIds.has(x)));

console.log('\n=== GENERA ===');
console.log(`Expected: ${expectedGenera.length}`);
console.log(`Current: ${currentGenera.length}`);
const expGIds = new Set(expectedGenera.map(g => g.id));
const curGIds = new Set(currentGenera.map(g => g.id));
console.log('In JSON but NOT producible from NEXUS:', [...curGIds].filter(x => !expGIds.has(x)));
console.log('Expected but missing from JSON:', [...expGIds].filter(x => !curGIds.has(x)));

console.log('\n=== CHARACTERS ===');
console.log(`Expected: ${expectedChars.length} (sequential gen-1..gen-${charCounter})`);
console.log(`Current: ${currentChars.length}`);
console.log('Current char IDs:', currentChars.map(c => c.id).join(', '));
console.log('Expected char IDs:', expectedChars.map(c => c.id).join(', '));

const expCIds = new Set(expectedChars.map(c => c.id));
const curCIds = new Set(currentChars.map(c => c.id));
console.log('In JSON but NOT in NEXUS:', [...curCIds].filter(x => !expCIds.has(x)));
console.log('In NEXUS but NOT in JSON:', [...expCIds].filter(x => !curCIds.has(x)));

console.log('\n=== MATRIX ENTRIES ===');
console.log(`Expected: ${expectedMatrix.length}`);
console.log(`Current: ${currentMatrix.length}`);

// Genera with matrix entries that aren't expected (i.e. hand-added matrix data)
const expectedGenusInMatrix = new Set(expectedMatrix.map(m => m.genus_id));
const currentGenusInMatrix = new Set(currentMatrix.map(m => m.genus_id));
console.log('Genera with matrix data in JSON but NOT in NEXUS-derived:',
  [...currentGenusInMatrix].filter(x => !expectedGenusInMatrix.has(x)));

// Save expected JSON for diff
const dumpDir = path.join(path.dirname(process.argv[1]), 'expected-from-nexus');
fs.mkdirSync(dumpDir, { recursive: true });
fs.writeFileSync(path.join(dumpDir, 'expected-genera.json'), JSON.stringify(expectedGenera, null, 2));
fs.writeFileSync(path.join(dumpDir, 'expected-chars.json'), JSON.stringify(expectedChars, null, 2));
fs.writeFileSync(path.join(dumpDir, 'expected-matrix.json'), JSON.stringify(expectedMatrix, null, 2));
fs.writeFileSync(path.join(dumpDir, 'expected-subfamilies.json'), JSON.stringify(expectedSubfamilies, null, 2));
console.log(`\nExpected snapshots written to ${dumpDir}`);
