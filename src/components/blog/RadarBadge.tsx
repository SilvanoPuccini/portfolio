export function RadarBadge({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="relative inline-flex flex-col items-center"
      style={{
        width: "280px",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "center center",
      }}
    >
      {/* Radar circles — centered at cx=84 (≈30% from left), aligns with "El" text.
          Container width=280px is the centering unit, so circles+text center together.
          Radii 30:60:90:120 = 1:2:3:4 matching reference 75:150:225:300 ratio.
          Scan line 45° upper-right toward "Radar". Secondary line offset, not from center. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: "280px",
          height: "80px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          overflow: "visible",
        }}
        viewBox="0 0 280 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.4">
          <circle cx="84" cy="40" r="30" stroke="#00d4d4" strokeWidth="0.75" strokeDasharray="3 3" />
          <circle cx="84" cy="40" r="60" stroke="#00d4d4" strokeWidth="0.5" />
          <circle cx="84" cy="40" r="90" stroke="#00d4d4" strokeWidth="0.5" strokeDasharray="6 6" />
          <circle cx="84" cy="40" r="120" stroke="#00d4d4" strokeWidth="0.3" />
          <line x1="84" y1="40" x2="169" y2="-45" stroke="#00d4d4" strokeWidth="0.75" opacity="0.5" />
          <line x1="64" y1="57" x2="-21" y2="142" stroke="#00d4d4" strokeWidth="0.4" opacity="0.2" />
        </g>
      </svg>

      {/* Línea superior decorativa */}
      <div className="relative z-10 mb-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/50" />
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-text-secondary">
          est. 2026
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>

      {/* Nombre principal */}
      <div className="relative z-10 flex items-baseline gap-1.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.32em] text-text-secondary"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          El
        </span>
        <span
          className="text-[18px] font-bold uppercase text-text-tertiary"
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            letterSpacing: "0.14em",
          }}
        >
          Radar
        </span>
      </div>

      {/* Línea inferior + tagline */}
      <div className="relative z-10 mt-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/50" />
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-text-secondary">
          arquitectura · código · producto
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>
    </div>
  );
}
