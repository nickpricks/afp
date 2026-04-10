const STEP_DELAYS = [0, 0.42, 0.96, 1.5, 2.04];

/** SVG stick figure climbing a 5-step staircase — ported from Floor-Tracker */
export function SceneClimber() {
  return (
    <svg viewBox="0 0 140 110" className="w-48 overflow-visible" aria-hidden="true">
      {/* Staircase outline — draws itself on mount */}
      <polyline
        className="loading-stairs"
        points="10,98 34,98 34,81 58,81 58,64 82,64 82,47 106,47 106,30 130,30"
        fill="none"
        stroke="var(--text-subtle)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Step flash highlights */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 10 + i * 24;
        const y = 98 - i * 17;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + 24}
            y2={y}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="loading-step"
            style={{ animationDelay: `${STEP_DELAYS[i]}s` }}
          />
        );
      })}

      {/* Climbing stick figure — origin at feet */}
      <g className="loading-climber">
        <circle cx="0" cy="-10" r="12" fill="var(--accent)" className="loading-glow" />
        <circle cx="0" cy="-18" r="3.5" fill="var(--accent)" />
        <line x1="0" y1="-14.5" x2="0" y2="-6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />

        {/* Frame A: stride */}
        <g className="loading-frame-a">
          <line x1="0" y1="-12" x2="-4" y2="-8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-12" x2="4.5" y2="-9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="3.5" y2="-0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="-3" y2="1" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Frame B: gather */}
        <g className="loading-frame-b">
          <line x1="0" y1="-12" x2="-2" y2="-8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-12" x2="2.5" y2="-8.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="1.5" y2="0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="-1" y2="0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
