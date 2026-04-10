/** SVG stick figure alternating between running and boxing poses */
export function SceneAthlete() {
  return (
    <svg viewBox="0 0 80 80" className="w-48 overflow-visible" aria-hidden="true">
      {/* Ground line */}
      <line
        x1="10" y1="72" x2="70" y2="72"
        stroke="var(--text-subtle)" strokeWidth="1.5" strokeLinecap="round"
        className="loading-stairs"
      />

      {/* Figure group — subtle bounce */}
      <g className="loading-athlete" style={{ transformOrigin: '40px 72px' }}>
        {/* Glow halo */}
        <circle cx="40" cy="42" r="14" fill="var(--accent)" className="loading-glow" />

        {/* Head */}
        <circle cx="40" cy="30" r="4" fill="var(--accent)" />

        {/* Torso */}
        <line x1="40" y1="34" x2="40" y2="52" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

        {/* Frame A: running stride — arms pumping, legs spread */}
        <g className="loading-frame-a">
          {/* Arms */}
          <line x1="40" y1="38" x2="33" y2="44" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="38" x2="48" y2="42" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Legs */}
          <line x1="40" y1="52" x2="34" y2="65" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="65" x2="32" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="52" x2="47" y2="63" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="47" y1="63" x2="50" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Frame B: boxing guard — fists up, compact stance */}
        <g className="loading-frame-b">
          {/* Arms — fists raised */}
          <line x1="40" y1="38" x2="34" y2="34" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="34" cy="33" r="1.5" fill="var(--accent)" />
          <line x1="40" y1="38" x2="47" y2="36" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="47" cy="35" r="1.5" fill="var(--accent)" />
          {/* Legs — wider boxing stance */}
          <line x1="40" y1="52" x2="33" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="52" x2="47" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
