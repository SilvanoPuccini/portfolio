import type { Locale } from "@/lib/i18n";

const copy = {
  es: {
    eyebrow: "Credibilidad",
    title: "Evidencia de ejecución real",
    description:
      "Sin claims inflados. Solo proyectos, decisiones técnicas y resultados en producción.",
    cards: [
      {
        eyebrow: "Experiencia",
        title: "Experiencia en negocio real",
        body: "Más de una década en contextos comerciales y ejecución full stack orientada a resolver problemas concretos.",
      },
      {
        eyebrow: "Stack",
        title: "Stack enfocado en producto",
        body: "React · Next.js · TypeScript · Node.js · Python · Django. Arquitecturas pensadas para escalar, no solo para prototipos.",
      },
      {
        eyebrow: "Proyectos",
        title: "Proyectos en producción",
        body: "Casos publicados con decisiones técnicas visibles, foco en performance y lectura clara del resultado.",
      },
      {
        eyebrow: "Contacto",
        title: "Contacto directo",
        body: "Canal directo para conversar sobre plataformas, producto o automatización sin vueltas innecesarias.",
      },
    ],
  },
  en: {
    eyebrow: "Credibility",
    title: "Concrete signals, not promises.",
    description:
      "Experience, stack, and published work that support the profile with visible evidence.",
    cards: [
      {
        eyebrow: "Experience",
        title: "Experience in real business",
        body: "Background across commercial environments and full stack execution, focused on impact and solving concrete problems.",
      },
      {
        eyebrow: "Stack",
        title: "Product-focused stack",
        body: "React · Next.js · TypeScript · Node.js · Python · Django. Architectures designed to scale, not just to prototype.",
      },
      {
        eyebrow: "Projects",
        title: "Production projects",
        body: "Systems designed, built, and taken into real environments, with a focus on performance and usability.",
      },
      {
        eyebrow: "Contact",
        title: "Direct contact",
        body: "Available to collaborate on projects, platforms, and automation with real impact.",
      },
    ],
  },
} as const;

export default function TrustStrip({ locale }: { locale: Locale }) {
  const labels = copy[locale];

  return (
    <section className="bg-[linear-gradient(180deg,rgb(var(--surface)/0.18),rgb(var(--surface-dim)/0.26))] py-10 sm:py-12 lg:py-14">
      <div className="site-container">
        <div className="max-w-3xl space-y-5">
          <p className="technical-label">{labels.eyebrow}</p>
          <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.title}</h2>
          <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.description}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {labels.cards.map((card, index) => (
              <article
                key={`${card.eyebrow}-${card.title}`}
                className={`surface-subpanel px-5 py-5 sm:px-6 sm:py-6 ${index % 2 === 0 ? "bg-[rgb(var(--background)/0.14)]" : "bg-[rgb(var(--background)/0.1)]"}`}
              >
              <p className="technical-label">{card.eyebrow}</p>
              <h3 className="mt-3 text-xl font-semibold text-text-primary">{card.title}</h3>
              <p className="mt-3 text-base leading-7 text-text-primary">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
