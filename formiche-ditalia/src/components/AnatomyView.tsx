import { useState, useEffect } from 'react';

interface Props {
  base: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  // Pre-rendered variant of `base` with the active term highlighted, or null
  // when the selected term is drawn on another plate.
  highlight: string | null;
  alt: string;
  dimmed: boolean;
}

export default function AnatomyView({ base, srcSet, sizes, width, height, highlight, alt, dimmed }: Props) {
  // The variant is a separate file, so it arrives a moment after the click. Keep
  // the base plate underneath and fade the variant in once it has decoded:
  // swapping `src` directly would blank the panel mid-download.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [highlight]);

  return (
    <div
      className={`relative select-none transition-opacity duration-300 ${dimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      <img
        src={base}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className="w-full h-auto block"
        draggable={false}
        // NOT loading="lazy". Both suppress the <link rel="preload" as="image">
        // that react-dom/server emits for every SSR'd <img> — which put 305 KB of
        // high-priority fetches on a page where the plates sit below the fold at
        // 375px. But clicking a term scrolls its plate into view, and a lazy base
        // that had not loaded yet would leave an empty box at exactly that moment.
        // fetchPriority="low" drops the preload while still loading eagerly.
        fetchPriority="low"
      />
      {highlight && (
        <img
          src={highlight}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
          draggable={false}
          // Sized by this box, so a full-resolution overlay still lines up with a
          // downscaled base — only the three base plates have variants.
          className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
