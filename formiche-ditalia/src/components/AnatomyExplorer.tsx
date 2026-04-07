import { useState, useEffect } from 'react';
import { getLang, type Lang } from '../i18n';

interface AnatomyTerm {
  id: string;
  label_it: string;
  label_en: string;
  image: string;
}

interface KeyCharacter {
  name_it: string;
  name_en: string;
  difficulty: 'easy' | 'medium' | 'hard';
  states_it: string[];
}

interface BodyRegion {
  id: string;
  label_it: string;
  label_en: string;
  terms: AnatomyTerm[];
  characters: KeyCharacter[];
}

const REGIONS: BodyRegion[] = [
  {
    id: 'head',
    label_it: 'Capo',
    label_en: 'Head',
    terms: [
      { id: 'antenna', label_it: 'Antenna', label_en: 'Antenna', image: 'antenna.png' },
      { id: 'antennal-club', label_it: 'Clava antennale', label_en: 'Antennal club', image: 'antennal-club.png' },
      { id: 'antennal-socket', label_it: 'Torulo antennale', label_en: 'Antennal socket', image: 'antennal-socket.png' },
      { id: 'clypeus', label_it: 'Clipeo', label_en: 'Clypeus', image: 'clypeus.png' },
      { id: 'clypeal-socket', label_it: 'Fossetta clipeale', label_en: 'Clypeal socket', image: 'clypeal-socket.png' },
      { id: 'compound-eye', label_it: 'Occhio composto', label_en: 'Compound eye', image: 'compound-eye.png' },
      { id: 'frontal-carina', label_it: 'Carena frontale', label_en: 'Frontal carina', image: 'frontal-carina.png' },
      { id: 'frontal-lobe', label_it: 'Lobo frontale', label_en: 'Frontal lobe', image: 'frontal-lobe.png' },
      { id: 'frontal-triangle', label_it: 'Triangolo frontale', label_en: 'Frontal triangle', image: 'frontal-triangle.png' },
      { id: 'funiculus', label_it: 'Funicolo', label_en: 'Funiculus', image: 'funiculus.png' },
      { id: 'mandible', label_it: 'Mandibola', label_en: 'Mandible', image: 'mandible.png' },
      { id: 'labial-palp', label_it: 'Palpo labiale', label_en: 'Labial palp', image: 'labial-palp.png' },
      { id: 'maxillary-palp', label_it: 'Palpo mascellare', label_en: 'Maxillary palp', image: 'maxillary-palp.png' },
      { id: 'ocelli', label_it: 'Ocelli', label_en: 'Ocelli', image: 'ocelli.png' },
      { id: 'scape', label_it: 'Scapo', label_en: 'Scape', image: 'scape.png' },
      { id: 'scrobe', label_it: 'Scrobo antennale', label_en: 'Scrobe', image: 'scrobe.png' },
    ],
    characters: [],
  },
  {
    id: 'mesosoma',
    label_it: 'Mesosoma (torace)',
    label_en: 'Mesosoma (thorax)',
    terms: [
      { id: 'mesosoma', label_it: 'Mesosoma', label_en: 'Mesosoma', image: 'mesosoma.png' },
      { id: 'pronotum', label_it: 'Pronoto', label_en: 'Pronotum', image: 'pronotum.png' },
      { id: 'mesonotum', label_it: 'Mesonoto', label_en: 'Mesonotum', image: 'mesonotum.png' },
      { id: 'metanotum', label_it: 'Metanoto', label_en: 'Metanotum', image: 'metanotum.png' },
      { id: 'metanotal-impression', label_it: 'Impressione metanotale', label_en: 'Metanotal impression', image: 'metanotal-impression.png' },
      { id: 'propodeum', label_it: 'Propodeo', label_en: 'Propodeum', image: 'propodeum.png' },
      { id: 'propodeal-spine', label_it: 'Spina propodeale', label_en: 'Propodeal spine', image: 'propodeal-spine.png' },
      { id: 'propodeal-lobe', label_it: 'Lobo propodeale', label_en: 'Propodeal lobe', image: 'propodeal-lobe.png' },
      { id: 'metapleural-gland', label_it: 'Orifizio ghiandola metapleurale', label_en: 'Orifice of metapleural gland', image: 'orifice-of-metapleural-gland.png' },
      { id: 'apical-spur', label_it: 'Sperone apicale della tibia', label_en: 'Apical spur of tibia', image: 'apical-spur-of-tibia.png' },
    ],
    characters: [],
  },
  {
    id: 'waist',
    label_it: 'Vita (peziolo)',
    label_en: 'Waist (petiole)',
    terms: [
      { id: 'petiole', label_it: 'Peziolo', label_en: 'Petiole', image: 'petiole.png' },
      { id: 'postpetiole', label_it: 'Postpeziolo', label_en: 'Postpetiole', image: 'postpetiole.png' },
    ],
    characters: [],
  },
  {
    id: 'gaster',
    label_it: 'Gastro',
    label_en: 'Gaster',
    terms: [
      { id: 'gaster', label_it: 'Gastro', label_en: 'Gaster', image: 'gaster.png' },
      { id: 'cloacal-orifice', label_it: 'Orifizio cloacale', label_en: 'Cloacal orifice', image: 'cloacal-orifice.png' },
      { id: 'sting', label_it: 'Pungiglione', label_en: 'Sting', image: 'sting.png' },
    ],
    characters: [],
  },
];

// Colors for each region
const REGION_COLORS: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  head: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', activeBg: 'bg-emerald-100' },
  mesosoma: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', activeBg: 'bg-sky-100' },
  waist: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', activeBg: 'bg-amber-100' },
  gaster: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', activeBg: 'bg-rose-100' },
};

interface Props {
  characters?: { name_it: string; name_en: string; body_region: string; difficulty: string; states: { label_it: string }[] }[];
}

export default function AnatomyExplorer({ characters = [] }: Props) {
  const [lang, setLang] = useState<Lang>('it');
  const [activeTerm, setActiveTerm] = useState<AnatomyTerm | null>(null);
  const [openRegion, setOpenRegion] = useState<string | null>('head');

  useEffect(() => {
    setLang(getLang());
    const handler = (e: Event) => setLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  // Map body_region from characters data to our region ids
  const regionMap: Record<string, string> = {
    head: 'head', thorax: 'mesosoma', petiole: 'waist', gaster: 'gaster',
    legs: 'mesosoma', antennae: 'head',
  };

  // Enrich regions with characters from the key
  const enrichedRegions = REGIONS.map(region => ({
    ...region,
    characters: characters
      .filter(c => regionMap[c.body_region] === region.id)
      .map(c => ({
        name_it: c.name_it,
        name_en: c.name_en,
        difficulty: c.difficulty as 'easy' | 'medium' | 'hard',
        states_it: c.states.map(s => s.label_it),
      })),
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Region cards with terms */}
      <div className="lg:w-1/2 space-y-3">
        <p className="text-sm text-gray-500 mb-2">
          {lang === 'it'
            ? 'Clicca su un termine morfologico per vedere la parte evidenziata nell\'illustrazione.'
            : 'Click a morphological term to see the highlighted part in the illustration.'}
        </p>

        {enrichedRegions.map(region => {
          const colors = REGION_COLORS[region.id];
          const isOpen = openRegion === region.id;
          return (
            <div key={region.id} className={`rounded-xl border overflow-hidden transition-all ${colors.border}`}>
              {/* Region header */}
              <button
                onClick={() => setOpenRegion(isOpen ? null : region.id)}
                className={`w-full px-5 py-4 flex items-center justify-between ${colors.bg} hover:brightness-95 transition-all`}
              >
                <h3 className={`font-semibold text-lg ${colors.text}`}>
                  {lang === 'it' ? region.label_it : region.label_en}
                  <span className="text-sm font-normal opacity-60 ml-2">
                    ({region.terms.length} {lang === 'it' ? 'strutture' : 'structures'}
                    {region.characters.length > 0 && ` + ${region.characters.length} ${lang === 'it' ? 'caratteri chiave' : 'key characters'}`})
                  </span>
                </h3>
                <svg className={`w-5 h-5 ${colors.text} transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Region content */}
              {isOpen && (
                <div className="bg-white">
                  {/* Anatomical terms - clickable to show image */}
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      {lang === 'it' ? 'Strutture anatomiche' : 'Anatomical structures'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {region.terms.map(term => (
                        <button
                          key={term.id}
                          onMouseEnter={() => setActiveTerm(term)}
                          onMouseLeave={() => { if (activeTerm?.id === term.id) setActiveTerm(null); }}
                          onClick={() => setActiveTerm(prev => prev?.id === term.id ? null : term)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            activeTerm?.id === term.id
                              ? `${colors.activeBg} ${colors.border} ${colors.text} font-semibold shadow-sm`
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {lang === 'it' ? term.label_it : term.label_en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Key characters for this region */}
                  {region.characters.length > 0 && (
                    <div className="px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        {lang === 'it' ? 'Caratteri usati nella chiave' : 'Characters used in the key'}
                      </p>
                      <div className="space-y-2">
                        {region.characters.map((ch, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`inline-block mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              ch.difficulty === 'easy' ? 'bg-green-400' : ch.difficulty === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <div>
                              <p className="text-sm text-gray-700">{lang === 'it' ? ch.name_it : ch.name_en}</p>
                              <p className="text-xs text-gray-400">{ch.states_it.join(' · ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Difficulty legend */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> {lang === 'it' ? 'Facile' : 'Easy'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> {lang === 'it' ? 'Medio' : 'Medium'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> {lang === 'it' ? 'Difficile' : 'Hard'}</span>
        </div>
      </div>

      {/* Right: Sticky image panel */}
      <div className="lg:w-1/2 lg:sticky lg:top-20 lg:self-start">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6">
          {activeTerm ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-bold text-forest-700">
                  {lang === 'it' ? activeTerm.label_it : activeTerm.label_en}
                </span>
                <span className="text-xs text-gray-400">
                  ({lang === 'it' ? activeTerm.label_en : activeTerm.label_it})
                </span>
              </div>
              <img
                src={`/images/anatomy/${activeTerm.image}`}
                alt={`${lang === 'it' ? activeTerm.label_it : activeTerm.label_en} - evidenziato in rosso`}
                className="w-full h-auto rounded-lg"
              />
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {lang === 'it' ? 'Seleziona un termine per evidenziare la struttura' : 'Select a term to highlight the structure'}
              </p>
              <img
                src="/images/anatomy/profile.png"
                alt={lang === 'it' ? 'Profilo di formica operaia con etichette anatomiche' : 'Worker ant profile with anatomical labels'}
                className="w-full h-auto rounded-lg"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
