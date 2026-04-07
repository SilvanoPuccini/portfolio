import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactMethod = {
  label: string;
  href: string;
  icon: LucideIcon;
  accent?: "primary" | "secondary";
};

export default function ContactMethods({
  items,
}: {
  items: readonly ContactMethod[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <a
            key={`${item.label}-${item.href}`}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            className="surface-panel interactive-surface group flex aspect-square flex-col justify-between border border-outline-ghost/10 px-5 py-5"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-ghost/10 bg-surface-dim/80 transition-transform duration-300 group-hover:scale-[1.03]",
                item.accent === "secondary" ? "text-brand-secondary" : "text-brand-primary",
              )}
            >
              <Icon size={20} strokeWidth={1.75} />
            </div>

            <div className="space-y-3">
              <ArrowUpRight className="text-text-tertiary transition-colors group-hover:text-text-primary" size={18} strokeWidth={1.75} />
              <p className="font-display text-lg uppercase tracking-tight text-text-primary sm:text-xl">{item.label}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
