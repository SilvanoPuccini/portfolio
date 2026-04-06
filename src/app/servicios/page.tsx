const services = [
  "Landing pages",
  "Web apps",
  "Portfolio profesional",
  "Optimización de performance",
  "Integración de APIs",
];

export default function ServiciosPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="mb-8 text-4xl font-bold">Servicios</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <article key={service} className="rounded-xl border border-white/10 bg-surface p-6">
            <h2 className="mb-2 font-semibold">{service}</h2>
            <p className="text-sm text-slate-400">
              Soluciones orientadas a resultados, escalabilidad y calidad de
              producto.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
