import { useId } from "react";

export function RadarBadge({ scale = 1, className }: { scale?: number; className?: string }) {
  const uid = useId();
  return (
    <div
      className={`relative inline-flex flex-col items-center${className ? ` ${className}` : ""}`}
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
        <defs>
          {/* Gradiente radial para el sector de barrido — emana desde el centro */}
          <radialGradient id={`${uid}-sweep`} gradientUnits="userSpaceOnUse" cx="140" cy="40" r="95">
            <stop offset="0%"   stopColor="#00d4d4" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00d4d4" stopOpacity="0" />
          </radialGradient>
          {/* Gradiente radial de fondo — profundidad sutil */}
          <radialGradient id={`${uid}-bg`} gradientUnits="userSpaceOnUse" cx="140" cy="40" r="120">
            <stop offset="0%"   stopColor="#00d4d4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00d4d4" stopOpacity="0" />
          </radialGradient>
          {/* Blur suave para el glow del centro */}
          <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Blur para el sector de barrido */}
          <filter id={`${uid}-sweep-blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Fondo radial — profundidad */}
        <circle cx="140" cy="40" r="120" fill={`url(#${uid}-bg)`} />

        {/* Trail espiral — sectores de 30° cada uno, opacidad decreciente hacia atrás.
            Centro en (140,40). Ángulos en convención estándar (counterclockwise desde eje X).
            Sweep line en α=45°. Trailing va hacia α=75°, 105°, 135° (detrás de la aguja).
            Cada sector: desde αStart clockwise → αEnd (sweep-flag=1 en SVG).
            Sector C (far): α=135°→105°  pts: (76,-24)→(117,-47) */}
        <path
          d="M 140 40 L 76 -24 A 90 90 0 0 1 117 -47 Z"
          fill={`url(#${uid}-sweep)`}
          opacity="0.18"
          filter={`url(#${uid}-sweep-blur)`}
        />
        {/* Sector B (mid): α=105°→75°  pts: (117,-47)→(163,-47) */}
        <path
          d="M 140 40 L 117 -47 A 90 90 0 0 1 163 -47 Z"
          fill={`url(#${uid}-sweep)`}
          opacity="0.44"
          filter={`url(#${uid}-sweep-blur)`}
        />
        {/* Sector A (main glow): α=75°→45°  pts: (163,-47)→(204,-24) */}
        <path
          d="M 140 40 L 163 -47 A 90 90 0 0 1 204 -24 Z"
          fill={`url(#${uid}-sweep)`}
          filter={`url(#${uid}-sweep-blur)`}
        />

        {/* Círculos concéntricos — ratio 1:2:3:4 fiel al SVG de referencia */}
        <g opacity="0.4">
          <circle cx="140" cy="40" r="30"  stroke="#00d4d4" strokeWidth="0.75" strokeDasharray="3 3" />
          <circle cx="140" cy="40" r="60"  stroke="#00d4d4" strokeWidth="0.5" />
          <circle cx="140" cy="40" r="90"  stroke="#00d4d4" strokeWidth="0.5" strokeDasharray="6 6" />
          <circle cx="140" cy="40" r="120" stroke="#00d4d4" strokeWidth="0.3" />
        </g>

        {/* Línea de barrido — bloom multicapa para efecto glow */}
        <line x1="140" y1="40" x2="225" y2="-45" stroke="#00d4d4" strokeWidth="5"    opacity="0.04" />
        <line x1="140" y1="40" x2="225" y2="-45" stroke="#00d4d4" strokeWidth="2"    opacity="0.10" />
        <line x1="140" y1="40" x2="225" y2="-45" stroke="#00d4d4" strokeWidth="0.75" opacity="0.55" />

        {/* Línea secundaria — offset, baja opacidad */}
        <line x1="120" y1="63" x2="50" y2="133" stroke="#00d4d4" strokeWidth="0.4" opacity="0.18" />

        {/* Punto central — origen del radar con halo */}
        <circle cx="140" cy="40" r="4" fill="#00d4d4" opacity="0.15" filter={`url(#${uid}-glow)`} />
        <circle cx="140" cy="40" r="1.8" fill="#00d4d4" opacity="0.9" />

        {/* Blip pulsante — objetivo detectado en zona de barrido.
            r=60 circle, α=60°: (170,-12). Justo en el sector main glow, cerca de la aguja. */}
        <circle cx="170" cy="-12" r="6" fill="none" stroke="#00d4d4" strokeWidth="0.7">
          <animate attributeName="r" values="2;9;2" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.65;0;0.65" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="170" cy="-12" r="2" fill="#00d4d4" filter={`url(#${uid}-glow)`}>
          <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* est. 2026 — sin líneas decorativas */}
      <div className="relative z-10 mb-1">
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-text-secondary">
          est. 2026
        </span>
      </div>

      {/* El Radar */}
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

      {/* tagline — sin líneas decorativas */}
      <div className="relative z-10 mt-1">
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-text-secondary">
          arquitectura · código · producto
        </span>
      </div>
    </div>
  );
}
