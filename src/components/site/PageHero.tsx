import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  aside,
  sectionClassName,
  containerClassName,
  contentClassName,
  layoutClassName,
  bodyClassName,
  titleClassName,
  subtitleClassName,
  descriptionClassName,
  asideClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  sectionClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  layoutClassName?: string;
  bodyClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  descriptionClassName?: string;
  asideClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative -mt-28 overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.72),rgb(var(--background)/0.92))] pt-28 sm:-mt-[7.5rem] sm:pt-[7.5rem]",
        sectionClassName,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgb(var(--brand-primary)/0.16),transparent_26%),radial-gradient(circle_at_82%_24%,rgb(var(--brand-secondary)/0.14),transparent_28%),linear-gradient(180deg,rgb(var(--surface-contrast)/0.18),transparent_34%)]" />

      <div
        className={cn(
          "relative mx-auto w-full max-w-[92rem] px-6 pb-18 pt-12 sm:px-8 sm:pb-22 sm:pt-16 lg:px-12 lg:pb-28 lg:pt-16 xl:pt-[4.5rem]",
          containerClassName,
        )}
      >
        <div
          className={cn(
            "grid gap-10 lg:min-h-[30rem] lg:items-start xl:min-h-[32rem] xl:gap-16",
            aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)]" : "max-w-5xl xl:max-w-6xl",
            layoutClassName,
          )}
        >
          <div className={cn("max-w-5xl xl:max-w-6xl", contentClassName)}>
            <div className={cn("space-y-5 sm:space-y-6", bodyClassName)}>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1
                className={cn(
                  "font-display text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-text-primary text-balance sm:text-6xl lg:text-[5rem] xl:text-[5.75rem]",
                  titleClassName,
                )}
              >
                {title}
              </h1>

              {subtitle ? (
                <div
                  className={cn(
                    "max-w-4xl text-2xl font-medium leading-tight text-text-primary text-balance sm:text-3xl lg:text-[2.7rem]",
                    subtitleClassName,
                  )}
                >
                  {subtitle}
                </div>
              ) : null}

              {description ? (
                <div
                  className={cn(
                    "max-w-4xl text-lg leading-8 text-text-secondary sm:text-xl sm:leading-9",
                    descriptionClassName,
                  )}
                >
                  {description}
                </div>
              ) : null}
            </div>

            {actions ? <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">{actions}</div> : null}
          </div>

          {aside ? <aside className={cn("relative self-start", asideClassName)}>{aside}</aside> : null}
        </div>
      </div>
    </section>
  );
}
