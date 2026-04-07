import type { ReactNode } from "react";

export default function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="site-container pb-10 sm:pb-12 lg:pb-14">
      <div className="surface-section px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
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
    </section>
  );
}
