/** SVG head+torso stick figure with spectacles, comparing two papers */
export function SceneReader() {
  return (
    <svg viewBox="0 0 80 70" className="w-48 overflow-visible" aria-hidden="true">
      {/* Desk line */}
      <line
        x1="15" y1="60" x2="65" y2="60"
        stroke="var(--text-subtle)" strokeWidth="1.5" strokeLinecap="round"
        className="loading-stairs"
      />

      {/* Glow halo */}
      <circle cx="40" cy="32" r="14" fill="var(--accent)" className="loading-glow" />

      {/* Head group — tilts left/right */}
      <g className="loading-reader-head" style={{ transformOrigin: '40px 24px' }}>
        {/* Head */}
        <circle cx="40" cy="18" r="5" fill="var(--accent)" />

        {/* Spectacles — two circles with bridge */}
        <circle cx="37" cy="18" r="2.5" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
        <circle cx="43" cy="18" r="2.5" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
        <line x1="39.5" y1="18" x2="40.5" y2="18" stroke="var(--accent)" strokeWidth="0.8" />
        {/* Temple arms */}
        <line x1="34.5" y1="18" x2="33" y2="16" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="45.5" y1="18" x2="47" y2="16" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* Torso */}
      <line x1="40" y1="23" x2="40" y2="42" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

      {/* Left arm + paper */}
      <g className="loading-paper-left">
        <line x1="40" y1="30" x2="28" y2="38" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Paper — angled rectangle */}
        <rect x="20" y="36" width="10" height="14" rx="1"
          fill="none" stroke="var(--accent)" strokeWidth="1"
          transform="rotate(-5 25 43)" />
        <line x1="22" y1="40" x2="28" y2="40" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(-5 25 43)" />
        <line x1="22" y1="43" x2="27" y2="43" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(-5 25 43)" />
      </g>

      {/* Right arm + paper */}
      <g className="loading-paper-right">
        <line x1="40" y1="30" x2="52" y2="38" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Paper — angled rectangle */}
        <rect x="50" y="36" width="10" height="14" rx="1"
          fill="none" stroke="var(--accent)" strokeWidth="1"
          transform="rotate(5 55 43)" />
        <line x1="52" y1="40" x2="58" y2="40" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(5 55 43)" />
        <line x1="52" y1="43" x2="57" y2="43" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(5 55 43)" />
      </g>
    </svg>
  );
}
