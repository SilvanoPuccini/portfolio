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
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  surface?: "contained" | "plain";
  id?: string;
}) {
  return (
    <section id={id} className={sectionClassName}>
      <div className={cn("site-container pb-10 sm:pb-12 lg:pb-14", containerClassName)}>
        <div
          className={cn(
            surface === "contained" && "surface-section px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12",
            surface === "plain" && "px-0 py-0",
            contentClassName,
          )}
        >
          {eyebrow || title || description ? (
            <div className="mb-12 max-w-3xl">
              {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
              {title ? <h2 className="mt-4 section-title">{title}</h2> : null}
              {description ? <div className="mt-5 section-lede">{description}</div> : null}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}
