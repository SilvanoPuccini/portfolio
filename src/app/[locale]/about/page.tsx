import type { Metadata } from "next";
import AboutNarrative from "@/components/blocks/AboutNarrative";
import ResumeDownload from "@/components/blocks/ResumeDownload";
import TimelineList from "@/components/blocks/TimelineList";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    heroStats: {
      availability: "Disponibilidad",
      location: "Base",
      languages: "Idiomas",
      profile: "Perfil",
    },
    narrative: {
      eyebrow: "Narrativa editorial",
      title: "Contexto técnico, recorrido real y criterio de producto.",
      description:
        "La página reúne biografía verificable, señales de credibilidad y contexto profesional para leer el perfil completo sin depender de claims vacíos.",
      intro:
        "Construyo interfaces y productos con una mezcla concreta de ingeniería, sensibilidad editorial y lectura de negocio ganada en terreno.",
      strengths: "Fortalezas verificables",
      facts: {
        education: "Formación",
        background: "Trayectoria",
        stack: "Stack central",
      },
    },
    resume: {
      eyebrow: "CV integrado",
      title: "Currículum listo para descargar desde About.",
      description:
        "El CV vive como acción directa dentro de esta página, manteniendo la navegación limpia y conectando la descarga con el contexto real del perfil.",
      helper:
        "El archivo descargable corresponde al PDF real centralizado en `/cv` y complementa la información publicada en esta página.",
      meta: {
        availability: "Disponibilidad",
        contact: "Contacto",
        location: "Ubicación",
        source: "Fuente",
      },
      contactCta: "Ir a contacto",
    },
    timeline: {
      eyebrow: "Timeline real",
      title: "Experiencia, estudios y stack con trazabilidad.",
      description:
        "Si el diseño editorial debe sostener credibilidad, estas capas muestran el recorrido laboral, la formación y la caja de herramientas que ya están respaldadas por el contenido centralizado.",
      experienceEyebrow: "Experiencia",
      educationEyebrow: "Estudios",
      experienceTitle: "Experiencia profesional",
      educationTitle: "Formación técnica",
      stackTitle: "Stack & tooling",
      stackIntro:
        "Tecnologías y herramientas que ya aparecen en el portfolio, el CV y los proyectos publicados. Sin inflar el scope: sólo capacidades respaldadas.",
      closingPrimary: "Ver proyectos",
      closingSecondary: "Descargar CV",
    },
  },
  en: {
    heroStats: {
      availability: "Availability",
      location: "Based in",
      languages: "Languages",
      profile: "Profile",
    },
    narrative: {
      eyebrow: "Editorial narrative",
      title: "Technical context, real background, and product judgment.",
      description:
        "This page combines verified biography, credibility signals, and professional context so the profile can be read in full without relying on empty claims.",
      intro:
        "I build interfaces and products with a concrete blend of engineering, editorial sensitivity, and business awareness earned in the field.",
      strengths: "Verified strengths",
      facts: {
        education: "Education",
        background: "Background",
        stack: "Core stack",
      },
    },
    resume: {
      eyebrow: "Integrated resume",
      title: "Resume ready to download from About.",
      description:
        "The resume lives as a direct action inside this page, keeping navigation clean while connecting the download to the real context behind the profile.",
      helper:
        "The downloadable file is the real PDF served from `/cv` and complements the information already published on this page.",
      meta: {
        availability: "Availability",
        contact: "Contact",
        location: "Location",
        source: "Source",
      },
      contactCta: "Go to contact",
    },
    timeline: {
      eyebrow: "Real timeline",
      title: "Experience, education, and stack with traceability.",
      description:
        "If the editorial design needs to sustain credibility, these layers expose work history, education, and tooling already backed by centralized content.",
      experienceEyebrow: "Experience",
      educationEyebrow: "Education",
      experienceTitle: "Professional experience",
      educationTitle: "Technical education",
      stackTitle: "Stack & tooling",
      stackIntro:
        "Technologies and tools already present across the portfolio, resume, and published projects. No inflated scope: only source-backed capabilities.",
      closingPrimary: "View projects",
      closingSecondary: "Download resume",
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
  const factItems = [
    {
      label: labels.narrative.facts.education,
      value: content.about.education[0]?.period ?? "—",
      detail: content.about.education[0]?.title ?? "—",
    },
    {
      label: labels.narrative.facts.background,
      value: content.about.experience[0]?.title ?? "—",
      detail: content.about.experience[0]?.detail ?? "—",
    },
    {
      label: labels.narrative.facts.stack,
      value: content.about.skillGroups[0]?.title ?? "—",
      detail: content.about.skillGroups[0]?.items.slice(0, 5).join(" · ") ?? "—",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={content.about.eyebrow}
        title={content.about.title}
        description={
          <div className="space-y-4">
            <p>{content.about.summary[0]}</p>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              {labels.narrative.intro}
            </p>
          </div>
        }
        aside={
          <div className="no-line-stack">
            <div>
              <p className="technical-label">{labels.heroStats.profile}</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">{content.metadata.role}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{content.metadata.availability}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {labels.heroStats.availability}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{content.contact.availability}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {labels.heroStats.location}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{content.metadata.location}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                {labels.heroStats.languages}
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-text-secondary">
                {content.about.languages.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <CTACluster
              items={[
                { label: content.about.cvLabel, href: content.metadata.cv.downloadHref },
                {
                  label: content.contact.primaryCtas[0].label,
                  href: `/${currentLocale}/contact`,
                  variant: "secondary",
                },
              ]}
            />
          </div>
        }
      />

      <SectionShell
        eyebrow={labels.narrative.eyebrow}
        title={labels.narrative.title}
        description={<p>{labels.narrative.description}</p>}
      >
        <AboutNarrative
          title={content.about.title}
          intro={labels.narrative.intro}
          paragraphs={content.about.summary}
          facts={factItems}
          strengthsLabel={labels.narrative.strengths}
          strengths={content.about.strengths}
        />
      </SectionShell>

      <ResumeDownload
        anchorId="cv"
        eyebrow={labels.resume.eyebrow}
        title={labels.resume.title}
        description={labels.resume.description}
        helper={labels.resume.helper}
        meta={[
          { label: labels.resume.meta.availability, value: content.contact.availability },
          { label: labels.resume.meta.contact, value: content.metadata.email },
          { label: labels.resume.meta.location, value: content.metadata.location },
          { label: labels.resume.meta.source, value: content.metadata.cv.sourcePath },
        ]}
        downloadLabel={content.about.cvLabel}
        downloadHref={content.metadata.cv.downloadHref}
        contactLabel={labels.resume.contactCta}
        contactHref={`/${currentLocale}/contact`}
      />

      <SectionShell
        eyebrow={labels.timeline.eyebrow}
        title={labels.timeline.title}
        description={<p>{labels.timeline.description}</p>}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <TimelineList
            eyebrow={labels.timeline.experienceEyebrow}
            title={labels.timeline.experienceTitle}
            items={content.about.experience}
          />

          <TimelineList
            eyebrow={labels.timeline.educationEyebrow}
            title={labels.timeline.educationTitle}
            items={content.about.education.map((item) => ({
              title: item.title,
              context: `${item.institution} · ${item.period}`,
              detail: item.detail,
            }))}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <article className="surface-panel no-line-stack px-6 py-7 sm:px-7">
            <div>
              <p className="technical-label">{labels.timeline.stackTitle}</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {labels.timeline.stackIntro}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {content.about.skillGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-outline-ghost/10 bg-surface-dim/70 px-5 py-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{group.title}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={`${group.title}-${item}`}
                        className="rounded-pill border border-outline-ghost/15 bg-surface-elevated/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <CTACluster
            items={[
              { label: labels.timeline.closingPrimary, href: `/${currentLocale}/projects` },
              {
                label: labels.timeline.closingSecondary,
                href: content.metadata.cv.downloadHref,
                variant: "secondary",
              },
            ]}
          />
        </div>
      </SectionShell>
    </>
  );
}
