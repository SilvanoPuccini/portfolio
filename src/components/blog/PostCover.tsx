interface Props {
  title: string;
  category: string;
  variant?: "card" | "featured";
  showRadar?: boolean;
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
};

const fallback = {
  gradient:
    "radial-gradient(ellipse at 25% 60%, rgba(0,212,212,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(5,102,217,0.14) 0%, transparent 50%)",
  dot: "rgba(0,212,212,0.35)",
  label: "text-brand-primary",
};

export function PostCover({ title, category, variant = "card", showRadar = false }: Props) {
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
      <div
        className="absolute inset-0"
        style={{ background: config.gradient }}
      />

      {/* Decorative top-right accent line */}
      <div className="absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
      <div className="absolute bottom-[44px] left-0 right-0 h-px bg-white/5" />

      {/* Corner accent dot */}
      <div
        className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dot }}
      />
      <div
        className="absolute right-8 top-5 h-1.5 w-1.5 rounded-full opacity-40"
        style={{ backgroundColor: config.dot }}
      />
      <div
        className="absolute right-11 top-5 h-1.5 w-1.5 rounded-full opacity-20"
        style={{ backgroundColor: config.dot }}
      />

      {/* El Radar centered label */}
      {showRadar && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/30"
          >
            El
          </span>
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
      )}

      {/* Bottom band — category + title */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
        <p
          className={`mb-1 font-mono text-[9px] uppercase tracking-[0.18em] ${config.label}`}
        >
          {category}
        </p>
        <p
          className={`font-semibold leading-tight text-white/80 ${
            isFeatured ? "text-sm" : "text-[11px]"
          }`}
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
