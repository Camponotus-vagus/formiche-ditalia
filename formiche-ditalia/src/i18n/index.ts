import it from './it.json';
import en from './en.json';
import { getLang, type Lang } from './lang';

// Language state lives in ./lang, which imports no JSON — so a caller that only
// reads or sets the language can avoid pulling the translations in. Re-exported
// here so every existing `from '../i18n'` import keeps working unchanged.
export { getLang, setLang, applyLangBlocks } from './lang';
export type { Lang } from './lang';

export type TranslationKey = keyof typeof it;

const translations: Record<Lang, Record<string, string>> = { it, en };

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
