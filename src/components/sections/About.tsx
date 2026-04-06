export default function About() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-2">
        <article className="section-card p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">Sobre mí</p>
          <h2 className="mb-4 font-['Space_Grotesk'] text-3xl font-bold">Desarrollo con visión de producto</h2>
          <p className="text-slate-300">
            No solo escribo código: diseño experiencias digitales que posicionan
            tu marca, mejoran la conversión y soportan crecimiento real.
          </p>
        </article>

        <article className="section-card p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">Stack principal</p>
          <ul className="space-y-2 text-slate-300">
            <li>Next.js · TypeScript · Tailwind CSS</li>
            <li>Node.js · APIs REST · SQL/NoSQL</li>
            <li>SEO técnico · Performance · Deploy en Vercel</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
