const services = [
  "Landing Pages",
  "Web Apps",
  "Frontend Engineering",
  "Integración de APIs",
];

export default function Services() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 text-3xl font-bold">Servicios</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <article key={service} className="rounded-xl border border-white/10 bg-surface p-6">
            <h3 className="mb-2 text-lg font-semibold">{service}</h3>
            <p className="text-sm text-slate-400">
              Desarrollo con enfoque en negocio, calidad y escalabilidad.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
