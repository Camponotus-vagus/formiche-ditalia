// Deterministic mirror of IdentificationKey.tsx scoring logic.
// Goal: given a set of (characterId -> value) selections, return the ranked list of genera.
// We do NOT replicate the entropy weighting *during* exploration (it depends on UI ordering);
// we simulate worst-case equal weights, but also support a mode that recomputes entropy
// at each selection step (mimicking real UI flow).

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.argv[2] || '../../formiche-ditalia/src/data');

export function loadData(dir = DATA_DIR) {
  const read = (n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'));
  const characters = read('characters.json');
  const matrix = read('matrix.json');
  const genera = read('genera.json');
  const subfamilies = read('subfamilies.json');

  // Build matrix lookup: { genusId: { charId: [stateValues...] } }
  const matrixLookup = {};
  for (const e of matrix) {
    if (!matrixLookup[e.genus_id]) matrixLookup[e.genus_id] = {};
    matrixLookup[e.genus_id][e.character_id] = e.state_values;
  }

  const charById = Object.fromEntries(characters.map(c => [c.id, c]));
  return { characters, matrix, genera, subfamilies, matrixLookup, charById };
}

/**
 * Implied subfamily: returns the shared subfamily_scope ONLY when at least two
 * selected characters carry it and ALL scoped selections agree. One scoped answer,
 * mixed scopes, or zero scoped answers → null. Global (null-scope) characters are
 * ignored via filter(Boolean). Mirror of IdentificationKey.tsx impliedSubfamily.
 * NOTE: caller passes selections already filtered of user '?' values.
 */
export function impliedSubfamily(selections, charById) {
  const scoped = selections.map(sel => charById[sel.characterId]?.subfamily_scope).filter(Boolean);
  const scopes = new Set(scoped);
  return (scopes.size === 1 && scoped.length >= 2) ? [...scopes][0] : null;
}

/**
 * Run the scoring algorithm.
 * @param selections - array of { characterId, value, weight } (weight in 0..1, default 1)
 * @param genera - genera list (already region-filtered if applicable)
 * @param matrixLookup - precomputed
 * @param charById - precomputed
 * @param maxMismatches - tolerance (default 1, matching UI default)
 * @returns sorted ScoredGenus[]
 */
export function score(selections, genera, matrixLookup, charById, maxMismatches = 1) {
  // A user-selected '?' ("unknown") is score-neutral (mirror of IdentificationKey.tsx):
  // it must neither imply a subfamily nor penalize any genus.
  selections = selections.filter(sel => sel.value !== '?');
  if (selections.length === 0) {
    return genera.map(g => ({ genus: g, score: 1, mismatches: 0, matched: 0 }));
  }
  // Implied subfamily: only when >=2 selected scoped characters agree (spec §4).
  const impliedSubfamilyVal = impliedSubfamily(selections, charById);

  const out = genera.map(genus => {
    let mismatches = 0, matched = 0, missingCount = 0;
    let totalWeight = 0, weightedScore = 0;

    for (const sel of selections) {
      const values = matrixLookup[genus.id]?.[sel.characterId];
      const w = sel.weight ?? 1;
      if (!values) {
        missingCount++;
        continue;
      }
      if (values.includes('?') || values.includes('-')) {
        // Uninformative cell — '?' (unknown, guide Sec. 4) or '-' (structurally
        // inapplicable, item 3.1): the taxon survives without penalty either way.
        continue;
      }
      totalWeight += w;
      if (values.includes(sel.value)) {
        matched++;
        weightedScore += w;
      } else {
        mismatches++;
      }
    }

    const isOutOfScope = impliedSubfamilyVal && genus.subfamily_id !== impliedSubfamilyVal;
    let s;
    if (totalWeight > 0) {
      const avgWeight = totalWeight / (matched + mismatches);
      const missingPenalty = isOutOfScope ? 0.8 : 0.3;
      const effMis = mismatches + missingCount * missingPenalty;
      const effTot = totalWeight + missingCount * avgWeight;
      s = Math.max(0, (effTot - effMis * avgWeight) / effTot);
    } else {
      s = isOutOfScope ? 0.2 : 0.5;
    }
    return { genus, score: s, mismatches, matched };
  })
    .filter(sg => sg.mismatches <= maxMismatches)
    .sort((a, b) =>
      b.score - a.score ||
      a.genus.scientific_name.localeCompare(b.genus.scientific_name)
    );
  return out;
}

/**
 * Compatible selections for a genus: the set of (charId, value) the genus matches.
 * Each character's state list is expanded into individual entries.
 * Characters with '?' are excluded (genus has no data).
 */
export function compatibleSelections(genusId, matrixLookup) {
  const out = [];
  const m = matrixLookup[genusId] || {};
  for (const [charId, values] of Object.entries(m)) {
    if (values.includes('?') || values.includes('-')) continue;
    for (const v of values) out.push({ characterId: charId, value: v });
  }
  return out;
}

/**
 * Item 2.4: genera ruled out by the current selections, each with the reason(s) —
 * which selected characters the genus contradicts. Mirror of IdentificationKey.tsx
 * excludedGenera. A genus is excluded iff it does NOT pass the tolerance filter; a
 * missing / '?' / '-' cell never contributes a reason.
 */
export function excludedGenera(selections, genera, matrixLookup, charById, maxMismatches = 1) {
  const effective = selections.filter(sel => sel.value !== '?');
  if (effective.length === 0) return [];
  const keptIds = new Set(score(selections, genera, matrixLookup, charById, maxMismatches).map(sg => sg.genus.id));
  const out = [];
  for (const genus of genera) {
    if (keptIds.has(genus.id)) continue;
    const reasons = [];
    for (const sel of effective) {
      const values = matrixLookup[genus.id]?.[sel.characterId];
      if (!values || values.includes('?') || values.includes('-')) continue;
      if (!values.includes(sel.value)) {
        reasons.push({ characterId: sel.characterId, userValue: sel.value, genusValues: values });
      }
    }
    out.push({ genusId: genus.id, reasons });
  }
  return out;
}

/**
 * Is genus G the unique top-ranker for these selections?
 * If `tieAllowedSameSubfamily` is true, ties with same-subfamily genera don't count as failure
 * (only used to investigate; default false).
 */
export function isUniqueTop(targetId, selections, genera, matrixLookup, charById, maxMismatches = 1) {
  const ranked = score(selections, genera, matrixLookup, charById, maxMismatches);
  if (ranked.length === 0) return { unique: false, reason: 'no-genera-pass-tolerance' };
  const top = ranked[0];
  if (top.genus.id !== targetId) {
    return { unique: false, reason: 'not-top', top: top.genus.id, topScore: top.score };
  }
  if (ranked.length === 1) return { unique: true, score: top.score, gap: 1 };
  const gap = top.score - ranked[1].score;
  if (gap === 0) return { unique: false, reason: 'tied', tiedWith: ranked.filter(r => r.score === top.score && r.genus.id !== targetId).map(r => r.genus.id) };
  return { unique: true, score: top.score, gap };
}

/**
 * Within-subfamily convergence (globalized-key design, 2026-07-09). The target is
 * "resolved" when it sits at the top score AND no genus of the SAME subfamily is tied
 * with it. Cross-subfamily genera tied at the top are acceptable: after character
 * globalization they share the global characters as comparable ground and can legitimately
 * tie on them — in the key they are separated by the subfamily mechanism (>=2-concordant
 * impliedSubfamily) + subfamily-scoped characters, not by the entropy-ranked global
 * suggestion. Mirrors the P6 pairwise-distance within-subfamily guard. See
 * docs/superpowers/specs/2026-07-09-character-globalization-design.md §6.
 */
export function isUniqueTopWithinSubfamily(targetId, selections, genera, matrixLookup, charById, maxMismatches = 1) {
  const ranked = score(selections, genera, matrixLookup, charById, maxMismatches);
  if (ranked.length === 0) return { unique: false, reason: 'no-genera-pass-tolerance' };
  const target = ranked.find(r => r.genus.id === targetId);
  if (!target) return { unique: false, reason: 'target-eliminated' };
  const topScore = ranked[0].score;
  if (target.score < topScore) return { unique: false, reason: 'not-top', top: ranked[0].genus.id };
  const sub = target.genus.subfamily_id;
  const sameSubTied = ranked.filter(
    r => r.score === topScore && r.genus.id !== targetId && r.genus.subfamily_id === sub);
  if (sameSubTied.length > 0) {
    return { unique: false, reason: 'tied-within-subfamily', tiedWith: sameSubTied.map(r => r.genus.id) };
  }
  return { unique: true, score: target.score };
}

/**
 * Shannon entropy of a character over a candidate genus set.
 * Mirror of IdentificationKey.tsx calculateCharacterEntropy / bestCharacterId loop:
 * a genus coded '?' (or with no data) for the character contributes nothing; every
 * real state adds to its bucket; `total` counts genera with usable data.
 */
export function characterEntropy(charId, scoredGenera, matrixLookup) {
  const stateCounts = {};
  let total = 0;
  for (const sg of scoredGenera) {
    const values = matrixLookup[sg.genus.id]?.[charId];
    if (!values || values.includes('?') || values.includes('-')) continue;
    for (const v of values) stateCounts[v] = (stateCounts[v] || 0) + 1;
    total++;
  }
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of Object.values(stateCounts)) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Best not-yet-answered character to ask next, by max dynamic entropy over the
 * CURRENT candidate set (mirror of IdentificationKey.tsx bestCharacterId).
 * @returns { id, entropy } or null if no informative character remains.
 */
export function bestNextCharacter(scoredGenera, characters, matrixLookup, usedIds = new Set(), hiddenIds = new Set(), preferEasy = false) {
  const pick = (cands) => {
    let bestId = '';
    let bestScore = -1;
    for (const char of cands) {
      if (usedIds.has(char.id) || hiddenIds.has(char.id)) continue;
      const e = characterEntropy(char.id, scoredGenera, matrixLookup);
      if (e > bestScore) { bestScore = e; bestId = char.id; }
    }
    return { bestId, bestScore };
  };
  // Item 1.4: prefer non-hard (easy/medium) characters; fall back to a hard one only
  // if no easier character discriminates. Mirror of IdentificationKey.tsx bestCharacterId.
  if (preferEasy) {
    const easier = pick(characters.filter(c => c.difficulty !== 'hard'));
    if (easier.bestId && easier.bestScore > 0) return { id: easier.bestId, entropy: easier.bestScore };
  }
  const r = pick(characters);
  return r.bestId ? { id: r.bestId, entropy: r.bestScore } : null;
}

export function selectionToString(sel, charById) {
  const c = charById[sel.characterId];
  const st = c?.states.find(s => s.value === sel.value);
  return `${c?.name_it ?? sel.characterId}=${st?.label_it ?? sel.value}`;
}
