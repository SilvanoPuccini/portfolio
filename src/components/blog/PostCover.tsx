"use client";

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
const techIcons: Record<string, { color: string; icon: React.ReactNode }> = {
  React: {
    color: "#61DAFB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  TypeScript: {
    color: "#3178C6",
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="white" fontFamily="monospace">TS</text>
      </svg>
    ),
  },
  Angular: {
    color: "#DD0031",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M12 2L3 6.2l1.4 12.6L12 22l7.6-3.2L21 6.2z" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M12 6.5L8.2 16h1.7l.8-2h2.6l.8 2h1.7L12 6.5z" fill="currentColor" />
        <path d="M10.3 12.5l1.7-4.5 1.7 4.5h-3.4z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
  "Next.js": {
    color: "#FFFFFF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M8 16V8l8 9V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  Django: {
    color: "#44B78B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="3" y="18" width="4" height="4" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="9" y="2" width="4" height="8" rx="1" fill="currentColor" />
        <path d="M9 12h4a4 4 0 0 1 0 8H9v-8z" fill="currentColor" />
      </svg>
    ),
  },
  Python: {
    color: "#3776AB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M12 2C8.5 2 7 3.5 7 5v2h5v1H5.5C3.5 8 2 9.5 2 12s1.5 4 3.5 4H7v-2.5C7 12 8.5 11 10 11h4c1.5 0 3-1 3-3V5c0-1.5-1.5-3-5-3zm-1 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="currentColor" />
        <path d="M12 22c3.5 0 5-1.5 5-3v-2h-5v-1h6.5c2 0 3.5-1.5 3.5-4s-1.5-4-3.5-4H17v2.5C17 12 15.5 13 14 13h-4c-1.5 0-3 1-3 3v3c0 1.5 1.5 3 5 3zm1-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="currentColor" />
      </svg>
    ),
  },
  "React + TypeScript": {
    color: "#61DAFB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
};

function KeywordCenter({ keyword, isFeatured }: { keyword: string; isFeatured: boolean }) {
  // ── Special case: El Radar ──────────────────────────────────
  if (keyword === "El Radar") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">El</span>
        <span
          className="font-bold uppercase tracking-[0.18em] text-white/60"
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: isFeatured ? "2.2rem" : "1.2rem",
            lineHeight: 1,
          }}
        >
          Radar
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 mt-1">
          arquitectura · código · producto
        </span>
      </div>
    );
  }

  // ── Known tech with icon ─────────────────────────────────────
  const tech = techIcons[keyword];
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
            fontSize: isFeatured ? "1.1rem" : "0.65rem",
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
        style={{ fontSize: isFeatured ? "1.25rem" : "0.7rem" }}
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
