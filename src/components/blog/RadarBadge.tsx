interface Props {
  size?: "sm" | "lg";
}

export function RadarBadge({ size = "sm" }: Props) {
  const isLg = size === "lg";

  return (
    <div className="inline-flex flex-col items-start">
      {/* Línea superior decorativa */}
      <div className="mb-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-text-tertiary/50" />
        <span
          className={`font-mono uppercase tracking-[0.22em] text-text-secondary ${
            isLg ? "text-[11px]" : "text-[8px]"
          }`}
        >
          est. 2026
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>

      {/* Nombre principal */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-semibold uppercase tracking-[0.32em] text-text-secondary ${
            isLg ? "text-[15px]" : "text-[11px]"
          }`}
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          El
        </span>
        <span
          className={`font-bold uppercase text-text-tertiary ${
            isLg ? "text-[28px]" : "text-[18px]"
          }`}
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
        <span
          className={`font-mono uppercase tracking-[0.2em] text-text-secondary ${
            isLg ? "text-[10px]" : "text-[7px]"
          }`}
        >
          arquitectura · código · producto
        </span>
        <span className="h-px flex-1 bg-text-tertiary/50" />
      </div>
    </div>
  );
}
