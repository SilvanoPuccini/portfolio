"use client";

import Link from "next/link";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function Hero() {
  const { t } = usePreferences();

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-2">
      <div>
        <p className="mb-4 inline-flex rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-secondary">
          {t.hero.badge}
        </p>
        <h1 className="mb-6 font-['Space_Grotesk'] text-5xl font-bold leading-tight md:text-6xl">
          {t.hero.titleLine1}
          <span className="block bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {t.hero.titleLine2}
          </span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-slate-300">{t.hero.description}</p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/proyectos"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-glow"
          >
            {t.hero.ctaProjects}
          </Link>
          <Link
            href="/contacto"
            className="rounded-xl border border-white/25 px-6 py-3 text-slate-100 hover:border-secondary"
          >
            {t.hero.ctaContact}
          </Link>
        </div>
      </div>

      <div className="section-card bg-grid bg-[size:24px_24px] p-8">
        <p className="mb-5 text-sm uppercase tracking-[0.15em] text-slate-400">
          {t.about.title}
        </p>
        <p className="text-slate-300">{t.about.text}</p>
      </div>
    </section>
  );
}
