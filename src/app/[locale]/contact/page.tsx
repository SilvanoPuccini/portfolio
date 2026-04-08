import type { ComponentPropsWithoutRef } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github, Linkedin, Mail, Phone } from "lucide-react";
import ContactForm from "@/components/blocks/ContactForm";
import ContactMethods from "@/components/blocks/ContactMethods";
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
      phoneHeading: "¿Listo para estructurar tu próximo proyecto?",
      emailDetail: "Canal principal para propuestas, consultas y colaboración.",
      locationDetail: "Base en Pucón, Chile con trabajo remoto.",
      phoneDetail: "Canal útil para coordinar rápido y seguimiento.",
      phoneCta: "Agenda tu llamada",
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
      phoneHeading: "Ready to structure your next project?",
      emailDetail: "Primary channel for proposals, questions, and collaboration.",
      locationDetail: "Based in Pucon, Chile with remote work.",
      phoneDetail: "Useful channel for quick coordination and follow-up.",
      phoneCta: "Schedule your call",
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
      eyebrow: "",
      title: "",
      description: "",
      mapEyebrow: "",
      mapDetail: "Embedded view of Pucon using real cartographic data via OpenStreetMap.",
      openMap: "Open map",
      labels: {
        availability: "Availability",
        location: "Location",
        profile: "Profile",
      },
      support: "",
    },
  },
} as const;

function DiscordIcon({ size = 18, ...props }: ComponentPropsWithoutRef<"svg"> & { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.484 3a13.92 13.92 0 0 0-.613 1.264 18.27 18.27 0 0 0-5.742 0A13.42 13.42 0 0 0 8.516 3a19.736 19.736 0 0 0-4.835 1.37C.624 8.997-.208 13.51.208 17.962A19.9 19.9 0 0 0 6.13 21a14.37 14.37 0 0 0 1.271-2.039 12.94 12.94 0 0 1-2.004-.98c.169-.125.334-.255.495-.39a13.99 13.99 0 0 0 12.215 0c.162.135.327.265.495.39-.64.374-1.311.703-2.004.98.37.734.795 1.416 1.271 2.039a19.88 19.88 0 0 0 5.924-3.038c.488-5.159-.833-9.631-3.476-13.593ZM9.813 15.234c-1.183 0-2.156-1.091-2.156-2.424 0-1.334.95-2.425 2.156-2.425 1.214 0 2.171 1.1 2.156 2.425 0 1.333-.95 2.424-2.156 2.424Zm4.374 0c-1.183 0-2.156-1.091-2.156-2.424 0-1.334.95-2.425 2.156-2.425 1.214 0 2.171 1.1 2.156 2.425 0 1.333-.942 2.424-2.156 2.424Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.11 4.89A9.88 9.88 0 0 0 12.06 2C6.57 2 2.1 6.47 2.1 11.96c0 1.76.46 3.47 1.33 4.98L2 22l5.22-1.37a9.9 9.9 0 0 0 4.74 1.21h.01c5.49 0 9.96-4.47 9.96-9.96a9.9 9.9 0 0 0-2.82-6.99ZM12 20.16h-.01a8.21 8.21 0 0 1-4.19-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.25 8.25 0 0 1 12.81-10.2A8.16 8.16 0 0 1 20.26 12c0 4.55-3.71 8.16-8.26 8.16Zm4.53-6.15c-.25-.13-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.17-.28.19-.53.06-.25-.13-1.05-.39-2-.25-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.28.37-.42.12-.14.16-.24.24-.41.08-.16.04-.31-.02-.44-.06-.13-.56-1.35-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.36 1 2.52.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3Z" />
    </svg>
  );
}

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
  const socialItems = [
    linkedinHref ? { label: labels.methods.linkedin, href: linkedinHref, icon: Linkedin } : null,
    githubHref ? { label: labels.methods.github, href: githubHref, icon: Github, accent: "secondary" as const } : null,
    socialEmailHref ? { label: labels.methods.email, href: socialEmailHref, icon: Mail } : null,
    discordHref ? { label: labels.methods.discord, href: discordHref, icon: DiscordIcon, accent: "secondary" as const } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const puconLatitude = "-39.2731173";
  const puconLongitude = "-71.9777605";
  const puconEmbedSrc =
    "https://www.openstreetmap.org/export/embed.html?bbox=-72.03%2C-39.33%2C-71.92%2C-39.22&layer=mapnik&marker=-39.2731173%2C-71.9777605";
  const puconMapHref = `https://www.openstreetmap.org/?mlat=${puconLatitude}&mlon=${puconLongitude}#map=12/${puconLatitude}/${puconLongitude}`;

  return (
    <>
      <PageHero
        eyebrow={content.contact.eyebrow}
        title={
          <>
            {labels.hero.titlePrefix} {labels.hero.titleAccent}
          </>
        }
        subtitle={<p>{labels.hero.lead}</p>}
        description={<p>{labels.hero.support}</p>}
        actions={
          <>
            <Link href={emailHref} className="button-primary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.ctaBanner.primary}
            </Link>
            <Link href={`/${currentLocale}/services`} className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.ctaBanner.secondary}
            </Link>
          </>
        }
      />

      <SectionShell
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.28))]"
        containerClassName="pt-4 pb-7 sm:pt-5 sm:pb-9 lg:pt-6 lg:pb-10"
      >
        <div className="mx-auto max-w-6xl space-y-5 lg:space-y-6">
          <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch xl:gap-6">
            <div className="lg:col-span-7 xl:col-span-8">
              <ContactForm action={content.contact.formspreeAction} locale={currentLocale} labels={labels.form} />
            </div>

            <div className="lg:col-span-5 lg:h-full xl:col-span-4">
              <div className="flex h-full flex-col gap-3 lg:gap-3.5">
                <a
                  href={phoneHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${labels.direct.phone}: ${labels.direct.phoneCta}`}
                  className="surface-panel interactive-surface group flex min-h-[7.75rem] flex-col justify-between gap-3 rounded-[var(--radius-soft)] border border-outline-ghost/10 px-4.5 py-3.5 sm:px-5 sm:py-4"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2.5 text-text-tertiary sm:gap-3">
                      <Phone size={14} strokeWidth={1.9} className="shrink-0" />
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em]">{labels.direct.phone}</p>
                    </div>
                    <h2 className="max-w-[18ch] text-[0.98rem] font-medium leading-5 text-text-primary sm:text-[1.02rem] sm:leading-5">
                      {labels.direct.phoneHeading}
                    </h2>
                    <p className="max-w-[26ch] text-sm leading-5 text-text-secondary">{labels.direct.phoneDetail}</p>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start text-brand-primary transition-opacity group-hover:opacity-80">
                    <WhatsAppIcon className="h-[1rem] w-[1rem] shrink-0" />
                    <span className="text-sm font-semibold leading-none">{labels.direct.phoneCta}</span>
                    <ArrowUpRight className="h-[0.95rem] w-[0.95rem] shrink-0" strokeWidth={1.8} />
                  </div>
                </a>

                <div className="surface-panel no-line-stack flex min-h-[10rem] flex-1 flex-col justify-between gap-3.5 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.78),rgb(var(--surface)/0.62))] px-4.5 py-4 sm:px-5 sm:py-4.5">
                  <div className="space-y-1.5">
                    <p className="technical-label">{labels.main.socialTitle}</p>
                    <p className="max-w-[29ch] text-sm leading-5.5 text-text-secondary">{content.contact.intro}</p>
                  </div>

                  <ContactMethods items={socialItems} />
                </div>
              </div>
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
        <div className="py-5 sm:py-6 lg:py-8">
          <div className="space-y-5 lg:space-y-6">
            <div className="surface-panel no-line-stack overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.88))]">
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:px-7 lg:py-7">
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

              <div className="px-3 pb-3 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
                <div className="relative overflow-hidden rounded-[calc(var(--radius-soft)-0.08rem)] bg-[rgb(var(--surface-dim)/0.96)]">
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
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/58 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.anchor.labels.availability}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-text-primary">{content.contact.availability}</p>
              </div>
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/58 px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.anchor.labels.location}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-text-primary">{content.metadata.location}</p>
              </div>
              <div className="surface-subpanel flex h-full min-h-[7.75rem] flex-col justify-between bg-surface/58 px-5 py-4">
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
