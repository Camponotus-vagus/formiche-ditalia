import it from './it.json';
import en from './en.json';

export type Lang = 'it' | 'en';
export type TranslationKey = keyof typeof it;

const translations: Record<Lang, Record<string, string>> = { it, en };

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'it';
  return (localStorage.getItem('lang') as Lang) || 'it';
}

export function setLang(lang: Lang): void {
  localStorage.setItem('lang', lang);
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

export function t(key: TranslationKey, lang?: Lang): string {
  const l = lang || getLang();
  return translations[l]?.[key] || translations.it[key] || key;
}

export function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang?: Lang,
): string {
  const l = lang || getLang();
  const localized = obj[`${field}_${l}`];
  if (typeof localized === 'string' && localized) return localized;
  const fallback = obj[`${field}_it`];
  return typeof fallback === 'string' ? fallback : '';
}
