import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPanel({
  icon: Icon,
  eyebrow,
  title,
  detail,
  href,
  accent = "primary",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail?: string;
  href?: string;
  accent?: "primary" | "secondary";
}) {
  const panel = (
    <div className="surface-panel interactive-surface group flex items-start gap-4 border border-outline-ghost/10 px-5 py-5 sm:px-6">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-outline-ghost/10 bg-surface-dim/80 transition-transform duration-300 group-hover:scale-[1.03]",
          accent === "secondary" ? "text-brand-primary" : "text-brand-secondary",
        )}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{eyebrow}</p>
        <p className="mt-2 text-base font-semibold leading-7 text-text-primary sm:text-lg">{title}</p>
        {detail ? <p className="mt-1 text-sm leading-6 text-text-secondary">{detail}</p> : null}
      </div>

      {href ? (
        <div className="mt-1 text-text-tertiary transition-colors group-hover:text-text-primary">
          <ArrowUpRight size={18} strokeWidth={1.75} />
        </div>
      ) : null}
    </div>
  );

  if (!href) {
    return panel;
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="block rounded-2xl"
    >
      {panel}
    </a>
  );
}
