// Language state and the `langchange` contract, deliberately free of any JSON
// import.
//
// i18n/index.ts statically imports it.json + en.json (75.9 KB combined). Anything
// that only needs to READ or SET the current language — the switcher button, the
// BaseLayout title script — must not pay for the translations, which are only
// needed once someone actually toggles. index.ts re-exports everything here, so
// existing importers are unaffected.

export type Lang = 'it' | 'en';

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'it';
  return (localStorage.getItem('lang') as Lang) || 'it';
}

export function setLang(lang: Lang): void {
  localStorage.setItem('lang', lang);
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
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
