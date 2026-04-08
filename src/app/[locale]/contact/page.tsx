import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github, Linkedin, Mail, MapPin, MessageSquareMore, Phone } from "lucide-react";
import ContactForm from "@/components/blocks/ContactForm";
import ContactPanel from "@/components/blocks/ContactPanel";
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
      lead: "Disponible para colaborar en productos digitales, plataformas web y automatización con foco en ejecución real.",
      support:
        "Una estructura clara para abrir una conversación de trabajo con formulario real, datos verificables y acceso directo a los canales principales.",
    },
    main: {
      socialTitle: "Social y presencia",
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
      sending: "Enviando...",
      success: "Mensaje enviado. Si todo salió bien, te responderé por email.",
      error: "Revisá los campos e intentá nuevamente. Si persiste, podés escribirme directo por email.",
      validation: {
        required: "Este campo es obligatorio.",
        email: "Ingresá un email válido.",
      },
    },
    direct: {
      email: "Email directo",
      location: "Ubicación",
      phone: "WhatsApp / Teléfono",
      emailDetail: "Canal principal para propuestas, consultas y colaboración.",
      locationDetail: "Base en Pucón, Chile con trabajo remoto.",
      phoneDetail: "Canal útil para coordinación rápida y seguimiento.",
    },
    methods: {
      linkedin: "LinkedIn",
      github: "GitHub",
      email: "Email",
      discord: "Discord",
    },
    ctaBanner: {
      eyebrow: "Siguiente paso",
      title: "Si ya tenés una idea, contexto o problema técnico, podemos pasar del primer mensaje al siguiente paso.",
      description:
        "Producto digital, automatización aplicada o una plataforma en evolución: el objetivo es ordenar rápido el contexto y definir cómo avanzar.",
      primary: "Abrir email",
      secondary: "Ir a servicios",
    },
    anchor: {
      eyebrow: "",
      title: "",
      description: "",
      mapEyebrow: "",
      mapDetail: "Vista embebida de Pucón con datos cartográficos reales vía OpenStreetMap.",
      openMap: "Abrir mapa",
      labels: {
        availability: "Disponibilidad",
        location: "Ubicación",
        profile: "Perfil",
      },
      support: "",
    },
  },
  en: {
    metaDescription:
      "Silvano Puccini editorial contact page with the real Formspree form, direct channels, and remote availability.",
    hero: {
      titlePrefix: "Let’s start a",
      titleAccent: "conversation",
      lead: "Available to collaborate on digital products, web platforms, and automation with a focus on real execution.",
      support: "A clear layout to start a working conversation with a real form, verified data, and direct access to the main channels.",
    },
    main: {
      socialTitle: "Social and presence",
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
      sending: "Sending...",
      success: "Message sent. If everything went through, I’ll reply by email.",
      error: "Review the fields and try again. If it persists, you can contact me directly by email.",
      validation: {
        required: "This field is required.",
        email: "Enter a valid email address.",
      },
    },
    direct: {
      email: "Direct email",
      location: "Location",
      phone: "WhatsApp / Phone",
      emailDetail: "Primary channel for proposals, questions, and collaboration.",
      locationDetail: "Based in Pucon, Chile with remote work.",
      phoneDetail: "Useful channel for fast coordination and follow-up.",
    },
    methods: {
      linkedin: "LinkedIn",
      github: "GitHub",
      email: "Email",
      discord: "Discord",
    },
    ctaBanner: {
      eyebrow: "Next step",
      title: "If you already have an idea, context, or technical problem, we can move from the first message to the next step.",
      description:
        "Digital product, applied automation, or an evolving platform: the goal is to structure the context quickly and define how to move forward.",
      primary: "Open email",
      secondary: "Go to services",
    },
    anchor: {
      eyebrow: "Operating base",
      title: "Wide visual block with location, availability, and working context.",
      description:
        "This close takes the visual-anchor logic from the reference and adapts it to the portfolio with real content instead of fictional data.",
      mapEyebrow: "Live map",
      mapDetail: "Embedded view of Pucon using real cartographic data via OpenStreetMap.",
      openMap: "Open map",
      labels: {
        availability: "Availability",
        location: "Location",
        profile: "Profile",
      },
      support:
        "I work remotely from Pucon, Chile, on projects where product thinking, implementation, and technical clarity need to coexist in the same conversation.",
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
  const socialEmailHref = content.metadata.socialLinks.find((item) => item.platform === "email")?.href ?? emailHref;
  const puconLatitude = "-39.2731173";
  const puconLongitude = "-71.9777605";
  const puconEmbedSrc =
    "https://www.openstreetmap.org/export/embed.html?bbox=-72.03%2C-39.33%2C-71.92%2C-39.22&layer=mapnik&marker=-39.2731173%2C-71.9777605";
  const puconMapHref = `https://www.openstreetmap.org/?mlat=${puconLatitude}&mlon=${puconLongitude}#map=12/${puconLatitude}/${puconLongitude}`;

  return (
    <>
      <section className="relative -mt-28 overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.72),rgb(var(--background)/0.96))] pt-28 sm:-mt-[7.5rem] sm:pt-[7.5rem]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgb(var(--brand-primary)/0.16),transparent_24%),radial-gradient(circle_at_80%_22%,rgb(var(--brand-secondary)/0.14),transparent_28%),linear-gradient(180deg,rgb(var(--surface-contrast)/0.18),transparent_36%)]" />

        <div className="relative mx-auto w-full max-w-[92rem] px-6 pb-3 pt-10 sm:px-8 sm:pb-4 sm:pt-14 lg:px-12 lg:pb-5 lg:pt-12 xl:pt-[3.5rem]">
          <div className="grid lg:min-h-[19rem] lg:items-start xl:min-h-[20.5rem]">
            <div className="max-w-4xl lg:self-start">
              <p className="eyebrow mb-4 text-white/72 sm:mb-5 lg:mb-6">{content.contact.eyebrow}</p>
              <h1 className="max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-pretty text-white sm:text-4xl sm:leading-[1.05] lg:text-[3.75rem] lg:leading-[1.02] xl:text-[4.15rem]">
                {labels.hero.titlePrefix} {labels.hero.titleAccent}
              </h1>

              <div className="mt-5 max-w-3xl space-y-3 text-lg leading-[1.82rem] text-white/72 sm:mt-6 sm:space-y-4 sm:text-xl sm:leading-[2rem] lg:mt-5 lg:space-y-3 xl:mt-6">
                <p>{labels.hero.lead}</p>
                <p className="text-base leading-7 text-white/68 sm:text-lg sm:leading-8">{labels.hero.support}</p>
              </div>

              <div className="mt-6 rounded-[var(--radius-surface)] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm sm:px-5 lg:mt-7 lg:px-6 lg:py-4">
                <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
                  <p className="technical-label whitespace-nowrap text-white/64">{labels.ctaBanner.eyebrow}</p>
                  <p className="text-sm font-medium leading-6 text-white sm:text-[0.95rem] sm:leading-6 lg:text-base">
                    {labels.ctaBanner.title}
                  </p>
                  <p className="text-sm leading-6 text-white/70 sm:text-[0.95rem] sm:leading-6">
                    {labels.ctaBanner.description}
                  </p>
                  <Link
                    href={`/${currentLocale}/services`}
                    className="button-secondary min-h-10 px-4 py-2 text-[11px] tracking-[0.16em] sm:w-fit"
                  >
                    {labels.ctaBanner.secondary}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.28))]"
        containerClassName="pt-4 pb-7 sm:pt-5 sm:pb-9 lg:pt-6 lg:pb-10"
        surface="plain"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7 xl:col-span-8">
            <ContactForm action={content.contact.formspreeAction} locale={currentLocale} labels={labels.form} />
          </div>

          <div className="lg:col-span-5 lg:h-full xl:col-span-4">
            <div className="grid h-full auto-rows-fr gap-4">
              <ContactPanel
                icon={Mail}
                eyebrow={labels.direct.email}
                title={content.metadata.email}
                detail={labels.direct.emailDetail}
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
          </div>
        </div>

        <div className="mt-5 lg:mt-6">
          <div className="surface-panel no-line-stack px-5 py-5 sm:px-6 sm:py-5">
            <div>
              <p className="technical-label">{labels.main.socialTitle}</p>
              <p className="mt-2 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">{content.contact.intro}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:gap-2.5">
              {[
                linkedinHref ? { label: labels.methods.linkedin, href: linkedinHref, icon: Linkedin } : null,
                githubHref ? { label: labels.methods.github, href: githubHref, icon: Github } : null,
                socialEmailHref ? { label: labels.methods.email, href: socialEmailHref, icon: Mail } : null,
                discordHref ? { label: labels.methods.discord, href: discordHref, icon: MessageSquareMore } : null,
              ]
                .filter((item): item is NonNullable<typeof item> => Boolean(item))
                .map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="surface-subpanel inline-flex min-h-0 items-center gap-2.5 border border-outline-ghost/10 bg-surface/65 px-3 py-2 text-sm text-text-primary transition-colors hover:border-outline-ghost/20 hover:text-text-primary"
                    >
                      <Icon size={15} strokeWidth={1.8} className="text-brand-primary" />
                      <span>{item.label}</span>
                      <ArrowUpRight size={14} strokeWidth={1.8} className="text-text-tertiary" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={labels.anchor.eyebrow || undefined}
        title={labels.anchor.title || undefined}
        description={labels.anchor.description ? <p>{labels.anchor.description}</p> : undefined}
        containerClassName="pt-0 pb-10 sm:pb-12 lg:-mt-2 lg:pb-14"
        surface="plain"
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="space-y-4 lg:space-y-5">
            <div className="surface-panel no-line-stack overflow-hidden border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.92),rgb(var(--surface)/0.9))]">
              <div className="flex flex-col gap-4 border-b border-outline-ghost/10 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between lg:px-7">
                <div className="max-w-3xl">
                  {labels.anchor.mapEyebrow ? <p className="technical-label">{labels.anchor.mapEyebrow}</p> : null}
                  <p className="mt-2 text-xl font-medium text-text-primary sm:text-2xl">{content.metadata.location}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{labels.anchor.mapDetail}</p>
                </div>

                <a
                  href={puconMapHref}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary min-h-10 px-4 py-2 text-[11px] tracking-[0.16em] sm:w-fit lg:self-start"
                >
                  {labels.anchor.openMap}
                </a>
              </div>

              <div className="bg-[rgb(var(--surface)/0.98)] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
                <div className="relative overflow-hidden rounded-[calc(var(--radius-soft)-0.1rem)] bg-[rgb(var(--surface-dim)/0.96)]">
                  <div className="relative aspect-[16/10] w-full sm:aspect-[18/9] lg:aspect-[21/8]">
                    <iframe
                      title={`Map of ${content.metadata.location}`}
                      src={puconEmbedSrc}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/60 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.anchor.labels.availability}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-text-primary">{content.contact.availability}</p>
              </div>
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/60 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.anchor.labels.location}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-text-primary">{content.metadata.location}</p>
              </div>
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/60 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.anchor.labels.profile}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-text-primary">{content.metadata.role}</p>
              </div>
            </div>

            {labels.anchor.support ? (
              <p className="max-w-3xl px-1 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{labels.anchor.support}</p>
            ) : null}
          </div>
        </div>
      </SectionShell>
    </>
  );
}
