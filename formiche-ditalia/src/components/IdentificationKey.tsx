import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { Character, MatrixEntry, Genus } from '../types';
import GlossaryTooltip from './GlossaryTooltip';
import { getLang, type Lang } from '../i18n';

interface GlossaryEntry {
  term: string;
  term_en: string;
  definition_it: string;
  definition_en: string;
  image_url: string | null;
}

interface Props {
  characters: Character[];
  matrix: MatrixEntry[];
  genera: Genus[];
  glossary?: GlossaryEntry[];
  lang: 'it' | 'en';
}

interface WeightedSelection {
  characterId: string;
  value: string;
  weight: number; // normalized entropy at time of selection (0-1)
}

interface ScoredGenus {
  genus: Genus;
  score: number;
  mismatches: number;
  matchedCount: number;
}

const STORAGE_KEY = 'formikey:state:v1';

interface PersistedState {
  selectedStates: WeightedSelection[];
  maxMismatches: number;
  selectedRegion: string;
  hiddenCharacterIds: string[];
  preferEasy: boolean;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      selectedStates: Array.isArray(parsed.selectedStates) ? parsed.selectedStates : [],
      maxMismatches: typeof parsed.maxMismatches === 'number' ? parsed.maxMismatches : 1,
      selectedRegion: typeof parsed.selectedRegion === 'string' ? parsed.selectedRegion : '',
      hiddenCharacterIds: Array.isArray(parsed.hiddenCharacterIds) ? parsed.hiddenCharacterIds : [],
      preferEasy: typeof parsed.preferEasy === 'boolean' ? parsed.preferEasy : false,
    };
  } catch {
    return null;
  }
}

/** Inline info tooltip — shows on click (mobile) and hover (desktop) */
function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-[10px] font-bold cursor-help transition-colors"
        aria-label="Info"
      >
        i
      </button>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs text-gray-700 bg-white rounded-lg shadow-xl border border-gray-200 leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -translate-y-1" />
        </span>
      )}
    </span>
  );
}

export default function IdentificationKey({ characters, matrix, genera, glossary = [], lang: initialLang }: Props) {
  const [selectedStates, setSelectedStates] = useState<WeightedSelection[]>([]);
  const [maxMismatches, setMaxMismatches] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [hiddenCharacterIds, setHiddenCharacterIds] = useState<Set<string>>(new Set());
  // Item 1.4: when true, the suggested character avoids 'hard' (microscopic) traits.
  const [preferEasy, setPreferEasy] = useState(false);
  // Item 2.4: expand the "excluded genera" trace panel.
  const [showExcluded, setShowExcluded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lang, setCurrentLang] = useState<Lang>(initialLang);

  useEffect(() => {
    setCurrentLang(getLang());
    const handler = (e: Event) => setCurrentLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  // Hydrate state from sessionStorage on mount (deferred to avoid SSR mismatch)
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setSelectedStates(persisted.selectedStates);
      setMaxMismatches(persisted.maxMismatches);
      setSelectedRegion(persisted.selectedRegion);
      setHiddenCharacterIds(new Set(persisted.hiddenCharacterIds));
      setPreferEasy(persisted.preferEasy);
    }
    setHydrated(true);
  }, []);

  // Persist state to sessionStorage on change (only after hydration to avoid wiping)
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedStates,
        maxMismatches,
        selectedRegion,
        hiddenCharacterIds: [...hiddenCharacterIds],
        preferEasy,
      }));
    } catch {
      // sessionStorage may be disabled or full — silently ignore
    }
  }, [hydrated, selectedStates, maxMismatches, selectedRegion, hiddenCharacterIds, preferEasy]);

  /** Wraps the first glossary term found in `text` with a GlossaryTooltip. */
  const annotateWithGlossary = (text: string): ReactNode => {
    if (glossary.length === 0) return text;
    const lower = text.toLowerCase();
    let bestMatch: { entry: GlossaryEntry; index: number; matchLen: number } | null = null;

    for (const entry of glossary) {
      const term = lang === 'it' ? entry.term : entry.term_en;
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1 && (!bestMatch || term.length > bestMatch.matchLen)) {
        bestMatch = { entry, index: idx, matchLen: term.length };
      }
    }

    if (!bestMatch) return text;

    const { entry, index, matchLen } = bestMatch;
    const before = text.slice(0, index);
    const match = text.slice(index, index + matchLen);
    const after = text.slice(index + matchLen);
    const definition = lang === 'it' ? entry.definition_it : entry.definition_en;

    return (
      <>
        {before}
        <GlossaryTooltip term={lang === 'it' ? entry.term : entry.term_en} definition={definition} imageUrl={entry.image_url}>
          {match}
        </GlossaryTooltip>
        {after}
      </>
    );
  };

  // Item 2.4: human-readable character name / state label for the excluded-genera trace.
  const charName = (charId: string) => {
    const c = characters.find(ch => ch.id === charId);
    return (lang === 'it' ? c?.name_it : c?.name_en) ?? charId;
  };
  const stateLabel = (charId: string, value: string) => {
    const c = characters.find(ch => ch.id === charId);
    const st = c?.states.find(s => s.value === value);
    return (lang === 'it' ? st?.label_it : st?.label_en) ?? value;
  };

  const regions = [
    { value: 'nord-ovest', label: lang === 'it' ? 'Nord-Ovest' : 'North-West' },
    { value: 'nord-est', label: lang === 'it' ? 'Nord-Est' : 'North-East' },
    { value: 'centro', label: lang === 'it' ? 'Centro' : 'Central' },
    { value: 'sud', label: lang === 'it' ? 'Sud' : 'South' },
    { value: 'sicilia', label: lang === 'it' ? 'Sicilia' : 'Sicily' },
    { value: 'sardegna', label: lang === 'it' ? 'Sardegna' : 'Sardinia' },
  ];

  const regionFilteredGenera = useMemo(() => {
    if (!selectedRegion) return genera;
    return genera.filter(g =>
      !g.distribution_regions || g.distribution_regions.length === 0 ||
      g.distribution_regions.includes(selectedRegion)
    );
  }, [genera, selectedRegion]);

  const matrixLookup = useMemo(() => {
    const lookup: Record<string, Record<string, string[]>> = {};
    for (const entry of matrix) {
      if (!lookup[entry.genus_id]) lookup[entry.genus_id] = {};
      lookup[entry.genus_id][entry.character_id] = entry.state_values;
    }
    return lookup;
  }, [matrix]);

  // Level 2: Detect implied subfamily from selected characters
  const impliedSubfamily = useMemo(() => {
    // A user-selected '?' ("unknown") is score-neutral: it must not imply a subfamily.
    const effective = selectedStates.filter(sel => sel.value !== '?');
    if (effective.length === 0) return null;
    const scoped = effective.map(sel => {
      const char = characters.find(c => c.id === sel.characterId);
      return char?.subfamily_scope;
    }).filter(Boolean);
    const scopes = new Set(scoped);
    // Quorum (spec §4): imply a subfamily only when >=2 selected scoped characters
    // agree. One scoped answer never locks; mixed scopes never lock.
    return (scopes.size === 1 && scoped.length >= 2) ? [...scopes][0]! : null;
  }, [selectedStates, characters]);

  const scoredGenera = useMemo((): ScoredGenus[] => {
    // A user-selected '?' ("unknown") is score-neutral — drop it before scoring so it
    // neither penalizes real-data genera nor counts toward the "any selection" branch.
    const effectiveStates = selectedStates.filter(sel => sel.value !== '?');
    if (effectiveStates.length === 0) {
      return regionFilteredGenera.map(g => ({ genus: g, score: 1, mismatches: 0, matchedCount: 0 }));
    }

    return regionFilteredGenera.map((genus) => {
      let mismatches = 0;
      let matched = 0;
      let missingCount = 0;
      let totalWeight = 0;
      let weightedScore = 0;

      for (const sel of effectiveStates) {
        const values = matrixLookup[genus.id]?.[sel.characterId];
        if (!values) {
          missingCount++;
          continue;
        }
        if (values.includes('?') || values.includes('-')) {
          // Uninformative cell — '?' (unknown, guide Sec. 4) or '-' (structurally
          // inapplicable, item 3.1): the taxon survives without penalty either way.
          continue;
        }
        totalWeight += sel.weight;
        if (values.includes(sel.value)) {
          matched++;
          weightedScore += sel.weight;
        } else {
          mismatches++;
        }
      }

      // Level 2: If all selected characters point to one subfamily,
      // genera from OTHER subfamilies with no data get a heavy penalty
      const isOutOfScope = impliedSubfamily && genus.subfamily_id !== impliedSubfamily;

      let score: number;
      if (totalWeight > 0) {
        // Genus has some data for selected characters
        const avgWeight = totalWeight / (matched + mismatches);
        // Level 1: missing data penalty — heavier if out of scope
        const missingPenalty = isOutOfScope ? 0.8 : 0.3;
        const effectiveMismatches = mismatches + (missingCount * missingPenalty);
        const effectiveTotalWeight = totalWeight + (missingCount * avgWeight);
        score = Math.max(0, (effectiveTotalWeight - effectiveMismatches * avgWeight) / effectiveTotalWeight);
      } else {
        // Genus has NO data at all for any selected character
        if (isOutOfScope) {
          // Wrong subfamily + no data = very low score
          score = 0.2;
        } else {
          // Same subfamily but no data (shouldn't happen often)
          score = 0.5;
        }
      }

      return { genus, score, mismatches, matchedCount: matched };
    })
    .filter(sg => sg.mismatches <= maxMismatches)
    .sort((a, b) => b.score - a.score || a.genus.scientific_name.localeCompare(b.genus.scientific_name));
  }, [regionFilteredGenera, selectedStates, matrixLookup, maxMismatches, impliedSubfamily]);

  // Item 2.4: genera ruled out by the current answers, each with the reason(s) — which
  // selected characters the genus contradicts. Lets users click to see WHY a genus was
  // dropped (teaching; catching their own mis-scoring of a specimen).
  const excludedGenera = useMemo(() => {
    const effective = selectedStates.filter(sel => sel.value !== '?');
    if (effective.length === 0) return [] as { genus: Genus; reasons: { characterId: string; userValue: string; genusValues: string[] }[] }[];
    const keptIds = new Set(scoredGenera.map(sg => sg.genus.id));
    const out: { genus: Genus; reasons: { characterId: string; userValue: string; genusValues: string[] }[] }[] = [];
    for (const genus of regionFilteredGenera) {
      if (keptIds.has(genus.id)) continue;
      const reasons: { characterId: string; userValue: string; genusValues: string[] }[] = [];
      for (const sel of effective) {
        const values = matrixLookup[genus.id]?.[sel.characterId];
        // Only real contradictions count: missing / '?' / '-' cells never exclude a genus.
        if (!values || values.includes('?') || values.includes('-')) continue;
        if (!values.includes(sel.value)) {
          reasons.push({ characterId: sel.characterId, userValue: sel.value, genusValues: values });
        }
      }
      out.push({ genus, reasons });
    }
    return out.sort((a, b) => a.genus.scientific_name.localeCompare(b.genus.scientific_name));
  }, [regionFilteredGenera, selectedStates, scoredGenera, matrixLookup]);

  const bestCharacterId = useMemo(() => {
    const usedIds = new Set(selectedStates.map(s => s.characterId));
    const remaining = characters.filter(c => !usedIds.has(c.id) && !hiddenCharacterIds.has(c.id));

    // Best not-yet-used character by dynamic entropy over the current candidate set.
    const pickBest = (candidates: typeof characters) => {
      let bestId = '';
      let bestScore = -1;
      for (const char of candidates) {
        const stateCounts: Record<string, number> = {};
        let total = 0;
        for (const sg of scoredGenera) {
          const values = matrixLookup[sg.genus.id]?.[char.id];
          if (!values || values.includes('?') || values.includes('-')) continue;
          for (const v of values) {
            stateCounts[v] = (stateCounts[v] || 0) + 1;
          }
          total++;
        }
        if (total === 0) continue;

        let entropy = 0;
        for (const count of Object.values(stateCounts)) {
          const p = count / total;
          if (p > 0) entropy -= p * Math.log2(p);
        }
        if (entropy > bestScore) {
          bestScore = entropy;
          bestId = char.id;
        }
      }
      return { bestId, bestScore };
    };

    // Item 1.4: when "prefer easier" is on, suggest the best non-hard (easy/medium)
    // character; fall back to a hard one only if no easier character discriminates.
    if (preferEasy) {
      const easier = pickBest(remaining.filter(c => c.difficulty !== 'hard'));
      if (easier.bestId && easier.bestScore > 0) return easier.bestId;
    }
    return pickBest(remaining).bestId;
  }, [characters, selectedStates, scoredGenera, matrixLookup, hiddenCharacterIds, preferEasy]);

  // Issue 1: Scroll to and highlight the suggested character when it changes
  const prevBestCharRef = useRef<string>('');
  const suggestedBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bestCharacterId && bestCharacterId !== prevBestCharRef.current && selectedStates.length > 0) {
      const el = suggestedBoxRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('suggest-glow');
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('suggest-glow');
      }
    }
    prevBestCharRef.current = bestCharacterId;
  }, [bestCharacterId, selectedStates.length]);

  // Issue 3: Best "easy" character for beginner tip
  const bestEasyCharId = useMemo(() => {
    const usedIds = new Set(selectedStates.map(s => s.characterId));
    const easyChars = characters.filter(c => !usedIds.has(c.id) && !hiddenCharacterIds.has(c.id) && c.difficulty === 'easy');

    let bestId = '';
    let bestScore = -1;

    for (const char of easyChars) {
      const stateCounts: Record<string, number> = {};
      let total = 0;
      for (const sg of scoredGenera) {
        const values = matrixLookup[sg.genus.id]?.[char.id];
        if (!values || values.includes('?') || values.includes('-')) continue;
        for (const v of values) {
          stateCounts[v] = (stateCounts[v] || 0) + 1;
        }
        total++;
      }
      if (total === 0) continue;

      let entropy = 0;
      for (const count of Object.values(stateCounts)) {
        const p = count / total;
        if (p > 0) entropy -= p * Math.log2(p);
      }
      if (entropy > bestScore) {
        bestScore = entropy;
        bestId = char.id;
      }
    }
    // Only suggest if there's an easy character different from the main suggestion
    return bestId && bestId !== bestCharacterId ? bestId : '';
  }, [characters, selectedStates, scoredGenera, matrixLookup, bestCharacterId, hiddenCharacterIds]);

  // Best character suggestion detail (for diagnosis panel)
  const suggestedCharDetail = useMemo(() => {
    if (!bestCharacterId || scoredGenera.length < 2) return null;
    const char = characters.find(c => c.id === bestCharacterId);
    if (!char) return null;
    // Find two genera this character best distinguishes
    const top = scoredGenera[0];
    const second = scoredGenera[1];
    const topValues = matrixLookup[top.genus.id]?.[bestCharacterId];
    const secondValues = matrixLookup[second.genus.id]?.[bestCharacterId];
    const informative = (v?: string[]) => !!v && !v.includes('?') && !v.includes('-');
    if (informative(topValues) && informative(secondValues) && !topValues!.some(v => secondValues!.includes(v))) {
      return {
        charName: lang === 'it' ? char.name_it : char.name_en,
        genus1: top.genus.scientific_name,
        genus2: second.genus.scientific_name,
      };
    }
    return {
      charName: lang === 'it' ? char.name_it : char.name_en,
      genus1: null,
      genus2: null,
    };
  }, [bestCharacterId, scoredGenera, characters, matrixLookup, lang]);

  // Component B: Gap from second place
  const gapInfo = useMemo(() => {
    if (selectedStates.length === 0 || scoredGenera.length === 0) {
      return { gap: 0, confidenceLevel: 'low' as const, top: null as Genus | null, second: null as Genus | null };
    }
    const top = scoredGenera[0];
    const second = scoredGenera.length >= 2 ? scoredGenera[1] : null;
    const gap = second ? top.score - second.score : 1;
    const confidenceLevel = gap > 0.3 ? 'high' as const : gap > 0.1 ? 'medium' as const : 'low' as const;
    return { gap, confidenceLevel, top: top.genus, second: second?.genus ?? null };
  }, [selectedStates.length, scoredGenera]);

  // Component C: Progress bar — based on top score gap and score concentration
  const progressInfo = useMemo(() => {
    const totalGenera = regionFilteredGenera.length;
    if (selectedStates.length === 0 || scoredGenera.length === 0) {
      return { progress: 0, progressLabel: lang === 'it' ? 'Inizia selezionando i caratteri' : 'Start selecting characters', totalGenera, topCandidates: totalGenera };
    }

    // Item 1.2: progress is driven by the REAL remaining candidate set (the genera
    // that still pass the tolerance filter — i.e. the cards shown and the counter),
    // so the bar can never claim "almost identified" while many genera still remain.
    const remaining = scoredGenera.length;
    const topCandidates = remaining;

    // Progress based on: how few candidates remain + how many characters used
    const candidateProgress = totalGenera > 1 ? 1 - (remaining / totalGenera) : 0;
    const charProgress = Math.min(1, selectedStates.length / 8); // ~8 chars = fully explored

    // Weighted combination: candidates matter more
    const progress = Math.min(0.99, candidateProgress * 0.7 + charProgress * 0.3);

    const progressLabel =
      progress < 0.2 ? (lang === 'it' ? 'Inizia selezionando i caratteri' : 'Start selecting characters') :
      progress < 0.4 ? (lang === 'it' ? 'Buon inizio' : 'Good start') :
      progress < 0.6 ? (lang === 'it' ? 'Buon progresso' : 'Good progress') :
      progress < 0.8 ? (lang === 'it' ? 'Quasi identificato' : 'Almost identified') :
      (lang === 'it' ? 'Identificazione probabile' : 'Likely identification');

    return { progress, progressLabel, totalGenera, topCandidates };
  }, [regionFilteredGenera.length, scoredGenera, selectedStates.length, lang]);

  // Component D: Impact prediction per character state
  // Counts genera that would be excluded or significantly penalized
  const predictStateImpact = (charId: string, stateValue: string): number => {
    // Selecting '?' ("unknown") is score-neutral — it excludes nothing.
    if (stateValue === '?') return 0;
    const char = characters.find(c => c.id === charId);
    const charScope = char?.subfamily_scope;
    return scoredGenera.filter(sg => {
      const values = matrixLookup[sg.genus.id]?.[charId];
      if (values && !values.includes('?') && !values.includes('-')) {
        // Has informative data: count as excluded if doesn't match
        return !values.includes(stateValue);
      }
      // No data: would be penalized if out of scope
      if (charScope && sg.genus.subfamily_id !== charScope) {
        return true; // out-of-scope genera get heavy penalty
      }
      return false;
    }).length;
  };

  // Helper: calculate entropy of a character among given genera
  const calculateCharacterEntropy = (charId: string, generaList: ScoredGenus[]): number => {
    const stateCounts: Record<string, number> = {};
    let total = 0;
    for (const sg of generaList) {
      const values = matrixLookup[sg.genus.id]?.[charId];
      if (!values || values.includes('?')) continue;
      for (const v of values) {
        stateCounts[v] = (stateCounts[v] || 0) + 1;
      }
      total++;
    }
    if (total === 0) return 0;
    let entropy = 0;
    for (const count of Object.values(stateCounts)) {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy;
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const selectState = (characterId: string, value: string) => {
    // Component A: Calculate entropy weight at time of selection
    const entropy = calculateCharacterEntropy(characterId, scoredGenera);
    const maxEntropy = Math.log2(Math.max(2, scoredGenera.length));
    const weight = maxEntropy > 0 ? entropy / maxEntropy : 0.5;

    setSelectedStates(prev => {
      const filtered = prev.filter(s => s.characterId !== characterId);
      return [...filtered, { characterId, value, weight: Math.max(0.1, weight) }];
    });
  };

  const undo = () => {
    setSelectedStates(prev => prev.slice(0, -1));
  };

  const reset = () => {
    setSelectedStates([]);
    setSelectedRegion('');
    setHiddenCharacterIds(new Set());
  };

  const hideCharacter = (characterId: string) => {
    setHiddenCharacterIds(prev => {
      const next = new Set(prev);
      next.add(characterId);
      return next;
    });
  };

  const restoreHiddenCharacters = () => {
    setHiddenCharacterIds(new Set());
  };

  const usedIds = new Set(selectedStates.map(s => s.characterId));
  const bodyRegions = ['head', 'thorax', 'petiole', 'gaster', 'legs', 'antennae'] as const;
  const charsByRegion = bodyRegions.map(region => ({
    region,
    chars: characters
      .filter(c => c.body_region === region && !usedIds.has(c.id) && !hiddenCharacterIds.has(c.id))
      .sort((a, b) => {
        const order: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
        return (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1);
      }),
  })).filter(g => g.chars.length > 0);

  const regionLabels: Record<string, string> = {
    head: lang === 'it' ? 'Testa' : 'Head',
    thorax: lang === 'it' ? 'Torace' : 'Thorax',
    petiole: lang === 'it' ? 'Peziolo' : 'Petiole',
    gaster: lang === 'it' ? 'Gastro' : 'Gaster',
    legs: lang === 'it' ? 'Zampe' : 'Legs',
    antennae: lang === 'it' ? 'Antenne' : 'Antennae',
  };

  // Renders the progress + diagnosis panels (shared between mobile top and desktop sidebar)
  const renderStatusPanels = () => (
    <>
      {/* Component C: Progress bar */}
      <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {lang === 'it' ? 'Progresso' : 'Progress'}
            <InfoTip text={lang === 'it' ? 'Indica quanto l\'identificazione è avanzata in base ai caratteri selezionati e ai generi rimasti.' : 'Shows how far the identification has progressed based on selected characters and remaining genera.'} />
          </span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progressInfo.progress * 100)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-forest-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progressInfo.progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{progressInfo.progressLabel}</span>
          <span className="text-xs text-gray-500">
            {/* Item 1.2: show the real remaining candidate set — identical to the
                number of genus cards rendered below (both are scoredGenera). */}
            {scoredGenera.length} {lang === 'it' ? 'generi rimasti su' : 'genera remaining out of'} {progressInfo.totalGenera}
          </span>
        </div>
      </div>

      {/* Component B: Diagnosis panel */}
      {selectedStates.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
            {lang === 'it' ? 'Diagnosi' : 'Diagnosis'}
            <InfoTip text={lang === 'it' ? 'Mostra quanto è sicura l\'identificazione e suggerisce il prossimo carattere da osservare.' : 'Shows how confident the identification is and suggests the next character to observe.'} />
          </span>
          <div className="flex items-start gap-2 mb-2">
            <span className={`inline-block w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
              gapInfo.confidenceLevel === 'high' ? 'bg-green-500' :
              gapInfo.confidenceLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <p className="text-sm text-gray-700">
              {scoredGenera.length < 2 ? (
                lang === 'it'
                  ? 'Un solo genere rimasto — identificazione completa!'
                  : 'Only one genus remaining — identification complete!'
              ) : gapInfo.confidenceLevel === 'high' ? (
                lang === 'it'
                  ? <><button type="button" className="font-semibold italic text-forest-600 hover:underline cursor-pointer" onClick={() => scrollToId(`genus-card-${gapInfo.top?.id}`)}>{gapInfo.top?.scientific_name}</button> è il candidato più probabile (distacco: {Math.round(gapInfo.gap * 100)}%)</>
                  : <><button type="button" className="font-semibold italic text-forest-600 hover:underline cursor-pointer" onClick={() => scrollToId(`genus-card-${gapInfo.top?.id}`)}>{gapInfo.top?.scientific_name}</button> is the most likely candidate (gap: {Math.round(gapInfo.gap * 100)}%)</>
              ) : gapInfo.confidenceLevel === 'medium' ? (
                lang === 'it'
                  ? <>Alcuni generi ancora in competizione — seleziona altri caratteri</>
                  : <>Several genera still competing — select more characters</>
              ) : (
                lang === 'it'
                  ? <>Molti generi ancora compatibili — continua a selezionare caratteri</>
                  : <>Many genera still compatible — keep selecting characters</>
              )}
            </p>
          </div>
          {suggestedCharDetail && scoredGenera.length >= 2 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => scrollToId(`char-${bestCharacterId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToId(`char-${bestCharacterId}`);
                }
              }}
              className="block text-sm text-forest-600 hover:text-forest-800 hover:underline text-left mt-1 cursor-pointer"
            >
              {lang === 'it' ? '→ Prossimo passo:' : '→ Next step:'}{' '}
              <span className="font-medium">{suggestedCharDetail.charName}</span>
              {suggestedCharDetail.genus1 && suggestedCharDetail.genus2 && (
                <>
                  {' '}{lang === 'it' ? '(distingue' : '(distinguishes'}{' '}
                  <button type="button" className="italic text-forest-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); scrollToId(`genus-card-${scoredGenera[0]?.genus.id}`); }}>{suggestedCharDetail.genus1}</button>
                  {' '}{lang === 'it' ? 'da' : 'from'}{' '}
                  <button type="button" className="italic text-forest-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); scrollToId(`genus-card-${scoredGenera[1]?.genus.id}`); }}>{suggestedCharDetail.genus2}</button>)
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile: show status panels at top, before characters */}
      <div className="lg:hidden">
        {renderStatusPanels()}
      </div>

      {/* Character selector panel */}
      <div className="lg:w-1/2">
        {/* Geographic region dropdown — hidden until distribution_regions data is available.
            Re-enable when genera have populated distribution_regions arrays. */}
        <p className="mb-6 text-xs text-gray-400 italic">
          {lang === 'it' ? 'Prossimamente: filtro per regione geografica' : 'Coming soon: geographic region filter'}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={undo}
            disabled={selectedStates.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:border-forest-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'it' ? 'Annulla' : 'Undo'}
          </button>
          <button
            onClick={reset}
            disabled={selectedStates.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'it' ? 'Ricomincia' : 'Reset'}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={preferEasy}
              onChange={e => setPreferEasy(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-forest-600 focus:ring-forest-400 cursor-pointer"
            />
            {lang === 'it' ? 'Preferisci caratteri facili' : 'Prefer easier characters'}
            <InfoTip text={lang === 'it' ? 'Il carattere consigliato eviterà i tratti microscopici "difficili" (utile per principianti). Un carattere difficile viene proposto solo se indispensabile per distinguere i generi rimasti.' : 'The suggested character will avoid "hard" microscopic traits (useful for beginners). A hard character is only suggested when it is indispensable to separate the remaining genera.'} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            {lang === 'it' ? 'Tolleranza' : 'Tolerance'}
            <InfoTip text={lang === 'it' ? 'Quanti errori sono ammessi. Con tolleranza 1, un genere che non matcha un carattere resta visibile. Aumenta se non sei sicuro delle osservazioni.' : 'How many mismatches are allowed. With tolerance 1, a genus that doesn\'t match one character stays visible. Increase if you\'re unsure of your observations.'} />:
            <select
              value={maxMismatches}
              onChange={e => setMaxMismatches(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </div>

        {selectedStates.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedStates.map((sel, i) => {
              const char = characters.find(c => c.id === sel.characterId);
              const state = char?.states.find(s => s.value === sel.value);
              return (
                <span key={i} className="text-xs bg-forest-100 text-forest-700 px-2 py-1 rounded-full" title={`${lang === 'it' ? 'Peso' : 'Weight'}: ${sel.weight.toFixed(2)}`}>
                  {lang === 'it' ? char?.name_it : char?.name_en}: {lang === 'it' ? state?.label_it : state?.label_en}
                </span>
              );
            })}
          </div>
        )}

        {/* Suggested character — prominent box at top */}
        {bestCharacterId && (() => {
          const bestChar = characters.find(c => c.id === bestCharacterId);
          if (!bestChar) return null;
          return (
            <div ref={suggestedBoxRef} className="bg-forest-50 border-2 border-forest-300 rounded-xl p-5 mb-6" id={`char-${bestChar.id}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-forest-600 text-lg">&#9733;</span>
                <h3 className="font-semibold text-forest-800">
                  {lang === 'it' ? 'Carattere consigliato' : 'Suggested character'}
                  <InfoTip text={lang === 'it' ? 'Questo carattere è il più utile per distinguere i generi rimasti.' : 'This character is the most useful to distinguish the remaining genera.'} />
                </h3>
                <button
                  onClick={() => hideCharacter(bestChar.id)}
                  className="ml-auto text-xs text-gray-500 hover:text-forest-700 underline cursor-pointer"
                  title={lang === 'it' ? 'Nascondi questo carattere e suggerisci il successivo' : 'Hide this character and suggest the next one'}
                >
                  {lang === 'it' ? 'Non riesco a vederlo →' : "Can't see it →"}
                </button>
              </div>
              {/* div, not p: annotateWithGlossary renders GlossaryTooltip (a block
                  <div role="tooltip">), which is invalid inside <p> and breaks hydration. */}
              <div className="text-sm font-medium text-gray-800 mb-3">
                {annotateWithGlossary(lang === 'it' ? bestChar.name_it : bestChar.name_en)}
              </div>
              <div className="flex flex-wrap gap-2">
                {bestChar.states.map(state => {
                  const impact = selectedStates.length > 0 ? predictStateImpact(bestChar.id, state.value) : 0;
                  return (
                    <button
                      key={state.value}
                      onClick={() => selectState(bestChar.id, state.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-forest-300 hover:border-forest-500 hover:bg-forest-100 transition-colors min-h-[44px] flex items-center gap-1.5 bg-white"
                    >
                      {lang === 'it' ? state.label_it : state.label_en}
                      {impact > 0 && (
                        <span className="text-[10px] font-medium text-red-500">-{impact}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Hidden characters banner */}
        {hiddenCharacterIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-800">
              {hiddenCharacterIds.size} {lang === 'it'
                ? (hiddenCharacterIds.size === 1 ? 'carattere nascosto' : 'caratteri nascosti')
                : (hiddenCharacterIds.size === 1 ? 'character hidden' : 'characters hidden')}
            </span>
            <button
              onClick={restoreHiddenCharacters}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              {lang === 'it' ? 'Ripristina' : 'Restore'}
            </button>
          </div>
        )}

        {/* Issue 3: Beginner tip — suggest easiest informative character */}
        {bestEasyCharId && (() => {
          const easyChar = characters.find(c => c.id === bestEasyCharId);
          if (!easyChar) return null;
          return (
            <button
              onClick={() => {
                const el = document.getElementById(`char-${bestEasyCharId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="mb-4 w-full text-left text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5" />
              {lang === 'it'
                ? <>Consiglio per principianti: inizia da <span className="font-medium text-gray-700">{easyChar.name_it}</span></>
                : <>Beginner tip: start with <span className="font-medium text-gray-700">{easyChar.name_en}</span></>
              }
            </button>
          );
        })()}

        {/* Impact badge legend */}
        {selectedStates.length > 0 && (
          <p className="text-[11px] text-gray-400 mb-4">
            <InfoTip text={lang === 'it' ? 'I numeri in rosso indicano quanti generi verrebbero esclusi scegliendo quel valore.' : 'Red numbers show how many genera would be excluded by choosing that value.'} />
            {lang === 'it' ? 'I numeri in rosso (-N) indicano quanti generi verrebbero esclusi' : 'Red numbers (-N) show how many genera would be excluded'}
          </p>
        )}

        {/* All other characters in flat grid grouped by body region */}
        <div className="space-y-6">
          {charsByRegion.map(({ region, chars }) => {
            const filteredChars = chars.filter(c => c.id !== bestCharacterId);
            if (filteredChars.length === 0) return null;
            return (
              <div key={region}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  {regionLabels[region] || region}
                </h3>
                <div className="space-y-2">
                  {filteredChars.map(char => (
                    <div
                      key={char.id}
                      id={`char-${char.id}`}
                      className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="text-sm font-medium text-gray-700 flex-1">
                          {annotateWithGlossary(lang === 'it' ? char.name_it : char.name_en)}
                        </div>
                        <button
                          onClick={() => hideCharacter(char.id)}
                          className="flex-shrink-0 text-gray-300 hover:text-gray-600 text-xs transition-colors cursor-pointer"
                          aria-label={lang === 'it' ? 'Nascondi carattere' : 'Hide character'}
                          title={lang === 'it' ? 'Nascondi questo carattere (non riesco a osservarlo)' : 'Hide this character (cannot observe it)'}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {char.states.map(state => {
                          const impact = selectedStates.length > 0 ? predictStateImpact(char.id, state.value) : 0;
                          return (
                            <button
                              key={state.value}
                              onClick={() => selectState(char.id, state.value)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:bg-forest-50 transition-colors min-h-[44px] flex items-center gap-1.5"
                            >
                              {lang === 'it' ? state.label_it : state.label_en}
                              {impact > 0 && (
                                <span className="text-[10px] font-medium text-red-500">-{impact}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:w-1/2">
        {/* Desktop: show status panels here */}
        <div className="hidden lg:block">
          {renderStatusPanels()}
        </div>

        {scoredGenera.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{lang === 'it'
              ? "Nessun genere corrisponde ai caratteri selezionati. Prova a rimuovere l'ultima selezione o ad aumentare la tolleranza."
              : 'No genera match the selected characters. Try removing the last selection or increasing the tolerance.'
            }</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={undo} className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors">
                {lang === 'it' ? 'Annulla' : 'Undo'}
              </button>
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                {lang === 'it' ? 'Ricomincia' : 'Reset'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoredGenera.map(({ genus, score, mismatches }) => (
              <a
                key={genus.id}
                id={`genus-card-${genus.id}`}
                href={`/generi/${genus.id}`}
                className="group block p-4 rounded-xl border border-gray-200 hover:border-forest-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold italic text-gray-900 group-hover:text-forest-600 transition-colors">
                      {genus.scientific_name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{genus.subfamily_id}</p>
                  </div>
                  {selectedStates.length > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      score >= 0.8 ? 'bg-green-100 text-green-700' :
                      score >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(score * 100)}%
                    </span>
                  )}
                </div>
                {selectedStates.length > 0 && (
                  <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        score >= 0.8 ? 'bg-green-500' :
                        score >= 0.5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(score * 100)}%` }}
                    />
                  </div>
                )}
                {genus.photo_urls[0] && (
                  <img
                    src={genus.photo_urls[0]}
                    alt={genus.scientific_name}
                    className="mt-3 w-full h-24 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-ant.svg'; }}
                  />
                )}
              </a>
            ))}
          </div>
        )}

        {/* Item 2.4: excluded-genera trace — why each ruled-out genus was dropped. */}
        {excludedGenera.length > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowExcluded(v => !v)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 cursor-pointer"
              aria-expanded={showExcluded}
            >
              <span className="text-xs">{showExcluded ? '▾' : '▸'}</span>
              {lang === 'it' ? `Generi esclusi (${excludedGenera.length})` : `Excluded genera (${excludedGenera.length})`}
              <InfoTip text={lang === 'it' ? 'Generi scartati dalle tue risposte. Espandi per vedere quale risposta ha escluso ciascuno — utile se sospetti un errore di osservazione.' : 'Genera ruled out by your answers. Expand to see which answer excluded each — useful if you suspect a mis-observation.'} />
            </button>
            {showExcluded && (
              <ul className="mt-3 space-y-2.5">
                {excludedGenera.map(({ genus, reasons }) => (
                  <li key={genus.id} className="text-sm border-l-2 border-red-200 pl-3">
                    <a href={`/generi/${genus.id}`} className="font-medium italic text-gray-700 hover:text-forest-600 transition-colors">
                      {genus.scientific_name}
                    </a>
                    <span className="text-xs text-gray-400 ml-1.5 capitalize">{genus.subfamily_id}</span>
                    {reasons.length > 0 ? (
                      <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
                        {reasons.map((r, i) => (
                          <li key={i}>
                            {lang === 'it' ? 'escluso da ' : 'excluded by '}
                            <span className="font-medium text-gray-600">{charName(r.characterId)}</span>
                            {lang === 'it' ? ': hai risposto ' : ': you answered '}
                            <span className="text-forest-600">&laquo;{stateLabel(r.characterId, r.userValue)}&raquo;</span>
                            {lang === 'it' ? ', ma questo genere è ' : ', but this genus is '}
                            <span className="text-red-600">&laquo;{r.genusValues.map(v => stateLabel(r.characterId, v)).join(lang === 'it' ? ' o ' : ' or ')}&raquo;</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400 ml-1">{lang === 'it' ? '(fuori tolleranza)' : '(out of tolerance)'}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
