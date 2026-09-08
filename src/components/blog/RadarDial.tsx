import { useId } from "react";

const bearings = Array.from({ length: 36 }, (_, index) => index * 10);

export function RadarDial({ className }: { className?: string }) {
  const uid = useId();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox="0 0 280 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-screen`} cx="0" cy="0" r="1" gradientTransform="translate(140 64) rotate(90) scale(58)">
          <stop stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="0.72" stopColor="currentColor" stopOpacity="0.035" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-sweep`} x1="140" y1="64" x2="196" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.03" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.34" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-scope`}>
          <circle cx="140" cy="64" r="56" />
        </clipPath>
      </defs>

      <circle cx="140" cy="64" r="61" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
      <circle cx="140" cy="64" r="58" fill={`url(#${uid}-screen)`} stroke="currentColor" strokeOpacity="0.48" strokeWidth="1.25" />
      <circle cx="140" cy="64" r="54.5" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.5" />

      <g stroke="currentColor" strokeOpacity="0.42">
        {bearings.map((bearing) => (
          <line
            key={bearing}
            x1="140"
            y1={bearing % 30 === 0 ? 7 : 9.5}
            x2="140"
            y2={bearing % 30 === 0 ? 14 : 12.5}
            strokeWidth={bearing % 30 === 0 ? 0.9 : 0.45}
            transform={`rotate(${bearing} 140 64)`}
          />
        ))}
      </g>

      <g clipPath={`url(#${uid}-scope)`}>
        <g stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.55">
          <line x1="82" y1="64" x2="198" y2="64" />
          <line x1="140" y1="6" x2="140" y2="122" />
          <line x1="99" y1="23" x2="181" y2="105" strokeDasharray="2 3" />
          <line x1="181" y1="23" x2="99" y2="105" strokeDasharray="2 3" />
        </g>
        <g stroke="currentColor">
          <circle cx="140" cy="64" r="14" strokeOpacity="0.34" strokeWidth="0.55" strokeDasharray="2 2" />
          <circle cx="140" cy="64" r="28" strokeOpacity="0.28" strokeWidth="0.65" />
          <circle cx="140" cy="64" r="42" strokeOpacity="0.28" strokeWidth="0.55" strokeDasharray="4 3" />
        </g>

        <path d="M140 64L177.3 20.7A57.2 57.2 0 0 1 196.4 54.1Z" fill={`url(#${uid}-sweep)`} />
        <line x1="140" y1="64" x2="196.4" y2="54.1" stroke="currentColor" strokeOpacity="0.72" strokeWidth="1" />
        <line x1="140" y1="64" x2="196.4" y2="54.1" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4" />

        <g fill="currentColor" filter={`url(#${uid}-glow)`}>
          <circle cx="170" cy="43" r="1.6" opacity="0.92" />
          <circle cx="111" cy="82" r="1.25" opacity="0.68" />
          <circle cx="174" cy="83" r="1" opacity="0.55" />
        </g>
        <g stroke="currentColor" fill="none">
          <circle cx="170" cy="43" r="4.5" strokeOpacity="0.42" strokeWidth="0.65" />
          <circle cx="111" cy="82" r="3.2" strokeOpacity="0.28" strokeWidth="0.55" />
        </g>
      </g>

      <circle cx="140" cy="64" r="2.2" fill="currentColor" opacity="0.92" filter={`url(#${uid}-glow)`} />
      <circle cx="140" cy="64" r="0.8" fill="#071116" />

      <g fill="currentColor" opacity="0.56" fontFamily="monospace" fontSize="5" letterSpacing="0.08em">
        <text x="140" y="13" textAnchor="middle">N</text>
        <text x="191" y="66" textAnchor="middle">E</text>
        <text x="140" y="118" textAnchor="middle">S</text>
        <text x="89" y="66" textAnchor="middle">W</text>
        <text x="205" y="40">BRG 080</text>
        <text x="205" y="47" opacity="0.65">RNG 04</text>
      </g>
    </svg>
  );
}
