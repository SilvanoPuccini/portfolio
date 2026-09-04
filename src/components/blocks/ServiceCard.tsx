import CTACluster from "@/components/site/CTACluster";
import { cn } from "@/lib/utils";

type ServiceReference = {
  label: string;
  value: string;
  detail: string;
};

type ServiceCardLink = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary";
};

export default function ServiceCard({
  eyebrow,
  title,
  description,
  proofLabel,
  proofPoints,
  referencesLabel,
  references,
  links,
  variant = "standard",
}: {
  eyebrow: string;
  title: string;
  description: string;
  proofLabel: string;
  proofPoints: readonly string[];
  referencesLabel: string;
  references: readonly ServiceReference[];
  links?: readonly ServiceCardLink[];
  variant?: "feature" | "standard";
}) {
  const isFeature = variant === "feature";

  return (
    <article
      className={cn(
        "surface-panel no-line-stack overflow-hidden px-6 py-7 sm:px-7",
        isFeature && "bg-editorial-texture relative",
      )}
    >
      {isFeature ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(138,235,255,0.1),transparent_34%),radial-gradient(circle_at_80%_24%,rgba(5,102,217,0.14),transparent_28%)]" />
      ) : null}

      <div className="relative no-line-stack">
        <div>
          <p className="technical-label">{eyebrow}</p>
          <h3 className={cn("mt-4 font-semibold text-text-primary", isFeature ? "max-w-3xl section-title-sm" : "card-title")}>{title}</h3>
          <p className={cn("mt-4 text-text-secondary", isFeature ? "max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" : "text-sm leading-6 sm:text-base sm:leading-7")}>{description}</p>
        </div>

        <div>
          <p className="technical-label">{proofLabel}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {proofPoints.map((item) => (
              <li
                key={item}
                className="rounded-pill border border-outline-ghost/15 bg-surface-dim/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="technical-label">{referencesLabel}</p>
          <div className={cn("mt-4 grid gap-4", isFeature ? "lg:grid-cols-3" : "md:grid-cols-2")}>
            {references.map((reference) => (
              <div key={`${reference.label}-${reference.value}`} className="surface-subpanel px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{reference.label}</p>
                <p className="mt-3 text-base font-medium leading-7 text-text-primary">{reference.value}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{reference.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {links?.length ? <CTACluster items={[...links]} /> : null}
      </div>
    </article>
  );
}
