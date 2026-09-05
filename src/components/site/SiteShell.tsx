import type { PropsWithChildren } from "react";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import type { Locale } from "@/lib/i18n";

export default function SiteShell({
  children,
  locale,
}: PropsWithChildren<{ locale: Locale }>) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {locale === "es" ? "Saltar al contenido principal" : "Skip to main content"}
      </a>
      <Header locale={locale} />
      <main id="main-content" tabIndex={-1} className="pt-[10.75rem] sm:pt-[7.5rem]">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
