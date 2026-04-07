import { useState, useEffect } from 'react';
import { getLang, type Lang } from '../i18n';
import it from '../i18n/it.json';
import en from '../i18n/en.json';

const translations: Record<string, Record<string, string>> = { it, en };
function t(key: string, lang: Lang): string {
  return translations[lang]?.[key] || translations.it[key] || key;
}

const WEB3FORMS_KEY = 'b661b616-641b-48a5-9cfe-b6a10967e57b';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
  const [lang, setLang] = useState<Lang>('it');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLang(getLang());
    const handler = (e: Event) => setLang((e as CustomEvent).detail as Lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot check
    if (data.get('website')) {
      setStatus('success');
      return;
    }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        form.reset();
      } else {
        setErrorMsg(json.message || t('contact_error', lang));
        setStatus('error');
      }
    } catch {
      setErrorMsg(t('contact_error', lang));
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-forest-50 border border-forest-200 p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-forest-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="font-display text-xl font-bold text-forest-900 mb-2">{t('contact_success_title', lang)}</h3>
        <p className="text-gray-600">{t('contact_success_desc', lang)}</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 px-5 py-2 rounded-lg bg-forest-600 text-white font-medium hover:bg-forest-700 transition-colors"
        >
          {t('contact_send_another', lang)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="access_key" value={WEB3FORMS_KEY} />
      <input type="hidden" name="subject" value="Nuovo messaggio da Formiche d'Italia" />
      <input type="hidden" name="from_name" value="Formiche d'Italia — Contatti" />

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {t('contact_name', lang)} *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
          placeholder={t('contact_name_placeholder', lang)}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('contact_email', lang)} *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
          placeholder={t('contact_email_placeholder', lang)}
        />
      </div>

      {/* Tipo messaggio */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          {t('contact_type', lang)} *
        </label>
        <select
          id="type"
          name="type"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm bg-white"
        >
          <option value="">{t('contact_type_select', lang)}</option>
          <option value="error">{t('contact_type_error', lang)}</option>
          <option value="suggestion">{t('contact_type_suggestion', lang)}</option>
          <option value="claim">{t('contact_type_claim', lang)}</option>
          <option value="collaboration">{t('contact_type_collaboration', lang)}</option>
          <option value="other">{t('contact_type_other', lang)}</option>
        </select>
      </div>

      {/* Messaggio */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          {t('contact_message', lang)} *
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm resize-vertical"
          placeholder={t('contact_message_placeholder', lang)}
        />
      </div>

      {/* Privacy */}
      <p className="text-xs text-gray-500 leading-relaxed">
        {t('contact_privacy', lang)}
      </p>

      {/* Errore */}
      {status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-forest-600 text-white font-semibold hover:bg-forest-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? t('contact_sending', lang) : t('contact_send', lang)}
      </button>
    </form>
  );
}
