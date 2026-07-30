import { useState, useMemo, useEffect } from 'react';
import { getLang, type Lang } from '../i18n';
import it from '../i18n/it.json';
import en from '../i18n/en.json';

const translations: Record<string, Record<string, string>> = { it, en };
function t(key: string, lang: Lang): string {
  return translations[lang]?.[key] || translations.it[key] || key;
}

interface Genus {
  id: string;
  scientific_name: string;
  subfamily_id: string;
  species_count_italy: number;
  photo_urls: string[];
}

interface Species {
  id: string;
  scientific_name: string;
  genus_id: string;
  photo_urls: string[];
}

interface Subfamily {
  id: string;
  name: string;
}

interface Props {
  genera: Genus[];
  subfamilies: Subfamily[];
  species?: Species[];
}

export default function GeneraBrowser({ genera, subfamilies, species = [] }: Props) {
  const [search, setSearch] = useState('');
  const [subfamilyFilter, setSubfamilyFilter] = useState('');
  const [lang, setLang] = useState<Lang>('it');

  useEffect(() => {
    setLang(getLang());
    const handler = (e: Event) => setLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  const filtered = useMemo(() => {
    return genera.filter((g) => {
      if (search && !g.scientific_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (subfamilyFilter && g.subfamily_id !== subfamilyFilter) return false;
      return true;
    });
  }, [genera, search, subfamilyFilter]);

  const filteredSpecies = useMemo(() => {
    if (!search || search.length < 2 || !species.length) return [];
    const q = search.toLowerCase();
    return species.filter((s) => s.scientific_name.toLowerCase().includes(q)).slice(0, 12);
  }, [species, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <label className="sr-only" htmlFor="genera-search">{t('genera_search', lang)}</label>
        <input
          id="genera-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('genera_search', lang)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
        />
        <label className="sr-only" htmlFor="subfamily-filter">{t('genera_filter_subfamily', lang)}</label>
        <select
          id="subfamily-filter"
          value={subfamilyFilter}
          onChange={(e) => setSubfamilyFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm bg-white"
        >
          <option value="">{t('genera_all_subfamilies', lang)}</option>
          {subfamilies.map((sf) => (
            <option key={sf.id} value={sf.id}>{sf.name}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} {t('genera_count', lang)}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((genus) => (
          <a
            key={genus.id}
            href={`/generi/${genus.id}/`}
            className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-forest-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
              <img
                src={genus.photo_urls?.[0] || '/images/placeholder-ant.svg'}
                alt={`${genus.scientific_name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-ant.svg'; }}
              />
            </div>
            <div className="p-4">
              <h3 className="font-display text-lg font-semibold italic text-gray-900 group-hover:text-forest-600 transition-colors">
                {genus.scientific_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 capitalize">{genus.subfamily_id}</p>
              {genus.species_count_italy > 0 && (
                <p className="text-xs text-forest-600 mt-2">{genus.species_count_italy} {t('genera_species_count', lang)}</p>
              )}
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && filteredSpecies.length === 0 && (
        <p className="text-center text-gray-400 py-12">{t('genera_no_results', lang)}</p>
      )}

      {filteredSpecies.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {t('genera_matching_species', lang)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecies.map((sp) => (
              <a
                key={sp.id}
                href={`/specie/${sp.id}/`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 hover:border-brand-400 hover:shadow-md p-3 transition-all"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={sp.photo_urls?.[0] || '/images/placeholder-ant.svg'}
                    alt={sp.scientific_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-ant.svg'; }}
                  />
                </div>
                <div>
                  <p className="font-semibold italic text-gray-900 group-hover:text-brand-600 transition-colors text-sm">
                    {sp.scientific_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{sp.genus_id}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
