export function RadarBadge() {
  return (
    <div className="inline-flex flex-col items-center relative">
      {/* Radar circles — decorative background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: "160px",
          height: "80px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          overflow: "visible",
        }}
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.4">
          <circle cx="80" cy="40" r="18" stroke="#00d4d4" strokeWidth="0.75" strokeDasharray="4 4" />
          <circle cx="80" cy="40" r="32" stroke="#00d4d4" strokeWidth="0.5" />
          <circle cx="80" cy="40" r="48" stroke="#00d4d4" strokeWidth="0.5" strokeDasharray="8 8" />
          <circle cx="80" cy="40" r="65" stroke="#00d4d4" strokeWidth="0.375" />
          <line x1="80" y1="40" x2="126" y2="7" stroke="#00d4d4" strokeWidth="1" opacity="0.5" />
          <line x1="80" y1="40" x2="34" y2="73" stroke="#00d4d4" strokeWidth="0.5" opacity="0.2" />
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
