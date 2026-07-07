import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = resolveLocale(locale) === "es";

  return {
    title: isEs ? "Política de Privacidad | Silvano Puccini" : "Privacy Policy | Silvano Puccini",
    robots: { index: false },
  };
}

export default async function PrivacyPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const isEs = currentLocale === "es";

  return (
    <div className="site-container py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl">

        <nav className="mb-10">
          <Link
            href={`/${currentLocale}`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
          >
            <span aria-hidden>←</span>
            {isEs ? "Inicio" : "Home"}
          </Link>
        </nav>

        <header className="mb-12">
          <p className="technical-label mb-4">
            {isEs ? "Legal" : "Legal"}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
          </h1>
          <p className="mt-4 font-mono text-[11px] text-text-tertiary">
            {isEs ? "Última actualización: abril 2026" : "Last updated: April 2026"}
          </p>
        </header>

        <div className="space-y-10 text-sm leading-7 text-text-secondary">

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "1. Responsable" : "1. Data Controller"}
            </h2>
            <p>
              {isEs
                ? "Silvano Puccini, Full Stack Developer. Podés contactarme en cualquier momento a través del formulario de contacto del sitio o directamente por email."
                : "Silvano Puccini, Full Stack Developer. You can reach me at any time through the site's contact form or directly by email."}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "2. Datos que se recopilan" : "2. Data collected"}
            </h2>
            <p className="mb-4">
              {isEs
                ? "Este sitio recopila únicamente los datos que vos proporcionás de forma voluntaria:"
                : "This site only collects data you voluntarily provide:"}
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-primary/60" />
                <span>
                  {isEs
                    ? "Formulario de contacto: nombre, email, asunto y mensaje. Procesado por Formspree."
                    : "Contact form: name, email, subject and message. Processed by Formspree."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-primary/60" />
                <span>
                  {isEs
                    ? "Newsletter: únicamente tu dirección de email. Procesado por Resend."
                    : "Newsletter: only your email address. Processed by Resend."}
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "3. Finalidad" : "3. Purpose"}
            </h2>
            <p>
              {isEs
                ? "Los datos del formulario de contacto se usan exclusivamente para responder tu consulta. El email del newsletter se usa para enviarte actualizaciones del blog (El Radar). No se usan para publicidad, ni se venden o comparten con terceros."
                : "Contact form data is used solely to reply to your inquiry. Newsletter email is used to send you blog updates (El Radar). It is not used for advertising, and is not sold or shared with third parties."}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "4. Cookies" : "4. Cookies"}
            </h2>
            <p>
              {isEs
                ? "El sitio no utiliza cookies de rastreo ni analítica de terceros. Se puede usar una cookie de sesión técnica para la preferencia de tema (claro/oscuro), que no contiene información personal y se almacena solo en tu navegador."
                : "The site does not use tracking cookies or third-party analytics. A technical session cookie may be used for theme preference (light/dark), which contains no personal information and is stored only in your browser."}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "5. Tus derechos" : "5. Your rights"}
            </h2>
            <p>
              {isEs
                ? "Podés solicitar en cualquier momento el acceso, rectificación o eliminación de tus datos contactándome directamente. Para darte de baja del newsletter, respondé cualquier email con el asunto 'baja' o contactame."
                : "You can request access, correction or deletion of your data at any time by contacting me directly. To unsubscribe from the newsletter, reply to any email with the subject 'unsubscribe' or contact me."}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "6. Servicios de terceros" : "6. Third-party services"}
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-outline-ghost/40" />
                <span>
                  <strong className="text-text-primary">Formspree</strong>
                  {isEs ? ": procesamiento del formulario de contacto." : ": contact form processing."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-outline-ghost/40" />
                <span>
                  <strong className="text-text-primary">Resend</strong>
                  {isEs ? ": envío de emails del newsletter." : ": newsletter email delivery."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-outline-ghost/40" />
                <span>
                  <strong className="text-text-primary">Vercel</strong>
                  {isEs ? ": hosting del sitio. Puede registrar logs de acceso estándar." : ": site hosting. May log standard access logs."}
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              {isEs ? "7. Contacto" : "7. Contact"}
            </h2>
            <p>
              {isEs ? (
                <>
                  Cualquier consulta sobre esta política puede enviarse a través de la{" "}
                  <Link href={`/${currentLocale}/contact`} className="text-brand-primary hover:underline">
                    página de contacto
                  </Link>
                  .
                </>
              ) : (
                <>
                  Any questions about this policy can be sent through the{" "}
                  <Link href={`/${currentLocale}/contact`} className="text-brand-primary hover:underline">
                    contact page
                  </Link>
                  .
                </>
              )}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
