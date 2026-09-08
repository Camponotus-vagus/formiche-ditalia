import { useState, useEffect } from 'react';
import { applyLangBlocks, getLang, setLang, type Lang } from '../i18n/lang';

export default function LanguageSwitcher() {
  const [lang, setCurrentLang] = useState<Lang>('it');

  useEffect(() => {
    setCurrentLang(getLang());
  }, []);

  const toggle = async () => {
    const newLang: Lang = lang === 'it' ? 'en' : 'it';
    setLang(newLang);
    setCurrentLang(newLang);
    document.documentElement.lang = newLang;

    // The translations (75.9 KB of it.json + en.json) are fetched here, on the
    // first toggle, rather than statically at the top of this module — that import
    // put the whole bundle on every page's critical path for a single button.
    // Hoisted out of the loop below, which used to fire one promise per element.
    const { t } = await import('../i18n');

    // Use innerHTML for translations containing HTML markup (e.g. <strong>, <em>, <a>),
    // textContent otherwise. Values come from our own i18n JSON files, not user input.
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const value = t(key as any, newLang);
      if (/<[a-z][\s\S]*>/i.test(value)) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });
    // Swap bilingual data fields (description_it/description_en, bio_it/bio_en, etc.)
    document.querySelectorAll('[data-i18n-field]').forEach((el) => {
      const itText = el.getAttribute('data-it') || '';
      const enText = el.getAttribute('data-en') || '';
      el.textContent = (newLang === 'en' ? enText : itText) || itText || enText;
    });
    // Swap whole bilingual blocks (blog post bodies, headings, blurbs).
    applyLangBlocks(newLang);
  };

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium text-gray-500 hover:text-forest-600 transition-colors px-2 py-1 rounded border border-gray-300 hover:border-forest-400"
      aria-label={lang === 'it' ? 'Switch to English' : 'Passa all\'italiano'}
    >
      {lang === 'it' ? 'EN' : 'IT'}
    </button>
  );
}
