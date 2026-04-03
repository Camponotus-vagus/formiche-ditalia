import { useState, useMemo, useEffect } from 'react';
import { getLang, type Lang } from '../i18n';
import it from '../i18n/it.json';
import en from '../i18n/en.json';

const translations: Record<string, Record<string, string>> = { it, en };
function t(key: string, lang: Lang): string {
  return translations[lang]?.[key] || translations.it[key] || key;
}

interface Expert {
  id: string;
  name: string;
  affiliation: string | null;
  role: string | null;
  region: string | null;
  specializations: string[];
  profile_photo_url: string | null;
  claimed: boolean;
}

interface Props {
  experts: Expert[];
}

export default function ExpertsBrowser({ experts }: Props) {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [lang, setLang] = useState<Lang>('it');

  useEffect(() => {
    setLang(getLang());
    const handler = (e: Event) => setLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  const regions = useMemo(() => {
    return [...new Set(experts.map(e => e.region).filter(Boolean))].sort() as string[];
  }, [experts]);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
          !e.specializations.some(s => s.toLowerCase().includes(search.toLowerCase()))) return false;
      if (regionFilter && e.region !== regionFilter) return false;
      return true;
    });
  }, [experts, search, regionFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('experts_search', lang)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm bg-white"
        >
          <option value="">{t('experts_all_regions', lang)}</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} {t('experts_count', lang)}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((expert) => (
          <a
            key={expert.id}
            href={`/esperti/${expert.id}`}
            className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-brand-400 hover:shadow-lg transition-all duration-200 p-5"
          >
            <div className="flex items-start gap-4">
              {expert.profile_photo_url ? (
                <img src={expert.profile_photo_url} alt={expert.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" loading="lazy" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 font-semibold text-lg">
                    {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{expert.name}</h3>
                  {expert.claimed && <span className="text-xs bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full">{t('experts_verified', lang)}</span>}
                </div>
                {expert.affiliation && <p className="text-sm text-gray-500 truncate">{expert.affiliation}</p>}
                {expert.region && <p className="text-xs text-gray-400 mt-1">{expert.region}</p>}
              </div>
            </div>
            {expert.specializations?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {expert.specializations.slice(0, 3).map(spec => (
                  <span key={spec} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{spec}</span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">{t('experts_no_results', lang)}</p>
      )}
    </div>
  );
}
