import { useState, useMemo, type ReactNode } from 'react';
import type { Character, MatrixEntry, Genus } from '../types';
import GlossaryTooltip from './GlossaryTooltip';

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

interface SelectedState {
  characterId: string;
  value: string;
}

interface ScoredGenus {
  genus: Genus;
  score: number;
  mismatches: number;
  matchedCount: number;
}

export default function IdentificationKey({ characters, matrix, genera, glossary = [], lang }: Props) {
  const [selectedStates, setSelectedStates] = useState<SelectedState[]>([]);
  const [maxMismatches, setMaxMismatches] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

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
      for (const sel of selectedStates) {
        const values = matrixLookup[genus.id]?.[sel.characterId];
        if (!values || values.includes('?')) {
          continue;
        }
        if (values.includes(sel.value)) {
          matched++;
        } else {
          mismatches++;
        }
      }
      const score = selectedStates.length > 0
        ? (selectedStates.length - mismatches) / selectedStates.length
        : 1;
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

  const selectState = (characterId: string, value: string) => {
    setSelectedStates(prev => {
      const filtered = prev.filter(s => s.characterId !== characterId);
      return [...filtered, { characterId, value }];
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
                <span key={i} className="text-xs bg-forest-100 text-forest-700 px-2 py-1 rounded-full">
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
                    {char.states.map(state => (
                      <button
                        key={state.value}
                        onClick={() => selectState(char.id, state.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:bg-forest-50 transition-colors min-h-[44px]"
                      >
                        {lang === 'it' ? state.label_it : state.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Results panel */}
      <div className="lg:w-1/2">
        <p className="text-sm text-gray-500 mb-4" aria-live="polite">
          <span className="font-semibold text-forest-700 text-lg">{scoredGenera.length}</span>{' '}
          {lang === 'it' ? 'generi corrispondenti' : 'matching genera'}
        </p>

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
