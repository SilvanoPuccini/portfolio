import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import ServiceFormFlow from "@/components/blocks/ServiceFormFlow";
import type { ServiceCardData } from "@/components/blocks/ServiceFormFlow";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/metadata";
import ServiceJsonLd from "@/components/blocks/ServiceJsonLd";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Servicios de desarrollo web, automatización con IA y auditoría técnica. Full stack + criterio comercial para que no tengas que elegir entre velocidad y calidad.",
    hero: {
      eyebrow: "Servicios",
      title: "Convertí tu idea en un producto que funciona en producción.",
      subtitle:
        "Arquitectura de software de alto rendimiento diseñada para escalar. Resolvemos cuellos de botella técnicos para que puedas enfocarte en el crecimiento de tu negocio.",
      description:
        "Full stack + automatización + criterio comercial. Para que no tengas que elegir entre velocidad y calidad.",
      primaryCta: "Empezá tu proyecto",
      secondaryCta: "Conocé el método",
    },
    metrics: [
      { value: "10+", label: "años en gestión comercial" },
      { value: "6", label: "aplicaciones desplegadas y online" },
      { value: "24 h", label: "para responderte" },
      { value: "30 días", label: "de soporte incluido" },
    ],
    services: {
      pricingNote:
        "Los precios son de referencia y marcan el punto de partida de cada servicio. El presupuesto final depende del alcance que definamos juntos en la llamada, y queda por escrito antes de empezar.",
      eyebrow: "Cobertura real",
      title: "Tres servicios. Cada uno con proyectos que lo respaldan.",
      cards: [
        {
          number: "01",
          subtitle: "Que te encuentren y te escriban",
          title: "Sitio web profesional",
          description:
            "Sitio de una o varias páginas, rápido y adaptado a celular, con formulario que te llega al mail y tu negocio visible en Google. Dominio y hosting configurados.",
          details: [
            { label: "Incluye", value: "Diseño, textos y formulario" },
            { label: "Entrega", value: "Online, con dominio propio" },
            { label: "Después", value: "30 días de soporte incluido" },
          ],
          references: ["Adaptado a celular", "Formulario de contacto", "Listo para Google"],
          price: "Desde USD 450",
          timeline: "1 a 2 semanas",
          cta: "Pedir presupuesto",
          slug: "web-presence" as const,
        },
        {
          number: "02",
          subtitle: "Dejá de operar con Excel y WhatsApp",
          title: "Sistema de gestión a medida",
          description:
            "Aplicación web con usuarios y roles, base de datos, panel de administración y reportes. Turnos, stock, clientes, reservas o lo que tu operación necesite, en un solo lugar.",
          details: [
            { label: "Incluye", value: "Panel de admin, roles y reportes" },
            { label: "Entrega", value: "Desplegado, con dominio y capacitación" },
            { label: "Después", value: "30 días de soporte incluido" },
          ],
          references: ["Gestión de stock", "Reservas y turnos", "Panel de clientes"],
          price: "Desde USD 1.200",
          timeline: "3 a 6 semanas",
          cta: "Pedir presupuesto",
          slug: "full-stack-builds" as const,
        },
        {
          number: "03",
          subtitle: "Lo repetitivo, resuelto",
          title: "Automatización de reportes y documentos",
          description:
            "Lectura automática de PDFs y planillas, generación de reportes y envío programado por email. Los mismos datos, sin la carga manual de todos los días.",
          details: [
            { label: "Entrada", value: "PDFs, planillas, correos" },
            { label: "Salida", value: "Reporte listo y enviado solo" },
            { label: "Control", value: "Revisión humana donde importa" },
          ],
          references: ["Lectura de PDFs", "Reportes programados", "Envío automático"],
          price: "Desde USD 350",
          timeline: "1 a 2 semanas",
          cta: "Consultar factibilidad",
          slug: "automation-ai" as const,
        },
        {
          number: "04",
          subtitle: "Claridad antes de invertir",
          title: "Auditoría técnica",
          description:
            "Revisión de arquitectura, performance y deuda técnica. Salís con un diagnóstico claro y un roadmap ejecutable — no con una lista de problemas sin solución.",
          details: [
            { label: "Arquitectura", value: "Stack / escalabilidad / deuda" },
            { label: "Producto", value: "UX / narrativa / prioridades" },
            { label: "Salida", value: "Diagnóstico + roadmap" },
          ],
          references: ["Arquitectura", "Performance", "Deuda técnica"],
          price: "Desde USD 250",
          timeline: "5 días hábiles · alcance acordado",
          cta: "Solicitar auditoría",
          slug: "product-ux-engineering" as const,
        },
      ],
    },
    howIWork: {
      eyebrow: "Método",
      title: "Cómo trabajo",
      description:
        "Cada proyecto pasa por cuatro ejes que garantizan que la solución funcione en producción y tenga impacto real en tu negocio.",
      pillars: [
        {
          title: "Estructura",
          description:
            "Arquitectura sólida que sostiene tu operación digital. Base de datos, backend, frontend y deploy. Todo conectado y testeado.",
          anchor: "FerrelonStock",
          anchorDetail: "E-commerce con 65 tests, panel admin y gestión de inventario",
        },
        {
          title: "Procesos",
          description:
            "Automatizo lo que hoy hacés a mano. Clasificación, extracción y validación con IA, para que no pierdas tiempo en tareas repetitivas.",
          anchor: "FacturIA 2.0",
          anchorDetail: "Pipeline de facturación automatizada con IA",
        },
        {
          title: "Liderazgo",
          description:
            "Antes de escribir código, entiendo tu negocio. 10 años en gestión comercial me enseñaron que el problema real rara vez es el que te dicen primero.",
          anchor: "+10 años en negocio",
          anchorDetail: "Experiencia comercial aplicada a decisiones técnicas",
        },
        {
          title: "Libertad",
          description:
            "El objetivo final: que tu sistema funcione sin depender de mí. Código documentado, paneles de admin y procesos que corren solos.",
          anchor: "My Marketing Agency",
          anchorDetail: "SaaS donde el cliente opera sin asistencia técnica",
        },
      ],
    },
    approach: {
      eyebrow: "Cómo trabajo",
      title: "Orientado a claridad, viabilidad técnica y resultado.",
      description:
        "La metodología nace de dos capas: experiencia comercial para entender contexto, y práctica de desarrollo para construir soluciones estables.",
      steps: [
        {
          label: "01",
          title: "Entender el problema",
          detail:
            "Escucho, pregunto y analizo. 10 años en gestión comercial me enseñaron que el primer paso es entender el negocio, no el código.",
        },
        {
          label: "02",
          title: "Diseñar la solución",
          detail:
            "Arquitectura, estructura de datos, wireframes. Planifico antes de escribir una línea para evitar rehacer después.",
        },
        {
          label: "03",
          title: "Desarrollar con calidad",
          detail:
            "Código limpio, testing automatizado, documentación. No se entrega sin testear. 65 tests en FerrelonStock no fueron casualidad.",
        },
        {
          label: "04",
          title: "Entregar y acompañar",
          detail:
            "Deploy en producción, capacitación de uso, 30 días de soporte. El proyecto no termina cuando el código está listo.",
        },
      ],
    },
    closing: {
      title: "Elegí el servicio que necesitás",
      description: "Completá el formulario y agendamos una llamada de diagnóstico gratuita. Sin compromiso.",
    },
  },
  en: {
    metaDescription:
      "Web development, AI automation, and technical audit services. Full stack + commercial judgment so you don't have to choose between speed and quality.",
    hero: {
      eyebrow: "Services",
      title: "Turn your idea into a product that works in production.",
      subtitle:
        "High-performance software architecture designed to scale. We resolve technical bottlenecks so you can focus on growing your business.",
      description:
        "Full stack + automation + commercial judgment. So you don't have to choose between speed and quality.",
      primaryCta: "Start your project",
      secondaryCta: "See the method",
    },
    metrics: [
      { value: "10+", label: "years in commercial management" },
      { value: "6", label: "applications deployed and online" },
      { value: "24 h", label: "to get back to you" },
      { value: "30 days", label: "of support included" },
    ],
    services: {
      pricingNote:
        "Prices are indicative and mark the starting point for each service. The final quote depends on the scope we define together on the call, and is put in writing before any work begins.",
      eyebrow: "Real coverage",
      title: "Three services. Each backed by real projects.",
      cards: [
        {
          number: "01",
          subtitle: "Get found and get contacted",
          title: "Professional website",
          description:
            "A one-page or multi-page site, fast and mobile-ready, with a contact form that reaches your inbox and your business visible on Google. Domain and hosting configured.",
          details: [
            { label: "Includes", value: "Design, copy and contact form" },
            { label: "Delivery", value: "Live, on your own domain" },
            { label: "After", value: "30 days of support included" },
          ],
          references: ["Mobile-ready", "Contact form", "Google-ready"],
          price: "From USD 450",
          timeline: "1 to 2 weeks",
          cta: "Request a quote",
          slug: "web-presence" as const,
        },
        {
          number: "02",
          subtitle: "Stop running on spreadsheets and chat",
          title: "Custom management system",
          description:
            "End-to-end build: frontend, backend, data, auth, and deploy. Projects that work in production from day one.",
          details: [
            { label: "Frontend", value: "Next.js / React / TypeScript" },
            { label: "Backend", value: "Node.js / Django / Python / APIs" },
            { label: "Data", value: "PostgreSQL / Supabase / pipelines" },
          ],
          references: ["Stock management", "Bookings and scheduling", "Client panel"],
          price: "From USD 1,200",
          timeline: "3 to 6 weeks",
          cta: "Request a quote",
          slug: "full-stack-builds" as const,
        },
        {
          number: "03",
          subtitle: "Repetitive work, handled",
          title: "Report and document automation",
          description:
            "Flows that replace repetitive manual work. Classification, extraction, validation, and auditable pipelines, with a human in the loop when it matters.",
          details: [
            { label: "Processes", value: "Classification / extraction / validation" },
            { label: "Tooling", value: "Pipelines / agents / dashboards" },
            { label: "Goal", value: "Speed with traceability" },
          ],
          references: ["PDF parsing", "Scheduled reports", "Automatic delivery"],
          price: "From USD 350",
          timeline: "1 to 2 weeks",
          cta: "Check feasibility",
          slug: "automation-ai" as const,
        },
        {
          number: "04",
          subtitle: "Clarity before you invest",
          title: "Technical audit",
          description:
            "Architecture, performance, and tech debt review. You leave with a clear diagnosis and an executable roadmap — not just a list of problems.",
          details: [
            { label: "Architecture", value: "Stack / scalability / debt" },
            { label: "Product", value: "UX / narrative / priorities" },
            { label: "Output", value: "Diagnosis + roadmap" },
          ],
          references: ["Architecture", "Performance", "Technical debt"],
          price: "From USD 250",
          timeline: "5 business days · agreed scope",
          cta: "Request an audit",
          slug: "product-ux-engineering" as const,
        },
      ],
    },
    howIWork: {
      eyebrow: "Method",
      title: "How I work",
      description:
        "Every project goes through four pillars that ensure the solution works in production and delivers real business impact.",
      pillars: [
        {
          title: "Structure",
          description:
            "Solid architecture that supports your digital operation. Database, backend, frontend, and deploy. All connected and tested.",
          anchor: "FerrelonStock",
          anchorDetail: "E-commerce with 65 tests, admin panel, and inventory management",
        },
        {
          title: "Processes",
          description:
            "I automate what you do by hand today. Classification, extraction, and AI-powered validation, so you stop wasting time on repetitive tasks.",
          anchor: "FacturIA 2.0",
          anchorDetail: "AI-powered automated invoicing pipeline",
        },
        {
          title: "Leadership",
          description:
            "Before writing code, I understand your business. Ten years in commercial management taught me that the real problem is rarely what they tell you first.",
          anchor: "Business experience",
          anchorDetail: "Commercial experience applied to technical decisions",
        },
        {
          title: "Freedom",
          description:
            "The end goal: your system works without depending on me. Documented code, admin panels, and processes that run on their own.",
          anchor: "My Marketing Agency",
          anchorDetail: "SaaS where the client operates without technical assistance",
        },
      ],
    },
    approach: {
      eyebrow: "How I work",
      title: "Built for clarity, technical viability, and outcome.",
      description:
        "The method comes from two layers: commercial experience to understand context, and development practice to build stable solutions.",
      steps: [
        {
          label: "01",
          title: "Understand the problem",
          detail:
            "I listen, ask, and analyze. Ten years in commercial management taught me that the first step is understanding the business, not the code.",
        },
        {
          label: "02",
          title: "Design the solution",
          detail:
            "Architecture, data structure, and wireframes. I plan before writing a single line to avoid rework later.",
        },
        {
          label: "03",
          title: "Develop with quality",
          detail:
            "Clean code, automated testing, and documentation. Nothing ships untested. The 65 tests in FerrelonStock were not accidental.",
        },
        {
          label: "04",
          title: "Deliver and support",
          detail:
            "Production deploy, usage training, and 30 days of support. The project does not end when the code is ready.",
        },
      ],
    },
    closing:
{
      title: "Choose the service you need",
      description: "Fill out the form and we'll schedule a free diagnostic call. No commitment.",
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

  const servicesLabel = content.navigation.find((item) => item.key === "services")?.label ?? "Services";

  return generatePageMetadata({
    locale: currentLocale,
    path: "services",
    title: `${content.metadata.siteName} | ${servicesLabel}`,
    description: labels.metaDescription,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const labels = copy[currentLocale];

  const serviceSchemas = labels.services.cards.map((card, index) => ({
    name: card.title,
    description: card.description,
    url: `https://silvanopuccini.dev/${currentLocale}/services#service-${index + 1}`,
  }));

  // Build ServiceCardData array for the client component
  const serviceCards: ServiceCardData[] = labels.services.cards.map((card) => ({
    number: card.number,
    subtitle: card.subtitle,
    title: card.title,
    description: card.description,
    details: [...card.details],
    references: [...card.references],
    price: card.price,
    timeline: card.timeline,
    cta: card.cta,
    slug: card.slug,
  }));

  return (
    <>
      <ServiceJsonLd
        services={serviceSchemas}
        providerName="Silvano Puccini"
        providerUrl="https://silvanopuccini.dev"
      />
      {/* ── HERO ── */}
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={labels.hero.title}
        subtitle={<p>{labels.hero.subtitle}</p>}
        description={<p>{labels.hero.description}</p>}
        actions={
          <>
            <a
              href="#servicios"
              className="button-primary w-full gap-2.5 sm:min-w-[13.5rem] sm:w-auto"
            >
              <span>{labels.hero.primaryCta}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>
            <a
              href="#metodo"
              className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto"
            >
              {labels.hero.secondaryCta}
            </a>
          </>
        }
      />

      {/* ── METRICS ── */}
      <div className="border-y border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface)/0.5),rgb(var(--surface-dim)/0.7))]">
        <div className="site-container py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {labels.metrics.map((metric, i) => (
              <div key={i} className="flex flex-col items-start">
                <span
                  className="text-3xl font-semibold leading-none sm:text-4xl"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    color: "rgb(var(--brand-primary))",
                  }}
                >
                  {metric.value}
                </span>
                <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICES (vertical stack with form flow) ── */}
      <div id="servicios" />
      <SectionShell
        eyebrow={labels.services.eyebrow}
        title={labels.services.title}
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <ServiceFormFlow locale={currentLocale} cards={serviceCards} />

        {/* Aviso de alcance: fija que los precios son punto de partida y que el
            presupuesto se cierra por escrito. Protege legalmente y ademas
            califica al lead antes de la llamada. */}
        <p className="mt-10 max-w-3xl border-t border-outline-ghost/10 pt-6 text-sm leading-6 text-text-secondary">
          {labels.services.pricingNote}
        </p>
      </SectionShell>

      {/* ── HOW I WORK ── */}
      <div id="metodo" className="scroll-mt-24" />
      {/* ── PROCESS ── */}
      <SectionShell
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.08),rgb(var(--surface-dim)/0.22))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <div className="space-y-10 sm:space-y-12">
          <div className="max-w-3xl no-line-stack">
            <p className="technical-label">{labels.approach.eyebrow}</p>
            <h2 className="section-title">
              {labels.approach.title}
            </h2>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              {labels.approach.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {labels.approach.steps.map((step) => (
              <article
                key={step.label}
                className="surface-panel no-line-stack h-full border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-5 py-6 sm:px-6"
              >
                <div className="border-b border-outline-ghost/10 pb-4">
                  <span className="font-display text-[2.4rem] leading-none tracking-[-0.04em] text-brand-primary">
                    {step.label}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[1.35rem]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                    {step.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ── CLOSING CTA ── */}
      <section className="site-container py-16 sm:py-20 lg:py-28">
        <div className="group relative overflow-hidden rounded-sm border border-outline-ghost/10 bg-[rgb(var(--surface-elevated))] px-8 py-14 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-primary/8 blur-[100px] transition-colors duration-700 group-hover:bg-brand-primary/14" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-secondary/8 blur-[80px]" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="section-title">
              {labels.closing.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
              {labels.closing.description}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
              {labels.services.cards.map((card) => (
                <a
                  key={card.slug}
                  href={`#service-${card.slug}`}
                  className="button-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
