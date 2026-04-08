import Link from "next/link";
import type { getSiteContent } from "@/content/site";

type SiteContentView = ReturnType<typeof getSiteContent>;

export default function HeroEditorial({
  content,
}: {
  content: SiteContentView;
}) {
  const heroCtas = [
    content.home.ctas[0],
    content.home.ctas[1] ? { ...content.home.ctas[1], variant: "secondary" as const } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; variant?: "primary" | "secondary" }>;

  return (
    <section className="relative -mt-28 overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.72),rgb(var(--background)/0.92))] pt-28 sm:-mt-[7.5rem] sm:pt-[7.5rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgb(var(--brand-primary)/0.16),transparent_26%),radial-gradient(circle_at_82%_24%,rgb(var(--brand-secondary)/0.14),transparent_28%),linear-gradient(180deg,rgb(var(--surface-contrast)/0.18),transparent_34%)]" />

      <div className="relative mx-auto w-full max-w-[92rem] px-6 pb-18 pt-12 sm:px-8 sm:pb-22 sm:pt-16 lg:px-12 lg:pb-28 lg:pt-16 xl:pt-[4.5rem]">
        <div className="max-w-5xl xl:max-w-6xl">
          <div className="space-y-5 sm:space-y-6">
            <h1 className="font-display text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-text-primary sm:text-6xl lg:text-[5rem] xl:text-[5.75rem]">
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {content.home.title}
              </span>
            </h1>
            <p className="max-w-4xl text-2xl font-medium leading-tight text-text-primary text-balance sm:text-3xl lg:text-[2.7rem]">
              {content.home.subtitle}
            </p>
            <p className="max-w-4xl text-lg leading-8 text-text-secondary sm:text-xl sm:leading-9">
              {content.home.intro}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            {heroCtas[0] ? (
              <Link
                href={heroCtas[0].href}
                className="button-primary sm:min-w-[13.5rem]"
              >
                {heroCtas[0].label}
              </Link>
            ) : null}

            {heroCtas[1] ? (
              <Link
                href={heroCtas[1].href}
                className="button-secondary sm:min-w-[13.5rem]"
              >
                {heroCtas[1].label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
