import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
      <p className="mb-4 rounded-full border border-primary/30 px-4 py-1 text-xs uppercase tracking-[0.2em] text-primary">
        Full Stack Developer
      </p>
      <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
        Silvano Puccini
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-slate-400">
        Construyo aplicaciones web modernas, escalables y orientadas a
        resultados reales.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/proyectos"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-black"
        >
          Ver proyectos
        </Link>
        <Link
          href="/contacto"
          className="rounded-lg border border-white/20 px-6 py-3 text-slate-100"
        >
          Contactar
        </Link>
      </div>
    </section>
  );
}
