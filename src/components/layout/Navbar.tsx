"use client";

import Link from "next/link";
import { socialLinks } from "@/lib/site";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import PreferenceControls from "@/components/common/PreferenceControls";

export default function Navbar() {
  const { t } = usePreferences();

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/sobre-mi", label: t.nav.about },
    { href: "/proyectos", label: t.nav.projects },
    { href: "/servicios", label: t.nav.services },
    { href: "/cv", label: t.nav.cv },
    { href: "/contacto", label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-extrabold tracking-wide text-secondary">
          SP
        </Link>

        <ul className="hidden gap-5 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-secondary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {socialLinks.slice(0, 2).map((social) => {
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
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
          <PreferenceControls />
        </div>
      </nav>
    </header>
  );
}
