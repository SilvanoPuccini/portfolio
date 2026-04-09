import Link from "next/link";
import type { ComponentType } from "react";

type CTAIcon = ComponentType<{ className?: string }>;

type CTAItem = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary";
  icon?: CTAIcon;
  trailingIcon?: CTAIcon;
};

export default function CTACluster({
  items,
  align = "start",
  size = "default",
}: {
  items: CTAItem[];
  align?: "start" | "center";
  size?: "default" | "large" | "compact";
}) {
  const sizeClass =
    size === "large"
      ? "px-8 py-4 text-base sm:text-lg"
      : size === "compact"
        ? "px-4 py-2.5 text-xs"
        : "px-5 py-3 text-sm";

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${align === "center" ? "sm:justify-center" : "sm:justify-start"}`}
    >
      {items.map((item) => {
        const className = `${item.variant === "secondary" ? "button-secondary" : "button-primary"} ${sizeClass} w-full sm:w-auto`;
        const Icon = item.icon;
        const TrailingIcon = item.trailingIcon;
        const content = (
          <>
            {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
            <span className={Icon ? "ml-0.5" : undefined}>{item.label}</span>
            {TrailingIcon ? <TrailingIcon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
          </>
        );

        if (item.external) {
          return (
            <a
              key={`${item.label}-${item.href}`}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={`${item.label}-${item.href}`} href={item.href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
