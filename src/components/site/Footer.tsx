import type { ComponentPropsWithoutRef } from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import { getSiteContent } from "@/content/site";
import type { SocialLink } from "@/content/schema";
import type { Locale } from "@/lib/i18n";

function DiscordIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.484 3a13.92 13.92 0 0 0-.613 1.264 18.27 18.27 0 0 0-5.742 0A13.42 13.42 0 0 0 8.516 3a19.736 19.736 0 0 0-4.835 1.37C.624 8.997-.208 13.51.208 17.962A19.9 19.9 0 0 0 6.13 21a14.37 14.37 0 0 0 1.271-2.039 12.94 12.94 0 0 1-2.004-.98c.169-.125.334-.255.495-.39a13.99 13.99 0 0 0 12.215 0c.162.135.327.265.495.39-.64.374-1.311.703-2.004.98.37.734.795 1.416 1.271 2.039a19.88 19.88 0 0 0 5.924-3.038c.488-5.159-.833-9.631-3.476-13.593ZM9.813 15.234c-1.183 0-2.156-1.091-2.156-2.424 0-1.334.95-2.425 2.156-2.425 1.214 0 2.171 1.1 2.156 2.425 0 1.333-.95 2.424-2.156 2.424Zm4.374 0c-1.183 0-2.156-1.091-2.156-2.424 0-1.334.95-2.425 2.156-2.425 1.214 0 2.171 1.1 2.156 2.425 0 1.333-.942 2.424-2.156 2.424Z" />
    </svg>
  );
}

const socialIconMap = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  discord: DiscordIcon,
} as const;

type FooterPlatform = keyof typeof socialIconMap;
type FooterSocialLink = Omit<SocialLink, "platform"> & { platform: FooterPlatform };
const footerPlatformOrder: FooterPlatform[] = ["github", "linkedin", "email", "discord"];

function isFooterSocialLink(link: SocialLink | undefined): link is FooterSocialLink {
  return Boolean(link && link.platform in socialIconMap);
}

export default function Footer({ locale }: { locale: Locale }) {
  const content = getSiteContent(locale);
  const footerLinks = footerPlatformOrder
    .map((platform) => content.metadata.socialLinks.find((link) => link.platform === platform))
    .filter(isFooterSocialLink);
  return (
    <footer className="mt-14 w-full bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.78),rgb(var(--background)/0.96))]">
      <div className="site-container py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="font-display text-xl tracking-editorial text-text-primary sm:text-2xl">
              {content.metadata.siteName}
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary sm:text-xs">
              {content.metadata.role}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {locale === "es" ? (
                <>
                  Construyendo sistemas digitales con foco en ejecución,
                  <br />
                  claridad técnica y resultados reales.
                </>
              ) : (
                "Full stack, product, and automation work focused on clear, maintainable, real systems."
              )}
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:max-w-[34rem] lg:justify-end"
            aria-label={locale === "es" ? "Enlaces sociales" : "Social links"}
          >
            {footerLinks.map((link) => {
              const Icon = socialIconMap[link.platform];

              return (
                <a
                  key={link.platform}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{link.platform === "github" ? (locale === "es" ? "Código" : "Code") : link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </footer>
  );
}
