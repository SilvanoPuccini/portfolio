"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function About() {
  const { t } = usePreferences();

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-2">
        <article className="section-card p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">About</p>
          <h2 className="mb-4 font-['Space_Grotesk'] text-3xl font-bold">{t.about.title}</h2>
          <p className="text-slate-300">{t.about.text}</p>
        </article>

        <article className="section-card p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">{t.about.stack}</p>
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
