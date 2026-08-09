import { useState, useEffect } from 'react';

interface Props {
  base: string;
  // Pre-rendered variant of `base` with the active term highlighted, or null
  // when the selected term is drawn on another plate.
  highlight: string | null;
  alt: string;
  dimmed: boolean;
}

export default function AnatomyView({ base, highlight, alt, dimmed }: Props) {
  // The variant is a separate ~120 KB file, so it arrives a moment after the
  // click. Keep the base plate underneath and fade the variant in once it has
  // decoded: swapping `src` directly would blank the panel mid-download.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [highlight]);

  return (
    <div
      className={`relative select-none transition-opacity duration-300 ${dimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      <img src={base} alt={alt} className="w-full h-auto block" draggable={false} />
      {highlight && (
        <img
          src={highlight}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
          draggable={false}
          className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
