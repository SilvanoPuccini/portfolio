import { useId } from "react";

export function RadarDial({ className }: { className?: string }) {
  const uid = useId();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox="0 0 116 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-screen`} cx="0" cy="0" r="1" gradientTransform="translate(58 58) rotate(90) scale(53)">
          <stop stopColor="currentColor" stopOpacity="0.13" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="58" cy="58" r="53" fill={`url(#${uid}-screen)`} stroke="currentColor" strokeOpacity="0.72" strokeWidth="1.5" />
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="58" cy="58" r="35" strokeOpacity="0.38" strokeWidth="1" />
        <circle cx="58" cy="58" r="18" strokeOpacity="0.48" strokeWidth="1" />
        <path d="M10 80C23 104 50 114 76 108" strokeOpacity="0.28" strokeWidth="1.2" />
      </g>

      <g className="radar-sweep" style={{ transformOrigin: "58px 58px" }}>
        <path d="M58 58L91 22A49 49 0 0 1 105 44Z" fill="currentColor" opacity="0.1" />
        <line x1="58" y1="58" x2="105" y2="44" stroke="currentColor" strokeOpacity="0.92" strokeWidth="2" strokeLinecap="round" />
        <line x1="58" y1="58" x2="105" y2="44" stroke="currentColor" strokeOpacity="0.18" strokeWidth="6" strokeLinecap="round" />
      </g>

      <circle cx="78" cy="35" r="2.5" fill="currentColor" filter={`url(#${uid}-glow)`} />
      <circle className="radar-blip" cx="78" cy="35" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="58" cy="58" r="3" fill="currentColor" />

      <style>{`
        .radar-sweep { animation: radar-scan 7s linear infinite; }
        .radar-blip { animation: radar-blink 1.8s ease-out infinite; transform-origin: 78px 35px; }
        @keyframes radar-scan { to { transform: rotate(360deg); } }
        @keyframes radar-blink { 0%, 35% { opacity: .9; transform: scale(.65); } 80%, 100% { opacity: 0; transform: scale(1.35); } }
        @media (prefers-reduced-motion: reduce) {
          .radar-sweep, .radar-blip { animation: none; }
          .radar-blip { opacity: .55; }
        }
      `}</style>
    </svg>
  );
}
