import type { Metadata } from "next";
import CapabilityMatrix from "@/components/blocks/CapabilityMatrix";
import ServiceCard from "@/components/blocks/ServiceCard";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Servicios y capacidades reales de Silvano Puccini: desarrollo full stack, automatización aplicada e ingeniería con visión de producto.",
    hero: {
      eyebrow: "Servicios",
      title: "Capacidades reales para producto, plataformas y automatización con criterio técnico.",
      intro:
        "La página de servicios no vende paquetes vacíos: ordena el tipo de trabajo que ya aparece en proyectos, CV y experiencia profesional para que el posicionamiento se lea claro y creíble.",
      support:
        "El enfoque combina ejecución full stack, automatización aplicada y lectura de negocio. Todo lo que aparece acá está respaldado por casos publicados o por trayectoria verificable.",
      aside: {
        status: "Posicionamiento",
        statusValue: "Perfil técnico con lectura de producto y negocio",
        proof: "Prueba reunida",
        proofValueSuffix: "proyectos reales",
        coverage: "Cobertura",
        coverageValue: "3 frentes de servicio",
        experience: "Trayectoria",
        experienceValue: "10+ años en gestión comercial y coordinación",
      },
      primaryCta: "Ir a contacto",
      secondaryCta: "Ver proyectos",
    },
    lead: {
      eyebrow: "Servicio ancla",
      title: "Desarrollo end-to-end para construir productos que funcionen en frontend, backend y operación.",
      description:
        "La combinación más repetida del portfolio está en sistemas completos: aplicaciones con UX cuidada, lógica de negocio, datos, pagos, despliegue y una narrativa técnica entendible para quien toma decisiones.",
      proofLabel: "Capas verificables",
      referencesLabel: "Pruebas concretas",
      linkPrimary: "Hablemos de un producto real",
      linkSecondary: "Ver proyectos publicados",
    },
    cards: {
      eyebrow: "Cobertura real",
      title: "Tres líneas de servicio sostenidas por trabajo publicado y experiencia verificable.",
      description:
        "No son categorías decorativas: cada frente conecta con proyectos reales, tecnologías visibles y decisiones que ya aparecen en el portfolio, el CV o repositorios públicos.",
      proofLabel: "Señales de prueba",
      referencesLabel: "Referencias",
    },
    process: {
      eyebrow: "Cómo trabajo",
      title: "Proceso orientado a claridad, viabilidad técnica y resultado utilizable.",
      intro:
        "La metodología nace de dos capas combinadas: experiencia comercial para entender contexto y práctica de ingeniería para convertirlo en una solución ejecutable, medible y mantenible.",
      steps: [
        {
          label: "01 · Contexto",
          title: "Traducir necesidad de negocio en alcance técnico legible.",
          detail:
            "La base comercial ayuda a detectar prioridades, restricciones operativas y señales de valor antes de escribir arquitectura o interfaz.",
        },
        {
          label: "02 · Construcción",
          title: "Resolver producto, datos y experiencia como un mismo sistema.",
          detail:
            "Los proyectos publicados muestran trabajo sobre frontend, backend, integraciones, persistencia y despliegue, sin separar artificialmente lo visual de lo funcional.",
        },
        {
          label: "03 · Cierre",
          title: "Entregar algo auditable, navegable y con siguiente paso claro.",
          detail:
            "Roadmaps, demos, repositorios y pruebas visibles pesan más que cualquier claim abstracto: el objetivo es que el resultado pueda evaluarse rápido.",
        },
      ],
    },
    approach: {
      eyebrow: "Approach técnico",
      title: "El trabajo cruza producto, stack y ejecución real.",
      intro:
        "Las capacidades no se presentan como lista genérica de skills sino como combinación concreta de tecnologías, dominios y resultados visibles en casos publicados.",
      items: [
        {
          label: "Frontend",
          title: "React, Next.js, TypeScript y UI editorial premium.",
          detail:
            "Base fuerte para interfaces claras, rápidas y con criterio visual, visible en este portfolio, Modern Art Gallery y parte del stack de Aktivar y PayTrack.",
        },
        {
          label: "Backend",
          title: "Python, Django, Node.js, APIs, datos y operaciones.",
          detail:
            "FerrelonStock y Aktivar muestran profundidad en lógica de negocio, autenticación, pagos, mapas, chat, modelos y despliegue productivo.",
        },
        {
          label: "Automation",
          title: "IA aplicada, pipelines y tooling para eficiencia real.",
          detail:
            "FacturIA 2.0 y el trabajo explorado en PayTrack sostienen una línea concreta de automatización con auditoría, procesamiento documental y flujos útiles.",
        },
      ],
    },
    closing: {
      eyebrow: "Cierre editorial",
      title: "Si el problema exige producto, claridad técnica y ejecución real, este es el tipo de colaboración que mejor encaja.",
      description:
        "La lectura final busca dejar algo nítido: no se trata de vender “de todo”, sino de concentrar fortalezas reales donde el cruce entre software, negocio y narrativa aporta valor.",
      notesTitle: "Lo que esta página deja claro",
      notes: [
        "El foco está en producto digital, plataformas y automatizaciones con evidencia pública o trazabilidad documental.",
        "La experiencia previa en gestión comercial mejora discovery, priorización y comunicación con negocio.",
        "La ejecución técnica cubre desde UI y arquitectura hasta datos, integraciones y despliegue.",
      ],
      primaryCta: "Abrir conversación",
      secondaryCta: "Ver Sobre mí",
    },
  },
  en: {
    metaDescription:
      "Silvano Puccini services and real capabilities: full stack development, applied automation, and engineering with product perspective.",
    hero: {
      eyebrow: "Services",
      title: "Real capabilities for product, platforms, and automation with technical judgment.",
      intro:
        "This services page does not sell empty packages: it organizes the type of work already visible across projects, resume, and professional background so positioning feels clear and credible.",
      support:
        "The focus combines full stack execution, applied automation, and business awareness. Everything shown here is backed by published work or verifiable experience.",
      aside: {
        status: "Positioning",
        statusValue: "Technical profile with product and business perspective",
        proof: "Proof gathered",
        proofValueSuffix: "real projects",
        coverage: "Coverage",
        coverageValue: "3 service fronts",
        experience: "Background",
        experienceValue: "10+ years in commercial management and coordination",
      },
      primaryCta: "Go to contact",
      secondaryCta: "View projects",
    },
    lead: {
      eyebrow: "Lead service",
      title: "End-to-end development to build products that work across frontend, backend, and operations.",
      description:
        "The most repeated pattern across the portfolio is complete systems: applications with strong UX, business logic, data, payments, deployment, and technical storytelling that decision-makers can read quickly.",
      proofLabel: "Verified layers",
      referencesLabel: "Concrete proof",
      linkPrimary: "Let’s discuss a real product",
      linkSecondary: "View published projects",
    },
    cards: {
      eyebrow: "Real coverage",
      title: "Three service lines sustained by published work and verifiable background.",
      description:
        "These are not decorative categories: each line connects to real projects, visible technologies, and decisions already present in the portfolio, resume, or public repositories.",
      proofLabel: "Proof signals",
      referencesLabel: "References",
    },
    process: {
      eyebrow: "How I work",
      title: "Process oriented to clarity, technical viability, and usable outcomes.",
      intro:
        "The method comes from combining two layers: commercial experience to understand context and engineering practice to turn it into something executable, measurable, and maintainable.",
      steps: [
        {
          label: "01 · Context",
          title: "Translate business needs into readable technical scope.",
          detail:
            "The commercial background helps identify priorities, operational constraints, and value signals before architecture or interface work begins.",
        },
        {
          label: "02 · Build",
          title: "Solve product, data, and experience as one system.",
          detail:
            "Published projects show work across frontend, backend, integrations, persistence, and deployment without artificially separating visual quality from functionality.",
        },
        {
          label: "03 · Delivery",
          title: "Ship something auditable, navigable, and easy to evaluate.",
          detail:
            "Roadmaps, demos, repositories, and visible proof matter more than abstract claims: the goal is to make the result easy to assess.",
        },
      ],
    },
    approach: {
      eyebrow: "Technical approach",
      title: "The work sits at the intersection of product, stack, and real execution.",
      intro:
        "Capabilities are not shown as a generic skills list but as a concrete blend of technologies, domains, and outcomes visible in published work.",
      items: [
        {
          label: "Frontend",
          title: "React, Next.js, TypeScript, and premium editorial UI.",
          detail:
            "A strong base for clear, fast interfaces with visual judgment, visible in this portfolio, Modern Art Gallery, and parts of the Aktivar and PayTrack stack.",
        },
        {
          label: "Backend",
          title: "Python, Django, Node.js, APIs, data, and operations.",
          detail:
            "FerrelonStock and Aktivar show depth in business logic, authentication, payments, maps, chat, data models, and production deployment.",
        },
        {
          label: "Automation",
          title: "Applied AI, pipelines, and tooling for real efficiency.",
          detail:
            "FacturIA 2.0 and the direction explored in PayTrack sustain a concrete automation line with auditing, document processing, and useful workflows.",
        },
      ],
    },
    closing: {
      eyebrow: "Editorial close",
      title: "If the problem needs product thinking, technical clarity, and real execution, this is the collaboration shape that fits best.",
      description:
        "The closing point is simple: this is not about offering everything, but about focusing on real strengths where software, business, and narrative intersect meaningfully.",
      notesTitle: "What this page makes explicit",
      notes: [
        "The focus is digital product, platforms, and automation with public evidence or documented traceability.",
        "Previous commercial-management experience improves discovery, prioritization, and communication with business stakeholders.",
        "Technical execution covers UI and architecture as well as data, integrations, and deployment.",
      ],
      primaryCta: "Start a conversation",
      secondaryCta: "View About",
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
  const labels = copy[currentLocale];

  return {
    title: `${content.metadata.siteName} | ${content.navigation.find((item) => item.key === "services")?.label ?? "Services"}`,
    description: labels.metaDescription,
  };
}

export default async function ServicesPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const projectBySlug = new Map(content.projects.map((project) => [project.slug, project]));
  const fullStackCases = ["ferrelonstock", "aktivar", "paytrack"]
    .map((slug) => projectBySlug.get(slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  const serviceReferences = {
    "full-stack-builds": fullStackCases.map((project) => ({
      label: project.name,
      value: `${project.category} · ${project.status} · ${project.year}`,
      detail: project.summary,
    })),
    "automation-ai": ["facturia-2-0", "paytrack"]
      .map((slug) => projectBySlug.get(slug))
      .filter((project): project is NonNullable<typeof project> => Boolean(project))
      .map((project) => ({
        label: project.name,
        value: `${project.category} · ${project.status}`,
        detail: project.challenge,
      })),
    "product-ux-engineering": [
      {
        label: currentLocale === "es" ? "Experiencia previa" : "Previous background",
        value: currentLocale === "es" ? "Gestión comercial + coordinación" : "Commercial management + coordination",
        detail: content.about.summary[2],
      },
      {
        label: "Modern Art Gallery",
        value: projectBySlug.get("modern-art-gallery")?.headline ?? "—",
        detail: projectBySlug.get("modern-art-gallery")?.summary ?? "—",
      },
      {
        label: currentLocale === "es" ? "Fortaleza" : "Strength",
        value: content.about.strengths[0] ?? "—",
        detail: content.about.strengths[1] ?? "—",
      },
    ],
  } as const;

  const leadService = content.services[0];
  const sourceBackedProjects = content.projects.length;

  return (
    <>
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={labels.hero.title}
        description={
          <div className="space-y-4">
            <p>{labels.hero.intro}</p>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.hero.support}</p>
          </div>
        }
        aside={
          <div className="no-line-stack">
            <div>
              <p className="technical-label">{labels.hero.aside.status}</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">{labels.hero.aside.statusValue}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{content.metadata.role}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.proof}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">
                  {sourceBackedProjects} {labels.hero.aside.proofValueSuffix}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.coverage}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{labels.hero.aside.coverageValue}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.experience}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{labels.hero.aside.experienceValue}</p>
            </div>

            <CTACluster
              items={[
                { label: labels.hero.primaryCta, href: `/${currentLocale}/contact` },
                { label: labels.hero.secondaryCta, href: `/${currentLocale}/projects`, variant: "secondary" },
              ]}
            />
          </div>
        }
      />

      {leadService ? (
        <SectionShell
          eyebrow={labels.lead.eyebrow}
          title={labels.lead.title}
          description={<p>{labels.lead.description}</p>}
        >
          <ServiceCard
            variant="feature"
            eyebrow={leadService.title}
            title={leadService.title}
            description={`${leadService.description} ${labels.lead.description}`}
            proofLabel={labels.lead.proofLabel}
            proofPoints={leadService.proofPoints}
            referencesLabel={labels.lead.referencesLabel}
            references={serviceReferences[leadService.slug as keyof typeof serviceReferences]}
            links={[
              { label: labels.lead.linkPrimary, href: `/${currentLocale}/contact` },
              { label: labels.lead.linkSecondary, href: `/${currentLocale}/projects`, variant: "secondary" },
            ]}
          />
        </SectionShell>
      ) : null}

      <SectionShell
        eyebrow={labels.cards.eyebrow}
        title={labels.cards.title}
        description={<p>{labels.cards.description}</p>}
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {content.services.map((service) => (
            <ServiceCard
              key={service.slug}
              eyebrow={service.slug}
              title={service.title}
              description={service.description}
              proofLabel={labels.cards.proofLabel}
              proofPoints={service.proofPoints}
              referencesLabel={labels.cards.referencesLabel}
              references={serviceReferences[service.slug as keyof typeof serviceReferences]}
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <CapabilityMatrix
            eyebrow={labels.process.eyebrow}
            title={labels.process.title}
            intro={labels.process.intro}
            items={labels.process.steps}
          />

          <CapabilityMatrix
            eyebrow={labels.approach.eyebrow}
            title={labels.approach.title}
            intro={labels.approach.intro}
            items={labels.approach.items}
          />
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={labels.closing.eyebrow}
        title={labels.closing.title}
        description={<p>{labels.closing.description}</p>}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            {[
              {
                label: labels.hero.aside.proof,
                value: String(sourceBackedProjects),
              },
              {
                label: labels.hero.aside.coverage,
                value: String(content.services.length),
              },
              {
                label: labels.hero.aside.experience,
                value: "10+",
              },
            ].map((item) => (
              <article key={item.label} className="surface-panel px-6 py-6 sm:px-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold text-text-primary">{item.value}</p>
              </article>
            ))}
          </div>

          <article className="surface-panel no-line-stack px-6 py-7 sm:px-7">
            <div>
              <p className="technical-label">{labels.closing.notesTitle}</p>
              <h3 className="mt-4 text-2xl font-semibold text-text-primary sm:text-3xl">{labels.closing.title}</h3>
            </div>

            <div className="space-y-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {labels.closing.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>

            <CTACluster
              items={[
                { label: labels.closing.primaryCta, href: `/${currentLocale}/contact` },
                { label: labels.closing.secondaryCta, href: `/${currentLocale}/about`, variant: "secondary" },
              ]}
            />
          </article>
        </div>
      </SectionShell>
    </>
  );
}
