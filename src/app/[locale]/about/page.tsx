import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import profileImage from "@/assets/images/profile.png";
import fotoColorImage from "@/assets/images/foto_perfil_ok01.png";
import fotoGrisImage from "@/assets/images/foto_perfil_ok_black.png";
import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { StackSection } from "@/components/about/StackSection";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    hero: {
      badge: "10+ años en negocio, ventas y coordinación",
      visualEyebrow: "Perfil híbrido",
      visualTitle: "Full stack con lectura comercial y foco en producto.",
      visualBody:
        "Interfaces, arquitectura y decisiones de negocio trabajadas dentro del mismo sistema visual que Home.",
      facts: {
        role: "Perfil",
        availability: "Disponibilidad",
        location: "Base",
        languages: "Idiomas",
      },
      ctas: {
        cv: "Descargar CV",
        contact: "Ir a contacto",
      },
    },
    philosophy: {
      eyebrow: "Filosofía de trabajo",
      paragraphs: [
        "Ingeniería, criterio de producto y claridad en la misma capa.",
        "Construyo productos combinando desarrollo técnico, sensibilidad editorial y lectura de negocio real.",
        "No separo frontend, backend o negocio: todo forma parte del mismo sistema.",
      ],
      strategyEyebrow: "Estrategia",
      strategyTitle: "Cada decisión técnica responde a producto.",
      strategyBody:
        "No escribo código aislado: construyo sistemas que funcionan en contexto real.",
    },
    stack: {
      eyebrow: "Base técnica y stack",
      description:
        "Trabajo con tecnologías modernas orientadas a producto, priorizando escalabilidad, claridad y mantenimiento.",
      closing:
        "Uso herramientas de automatización e IA cuando aportan valor real, no como tendencia.",
    },
    professionalContext: {
      eyebrow: "Contexto profesional",
      paragraphs: [
        "Mi perfil no nace solo desde el desarrollo.",
        "Antes de entrar al mundo tech, construí más de 10 años de experiencia en entornos comerciales reales.",
        "Trabajé en ventas, gestión de cuentas y coordinación de equipos, entendiendo cómo operan los negocios desde adentro.",
        "Hoy aplico esa experiencia en el desarrollo de productos digitales, tomando decisiones técnicas con criterio de producto y contexto real.",
      ],
    },
    trajectory: {
      eyebrow: "Trayectoria y evolución",
    },
    experienceSection: {
      eyebrow: "Experiencia profesional",
    },
    educationSection: {
      eyebrow: "Formación",
    },
    strengths: {
      eyebrow: "FORTALEZAS",
      items: [
        "Resolución de problemas con foco en producto",
        "Experiencia en negocio real aplicada a tecnología",
        "Arquitecturas escalables y mantenibles",
        "Comunicación clara entre negocio y desarrollo",
        "Automatización aplicada a casos reales",
      ],
    },
    vision: {
      eyebrow: "Visión",
      title: "Entiendo el desarrollo como construcción de sistemas.",
      leadIn: "Mi enfoque combina:",
      body: "Busco crear soluciones que no solo funcionen, sino que tengan sentido dentro del negocio.",
      points: ["ingeniería", "producto", "contexto real"],
    },
    closing: {
      eyebrow: "Cierre",
      title: "Disponible para construir productos reales.",
      description:
        "Si estás desarrollando una plataforma, sistema o solución con impacto, podemos trabajar juntos.",
      primary: "Contactar",
      secondary: "Ver proyectos",
    },
  },
  en: {
    hero: {
      badge: "10+ years in business, sales, and coordination",
      visualEyebrow: "Hybrid profile",
      visualTitle: "Full stack with commercial awareness and product focus.",
      visualBody:
        "Interfaces, architecture, and business decisions shaped within the same visual system as Home.",
      facts: {
        role: "Profile",
        availability: "Availability",
        location: "Based in",
        languages: "Languages",
      },
      ctas: {
        cv: "Download CV",
        contact: "Go to contact",
      },
    },
    philosophy: {
      eyebrow: "Work philosophy",
      paragraphs: [
        "Engineering, product judgment, and clarity in the same layer.",
        "I build products by combining technical development, editorial sensitivity, and real business awareness.",
        "I do not separate frontend, backend, or business: everything is part of the same system.",
      ],
      strategyEyebrow: "Strategy",
      strategyTitle: "Every technical decision answers to the product.",
      strategyBody:
        "I do not write isolated code: I build systems that work in a real context.",
    },
    stack: {
      eyebrow: "Technical foundation and stack",
      description:
        "I work with modern product-oriented technologies, prioritizing scalability, clarity, and maintainability.",
      closing:
        "I use automation and AI tools when they provide real value, not as a trend.",
    },
    professionalContext: {
      eyebrow: "Professional context",
      paragraphs: [
        "My profile does not come only from development.",
        "Before moving into tech, I built more than 10 years of experience in real commercial environments.",
        "I worked in sales, account management, and team coordination, understanding how businesses operate from the inside.",
        "Today I apply that experience to digital product development, making technical decisions with product judgment and real context.",
      ],
    },
    trajectory: {
      eyebrow: "Journey and evolution",
    },
    experienceSection: {
      eyebrow: "Professional experience",
    },
    educationSection: {
      eyebrow: "Education",
    },
    strengths: {
      eyebrow: "STRENGTHS",
      items: [
        "Problem solving with product focus",
        "Real business experience applied to technology",
        "Scalable and maintainable architectures",
        "Clear communication between business and development",
        "Automation applied to real use cases",
      ],
    },
    vision: {
      eyebrow: "Vision",
      title: "I understand development as systems building.",
      leadIn: "My approach combines:",
      body: "I aim to create solutions that do not just work, but also make sense within the business.",
      points: ["engineering", "product", "real context"],
    },
    closing: {
      eyebrow: "Closing",
      title: "Available to build real products.",
      description:
        "If you are building a platform, system, or solution with impact, we can work together.",
      primary: "Contact",
      secondary: "View projects",
    },
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);

  return {
    title: `${content.metadata.siteName} | ${content.about.eyebrow}`,
    description: content.about.summary[0],
  };
}

export default async function AboutPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const heroContent =
    currentLocale === "es"
      ? {
          eyebrow: "SOBRE MÍ",
          title: "Perfil técnico con lectura de negocio y ejecución real",
          body: [
            "Full Stack Developer enfocado en construir productos digitales funcionales, donde la tecnología impacta directamente en el negocio.",
            "Trabajo en plataformas, automatización y sistemas que operan en producción.",
          ],
          imageAlt: "Retrato de Silvano Puccini.",
          badge: [
            "+10 años",
            "Experiencia en negocio y entorno comercial real",
          ],
        }
      : {
          eyebrow: "ABOUT ME",
          title: "Technical profile with business awareness and real execution.",
          body: [
            "Full Stack Developer focused on building functional digital products where technology directly impacts the business.",
            "I work on platforms, automation, and systems that run in production.",
          ],
          imageAlt: "Portrait of Silvano Puccini.",
          badge: [
            "+10 years",
            "Business experience in real commercial environments",
          ],
        };

  const trajectoryItems =
    currentLocale === "es"
      ? [
          {
            label: "Presente",
            title: "Full Stack Developer",
            detail:
              "Desarrollo de productos digitales, automatización y sistemas orientados a negocio.",
          },
          {
            label: "Formación técnica (actual)",
            title: "Tecnicatura en Desarrollo de Aplicaciones Informáticas (3º año)",
            detail: "Base académica en curso con foco en desarrollo y sistemas.",
          },
          {
            label: "Formación especializada",
            title: "Máster en Desarrollo Web Full Stack — Conquer Blocks",
            detail: "Especialización intensiva en desarrollo web full stack.",
          },
          {
            label: "Etapa anterior",
            title: "Experiencia comercial (más de 10 años)",
            detail:
              "Ventas, operaciones, gestión de cuentas y coordinación de equipos en empresas reales.",
          },
        ]
      : [
          {
            label: "Present",
            title: "Full Stack Developer",
            detail:
              "Development of digital products, automation, and business-oriented systems.",
          },
          {
            label: "Technical education (current)",
            title: "Application Development degree (3rd year)",
            detail: "Ongoing academic foundation focused on development and systems.",
          },
          {
            label: "Specialized training",
            title: "Full Stack Web Development Master’s — Conquer Blocks",
            detail: "Intensive specialization in full stack web development.",
          },
          {
            label: "Previous stage",
            title: "Commercial experience (10+ years)",
            detail:
              "Sales, operations, account management, and team coordination in real companies.",
          },
        ];

  const experienceCards = [...content.about.experience].reverse();

  return (
    <>
      <PageHero
        eyebrow={heroContent.eyebrow}
        title={heroContent.title}
        bodyClassName="space-y-7 sm:space-y-8"
        subtitle={<p>{heroContent.body[0]}</p>}
        description={
          <div className="space-y-3 sm:space-y-4">
            {heroContent.body.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        }
        actions={
          <>
            <Link href={content.metadata.cv.downloadHref} className="button-primary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.hero.ctas.cv}
            </Link>
            <Link href={`/${currentLocale}/contact`} className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.hero.ctas.contact}
            </Link>
          </>
        }
        asideClassName="pt-2 lg:pt-4"
        aside={
          <>
            <div className="relative aspect-square overflow-hidden rounded-full bg-[#060e18] shadow-[0_22px_48px_rgba(2,8,23,0.22)] sm:aspect-square lg:min-h-0 lg:w-full">
              {/* Dark mode — color */}
              <Image
                src={fotoColorImage}
                alt={heroContent.imageAlt}
                fill
                priority
                sizes="(min-width: 1280px) 28rem, (min-width: 1024px) 32vw, (min-width: 640px) 60vw, 100vw"
                className="object-cover object-[center_20%] hidden dark:block"
              />
              {/* Light mode — B&W */}
              <Image
                src={fotoGrisImage}
                alt={heroContent.imageAlt}
                fill
                priority
                sizes="(min-width: 1280px) 28rem, (min-width: 1024px) 32vw, (min-width: 640px) 60vw, 100vw"
                className="object-cover object-[center_20%] block dark:hidden"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.02),rgba(7,10,18,0.18))] dark:bg-[linear-gradient(180deg,rgba(7,10,18,0.06),rgba(7,10,18,0.28))]" />
            </div>

            <div className="absolute -left-6 bottom-6 w-fit max-w-[16rem] rounded-[var(--radius-soft)] bg-[#060e18] px-4 py-3.5 shadow-[0_18px_36px_rgba(6,14,24,0.4)] sm:-left-8 sm:bottom-8 sm:max-w-[17rem] sm:px-5 sm:py-4 lg:-left-10 lg:bottom-10 xl:-left-11 xl:bottom-12">
              <p className="font-mono text-[14px] font-semibold leading-5 tracking-[0.16em] text-white sm:text-[15px]">{heroContent.badge[0]}</p>
              <p className="mt-1.5 max-w-full font-mono text-[12px] font-semibold leading-5 tracking-[0.04em] text-white sm:text-[13px] sm:leading-[1.4rem]">
                {heroContent.badge[1]}
              </p>
            </div>
          </>
        }
      />

      <section className="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))] py-12 sm:py-14 lg:py-16">
        <div className="site-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-start">
          <div className="space-y-6">
            <div className="max-w-3xl space-y-5">
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {labels.philosophy.eyebrow}
              </h2>
            </div>

            <article className="no-line-stack rounded-[var(--radius-soft)] bg-[rgb(var(--surface-elevated)/0.62)] px-6 py-7 sm:px-7">
              <div className="space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
                {labels.philosophy.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          </div>

          <div className="space-y-5">
            <article className="no-line-stack rounded-[var(--radius-soft)] bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.78),rgb(var(--surface)/0.92))] px-6 py-7 sm:px-7">
              <div>
                <p className="technical-label">{labels.philosophy.strategyEyebrow}</p>
                <h3 className="mt-4 text-2xl text-text-primary sm:text-3xl">{labels.philosophy.strategyTitle}</h3>
                <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">{labels.philosophy.strategyBody}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <StackSection
        groups={content.about.skillGroups}
        eyebrow={labels.stack.eyebrow}
        description={labels.stack.description}
        closing={labels.stack.closing}
      />

      <section className="bg-[linear-gradient(180deg,rgb(var(--surface)/0.1),rgb(var(--surface-dim)/0.24))] py-12 sm:py-14 lg:py-16">
        <div className="site-container grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.7fr)] lg:items-start">
          <div>
            <div className="max-w-3xl space-y-5">
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.professionalContext.eyebrow}</h2>
            </div>

            <div className="mt-8 max-w-3xl space-y-4 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              {labels.professionalContext.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="rounded-[var(--radius-soft)] bg-[rgb(var(--background)/0.18)] px-6 py-7 shadow-[0_18px_40px_rgba(2,8,23,0.08)] sm:px-7 sm:py-8">
            <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">{labels.trajectory.eyebrow}</h2>

            <div className="mt-8 space-y-5">
              {trajectoryItems.map((item) => (
                <div key={`${item.label}-${item.title}`} className="rounded-[var(--radius-soft)] bg-[rgb(var(--surface)/0.28)] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-text-primary sm:text-base">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{item.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.18),rgb(var(--surface)/0.06))] py-12 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="max-w-3xl space-y-5">
            <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.experienceSection.eyebrow}</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {experienceCards.map((item, index) => (
              <article
                key={`${item.title}-${item.context}`}
                className={`rounded-[var(--radius-soft)] px-5 py-6 sm:px-6 ${index === 1 ? "bg-[rgb(var(--surface-elevated)/0.68)]" : "bg-[rgb(var(--background)/0.12)]"}`}
              >
                <p className="technical-label">{labels.experienceSection.eyebrow}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.context}</p>
                <h3 className="mt-3 text-xl font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgb(var(--surface)/0.12),rgb(var(--surface-dim)/0.2))] py-12 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="max-w-3xl space-y-5">
            <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.educationSection.eyebrow}</h2>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {content.about.education.map((item, index) => (
              <article
                key={`${item.title}-${item.institution}`}
                className={`rounded-[var(--radius-soft)] px-5 py-6 sm:px-6 ${index === 0 ? "bg-[rgb(var(--surface-elevated)/0.62)]" : "bg-[rgb(var(--background)/0.12)]"}`}
              >
                <p className="technical-label">{labels.educationSection.eyebrow}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.institution}</p>
                <h3 className="mt-3 text-xl font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-tertiary">{item.period}</p>
                <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.14),rgb(var(--surface)/0.04))] py-12 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)] xl:items-start">
            <div className="max-w-3xl space-y-5">
              <p className="technical-label">{labels.vision.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.vision.title}</h2>

              <div className="space-y-4 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                <p>{labels.vision.leadIn}</p>
              </div>

              <ul className="grid gap-3 sm:grid-cols-3">
                {labels.vision.points.map((point) => (
                  <li
                    key={point}
                    className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[var(--radius-soft)] bg-[rgb(var(--surface-elevated)/0.62)] px-3 py-4 text-center shadow-[0_18px_40px_rgba(2,8,23,0.08)] sm:min-h-[7rem]"
                  >
                    <span className="technical-label">{labels.vision.eyebrow}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-primary">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="max-w-2xl space-y-4 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                <p>{labels.vision.body}</p>
              </div>
            </div>

            <article className="rounded-[var(--radius-soft)] bg-[rgb(var(--surface-elevated)/0.48)] px-5 py-6 sm:px-6">
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl xl:text-3xl">{labels.strengths.eyebrow}</h2>

              <ul className="mt-5 space-y-3 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8 xl:text-base xl:leading-7">
                {labels.strengths.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-text-primary" aria-hidden="true">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section
        id="cv"
        className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(var(--surface-dim),0.42),rgba(var(--surface),0.2))] py-10 sm:py-12 lg:py-14 scroll-mt-28"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.1),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgb(var(--surface-dim)/0.1))]" />

        <div className="site-container relative">
          <div className="max-w-4xl rounded-[var(--radius-surface)] border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.88),rgb(var(--surface)/0.66))] px-6 py-7 shadow-[0_18px_40px_rgba(2,8,23,0.08)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="max-w-3xl space-y-5">
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.closing.title}</h2>
              <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.closing.description}</p>

              <div className="flex flex-col gap-4 pt-3 sm:flex-row sm:flex-wrap">
                <Link href={`/${currentLocale}/contact`} className="button-primary w-full sm:w-auto">
                  {labels.closing.primary}
                </Link>
                <Link href={`/${currentLocale}/projects`} className="button-secondary w-full sm:w-auto">
                  {labels.closing.secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
