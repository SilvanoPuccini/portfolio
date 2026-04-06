import { socialLinks } from "@/lib/site";

export default function ContactoPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-5">
      <article className="section-card p-8 md:col-span-2">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">Contacto directo</p>
        <h1 className="mb-4 font-['Space_Grotesk'] text-4xl font-bold">Hablemos de tu proyecto</h1>
        <p className="mb-6 text-slate-300">
          Si preferís mantener el flujo actual, este formulario usa Formspree y
          puede funcionar sin backend propio.
        </p>

        <div className="space-y-2 text-sm text-slate-300">
          <p>Email: silvano.jm.puccini@gmail.com</p>
          <p>Zona horaria: UTC-3 (Argentina)</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-secondary"
              >
                <Icon size={16} />
                {social.name}
              </a>
            );
          })}
        </div>
      </article>

      <article className="section-card p-8 md:col-span-3">
        <form
          action="https://formspree.io/f/xvgvlzgk"
          method="POST"
          className="flex flex-col gap-4"
        >
          <input
            name="name"
            required
            placeholder="Nombre"
            className="rounded-xl border border-white/10 bg-background/70 p-3"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-background/70 p-3"
          />
          <textarea
            name="message"
            rows={6}
            required
            placeholder="Contame sobre tu proyecto"
            className="rounded-xl border border-white/10 bg-background/70 p-3"
          />

          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-glow"
          >
            Enviar mensaje
          </button>
        </form>
      </article>
    </section>
  );
}
