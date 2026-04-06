export default function ProyectosPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="mb-8 text-4xl font-bold">Proyectos</h1>
      <p className="mb-8 text-slate-300">
        Casos reales con foco en problema, solución, decisiones técnicas y
        resultados.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {["PayTrack", "FacturIA", "GathSession"].map((project) => (
          <article key={project} className="rounded-xl border border-white/10 bg-surface p-6">
            <h2 className="mb-2 text-xl font-semibold">{project}</h2>
            <p className="text-sm text-slate-400">
              Desarrollo end-to-end de una solución web enfocada en eficiencia
              y experiencia de usuario.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
