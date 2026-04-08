import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function PageHero({
  eyebrow,
  title,
  description,
  aside,
  sectionClassName,
  containerClassName,
  contentClassName,
  surface = "contained",
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  sectionClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  surface?: "contained" | "plain";
}) {
  return (
    <section className={sectionClassName}>
      <div className={cn("site-container section-spacing pb-10 sm:pb-12", containerClassName)}>
        <div
          className={cn(
            surface === "contained" && "surface-section bg-editorial-texture px-5 py-8 sm:px-8 sm:py-12 lg:px-14 lg:py-16",
            surface === "plain" && "bg-editorial-texture px-0 py-0",
            contentClassName,
          )}
        >
          <div className="editorial-grid items-end gap-8 md:gap-10 lg:gap-14">
            <div className="no-line-stack max-w-3xl">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="display-title text-balance">{title}</h1>
              <div className="max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">{description}</div>
            </div>

            {aside ? <div className="surface-panel px-5 py-6 sm:px-7 sm:py-8 lg:px-8">{aside}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
