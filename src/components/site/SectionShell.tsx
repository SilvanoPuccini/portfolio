import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function SectionShell({
  eyebrow,
  title,
  description,
  children,
  sectionClassName,
  containerClassName,
  contentClassName,
  surface = "contained",
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  surface?: "contained" | "plain";
}) {
  return (
    <section className={sectionClassName}>
      <div className={cn("site-container pb-10 sm:pb-12 lg:pb-14", containerClassName)}>
        <div
          className={cn(
            surface === "contained" && "surface-section px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12",
            surface === "plain" && "px-0 py-0",
            contentClassName,
          )}
        >
          {eyebrow || title || description ? (
            <div className="mb-10 max-w-3xl no-line-stack">
              {eyebrow ? <p className="technical-label">{eyebrow}</p> : null}
              {title ? <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{title}</h2> : null}
              {description ? (
                <div className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                  {description}
                </div>
              ) : null}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}
