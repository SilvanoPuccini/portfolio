import type { Metadata } from "next";
import { Github, Globe, Linkedin, Mail, MapPin, MessageSquareMore, Phone } from "lucide-react";
import ContactForm from "@/components/blocks/ContactForm";
import ContactMethods from "@/components/blocks/ContactMethods";
import ContactPanel from "@/components/blocks/ContactPanel";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Página de contacto editorial de Silvano Puccini con formulario real vía Formspree, canales directos y disponibilidad remota.",
    hero: {
      titlePrefix: "Iniciemos una",
      titleAccent: "conversación",
      support:
        "La composición replica el lenguaje editorial del sistema base y concentra un formulario real, datos verificables y accesos directos para abrir una conversación de trabajo sin pasos innecesarios.",
      aside: {
        eyebrow: "Disponibilidad",
        workModeLabel: "Modalidad",
        workModeValue: "Remoto · colaboración internacional",
        locationLabel: "Base",
        channelsLabel: "Canales",
        channelsValue: "Email, LinkedIn, GitHub y Discord",
      },
      primaryCta: "Enviar email",
      secondaryCta: "Ver proyectos",
    },
    form: {
      title: "Envíame un mensaje",
      fields: {
        name: "Nombre",
        email: "Email",
        subject: "Asunto",
        message: "Mensaje",
      },
      placeholders: {
        name: "Tu nombre",
        email: "tu@email.com",
        subject: "¿En qué estás trabajando?",
        message: "Contame sobre tu proyecto, contexto o necesidad técnica.",
      },
      submit: "Enviar propuesta",
      sending: "Enviando…",
      success: "Mensaje enviado. Si todo salió bien, te responderé por email.",
      error: "Revisá los campos e intentá nuevamente. Si persiste, podés escribirme directo por email.",
      helper: "El mensaje se envía por Formspree y queda integrado al mismo lenguaje visual editorial del sitio.",
      validation: {
        required: "Este campo es obligatorio.",
        email: "Ingresá un email válido.",
      },
    },
    direct: {
      email: "Email directo",
      location: "Ubicación",
      phone: "WhatsApp / Teléfono",
      locationDetail: "Base en Pucón, Chile · trabajo remoto",
      phoneDetail: "Canal útil para coordinación rápida y seguimiento.",
    },
    methods: {
      linkedin: "LinkedIn",
      github: "GitHub",
      portfolio: "Portfolio",
      discord: "Discord",
    },
    ctaBanner: {
      eyebrow: "Siguiente paso",
      title: "Si ya tenés una idea, contexto o problema técnico, este bloque está listo para recibirlo.",
      description:
        "Producto digital, automatización aplicada o una plataforma en evolución: el objetivo es abrir una conversación clara, útil y basada en necesidades reales.",
      primary: "Abrir email",
      secondary: "Ir a servicios",
    },
    editorial: {
      eyebrow: "Base operativa",
      title: "Contacto real, disponibilidad visible y encuadre editorial consistente con el resto del portfolio.",
      description:
        "La pantalla cierra el recorrido con una pieza terminada: CTA lateral, formulario funcional y contexto suficiente para decidir el próximo paso sin depender de placeholders.",
      labels: {
        availability: "Disponibilidad",
        location: "Ubicación",
        profile: "Perfil",
      },
      profileValue: "Desarrollador Full Stack · automatización, producto y ejecución end-to-end",
    },
  },
  en: {
    metaDescription:
      "Silvano Puccini editorial contact page with the real Formspree form, direct channels, and remote availability.",
    hero: {
      titlePrefix: "Let’s start a",
      titleAccent: "conversation",
      support:
        "The composition mirrors the editorial language of the base system and brings together a real form, verified contact data, and direct channels to start a working conversation without unnecessary friction.",
      aside: {
        eyebrow: "Availability",
        workModeLabel: "Work mode",
        workModeValue: "Remote · international collaboration",
        locationLabel: "Based in",
        channelsLabel: "Channels",
        channelsValue: "Email, LinkedIn, GitHub, and Discord",
      },
      primaryCta: "Send email",
      secondaryCta: "View projects",
    },
    form: {
      title: "Send me a message",
      fields: {
        name: "Name",
        email: "Email",
        subject: "Subject",
        message: "Message",
      },
      placeholders: {
        name: "Your name",
        email: "you@email.com",
        subject: "What are you working on?",
        message: "Tell me about your project, context, or technical need.",
      },
      submit: "Send proposal",
      sending: "Sending…",
      success: "Message sent. If everything went through, I’ll reply by email.",
      error: "Review the fields and try again. If it persists, you can contact me directly by email.",
      helper: "This message is sent through Formspree and stays integrated with the same editorial language used across the site.",
      validation: {
        required: "This field is required.",
        email: "Enter a valid email address.",
      },
    },
    direct: {
      email: "Direct email",
      location: "Location",
      phone: "WhatsApp / Phone",
      locationDetail: "Based in Pucón, Chile · remote work",
      phoneDetail: "Useful channel for fast coordination and follow-up.",
    },
    methods: {
      linkedin: "LinkedIn",
      github: "GitHub",
      portfolio: "Portfolio",
      discord: "Discord",
    },
    ctaBanner: {
      eyebrow: "Next step",
      title: "If you already have an idea, context, or technical problem, this block is ready to receive it.",
      description:
        "Digital product, applied automation, or an evolving platform: the goal is to open a clear and useful conversation rooted in real needs.",
      primary: "Open email",
      secondary: "Go to services",
    },
    editorial: {
      eyebrow: "Operating base",
      title: "Real contact data, visible availability, and editorial framing consistent with the rest of the portfolio.",
      description:
        "This screen closes the journey with a finished piece: lateral CTA, functional form, and enough context to decide the next step without relying on placeholders.",
      labels: {
        availability: "Availability",
        location: "Location",
        profile: "Profile",
      },
      profileValue: "Full Stack Developer · automation, product thinking, and end-to-end execution",
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
    title: `${content.metadata.siteName} | ${content.navigation.find((item) => item.key === "contact")?.label ?? "Contact"}`,
    description: labels.metaDescription,
  };
}

export default async function ContactPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const emailHref = `mailto:${content.metadata.email}`;
  const phoneHref = `https://wa.me/${content.metadata.phone.replace(/\D/g, "")}`;
  const linkedinHref = content.metadata.socialLinks.find((item) => item.platform === "linkedin")?.href;
  const githubHref = content.metadata.socialLinks.find((item) => item.platform === "github")?.href;
  const discordHref = content.metadata.socialLinks.find((item) => item.platform === "discord")?.href;
  const portfolioHref = content.metadata.socialLinks.find((item) => item.platform === "portfolio")?.href;

  return (
    <>
      <PageHero
        eyebrow={content.contact.eyebrow}
        title={
          <>
            {labels.hero.titlePrefix} <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">{labels.hero.titleAccent}</span>
          </>
        }
        description={
          <div className="space-y-4">
            <p>{content.contact.intro}</p>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.hero.support}</p>
          </div>
        }
        aside={
          <div className="no-line-stack">
            <div>
              <p className="technical-label">{labels.hero.aside.eyebrow}</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">{content.contact.availability}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{labels.hero.aside.workModeValue}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.workModeLabel}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{labels.hero.aside.workModeValue}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.locationLabel}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{content.metadata.location}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.aside.channelsLabel}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{labels.hero.aside.channelsValue}</p>
            </div>

            <CTACluster
              items={[
                { label: labels.hero.primaryCta, href: emailHref, external: true },
                { label: labels.hero.secondaryCta, href: `/${currentLocale}/projects`, variant: "secondary" },
              ]}
            />
          </div>
        }
      />

      <SectionShell
        eyebrow={currentLocale === "es" ? "Contacto directo" : "Direct contact"}
        title={currentLocale === "es" ? "Formulario real, canales directos y CTA lateral en una misma composición." : "Real form, direct channels, and a lateral CTA in one composition."}
        description={<p>{content.contact.intro}</p>}
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <ContactForm action={content.contact.formspreeAction} locale={currentLocale} labels={labels.form} />
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="grid gap-4">
              <ContactPanel
                icon={Mail}
                eyebrow={labels.direct.email}
                title={content.metadata.email}
                detail={currentLocale === "es" ? "Canal principal para propuestas, consultas y colaboración." : "Primary channel for proposals, questions, and collaboration."}
                href={emailHref}
              />
              <ContactPanel
                icon={MapPin}
                eyebrow={labels.direct.location}
                title={content.metadata.location}
                detail={labels.direct.locationDetail}
              />
              <ContactPanel
                icon={Phone}
                eyebrow={labels.direct.phone}
                title={content.metadata.phone}
                detail={labels.direct.phoneDetail}
                href={phoneHref}
                accent="secondary"
              />
            </div>

            <ContactMethods
              items={[
                linkedinHref ? { label: labels.methods.linkedin, href: linkedinHref, icon: Linkedin } : null,
                githubHref ? { label: labels.methods.github, href: githubHref, icon: Github, accent: "secondary" as const } : null,
                portfolioHref ? { label: labels.methods.portfolio, href: portfolioHref, icon: Globe } : null,
                discordHref ? { label: labels.methods.discord, href: discordHref, icon: MessageSquareMore, accent: "secondary" as const } : null,
              ].filter((item): item is NonNullable<typeof item> => Boolean(item))}
            />

            <div className="surface-panel bg-editorial-texture no-line-stack px-6 py-7 sm:px-7">
              <div>
                <p className="technical-label">{labels.ctaBanner.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-semibold text-text-primary">{labels.ctaBanner.title}</h3>
                <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{labels.ctaBanner.description}</p>
              </div>

              <CTACluster
                items={[
                  { label: labels.ctaBanner.primary, href: emailHref, external: true },
                  { label: labels.ctaBanner.secondary, href: `/${currentLocale}/services`, variant: "secondary" },
                ]}
              />
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={labels.editorial.eyebrow}
        title={labels.editorial.title}
        description={<p>{labels.editorial.description}</p>}
      >
        <div className="relative overflow-hidden rounded-[1.5rem] border border-outline-ghost/10 bg-[radial-gradient(circle_at_top_left,rgba(138,235,255,0.12),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(5,102,217,0.18),transparent_26%),linear-gradient(135deg,rgba(21,27,43,0.95),rgba(13,19,34,0.92))] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
            <div className="max-w-2xl">
              <p className="font-display text-3xl tracking-tight text-text-primary sm:text-4xl">{content.metadata.location}</p>
              <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.editorial.profileValue}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-outline-ghost/10 bg-surface/60 px-5 py-4 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.editorial.labels.availability}</p>
                <p className="mt-3 text-base font-medium leading-7 text-text-primary">{content.contact.availability}</p>
              </div>
              <div className="rounded-2xl border border-outline-ghost/10 bg-surface/60 px-5 py-4 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.editorial.labels.location}</p>
                <p className="mt-3 text-base font-medium leading-7 text-text-primary">{content.metadata.location}</p>
              </div>
              <div className="rounded-2xl border border-outline-ghost/10 bg-surface/60 px-5 py-4 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.editorial.labels.profile}</p>
                <p className="mt-3 text-base font-medium leading-7 text-text-primary">{content.metadata.role}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    </>
  );
}
