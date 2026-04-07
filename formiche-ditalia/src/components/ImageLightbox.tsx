import { useState, useEffect, useCallback } from 'react';

interface Props {
  images: { src: string; alt: string }[];
}

function getLang(): 'it' | 'en' {
  try {
    return (localStorage.getItem('lang') as 'it' | 'en') || 'it';
  } catch {
    return 'it';
  }
}

const labels = {
  it: { close: 'Chiudi', prev: 'Precedente', next: 'Successiva' },
  en: { close: 'Close', prev: 'Previous', next: 'Next' },
} as const;

export default function ImageLightbox({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lang, setLang] = useState<'it' | 'en'>(getLang);

  useEffect(() => {
    const onLangChange = () => setLang(getLang());
    window.addEventListener('langchange', onLangChange);
    return () => window.removeEventListener('langchange', onLangChange);
  }, []);

  const t = labels[lang];

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(() => {
    if (activeIndex !== null) setActiveIndex((activeIndex + 1) % images.length);
  }, [activeIndex, images.length]);
  const prev = useCallback(() => {
    if (activeIndex !== null) setActiveIndex((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [activeIndex, close, next, prev]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in focus:ring-2 focus:ring-forest-400 focus:outline-none"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-ant.svg'; }}
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center"
            aria-label={t.close}
          >
            &#x2715;
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center"
                aria-label={t.prev}
              >
                &#x2039;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center"
                aria-label={t.next}
              >
                &#x203A;
              </button>
            </>
          )}
          <img
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
