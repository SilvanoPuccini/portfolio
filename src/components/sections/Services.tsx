"use client";

import { LayoutPanelTop, MonitorSmartphone, Rocket, Workflow } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function Services() {
  const { language, t } = usePreferences();

  const services = [
    {
      title: language === "es" ? "Landing pages" : "Landing pages",
      detail:
        language === "es"
          ? "Diseño y desarrollo con narrativa de marca + foco en conversión."
          : "Design and development with branding narrative and conversion focus.",
      icon: LayoutPanelTop,
    },
    {
      title: language === "es" ? "Web apps" : "Web apps",
      detail:
        language === "es"
          ? "Aplicaciones escalables con frontend y backend moderno."
          : "Scalable applications with modern frontend and backend.",
      icon: MonitorSmartphone,
    },
    {
      title: language === "es" ? "Integraciones" : "Integrations",
      detail:
        language === "es"
          ? "Conexión de APIs, automatizaciones y procesos internos."
          : "API connections, automation and internal workflows.",
      icon: Workflow,
    },
    {
      title: language === "es" ? "Optimización" : "Optimization",
      detail:
        language === "es"
          ? "Mejoras de performance, UX y SEO técnico para crecer."
          : "Performance, UX and technical SEO improvements for growth.",
      icon: Rocket,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 font-['Space_Grotesk'] text-3xl font-bold">{t.services.title}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.title} className="section-card p-6">
              <div className="mb-4 inline-flex rounded-lg border border-secondary/30 bg-secondary/10 p-2 text-secondary">
                <Icon size={18} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{service.title}</h3>
              <p className="text-sm text-slate-400">{service.detail}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
