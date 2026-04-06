import Link from "next/link";

export default function CTA() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl section-card p-10 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">Disponible para proyectos</p>
        <h2 className="mb-4 font-['Space_Grotesk'] text-4xl font-bold">¿Trabajamos juntos?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-slate-300">
          Si querés una web profesional con identidad, performance y resultados,
          te ayudo a construirla de punta a punta.
        </p>
        <Link
          href="/contacto"
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-glow"
        >
          Empezar proyecto
        </Link>
      </div>
    </section>
  );
}
