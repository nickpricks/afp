/** SVG stick figure in side-pose boxing stance — alternates guard and jab */
export function SceneAthlete() {
  return (
    <svg viewBox="0 0 80 80" className="w-48 overflow-visible" aria-hidden="true">
      {/* Ground line */}
      <line
        x1="10"
        y1="72"
        x2="70"
        y2="72"
        stroke="var(--text-subtle)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="loading-stairs"
      />

      {/* Figure group — boxer bob-and-weave */}
      <g className="loading-athlete" style={{ transformOrigin: '40px 72px' }}>
        {/* Glow halo */}
        <circle cx="42" cy="40" r="14" fill="var(--accent)" className="loading-glow" />

        {/* Head — offset right for side profile */}
        <circle cx="43" cy="27" r="4" fill="var(--accent)" />

        {/* Torso — angled forward lean */}
        <line
          x1="42"
          y1="31"
          x2="38"
          y2="50"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Frame A: Guard — both fists up, bent arms, staggered stance */}
        <g className="loading-punch-a">
          {/* Lead arm — upper arm forward+down, forearm up to chin */}
          <line
            x1="42"
            y1="36"
            x2="48"
            y2="41"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="48"
            y1="41"
            x2="47"
            y2="33"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="47" cy="32" r="1.8" fill="var(--accent)" />
          {/* Rear arm — upper arm back+down, forearm up to chin */}
          <line
            x1="40"
            y1="37"
            x2="34"
            y2="41"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="34"
            y1="41"
            x2="36"
            y2="33"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="36" cy="32" r="1.8" fill="var(--accent)" />
          {/* Lead leg — forward, slightly bent */}
          <line
            x1="38"
            y1="50"
            x2="45"
            y2="62"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="45"
            y1="62"
            x2="47"
            y2="72"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Rear leg — back, weight planted */}
          <line
            x1="38"
            y1="50"
            x2="33"
            y2="63"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="33"
            y1="63"
            x2="31"
            y2="72"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Frame B: Jab — lead fist punched forward, weight shifts */}
        <g className="loading-punch-b">
          {/* Lead arm — extended jab */}
          <line
            x1="42"
            y1="36"
            x2="50"
            y2="37"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="37"
            x2="58"
            y2="35"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="59" cy="35" r="1.8" fill="var(--accent)" />
          {/* Rear arm — still guarding chin */}
          <line
            x1="40"
            y1="37"
            x2="34"
            y2="41"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="34"
            y1="41"
            x2="36"
            y2="33"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="36" cy="32" r="1.8" fill="var(--accent)" />
          {/* Lead leg — weight shifted forward */}
          <line
            x1="38"
            y1="50"
            x2="46"
            y2="61"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="46"
            y1="61"
            x2="48"
            y2="72"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Rear leg — pushing off */}
          <line
            x1="38"
            y1="50"
            x2="32"
            y2="64"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="64"
            x2="30"
            y2="72"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
