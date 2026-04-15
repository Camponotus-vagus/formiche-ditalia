import { useState, useRef, useCallback, useEffect } from 'react';
import type { AnatomyTermPaths, AnatomyViewId, AnatomyLabelPosition } from '../types';

interface Props {
  viewId: AnatomyViewId;
  imageSrc: string;
  alt: string;
  paths: Record<string, AnatomyTermPaths>;
  activeTerm: string | null;
  hoveredTerm: string | null;
  regionColors: Record<string, { fill: string; stroke: string }>;
  lang: 'it' | 'en';
  termLabels: Record<string, { it: string; en: string }>;
  dimmed: boolean;
  onTermClick: (termId: string) => void;
  onTermHover: (termId: string | null) => void;
}

function computeCentroid(pathData: string): { x: number; y: number } {
  const coords = pathData.match(/[\d.]+,[\d.]+/g) || [];
  const points = coords.map(c => {
    const [x, y] = c.split(',').map(Number);
    return { x, y };
  });
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export default function AnatomyView({
  viewId,
  imageSrc,
  alt,
  paths,
  activeTerm,
  hoveredTerm,
  regionColors,
  lang,
  termLabels,
  dimmed,
  onTermClick,
  onTermHover,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [viewBox, setViewBox] = useState<string | null>(null);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) {
      setViewBox(`0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    }
  }, []);

  useEffect(() => {
    // Handle case where image is already cached and loaded before ref attaches
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setViewBox(`0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    }
  }, []);

  return (
    <div
      className={`relative select-none ${dimmed ? 'opacity-40' : ''}`}
      style={{ transition: 'opacity 0.3s' }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className="w-full h-auto block"
        onLoad={handleImageLoad}
        draggable={false}
      />
      {viewBox && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          onClick={() => onTermClick('')}
        >
          {Object.entries(paths).map(([termId, termData]) => {
            const viewPath = termData.views[viewId];
            if (!viewPath) return null;

            const colors = regionColors[termData.region];
            if (!colors) return null;

            const isActive = activeTerm === termId;
            const isHovered = hoveredTerm === termId;

            return (
              <g
                key={termId}
                data-term={termId}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onTermClick(termId); }}
                onMouseEnter={() => onTermHover(termId)}
                onMouseLeave={() => onTermHover(null)}
              >
                <path
                  d={viewPath.path}
                  fill={isActive ? colors.fill : 'transparent'}
                  stroke={isActive ? colors.stroke : isHovered ? colors.stroke : 'transparent'}
                  strokeWidth={isActive ? 2.5 : 2}
                  strokeOpacity={isActive ? 0.8 : 0.3}
                  style={{ transition: 'fill 0.2s, stroke 0.2s, stroke-opacity 0.2s' }}
                />
                {isActive && viewPath.label && (() => {
                  const centroid = computeCentroid(viewPath.path);
                  const label = viewPath.label;
                  const labelIt = termLabels[termId]?.it || termId;
                  const labelEn = termLabels[termId]?.en || termId;

                  return (
                    <>
                      <line
                        x1={centroid.x} y1={centroid.y}
                        x2={label.x} y2={label.y}
                        stroke={colors.stroke} strokeWidth={1} strokeOpacity={0.6}
                      />
                      <foreignObject
                        x={label.anchor === 'end' ? label.x - 200 : label.anchor === 'middle' ? label.x - 100 : label.x}
                        y={label.y - 16}
                        width={200} height={40}
                        style={{ overflow: 'visible' }}
                      >
                        <div style={{
                          display: 'inline-block',
                          background: 'white',
                          border: `1px solid ${colors.stroke}`,
                          borderRadius: 6,
                          padding: '2px 8px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          textAlign: label.anchor === 'end' ? 'right' : label.anchor === 'middle' ? 'center' : 'left',
                          whiteSpace: 'nowrap',
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: colors.stroke }}>{labelIt}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{labelEn}</div>
                        </div>
                      </foreignObject>
                    </>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
