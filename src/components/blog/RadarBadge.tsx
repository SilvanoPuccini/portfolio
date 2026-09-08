import { RadarDial } from "@/components/blog/RadarDial";

const WIDTH = 280;
const HEIGHT = 128;

export function RadarBadge({ scale = 1, className }: { scale?: number; className?: string }) {
  return (
    <div
      className={`relative inline-block shrink-0 text-brand-primary [[data-theme='light']_&]:text-brand-glow${className ? ` ${className}` : ""}`}
      style={{ width: WIDTH * scale, height: HEIGHT * scale }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: "left top" }}
      >
        <RadarDial className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <span className="mb-1 font-mono text-[7px] uppercase tracking-[0.24em] text-text-secondary">
            est. 2026
          </span>
          <div className="flex items-baseline gap-1.5 rounded-md bg-background/35 px-2 py-0.5 backdrop-blur-[1px]">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.32em] text-text-secondary"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              El
            </span>
            <span
              className="text-[18px] font-bold uppercase text-text-tertiary"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif", letterSpacing: "0.14em" }}
            >
              Radar
            </span>
          </div>
          <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.2em] text-text-secondary">
            arquitectura · código · producto
          </span>
        </div>
      </div>
    </div>
  );
}
