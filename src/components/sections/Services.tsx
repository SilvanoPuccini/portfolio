import { LayoutPanelTop, MonitorSmartphone, Rocket, Workflow } from "lucide-react";

const services = [
  {
    title: "Landing pages",
    detail: "Diseño y desarrollo con narrativa de marca + foco en conversión.",
    icon: LayoutPanelTop,
  },
  {
    title: "Web apps",
    detail: "Aplicaciones escalables con frontend y backend moderno.",
    icon: MonitorSmartphone,
  },
  {
    title: "Integraciones",
    detail: "Conexión de APIs, automatizaciones y procesos internos.",
    icon: Workflow,
  },
  {
    title: "Optimización",
    detail: "Mejoras de performance, UX y SEO técnico para crecer.",
    icon: Rocket,
  },
];

export default function Services() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 font-['Space_Grotesk'] text-3xl font-bold">Servicios</h2>
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
