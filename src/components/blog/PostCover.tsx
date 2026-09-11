"use client";

import { TECH_ICONS, VERSUS_PATTERN, parseVersus } from "./tech-icons";

interface Props {
  title: string;
  category: string;
  variant?: "card" | "featured";
  keyword?: string;
}

const categoryConfig: Record<string, { gradient: string; dot: string; label: string }> = {
  Performance: {
    gradient:
      "radial-gradient(ellipse at 25% 60%, rgba(34,197,94,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(0,212,212,0.14) 0%, transparent 50%)",
    dot: "rgba(34,197,94,0.35)",
    label: "text-green-400",
  },
  Producto: {
    gradient:
      "radial-gradient(ellipse at 25% 60%, rgba(168,85,247,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.14) 0%, transparent 50%)",
    dot: "rgba(168,85,247,0.35)",
    label: "text-purple-400",
  },
  Automatización: {
    gradient:
      "radial-gradient(ellipse at 25% 60%, rgba(245,158,11,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.12) 0%, transparent 50%)",
    dot: "rgba(245,158,11,0.35)",
    label: "text-amber-400",
  },
  Editorial: {
    gradient:
      "radial-gradient(ellipse at 25% 60%, rgba(0,212,212,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(5,102,217,0.14) 0%, transparent 50%)",
    dot: "rgba(0,212,212,0.35)",
    label: "text-brand-primary",
  },
  Criterio: {
    gradient:
      "radial-gradient(ellipse at 25% 60%, rgba(56,189,248,0.24) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(2,132,199,0.16) 0%, transparent 50%)",
    dot: "rgba(56,189,248,0.35)",
    label: "text-sky-400",
  },
};

const fallback = {
  gradient:
    "radial-gradient(ellipse at 25% 60%, rgba(0,212,212,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(5,102,217,0.14) 0%, transparent 50%)",
  dot: "rgba(0,212,212,0.35)",
  label: "text-brand-primary",
};

// ── Tech icons ────────────────────────────────────────────────
// Add new techs here. color = accent color on dark bg.
// icon = inline SVG (viewBox 0 0 24 24, uses currentColor).


/**
 * Portada comparativa: dos filas de dos, con el "vs" en el medio.
 *
 * Un post que compara cuatro herramientas con el logo de una sola desorienta:
 * el lector cree que el post es sobre esa. Se activa desde el frontmatter con
 * un keyword del tipo "React vs Angular / Vite vs Next.js", así cualquier post
 * futuro puede comparar lo suyo sin tocar este archivo.
 */
function VersusCenter({ keyword, isFeatured }: { keyword: string; isFeatured: boolean }) {
  const rows = parseVersus(keyword);
  const size = isFeatured ? 44 : 26;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ gap: isFeatured ? 20 : 12, paddingBottom: isFeatured ? 34 : 26 }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center" style={{ gap: isFeatured ? 22 : 13 }}>
          {row.map((name, index) => {
            const tech = TECH_ICONS[name];
            return (
              <div key={name} className="flex items-center" style={{ gap: isFeatured ? 22 : 13 }}>
                {index > 0 && (
                  <span className="font-mono uppercase tracking-[0.18em] text-white/25"
                    style={{ fontSize: isFeatured ? "0.72rem" : "0.5rem" }}>
                    vs
                  </span>
                )}
                {tech ? (
                  <div style={{ width: size, height: size, color: tech.color, opacity: 0.85 }}>
                    {tech.icon}
                  </div>
                ) : (
                  <span className="font-mono text-white/45"
                    style={{ fontSize: isFeatured ? "1rem" : "0.7rem" }}>{name}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function KeywordCenter({ keyword, isFeatured }: { keyword: string; isFeatured: boolean }) {
  // Un keyword con "vs" pide la portada comparativa.
  if (VERSUS_PATTERN.test(keyword)) {
    return <VersusCenter keyword={keyword} isFeatured={isFeatured} />;
  }

  // ── Special case: El Radar ──────────────────────────────────
  if (keyword === "El Radar") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
        {/* Radar circles */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g opacity="0.3">
            <circle cx="200" cy="150" r="40" stroke="#00d4d4" strokeWidth="1" strokeDasharray="5 5" />
            <circle cx="200" cy="150" r="80" stroke="#00d4d4" strokeWidth="0.75" />
            <circle cx="200" cy="150" r="120" stroke="#00d4d4" strokeWidth="0.75" strokeDasharray="10 10" />
            <circle cx="200" cy="150" r="165" stroke="#00d4d4" strokeWidth="0.5" />
            <line x1="200" y1="150" x2="316" y2="68" stroke="#00d4d4" strokeWidth="1.5" opacity="0.5" />
            <line x1="200" y1="150" x2="84" y2="232" stroke="#00d4d4" strokeWidth="0.75" opacity="0.2" />
          </g>
        </svg>
        <span className="relative z-10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">El</span>
        <span
          className="relative z-10 font-bold uppercase tracking-[0.18em] text-white/60"
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: isFeatured ? "2.4rem" : "1.5rem",
            lineHeight: 1,
          }}
        >
          Radar
        </span>
        <span className="relative z-10 font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 mt-1">
          arquitectura · código · producto
        </span>
      </div>
    );
  }

  // ── Known tech with icon ─────────────────────────────────────
  const tech = TECH_ICONS[keyword];
  if (tech) {
    const iconSize = isFeatured ? 52 : 32;
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
        style={{ color: tech.color }}
      >
        <div style={{ width: iconSize, height: iconSize, opacity: 0.7 }}>
          {tech.icon}
        </div>
        <span
          className="font-semibold tracking-[0.12em]"
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: isFeatured ? "1.3rem" : "0.85rem",
            color: tech.color,
            opacity: 0.65,
            lineHeight: 1,
          }}
        >
          {keyword}
        </span>
      </div>
    );
  }

  // ── Generic keyword (domain, text, etc.) ────────────────────
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span
        className="font-mono tracking-[0.14em] text-white/40"
        style={{ fontSize: isFeatured ? "1.45rem" : "0.9rem" }}
      >
        {keyword}
      </span>
    </div>
  );
}

export function PostCover({ title, category, variant = "card", keyword }: Props) {
  const config = categoryConfig[category] ?? fallback;
  const isFeatured = variant === "featured";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0b12]">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Category gradient glow */}
      <div className="absolute inset-0" style={{ background: config.gradient }} />

      {/* Decorative lines */}
      <div className="absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
      <div className="absolute bottom-[44px] left-0 right-0 h-px bg-white/5" />

      {/* Corner accent dots */}
      <div className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
      <div className="absolute right-8 top-5 h-1.5 w-1.5 rounded-full opacity-40" style={{ backgroundColor: config.dot }} />
      <div className="absolute right-11 top-5 h-1.5 w-1.5 rounded-full opacity-20" style={{ backgroundColor: config.dot }} />

      {/* Centered keyword */}
      {keyword && <KeywordCenter keyword={keyword} isFeatured={isFeatured} />}

      {/* Bottom band — category + title */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
        <p className={`mb-1 font-mono text-[9px] uppercase tracking-[0.18em] ${config.label}`}>
          {category}
        </p>
        <p
          className={`font-semibold leading-tight text-white/80 ${isFeatured ? "text-sm" : "text-[11px]"}`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
