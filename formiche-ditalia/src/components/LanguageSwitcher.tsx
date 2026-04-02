import { useState, useEffect } from 'react';
import { getLang, setLang, type Lang } from '../i18n';

export default function LanguageSwitcher() {
  const [lang, setCurrentLang] = useState<Lang>('it');

  useEffect(() => {
    setCurrentLang(getLang());
  }, []);

  const toggle = () => {
    const newLang: Lang = lang === 'it' ? 'en' : 'it';
    setLang(newLang);
    setCurrentLang(newLang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        import('../i18n').then(({ t }) => {
          el.textContent = t(key as any, newLang);
        });
      }
    });
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
