import { useState, useRef, type ReactNode } from 'react';

interface Props {
  term: string;
  definition: string;
  imageUrl?: string | null;
  children: ReactNode;
}

export default function GlossaryTooltip({ term, definition, imageUrl, children }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-describedby={`glossary-${term}`}
    >
      <span className="border-b border-dashed border-gray-400 cursor-help">
        {children}
      </span>
      {visible && (
        <div
          ref={ref}
          id={`glossary-${term}`}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-sm"
        >
          <p className="font-semibold text-gray-900 mb-1">{term}</p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={term}
              className="w-full h-32 object-cover rounded mb-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <p className="text-gray-600">{definition}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -translate-y-1.5" />
          </div>
        </div>
      )}
    </span>
  );
}
