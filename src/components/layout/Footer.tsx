"use client";

import { socialLinks } from "@/lib/site";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function Footer() {
  const { language } = usePreferences();

  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-200">Silvano Puccini</p>
          <p>
            {language === "es"
              ? "Desarrollo web profesional · Diseño tipo Stitch"
              : "Professional web development · Stitch-style design"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-200 hover:border-secondary hover:text-secondary"
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
