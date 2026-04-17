export function RadarBadge() {
  return (
    <div className="inline-flex flex-col items-center">
      {/* Línea superior decorativa */}
      <div className="mb-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/50" />
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-text-secondary">
          est. 2026
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>

      {/* Nombre principal */}
      <div className="flex items-baseline gap-1.5">
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
      <div className="mt-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/50" />
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-text-secondary">
          arquitectura · código · producto
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>
    </div>
  );
}
