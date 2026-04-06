const featuredProjects = [
  {
    title: "PayTrack",
    summary: "Dashboard financiero con métricas en tiempo real y automatización de reportes.",
  },
  {
    title: "FacturIA 2.0",
    summary: "Sistema de facturación con IA para generación inteligente de comprobantes.",
  },
  {
    title: "CatGallery",
    summary: "Galería optimizada con filtros dinámicos y rendimiento superior en mobile.",
  },
];

export default function Projects() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 text-3xl font-bold">Proyectos destacados</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {featuredProjects.map((project) => (
          <article key={project.title} className="rounded-xl border border-white/10 bg-surface p-6">
            <h3 className="mb-2 text-xl font-semibold">{project.title}</h3>
            <p className="text-sm text-slate-400">{project.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
