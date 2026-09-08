import { RadarDial } from "@/components/blog/RadarDial";

const WIDTH = 300;
const HEIGHT = 116;

export function RadarBadge({ scale = 1, className }: { scale?: number; className?: string }) {
  return (
    <div
      className={`relative inline-block max-w-full shrink-0 text-brand-primary [[data-theme='light']_&]:text-brand-glow${className ? ` ${className}` : ""}`}
      style={{ width: WIDTH * scale, height: HEIGHT * scale }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: "left top" }}
      >
        <div className="flex h-full items-center gap-4">
          <RadarDial className="pointer-events-none h-[116px] w-[116px] shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary">
              est. 2026
            </span>
            <div className="mt-1 flex items-baseline gap-2 whitespace-nowrap">
              <span
                className="text-[13px] font-semibold uppercase tracking-[0.2em] text-text-secondary"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                El
              </span>
              <span
                className="text-[27px] font-bold uppercase leading-none text-text-primary"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif", letterSpacing: "0.08em" }}
              >
                Radar
              </span>
            </div>
            <span className="mt-2 block whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.13em] text-text-secondary">
              arquitectura · código · producto
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
