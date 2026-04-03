import { useState, useEffect, useCallback } from 'react';

interface GenusSlide {
  id: string;
  scientific_name: string;
  photo_url: string;
  species_count: number;
  subfamily_id: string;
}

interface Props {
  genera: GenusSlide[];
  intervalMs?: number;
}

export default function HeroCarousel({ genera, intervalMs = 5000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (isTransitioning) return;
    setDirection(dir);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 400);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % genera.length, 'next');
  }, [current, genera.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + genera.length) % genera.length, 'prev');
  }, [current, genera.length, goTo]);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [next, intervalMs]);

  if (genera.length === 0) return null;

  const genus = genera[current];

  return (
    <div className="relative group">
      {/* Background gradient card */}
      <div className="absolute inset-0 bg-gradient-to-br from-forest-200 to-brand-200 rounded-3xl rotate-3 scale-105 opacity-40" />

      {/* Main image with crossfade */}
      <div className="relative rounded-3xl shadow-2xl overflow-hidden aspect-square">
        <img
          key={genus.id}
          src={genus.photo_url}
          alt={`${genus.scientific_name}, specimen`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${
            isTransitioning
              ? `opacity-0 ${direction === 'next' ? 'scale-110' : 'scale-95'}`
              : 'opacity-100 scale-100'
          }`}
        />

        {/* Navigation arrows — visible on hover */}
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          aria-label="Precedente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          aria-label="Successivo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Info overlay with slide-up animation */}
      <a
        href={`/generi/${genus.id}`}
        className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg hover:bg-white transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold text-forest-800 italic transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {genus.scientific_name}
            </p>
            <p className={`text-xs text-gray-500 transition-all duration-300 delay-75 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {genus.species_count} specie a Roma · <span className="capitalize">{genus.subfamily_id}</span>
            </p>
          </div>
          <svg className="w-4 h-4 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </a>

      {/* Dot indicators */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {genera.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? 'bg-forest-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Vai a ${genera[i].scientific_name}`}
          />
        ))}
      </div>
    </div>
  );
}
