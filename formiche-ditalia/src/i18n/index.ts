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

// Third i18n mechanism, for long-form bilingual content (blog posts): neither a
// JSON key nor a data-attribute can hold a rendered article body, so both
// language variants are emitted into the page and toggled by visibility.
// Italian is the visible default in the served HTML, so crawlers index the IT
// version — the EN blocks carry `hidden` in the markup.
export function applyLangBlocks(lang: Lang, root: ParentNode = document): void {
  root.querySelectorAll('[data-lang]').forEach((el) => {
    el.classList.toggle('hidden', el.getAttribute('data-lang') !== lang);
  });
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
