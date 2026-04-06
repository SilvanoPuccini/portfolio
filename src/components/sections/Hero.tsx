import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-2">
      <div>
        <p className="mb-4 inline-flex rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-secondary">
          Tech Premium Minimal
        </p>
        <h1 className="mb-6 font-['Space_Grotesk'] text-5xl font-bold leading-tight md:text-6xl">
          Silvano Puccini,
          <span className="block bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            Full Stack Developer
          </span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-slate-300">
          Construyo productos web modernos, rápidos y escalables para negocios
          que quieren verse y funcionar como una empresa real.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/proyectos"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-glow"
          >
            Ver proyectos
          </Link>
          <Link
            href="/contacto"
            className="rounded-xl border border-white/25 px-6 py-3 text-slate-100 hover:border-secondary"
          >
            Contactar
          </Link>
        </div>
      </div>

      <div className="section-card bg-grid bg-[size:24px_24px] p-8">
        <p className="mb-5 text-sm uppercase tracking-[0.15em] text-slate-400">
          Enfoque de trabajo
        </p>
        <ul className="space-y-4 text-slate-200">
          <li>• Arquitectura sólida con Next.js + TypeScript</li>
          <li>• UI moderna enfocada en conversión</li>
          <li>• Integraciones y automatizaciones de negocio</li>
          <li>• Performance, SEO y escalabilidad desde el día uno</li>
        </ul>
      </div>
    </section>
  );
}
