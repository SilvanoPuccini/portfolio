export function RadarBadge() {
  // SVG replicates reference design proportions exactly:
  // - Circle center at cx=100 aligns with "El" text (left side of badge)
  // - Radii 30:60:90:120 = 1:2:3:4 ratio matching reference 75:150:225:300
  // - Stroke patterns: inner dashed sw=0.75, solid sw=0.5, dashed sw=0.5, solid sw=0.3
  // - Scan line 45° upper-right toward "Radar" text (like reference center→RADAR)
  // - Secondary line offset from center (lower-left), matching reference offset path
  return (
    <div className="inline-flex flex-col items-center relative">
      {/* Radar circles — decorative background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: "300px",
          height: "120px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          overflow: "visible",
        }}
        viewBox="0 0 300 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.4">
          {/* r=30 — inner dashed, strokeWidth=0.75, dasharray="3 3" */}
          <circle cx="100" cy="60" r="30" stroke="#00d4d4" strokeWidth="0.75" strokeDasharray="3 3" />
          {/* r=60 — solid */}
          <circle cx="100" cy="60" r="60" stroke="#00d4d4" strokeWidth="0.5" />
          {/* r=90 — outer dashed, dasharray="6 6" */}
          <circle cx="100" cy="60" r="90" stroke="#00d4d4" strokeWidth="0.5" strokeDasharray="6 6" />
          {/* r=120 — outermost solid, thinnest */}
          <circle cx="100" cy="60" r="120" stroke="#00d4d4" strokeWidth="0.3" />
          {/* Scan line — 45° upper-right toward "Radar" text, opacity=0.5 */}
          <line x1="100" y1="60" x2="190" y2="-30" stroke="#00d4d4" strokeWidth="0.75" opacity="0.5" />
          {/* Secondary line — offset lower-left like reference (not from center), opacity=0.2 */}
          <line x1="80" y1="83" x2="10" y2="150" stroke="#00d4d4" strokeWidth="0.4" opacity="0.2" />
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
