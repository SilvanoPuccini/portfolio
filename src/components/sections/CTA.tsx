"use client";

import Link from "next/link";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function CTA() {
  const { t } = usePreferences();

  return (
    <section className="px-6 py-20">
      <div className="section-card mx-auto max-w-5xl p-10 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-secondary">Ready</p>
        <h2 className="mb-4 font-['Space_Grotesk'] text-4xl font-bold">{t.cta.title}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-slate-300">{t.cta.text}</p>
        <Link
          href="/contacto"
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-glow"
        >
          {t.cta.button}
        </Link>
      </div>
    </section>
  );
}
