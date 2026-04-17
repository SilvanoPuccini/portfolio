export function RadarBadge() {
  return (
    <div className="inline-flex flex-col items-start">
      {/* Línea superior decorativa */}
      <div className="mb-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/40" />
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-text-tertiary/50">
          est. 2026
        </span>
        <span className="h-px flex-1 bg-text-tertiary/40" />
      </div>

      {/* Nombre principal */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.32em] text-text-tertiary/70"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          El
        </span>
        <span
          className="text-[18px] font-bold uppercase tracking-[0.18em] text-text-secondary"
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            letterSpacing: "0.14em",
          }}
        >
          Radar
        </span>
      </div>

      {/* Línea inferior + tagline */}
      <div className="mt-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/40" />
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-text-tertiary/40">
          arquitectura · código · producto
        </span>
        <span className="h-px flex-1 bg-text-tertiary/40" />
      </div>
    </div>
  );
}
