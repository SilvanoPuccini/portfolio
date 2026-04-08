import type { ComponentType, SVGProps } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactMethod = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: string | number; strokeWidth?: string | number }>;
  accent?: "primary" | "secondary";
};

export default function ContactMethods({
  items,
}: {
  items: readonly ContactMethod[];
}) {
  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <a
            key={`${item.label}-${item.href}`}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            className="surface-panel interactive-surface group flex aspect-square min-h-[7.5rem] flex-col justify-between border border-outline-ghost/10 px-4 py-4 sm:min-h-[8rem] sm:px-4.5 sm:py-4.5"
          >
            <div
              className={cn(
                "flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-surface-dim/80 transition-transform duration-300 group-hover:scale-[1.03] sm:h-10 sm:w-10",
                item.accent === "secondary" ? "text-brand-secondary" : "text-brand-primary",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
            </div>

            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-[0.92rem] uppercase tracking-tight text-text-primary sm:text-[0.98rem]">{item.label}</p>
              <ArrowUpRight className="shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary" size={17} strokeWidth={1.75} />
            </div>
          </a>
        );
      })}
    </div>
  );
}
