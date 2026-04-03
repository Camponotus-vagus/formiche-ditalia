import { useState, useMemo, useEffect, type ReactNode } from 'react';
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

export default function IdentificationKey({ characters, matrix, genera, glossary = [], lang: initialLang }: Props) {
  const [selectedStates, setSelectedStates] = useState<WeightedSelection[]>([]);
  const [maxMismatches, setMaxMismatches] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [lang, setCurrentLang] = useState<Lang>(initialLang);

  useEffect(() => {
    setCurrentLang(getLang());
    const handler = (e: Event) => setCurrentLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

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

  const scoredGenera = useMemo((): ScoredGenus[] => {
    if (selectedStates.length === 0) {
      return regionFilteredGenera.map(g => ({ genus: g, score: 1, mismatches: 0, matchedCount: 0 }));
    }

    return regionFilteredGenera.map((genus) => {
      let mismatches = 0;
      let matched = 0;
      let weightedScore = 0;
      let totalWeight = 0;
      for (const sel of selectedStates) {
        const values = matrixLookup[genus.id]?.[sel.characterId];
        if (!values || values.includes('?')) {
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
      const score = totalWeight > 0 ? weightedScore / totalWeight : 1;
      return { genus, score, mismatches, matchedCount: matched };
    })
    .filter(sg => sg.mismatches <= maxMismatches)
    .sort((a, b) => b.score - a.score || a.genus.scientific_name.localeCompare(b.genus.scientific_name));
  }, [regionFilteredGenera, selectedStates, matrixLookup, maxMismatches]);

  const bestCharacterId = useMemo(() => {
    const usedIds = new Set(selectedStates.map(s => s.characterId));
    const remaining = characters.filter(c => !usedIds.has(c.id));

    let bestId = '';
    let bestScore = -1;

    for (const char of remaining) {
      const stateCounts: Record<string, number> = {};
      let total = 0;
      for (const sg of scoredGenera) {
        const values = matrixLookup[sg.genus.id]?.[char.id];
        if (!values || values.includes('?')) continue;
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
    return bestId;
  }, [characters, selectedStates, scoredGenera, matrixLookup]);

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
    if (topValues && secondValues && !topValues.some(v => secondValues.includes(v))) {
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

  // Component C: Progress bar
  const progressInfo = useMemo(() => {
    const totalGenera = regionFilteredGenera.length;
    const remainingGenera = scoredGenera.length;
    const progress = totalGenera > 0 ? 1 - (remainingGenera / totalGenera) : 0;

    const progressLabel =
      progress < 0.25 ? (lang === 'it' ? 'Inizia selezionando i caratteri' : 'Start selecting characters') :
      progress < 0.50 ? (lang === 'it' ? 'Buon inizio' : 'Good start') :
      progress < 0.75 ? (lang === 'it' ? 'Buon progresso' : 'Good progress') :
      progress < 0.90 ? (lang === 'it' ? 'Quasi identificato' : 'Almost identified') :
      (lang === 'it' ? 'Identificazione probabile' : 'Likely identification');

    return { progress, progressLabel, totalGenera, remainingGenera };
  }, [regionFilteredGenera.length, scoredGenera.length, lang]);

  // Component D: Impact prediction per character state
  const predictStateImpact = (charId: string, stateValue: string): number => {
    return scoredGenera.filter(sg => {
      const values = matrixLookup[sg.genus.id]?.[charId];
      if (!values || values.includes('?')) return false;
      return !values.includes(stateValue);
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
  };

  const usedIds = new Set(selectedStates.map(s => s.characterId));
  const bodyRegions = ['head', 'thorax', 'petiole', 'gaster', 'legs', 'antennae'] as const;
  const charsByRegion = bodyRegions.map(region => ({
    region,
    chars: characters
      .filter(c => c.body_region === region && !usedIds.has(c.id))
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Character selector panel */}
      <div className="lg:w-1/2">
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {lang === 'it' ? 'Regione geografica' : 'Geographic region'}
          </label>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none text-sm bg-white"
          >
            <option value="">{lang === 'it' ? 'Tutta Italia' : 'All Italy'}</option>
            {regions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

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
          <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            {lang === 'it' ? 'Tolleranza' : 'Tolerance'}:
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

        {charsByRegion.map(({ region, chars }) => (
          <details key={region} className="mb-4" open={chars.some(c => c.id === bestCharacterId)}>
            <summary className="cursor-pointer font-semibold text-gray-700 py-2">
              {regionLabels[region] || region}
            </summary>
            <div className="space-y-3 pl-4 mt-2">
              {chars.map(char => (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg border transition-all ${
                    char.id === bestCharacterId
                      ? 'border-forest-400 bg-forest-50 ring-1 ring-forest-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    {annotateWithGlossary(lang === 'it' ? char.name_it : char.name_en)}
                    {char.id === bestCharacterId && (
                      <span className="ml-2 text-xs text-forest-600 font-normal">
                        &#9733; {lang === 'it' ? 'consigliato' : 'suggested'}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {char.states.map(state => {
                      const showImpact = selectedStates.length > 0 && char.id === bestCharacterId;
                      const impact = showImpact ? predictStateImpact(char.id, state.value) : 0;
                      return (
                        <button
                          key={state.value}
                          onClick={() => selectState(char.id, state.value)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:bg-forest-50 transition-colors min-h-[44px] flex items-center gap-1.5"
                        >
                          {lang === 'it' ? state.label_it : state.label_en}
                          {showImpact && impact > 0 && (
                            <span className="text-[10px] font-medium text-red-500">-{impact}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Results panel */}
      <div className="lg:w-1/2">
        {/* Component C: Progress bar */}
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {lang === 'it' ? 'Progresso' : 'Progress'}
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
              {scoredGenera.length} {lang === 'it' ? 'generi compatibili su' : 'compatible genera out of'} {progressInfo.totalGenera}
            </span>
          </div>
        </div>

        {/* Component B: Diagnosis panel */}
        {selectedStates.length > 0 && (
          <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
              {lang === 'it' ? 'Diagnosi' : 'Diagnosis'}
            </span>
            <div className="flex items-start gap-2 mb-2">
              <span className={`inline-block w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
                gapInfo.confidenceLevel === 'high' ? 'bg-green-500' :
                gapInfo.confidenceLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <p className="text-sm text-gray-700">
                {scoredGenera.length >= 2 ? (
                  lang === 'it'
                    ? `Il primo risultato è ${Math.round(gapInfo.gap * 100)}% più probabile del secondo`
                    : `The top result is ${Math.round(gapInfo.gap * 100)}% more likely than the second`
                ) : (
                  lang === 'it'
                    ? 'Un solo genere rimasto — identificazione completa'
                    : 'Only one genus remaining — identification complete'
                )}
              </p>
            </div>
            {suggestedCharDetail && scoredGenera.length >= 2 && (
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'it' ? 'Prossimo passo: seleziona' : 'Next step: select'}{' '}
                <span className="font-medium text-gray-700">&quot;{suggestedCharDetail.charName}&quot;</span>
                {suggestedCharDetail.genus1 && suggestedCharDetail.genus2 && (
                  <>
                    {' '}{lang === 'it' ? 'per distinguere' : 'to distinguish'}{' '}
                    <span className="italic">{suggestedCharDetail.genus1}</span>
                    {' '}{lang === 'it' ? 'da' : 'from'}{' '}
                    <span className="italic">{suggestedCharDetail.genus2}</span>
                  </>
                )}
              </p>
            )}
          </div>
        )}

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
                      mismatches === 0 ? 'bg-forest-100 text-forest-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {Math.round(score * 100)}%
                    </span>
                  )}
                </div>
                {selectedStates.length > 0 && (
                  <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        mismatches === 0 ? 'bg-forest-500' : 'bg-brand-400'
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
      </div>
    </div>
  );
}
