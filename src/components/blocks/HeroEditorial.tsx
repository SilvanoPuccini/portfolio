import Link from "next/link";
import PageHero from "@/components/site/PageHero";
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
    <PageHero
      title={<span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">{content.home.title}</span>}
      subtitle={<p>{content.home.subtitle}</p>}
      description={<p>{content.home.intro}</p>}
      actions={
        <>
          {heroCtas[0] ? (
            <Link href={heroCtas[0].href} className="button-primary sm:min-w-[13.5rem]">
              {heroCtas[0].label}
            </Link>
          ) : null}

          {heroCtas[1] ? (
            <Link href={heroCtas[1].href} className="button-secondary sm:min-w-[13.5rem]">
              {heroCtas[1].label}
            </Link>
          ) : null}
        </>
      }
    />
  );
}
